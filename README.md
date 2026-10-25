# PayMesh

Payment authorization gateway for AI agents. The backend owns spending decisions and PayPal credentials; the dashboard and demo agent call its API.

## Workspace

| Path              | Purpose                                                    |
| ----------------- | ---------------------------------------------------------- |
| `apps/web`        | Next.js owner dashboard, Tailwind, shadcn/ui components    |
| `apps/api`        | NestJS API, Prisma, owner sessions, PayPal Sandbox adapter |
| `apps/agent`      | Demo agent entry point (agent logic comes later)           |
| `packages/shared` | Types shared by the API and dashboard                      |

## Local setup

Requires Node.js 20+, pnpm 11, and PostgreSQL tools (`initdb`, `pg_ctl`, `psql`) on `PATH`.

```sh
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
pnpm db:start
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Before seeding, replace `OWNER_PASSWORD` in `apps/api/.env` with a strong password. The seed command creates or updates the owner and invalidates existing sessions. Open `http://localhost:3000/login`. The API health endpoint is `http://localhost:3001/health`.

`pnpm db:start` creates a local database cluster at `~/.local/share/paymesh/postgres` and binds it only to `127.0.0.1:5433`. The example local database password is `paymesh`; change `PAYMESH_DB_PASSWORD` and `DATABASE_URL` together before first initialization if you need another value. Run `pnpm db:stop` to stop it. For a hosted PostgreSQL instance, set `DATABASE_URL` and skip `db:start`.

The dashboard uses an HTTP-only owner session cookie. The API checks the session against PostgreSQL on every request; owner login is limited to five attempts per minute. Real `.env` files are ignored by Git. Only `NEXT_PUBLIC_` values are sent to browser code.

## PayPal Sandbox

See [sandbox setup](docs/paypal-sandbox.md). The backend adapter supports OAuth token retrieval and Orders v2 create/capture. A manual `$1.00` smoke test is available once sandbox credentials and buyer approval are ready. Payment endpoints are intentionally not exposed until policy authorization is implemented.

## Checks

```sh
pnpm build
pnpm lint
pnpm format:check
pnpm --filter @paymesh/api test
```

## Next product slices

Add agent registration and scoped keys, deterministic policy evaluation, atomic budget reservations, exact-request approvals, payment request audit records, and an MCP server that calls the same backend authorization path.
