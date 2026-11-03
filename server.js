'use strict';

require('dotenv').config();

const path = require('path');
const express = require('express');
const { validateContact, deliverContactEmail } = require('./lib/contact');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

app.disable('x-powered-by');
app.set('trust proxy', 1);

/* --------------------------------------------------------------------------
 * Security headers
 * The same headers are mirrored in vercel.json because Vercel serves files in
 * public/ from its CDN without running them through Express.
 * ------------------------------------------------------------------------ */
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "img-src 'self' data:",
      "script-src 'self'",
      "style-src 'self'",
      "font-src 'self'",
      "connect-src 'self'",
      "object-src 'none'",
    ].join('; ')
  );
  next();
});

app.use(express.json({ limit: '32kb' }));
app.use(express.urlencoded({ extended: false, limit: '32kb' }));

/* --------------------------------------------------------------------------
 * Contact form rate limiting
 * This is intentionally simple: an in-memory sliding window per IP address.
 * On Vercel each serverless instance has its own memory, so it limits bursts
 * rather than acting as a global quota. That is acceptable for a portfolio.
 * ------------------------------------------------------------------------ */
const RATE_LIMIT_MAX = positiveInteger(process.env.RATE_LIMIT_MAX, 5);
const RATE_LIMIT_WINDOW_MS = positiveInteger(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000);
const contactAttempts = new Map();

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function contactRateLimiter(req, res, next) {
  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const entry = contactAttempts.get(key);

  if (!entry || entry.resetAt <= now) {
    contactAttempts.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  entry.count += 1;

  if (entry.count > RATE_LIMIT_MAX) {
    const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    res.setHeader('Retry-After', String(retryAfterSeconds));
    const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
    return res.status(429).json({
      ok: false,
      message: `Too many messages from this connection. Please try again in about ${minutes} minute${minutes === 1 ? '' : 's'}, or email laijojose05@gmail.com directly.`,
    });
  }

  return next();
}

const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of contactAttempts) {
    if (entry.resetAt <= now) contactAttempts.delete(key);
  }
}, 10 * 60 * 1000);
if (typeof cleanupTimer.unref === 'function') cleanupTimer.unref();

/* --------------------------------------------------------------------------
 * API
 * ------------------------------------------------------------------------ */
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'laijo-portfolio',
    emailDeliveryConfigured: Boolean(process.env.RESEND_API_KEY),
  });
});

app.post('/api/contact', contactRateLimiter, async (req, res) => {
  const body = req.body && typeof req.body === 'object' ? req.body : {};

  // Honeypot: real visitors never fill this hidden field.
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return res.status(400).json({
      ok: false,
      message: 'Your submission could not be processed.',
    });
  }

  const { values, errors } = validateContact(body);

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      ok: false,
      message: 'Please correct the highlighted fields and try again.',
      errors,
    });
  }

  const result = await deliverContactEmail(values);

  if (result.delivered) {
    return res.status(200).json({
      ok: true,
      delivered: true,
      message: `Thank you, ${values.name.split(' ')[0]}! Your message was sent successfully. I will reply as soon as I can.`,
    });
  }

  if (!result.configured) {
    return res.status(200).json({
      ok: true,
      delivered: false,
      message:
        'Thank you for writing. Email delivery is not configured on this copy of the site yet, so your message was not sent. Please email laijojose05@gmail.com directly.',
    });
  }

  return res.status(502).json({
    ok: false,
    delivered: false,
    message:
      'Your message could not be delivered because the email service returned an error. Please email laijojose05@gmail.com directly instead.',
  });
});

/* --------------------------------------------------------------------------
 * Static site (local development). On Vercel, public/** is served by the CDN.
 * ------------------------------------------------------------------------ */
app.use(
  express.static(PUBLIC_DIR, {
    extensions: ['html'],
    maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0,
  })
);

// Unknown API routes always return JSON.
app.use('/api', (req, res) => {
  res.status(404).json({ ok: false, message: 'API route not found.' });
});

// Friendly 404 page for everything else.
app.use((req, res) => {
  res.status(404).sendFile(path.join(PUBLIC_DIR, '404.html'));
});

// Final error handler. Keep error details out of the response.
app.use((error, req, res, next) => {
  console.error('Unhandled server error:', error.message);
  if (res.headersSent) return next(error);
  return res.status(500).json({ ok: false, message: 'Something went wrong. Please try again.' });
});

/* --------------------------------------------------------------------------
 * Local server + Vercel export
 * Vercel detects server.js, imports the exported Express app, and turns it into
 * a serverless function. app.listen only runs during local development.
 * ------------------------------------------------------------------------ */
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Laijo Jose portfolio running at http://localhost:${PORT}`);
    console.log(
      process.env.RESEND_API_KEY
        ? 'Contact email delivery: configured'
        : 'Contact email delivery: not configured (form still runs safely)'
    );
  });
}

module.exports = app;
