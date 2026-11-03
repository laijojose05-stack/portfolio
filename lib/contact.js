'use strict';

/*
 * Contact form helpers.
 *
 * Two jobs:
 * 1. Validate and normalise user input on the server (never trust the browser).
 * 2. Deliver the message through Resend when it is configured.
 *
 * No message data is written to disk. Nothing here is exposed to the browser.
 */

const DEFAULT_TO_EMAIL = 'laijojose05@gmail.com';
const DEFAULT_FROM_EMAIL = 'Laijo Portfolio <onboarding@resend.dev>';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const LIMITS = {
  name: { min: 2, max: 80 },
  email: { max: 254 },
  subject: { min: 3, max: 120 },
  message: { min: 10, max: 3000 },
};

function asText(value) {
  return typeof value === 'string' ? value : '';
}

function stripControlCharacters(value) {
  // Keep normal whitespace, remove invisible control characters.
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
}

function normaliseSingleLine(value) {
  return stripControlCharacters(asText(value)).replace(/\s+/g, ' ').trim();
}

function normaliseMessage(value) {
  return stripControlCharacters(asText(value)).replace(/\r\n/g, '\n').trim();
}

function validateContact(input = {}) {
  const values = {
    name: normaliseSingleLine(input.name),
    email: normaliseSingleLine(input.email).toLowerCase(),
    subject: normaliseSingleLine(input.subject),
    message: normaliseMessage(input.message),
  };

  const errors = {};

  if (!values.name) {
    errors.name = 'Please enter your name.';
  } else if (values.name.length < LIMITS.name.min) {
    errors.name = `Please enter at least ${LIMITS.name.min} characters for your name.`;
  } else if (values.name.length > LIMITS.name.max) {
    errors.name = `Your name must be ${LIMITS.name.max} characters or fewer.`;
  }

  if (!values.email) {
    errors.email = 'Please enter your email address.';
  } else if (values.email.length > LIMITS.email.max || !EMAIL_PATTERN.test(values.email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!values.subject) {
    errors.subject = 'Please add a subject.';
  } else if (values.subject.length < LIMITS.subject.min) {
    errors.subject = `Please use at least ${LIMITS.subject.min} characters for the subject.`;
  } else if (values.subject.length > LIMITS.subject.max) {
    errors.subject = `The subject must be ${LIMITS.subject.max} characters or fewer.`;
  }

  if (!values.message) {
    errors.message = 'Please write a message.';
  } else if (values.message.length < LIMITS.message.min) {
    errors.message = `Please write at least ${LIMITS.message.min} characters.`;
  } else if (values.message.length > LIMITS.message.max) {
    errors.message = `Your message must be ${LIMITS.message.max} characters or fewer.`;
  }

  return { values, errors };
}

/**
 * Sends the contact message if Resend credentials are present.
 * Returns a result that always tells the caller the truth about delivery.
 */
async function deliverContactEmail(values) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL || DEFAULT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL || DEFAULT_FROM_EMAIL;

  if (!apiKey) {
    return { configured: false, delivered: false };
  }

  const text = [
    'New message from the portfolio contact form',
    '',
    `Name: ${values.name}`,
    `Email: ${values.email}`,
    `Subject: ${values.subject}`,
    '',
    values.message,
  ].join('\n');

  let response;
  try {
    response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: values.email,
        subject: `[Portfolio] ${values.subject}`,
        text,
      }),
      signal: AbortSignal.timeout(10000),
    });
  } catch (error) {
    console.error('Contact email request failed:', error.message);
    return { configured: true, delivered: false, failed: true };
  }

  if (!response.ok) {
    const details = await response.text().catch(() => '');
    console.error(`Resend API error (${response.status}): ${details.slice(0, 300)}`);
    return { configured: true, delivered: false, failed: true };
  }

  return { configured: true, delivered: true };
}

module.exports = {
  LIMITS,
  validateContact,
  deliverContactEmail,
};
