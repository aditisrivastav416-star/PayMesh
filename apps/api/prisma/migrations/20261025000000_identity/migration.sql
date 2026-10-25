CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

CREATE TABLE "owner_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "owner_sessions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "owner_sessions_token_hash_key" ON "owner_sessions"("token_hash");
CREATE INDEX "owner_sessions_user_id_idx" ON "owner_sessions"("user_id");
ALTER TABLE "owner_sessions" ADD CONSTRAINT "owner_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "agents" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deactivated_at" TIMESTAMP(3),
    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "agents_owner_id_idx" ON "agents"("owner_id");
ALTER TABLE "agents" ADD CONSTRAINT "agents_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "agent_api_keys" (
    "id" UUID NOT NULL,
    "agent_id" UUID NOT NULL,
    "key_hash" TEXT NOT NULL,
    "scopes" TEXT[] NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "last_used_at" TIMESTAMP(3),
    CONSTRAINT "agent_api_keys_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "agent_api_keys_agent_id_idx" ON "agent_api_keys"("agent_id");
ALTER TABLE "agent_api_keys" ADD CONSTRAINT "agent_api_keys_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
