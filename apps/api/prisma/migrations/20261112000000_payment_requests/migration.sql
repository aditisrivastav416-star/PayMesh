ALTER TABLE "users" ADD COLUMN "spendingLimitCents" INTEGER NOT NULL DEFAULT 100;
CREATE TABLE "PaymentRequest" (
  "id" UUID NOT NULL,
  "ownerId" UUID NOT NULL,
  "agentId" UUID NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "purpose" TEXT NOT NULL,
  "merchant" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "orderId" TEXT,
  "approveUrl" TEXT,
  "captureId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PaymentRequest_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PaymentRequest_orderId_key" ON "PaymentRequest"("orderId");
CREATE INDEX "PaymentRequest_ownerId_createdAt_idx" ON "PaymentRequest"("ownerId", "createdAt");
ALTER TABLE "PaymentRequest" ADD CONSTRAINT "PaymentRequest_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentRequest" ADD CONSTRAINT "PaymentRequest_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
