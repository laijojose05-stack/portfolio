# Laijo Jose - Student Developer Portfolio

A complete, responsive personal portfolio for **Laijo Jose**, a third-year Diploma in Computer Engineering student at AKM Polytechnic College, Kollam, Kerala, India.

The site is built with **Node.js + Express**, semantic **HTML5**, a custom **CSS3** design system, and **vanilla JavaScript**. The interface uses a dark editorial developer theme with oversized type, a full-screen numbered menu, locally hosted variable fonts, local SVG skill icons, and real project screenshots. It runs locally on Windows and is structured for zero-configuration deployment on Vercel.

> The site has been tested locally. It has **not** been deployed to Vercel or pushed to GitHub by this project setup.

---

## Features

- Fixed header with a full-screen, keyboard-accessible numbered menu, scroll-spy active states, and focus management
- Dark editorial layout with an oversized hero, a typing role line, a live IST clock, and a custom developer illustration
- Real MediConnect and SeaFile project screenshots, with a custom OpenLearn illustration
- About, skills, education, projects, certificates, contact, and footer sections
- Projects generated from a single editable data file
- Technology filtering with a live result count
- Accessible project detail modal with focus trapping, Escape-to-close, and background scroll locking
- Contact form with client-side validation, server-side validation, honeypot spam protection, rate limiting, and honest delivery status
- Optional email delivery through Resend, configured with environment variables only
- Responsive layouts for mobile, tablet, and desktop
- Scroll-reveal animations with `prefers-reduced-motion` support
- SEO metadata, Open Graph/Twitter cards, a custom `LJ` favicon, local social preview image, and a custom 404 page
- Security headers including a strict Content Security Policy
- No database, no file-based message storage, and no secrets in frontend code

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Server | Node.js, Express 4 |
| Frontend | HTML5, CSS3, vanilla JavaScript (ES modules) |
| Typography | Local Space Grotesk + JetBrains Mono variable fonts |
| Icons | Locally hosted Simple Icons SVGs + embedded interface icons |
| Email (optional) | Resend HTTP API |
| Hosting | Vercel serverless function + static CDN |

No React, Vue, Next.js, Laravel, or build tool is required.

---

## Project structure

```text
laijo-portfolio/
├── lib/
│   └── contact.js          # Server-side validation + optional Resend delivery
├── public/
│   ├── css/
│   │   └── styles.css      # Complete design system and responsive styles
│   ├── fonts/
│   │   ├── space-grotesk-var.woff2
│   │   ├── jetbrains-mono-var.woff2
│   │   └── OFL-*.txt       # Font licence texts
│   ├── images/
│   │   ├── icons/          # Local Simple Icons SVGs
│   │   ├── developer-illustration.svg
│   │   ├── og-image.png
│   │   ├── project-mediconnect.png
│   │   ├── project-openlearn.svg
│   │   └── project-seafile.png
│   ├── js/
│   │   ├── main.js         # Menu, projects, modal, form, typewriter, clock
│   │   └── projects.js     # Project + certificate content (edit this file)
│   ├── 404.html            # Custom not-found page
│   ├── favicon.svg         # LJ favicon
│   ├── index.html          # Single-page portfolio
│   └── robots.txt
├── .env.example            # Documented environment variables (safe to commit)
├── .gitignore
├── package.json
├── README.md
├── server.js               # Express app + local server + Vercel export
└── vercel.json             # Security headers and asset caching on Vercel
```

---

## Requirements

- **Node.js 20 or newer** (tested with Node.js 26.8.2)
- **npm 10 or newer** (tested with npm 11.19.1)
- Windows PowerShell, Command Prompt, or a terminal of your choice
- VS Code (recommended, not required)
- A modern browser (Chrome, Edge, Firefox, or Safari)

Check your versions:

```powershell
node --version
npm --version
```

> **Windows note:** If PowerShell says `npm.ps1 cannot be loaded because running scripts is disabled`, use `npm.cmd --version` instead, or run the commands in Command Prompt. You can also allow local scripts for your own user account with:
>
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
> ```
>
> Only change this setting if you understand it. Using `npm.cmd` is the simplest option.

---

## Run the project locally (Windows)

### 1. Open the project

```powershell
cd C:\Users\ANGEL\laijo-portfolio
code .
```

`code .` opens the folder in VS Code. If the `code` command is not recognised, open VS Code and use **File → Open Folder**.

### 2. Install dependencies

```powershell
npm install
```

If PowerShell blocks the npm script, use:

```powershell
npm.cmd install
```

### 3. Configure environment variables (optional)

The site runs without any environment variables. To configure optional email delivery:

```powershell
Copy-Item .env.example .env
```

Open `.env` and fill in the values you need. See [Email delivery](#email-delivery-optional) below.

Never commit `.env`. It is already listed in `.gitignore`.

### 4. Start the development server

```powershell
npm run dev
```

This uses Node's built-in `--watch` mode and restarts the server when `server.js` or `lib/` files change. Frontend files are served directly, so a browser refresh is enough after editing HTML, CSS, or JavaScript.

For a normal run without file watching:

```powershell
npm start
```

### 5. Open the site

Visit:

```text
http://localhost:3000
```

If port 3000 is already in use, set a different port in `.env`:

```text
PORT=3001
```

Then restart the server and visit `http://localhost:3001`.

### Available scripts

| Command | What it does |
| --- | --- |
| `npm start` | Starts the Express server on port 3000 (or `PORT`). |
| `npm run dev` | Starts the server with Node's watch mode for server changes. |

There is no build step and no test package installed by default. The site uses native ES modules and plain CSS.

---

## Editing the site content

### Personal details, sections, and links

Edit `public/index.html`. The text, headings, contact links, and section structure all live there.

### Projects and certificates

Edit `public/js/projects.js`. Each project object controls:

- card title, category, summary, and illustration
- technology badges
- filter keys (`php`, `python`, `nodejs`, `mysql`, `supabase`)
- optional GitHub/demo links
- every detail shown in the modal: overview, problem, objectives, features, workflow, technology purposes, learning outcomes, future enhancements, and note

**Links policy:** leave `github` and `demo` as `null` until a real, public URL exists. The UI only renders buttons for valid `http(s)` links. No repository or live demo link is invented in this project.

To add certificates later, add objects to the `certificates` array:

```js
export const certificates = [
  {
    title: 'Certificate title',
    issuer: 'Issuing organisation',
    date: 'Month Year',
    url: 'https://example.com/credential',
  },
];
```

The empty state ("No certificates added yet.") disappears automatically once the array is non-empty.

### Design system

Edit the CSS custom properties at the top of `public/css/styles.css` to change colours, spacing, radii, and typography consistently. The two local font files are variable fonts, so one file covers each family's full weight range. Keep the `OFL-*.txt` licence files with the fonts when redistributing the project.

### Project images

Project images are declared in `public/js/projects.js`. Photographs use their native 16:9 aspect ratio on the project cards; illustrations keep the default 16:10 frame. Add `thumbnailWidth` and `thumbnailHeight` when replacing an image so the browser reserves the correct space and avoids layout shift.

### Social preview image

`public/images/og-image.png` is 1200 × 630 px and uses the current dark theme. Replace it with an updated graphic if the branding changes. For best social-platform compatibility, update the `og:image` and `twitter:image` meta tags in `public/index.html` to a full URL (for example `https://your-domain.com/images/og-image.png`) after deployment.

---

## Contact form and email delivery

The form posts JSON to `POST /api/contact`.

Validation rules:

| Field | Rule |
| --- | --- |
| Name | 2-80 characters |
| Email | Valid format, 254 characters maximum |
| Subject | 3-120 characters |
| Message | 10-3000 characters |

Additional protections:

- **Honeypot:** a hidden `website` field rejects simple bots.
- **Rate limiting:** 5 submissions per IP per 15 minutes, per server instance.
- **Server-side validation:** the browser is never trusted.
- **No persistence:** messages are never written to disk or a database.
- **No false success:** if email delivery is not configured or fails, the API says so honestly.

### Email delivery (optional)

Email is sent through [Resend](https://resend.com) using a server-side HTTP request. Add these variables to `.env` locally and to Vercel's environment variables in production:

```text
RESEND_API_KEY=re_your_api_key_here
CONTACT_TO_EMAIL=laijojose05@gmail.com
CONTACT_FROM_EMAIL=Laijo Portfolio <onboarding@resend.dev>
```

Notes:

- The default `onboarding@resend.dev` sender works only for the Resend account owner's own email. Verify a domain in Resend and use an address on that domain for reliable delivery to any recipient.
- `CONTACT_TO_EMAIL` defaults to `laijojose05@gmail.com` if omitted.
- The API key is read only by the Express backend. It is never sent to the browser.
- If no key is configured, visitors see: "Email delivery is not configured on this copy of the site yet... Please email laijojose05@gmail.com directly." The site still runs normally.
- Delivery failures return an honest error and log a short, non-sensitive error message on the server.

Optional rate-limit configuration (defaults shown):

```text
RATE_LIMIT_MAX=5
RATE_LIMIT_WINDOW_MS=900000
```

On Vercel, the in-memory rate limiter applies per serverless instance. It reduces bursts but is not a global quota. For stronger limits, use a hosted rate-limit service or Vercel Firewall.

---

## Deploy to Vercel

This project uses Vercel's **zero-configuration Express** support. Vercel detects `server.js`, imports the exported Express app, and runs it as a serverless function. Files in `public/` are served from Vercel's CDN. `express.static()` is intentionally local-development-only; Vercel ignores it and serves `public/**` directly.

### 1. Publish the source to GitHub

Create an empty repository on GitHub (do not add a README, `.gitignore`, or licence if you already have them), then run:

```powershell
cd C:\Users\ANGEL\laijo-portfolio
git init
git add .
git commit -m "Build Laijo Jose student developer portfolio"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

Replace the remote URL with the repository you created. Confirm that `.env` and `node_modules/` are not committed (`git status` should show only intended files).

### 2. Import the repository into Vercel

1. Sign in at [vercel.com](https://vercel.com) and choose **Add New → Project**.
2. Import the GitHub repository.
3. Leave the framework preset on **Express** (Vercel detects it). If asked for build settings, keep the defaults; there is no build step.
4. Ensure the Node.js version is **20 or newer**.
5. Add environment variables only if you configured email delivery:
   - `RESEND_API_KEY`
   - `CONTACT_TO_EMAIL`
   - `CONTACT_FROM_EMAIL`
6. Click **Deploy**.

### 3. Verify the deployment

After Vercel finishes:

- Open the deployment URL.
- Check all sections, the mobile menu, project filtering, and the project modal.
- Submit the contact form once and confirm you see either a delivered message or the honest "not configured" notice.
- Check **Functions → Logs** if the contact endpoint returns an error.

### 4. Update the Open Graph image URL (recommended)

After deployment, replace the relative `og:image` and `twitter:image` values in `public/index.html` with the full production URL, then redeploy.

### Optional: deploy with the Vercel CLI

```powershell
npm.cmd install -g vercel
vercel
vercel --prod
```

You must still add environment variables in the Vercel dashboard. The project has not been deployed by this setup.

---

## Troubleshooting

### `npm.ps1 cannot be loaded`

Use `npm.cmd` instead of `npm`, or open Command Prompt. See the Windows note above.

### Dependency errors

```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
```

Then start the server again. Avoid mixing `npm` and `yarn` lockfiles.

### Port already in use

Find the process using port 3000:

```powershell
netstat -ano | findstr :3000
```

Stop that process from Task Manager, or set a different `PORT` in `.env`, then restart.

### Contact form returns 429

The rate limit was reached (5 submissions per 15 minutes per IP). Wait, restart the local server to clear in-memory limits, or email directly.

### Contact form says delivery is not configured

That is expected when `RESEND_API_KEY` is missing. Add it to `.env` and restart, or add it in Vercel and redeploy. The site deliberately does not pretend a message was sent.

### Email API returns an error

Check the server logs. Common causes are an invalid API key, an unverified sender domain, or using `onboarding@resend.dev` to send to an address other than the Resend account owner. Verify your domain in Resend and update `CONTACT_FROM_EMAIL`.

### Images or styles do not update after deployment

Vercel caches static assets. See `vercel.json` for cache headers. A new deployment updates the files. During local development, use a hard refresh (`Ctrl + F5`) if needed.

### 404 page appears on Vercel for a valid file

Confirm the file exists inside `public/` and that the path uses a leading slash (for example `/images/og-image.png`). Static files must live in `public/`, not the project root.

---

## Accessibility and quality notes

- Skip link, semantic landmarks, and a logical heading hierarchy
- Visible focus states and keyboard-operable navigation, filters, modal, and form
- Full-screen menu uses `inert` backgrounds, `aria-expanded`, a focus trap, Escape-to-close, and focus restoration
- Modal uses `role="dialog"`, `aria-modal`, focus trapping, Escape, and background inertness
- Form errors are linked with `aria-describedby` and announced with `aria-live`
- Decorative icons are hidden from assistive technologies; meaningful links have accessible names
- Colour palette chosen for readable contrast
- `prefers-reduced-motion` disables entrance animations, typing, floating movement, and smooth scrolling
- Responsive from small mobile screens up to wide desktops
- Local assets only: no external font, icon, or image requests
- Strict Content Security Policy; no inline scripts or inline event handlers

## Licensing

- Site code, custom illustrations, and project screenshots: created for Laijo Jose's portfolio.
- [Space Grotesk](https://github.com/floriankarsten/space-grotesk) - SIL Open Font License 1.1; licence text in `public/fonts/OFL-SpaceGrotesk.txt`.
- [JetBrains Mono](https://github.com/JetBrains/JetBrainsMono) - SIL Open Font License 1.1; licence text in `public/fonts/OFL-JetBrainsMono.txt`.
- Skill icons come from [Simple Icons](https://simpleicons.org/) and are released under CC0 1.0. Brand names and logos remain trademarks of their respective owners.
- Embedded interface icons are Lucide-style SVG symbols. [Lucide](https://lucide.dev/) is ISC licensed.

## Contact

- Email: [laijojose05@gmail.com](mailto:laijojose05@gmail.com)
- GitHub: [github.com/laijojose05-stack](https://github.com/laijojose05-stack)
- LinkedIn: [linkedin.com/in/laijo-jose-96b60b3a8](https://www.linkedin.com/in/laijo-jose-96b60b3a8)
- Location: Kollam, Kerala, India
"# portfolio" 
