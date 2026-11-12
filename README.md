# PayMesh

Payment authorization gateway for AI agents. The backend owns spending decisions and PayPal credentials; the dashboard and demo agent call its API.

## Workspace

| Path              | Purpose                                                    |
| ----------------- | ---------------------------------------------------------- |
| `apps/web`        | Next.js owner dashboard, Tailwind, shadcn/ui components    |
| `apps/api`        | NestJS API, Prisma, owner sessions, PayPal Sandbox adapter |
| `apps/agent`      | AI demo agent with a two-item sandbox catalog              |
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

After pulling changes, run `pnpm db:migrate`. On the Agents page, register an agent and create a key. Copy it when shown; PayMesh stores only its hash. Put it in `PAYMESH_AGENT_API_KEY` in `apps/agent/.env`. Revoking a key or deactivating an agent blocks later authentication.

## PayPal Sandbox

See [sandbox setup](docs/paypal-sandbox.md). The backend adapter supports OAuth token retrieval and Orders v2 create/capture. A manual `$1.00` smoke test is available once sandbox credentials and buyer approval are ready.

## Demo: AI agent to PayPal Sandbox

1. Complete local setup above, configure sandbox business app credentials in `apps/api/.env`, and use a separate sandbox personal buyer account.
2. On `/agents`, register an agent and create its key. Copy `apps/agent/.env.example` to `apps/agent/.env`, then set `PAYMESH_AGENT_API_KEY` and `GEMINI_API_KEY`. Never commit either key.
3. On `/settings`, set the per-purchase limit to `1.00` USD.
4. Run `pnpm build`, then `pnpm --filter @paymesh/agent demo -- "Buy a notebook"`. The AI chooses from the fixed demo catalog and submits a $1.00 request. It should appear as **READY** on `/approvals`.
5. Run `pnpm --filter @paymesh/agent demo -- "Buy headphones"`. The $2.00 request should appear as **PENDING**. Approve it (or reject it to demonstrate denial).
6. For a READY request, click **Create PayPal checkout**, then **Approve in PayPal Sandbox**. Sign in as the sandbox buyer and approve. Return to PayMesh and click **Capture after buyer approval**. The completed capture appears on `/payments`.

PayMesh makes the authorization decision; the AI only picks a catalog item. The catalog is fictional and no product is delivered. All PayPal calls use Sandbox. PayPal buyer approval is required before capture. If checkout or capture fails temporarily, retry the action on the same request; PayPal request IDs make those retries idempotent.

The demo agent uses Gemini by default. Set `DEEPSEEK_API_KEY` to let it fall back to DeepSeek only when Gemini times out, cannot be reached, is rate limited, or returns a server error. Invalid Gemini credentials stop the run instead of falling back.

## Hackathon submission

Publish this repository with the root [MIT license](LICENSE). Include this setup guide, a short project description, and the AI model used in your Devpost entry. Record a public YouTube video under three minutes showing the AI choice, pending approval, sandbox buyer approval, and completed payment. Add the video and public repository links to the submission. A static mockup alone does not meet the functional demo requirement.

## Checks

```sh
pnpm build
pnpm lint
pnpm format:check
pnpm --filter @paymesh/api test
```

## Current limits

The MVP has one per-purchase limit, USD Sandbox checkout, and an owner-assisted buyer approval/capture flow. It does not implement cumulative budgets or production payments.
