# CONVENTIONS

Updated: 2026-04-24

## Summary

The codebase follows pragmatic project conventions rather than strict framework enforcement. Consistency exists in naming, route organization, and tokenized styling, but there is little evidence of automated linting, formatting, or test enforcement.

## Naming

- React pages and components use PascalCase file names such as `src/pages/Login.jsx` and `src/components/layout/AppLayout.jsx`.
- Hooks use the `useX` pattern such as `src/hooks/useAuth.jsx` and `src/hooks/usePermissions.jsx`.
- Utilities in `src/lib/` are short and descriptive, for example `api.js`, `access.js`, and `supabase.js`.
- Environment variables use Vite and service-specific naming conventions such as `VITE_API_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

## Component Style

- Most components are functional components with React hooks.
- State is generally local to the page/component.
- Providers are used for cross-cutting concerns: auth and permissions in `src/hooks/`.
- Inline styles are common in app screens and helpers, especially in `src/App.jsx` and many page files.
- CSS variables from `src/index.css` are the main visual contract across the app.

## Data Access Pattern

- Page components usually query Supabase directly instead of calling a shared domain service.
- Auth/session handling is centralized in `src/hooks/useAuth.jsx`.
- Compatibility and tenant lookup logic is centralized in `src/lib/access.js`.
- Lightweight fetch abstraction exists in `src/lib/api.js` for backend-bound requests.

## Error Handling

- Frontend error handling is mostly local `try/catch` with `console.error`.
- Fallback query strategies are common, especially in `src/lib/access.js` and `src/hooks/usePermissions.jsx`, to support schema drift.
- Edge Functions return JSON error responses rather than a shared error envelope library.
- The Fastify backend uses explicit guard helpers and throws `Error` objects with human-readable Portuguese messages.

## Access Control Convention

- Owner/admin behavior is treated as an override in both frontend permissions and backend guards.
- Role defaults are hardcoded in `src/hooks/usePermissions.jsx`.
- Workspace or company scope is inferred rather than fully abstracted behind one canonical tenant model.

## Styling Convention

- Global design tokens are defined centrally in `src/index.css`.
- Theme switching is implemented by mutating `data-theme` on `document.documentElement` in `src/App.jsx`.
- The app mixes token-driven CSS classes with inline style objects for screen-specific composition.

## Logging and Debugging

- The codebase still contains debug logging in UI flows, for example in `src/pages/Login.jsx` and `src/pages/ClientForm.jsx`.
- Comments are present but informal; there is no strict doc-comment or API-doc convention.

## Conventions to Preserve

- Keep route files under `src/pages/`.
- Keep global/shared infra in `src/lib/` and cross-cutting context in `src/hooks/`.
- Prefer existing CSS token usage over introducing a second design system.
- Preserve the current owner/admin/agent permission model unless a product-level access redesign is explicitly requested.
