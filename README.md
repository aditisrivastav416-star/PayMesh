# PayMesh

Payment authorization gateway for AI agents. The agent requests a purchase; the backend alone decides whether it is allowed, denied, or needs human approval. PayPal checkout will be initiated only after authorization.

## Layout

| Path | Responsibility |
| --- | --- |
| `apps/web` | Next.js owner dashboard |
| `apps/api` | NestJS API; policy, approvals, budget ledger, audit, and PayPal integration belong here |
| `apps/agent` | Demo purchasing agent and future MCP client; it only requests payments from the API |

The API is the trust boundary. The web app and agent must never hold PayPal credentials or implement spending decisions. A future MCP server should call the same backend request service as REST.

## Run the skeleton

Requires Node.js 20+ and pnpm 11.

Copy each app's `.env.example` to `.env` in the same directory and fill in credentials as those integrations are implemented. Next.js also accepts `apps/web/.env.local`. Keep real `.env` files out of Git. Only `NEXT_PUBLIC_` values should be exposed to the browser.

```sh
pnpm install
pnpm dev
```

Open `http://localhost:3000` for the dashboard shell. The API health endpoint is `http://localhost:3001/health`.

## Next implementation slices

1. Add PostgreSQL/Prisma schema for owners, agents, policies, payment requests, reservations, approvals, and audit events.
2. Add scoped agent keys and owner authentication before accepting payment requests.
3. Implement deterministic policy evaluation and atomic budget reservations in the API.
4. Add exact-request approvals, then PayPal Sandbox order creation and capture.
5. Expose the API through MCP and connect the demo agent.

No payment request or checkout path is active in this skeleton.

