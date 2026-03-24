---
inclusion: fileMatch
fileMatchPattern: "**/*.{js,ts,tsx,html}"
---

# UW Flow — Coding Standards

## JavaScript / TypeScript
- Use `const` by default, `let` only when reassignment is needed
- Prefer arrow functions for callbacks
- All API endpoints must return JSON with consistent error shapes: `{ error: string }`
- Use descriptive variable names — no single-letter variables except loop counters

## HTML / CSS
- All colors must use the UW palette variables, not hardcoded hex values where possible
- Primary: `#4b2e83` (purple), Accent: `#b7a57a` (gold)
- Use semantic HTML elements (`<main>`, `<nav>`, `<section>`, `<article>`)
- All interactive elements must have visible focus states
- All images and icons must have alt text or aria-label

## API Design
- REST endpoints use kebab-case paths: `/api/wait-times`, `/api/dry-route`
- POST endpoints validate input and return 400 with descriptive error messages
- All responses include appropriate HTTP status codes

## Error Handling
- Never swallow errors silently — log them at minimum
- API endpoints should catch errors and return structured JSON error responses
- Frontend should display user-friendly error messages, not raw error text
