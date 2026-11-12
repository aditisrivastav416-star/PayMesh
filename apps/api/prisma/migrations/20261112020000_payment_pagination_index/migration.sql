DROP INDEX "PaymentRequest_ownerId_createdAt_idx";
CREATE INDEX "PaymentRequest_ownerId_createdAt_id_idx" ON "PaymentRequest"("ownerId", "createdAt" DESC, "id" DESC);
