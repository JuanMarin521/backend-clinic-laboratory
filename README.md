 # CPO Conecta API

REST API for the CPO Conecta patient application. The backend is a Node.js, Express, and TypeScript service with SQLite persistence, versioned routes, JWT authentication, PDF generation, biometric device credentials, and an optional Gemini-backed support assistant.

## Responsibilities

- Register and authenticate patients.
- Manage JWT sessions and biometric device credentials.
- Serve patient-scoped orders, exams, profiles, and result PDFs.
- Store authenticated support conversations.
- Provide a keyword assistant and an optional server-side Google Gemini integration.

## Technology

- Node.js and TypeScript
- Express 4
- SQLite through `better-sqlite3`
- Zod request validation
- `bcryptjs` password hashing
- `jsonwebtoken` access tokens
- `pdf-lib` PDF generation
- Helmet and CORS middleware

## Architecture

```text
src/
├── config/        Environment validation, constants, schema, and database setup
├── routes/        Versioned HTTP route registration
├── middlewares/   Authentication, validation, logging, 404, and errors
├── controllers/   HTTP-to-service adapters
├── services/      Authentication, orders, exams, profiles, chat, biometrics, and PDFs
├── repositories/  SQLite queries and persistence operations
├── validators/    Zod request schemas
├── exceptions/    Typed application errors
├── utils/         JWT, password, file, and token helpers
├── seed/          Explicit development/test demo data
└── server.ts      Migrations, optional seed, and HTTP startup
```
<img width="6600" height="1202" alt="image" src="https://github.com/user-attachments/assets/2cefab3b-c1e8-4034-a71e-df90414216b9" />

The normal request path is `route → middleware → controller → service → repository`. SQL is kept in repositories; services do not depend on Express request/response objects.

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

The server listens on port `4000` by default. The configuration loader fails closed: `NODE_ENV`, `JWT_SECRET`, and `CORS_ORIGIN` must be explicitly configured. Generate a local JWT secret instead of using a repository-known value:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Useful commands:

```bash
npm run typecheck
npm run build
npm start
npm run db:reset
```

`db:reset` removes the configured local SQLite file and is intended for local development only.

## Environment

Copy `.env.example` to `.env` and set values appropriate for the environment:

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | No | HTTP port; defaults to `4000`. |
| `NODE_ENV` | Yes | `development`, `test`, or `production`. |
| `JWT_SECRET` | Yes | At least 32 characters and not a known insecure value. |
| `JWT_EXPIRES_IN` | No | JWT lifetime; defaults to `2h`. |
| `BCRYPT_SALT_ROUNDS` | No | Password hashing cost; minimum effective value is 10. |
| `CORS_ORIGIN` | Yes | Comma-separated allowlist. `*` is rejected in production. |
| `DATABASE_PATH` | No | SQLite file path; defaults to `./data/cpo-conecta.db`. |
| `GEMINI_API_KEY` | No | Enables the server-side Gemini assistant when present. |
| `GEMINI_MODEL` | No | Gemini model name. |
| `ENABLE_DEMO_SEED` | No | Explicitly enables synthetic demo data outside production. Defaults to `false`. |
| `DEMO_USER_PASSWORD` | Only with seed | Password for demo users; never commit it or log it. |
| `DEBUG_ERRORS` | No | Development-only opt-in for internal error details. |

Demo seeding is never automatic in a fresh environment and is forbidden when `NODE_ENV=production`. If enabled in development or test, the password is supplied through `DEMO_USER_PASSWORD`; no shared credential is stored in source code.

## API

Base URL: `/api/v1`

| Area | Method and route | Authentication |
| --- | --- | --- |
| Health | `GET /health` | Public |
| Authentication | `POST /auth/register` | Public |
| Authentication | `POST /auth/login` | Public |
| Biometrics | `POST /auth/biometric/enroll` | JWT |
| Biometrics | `POST /auth/biometric/login` | Device token |
| Biometrics | `POST /auth/biometric/revoke` | Device token |
| Orders | `GET /orders`, `GET /orders/latest` | JWT |
| Orders | `GET /orders/:orderNumber/pdf/file` | JWT |
| Exams | `GET /exams`, `GET /exams/:examId/pdf` | JWT |
| Exams | `GET /exams/:examId/pdf/file` | JWT |
| Profile | `GET /profile` | JWT |
| Profile | `PATCH /profile` | JWT |
| Profile | `PATCH /profile/password` | JWT |
| Support | `GET /support/messages` | JWT |
| Support | `POST /support/messages` | JWT |

Successful JSON responses use `{ success: true, data }`; errors use `{ success: false, error }`. PDF file endpoints return binary content.

## Persistence and security

The SQLite schema contains users, orders, exams, support messages, and biometric device credentials. Foreign keys and WAL mode are enabled during database setup. Patient-owned queries are scoped by the authenticated user ID.

- Passwords are hashed with bcrypt and never returned.
- Failed password attempts are throttled, including unknown usernames.
- JWT-protected routes require a Bearer token.
- Biometric secrets are hashed server-side and rotated after successful device login.
- Changing a password revokes biometric device credentials.
- Unexpected errors are returned as a generic 500 response; debug details require explicit development configuration.

These behaviors describe the implementation and are not a security certification.

## Source references

The backend source is the authority for current behavior. The main implementation references are:

- [`src/config/schema.ts`](src/config/schema.ts) — SQLite schema and constraints.
- [`src/routes/v1/`](src/routes/v1/) — versioned route registration.
- [`src/controllers/`](src/controllers/) — HTTP adapters.
- [`src/services/`](src/services/) — application behavior and integrations.
- [`src/repositories/`](src/repositories/) — SQL persistence operations.

