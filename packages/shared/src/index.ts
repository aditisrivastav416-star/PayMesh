export type HealthResponse = { status: 'ok' };
export type OwnerSession = { id: string; email: string };
export const AGENT_KEY_SCOPES = ['payment_requests:create'] as const;
export type AgentKeyScope = (typeof AGENT_KEY_SCOPES)[number];
export type AgentKey = {
  id: string;
  scopes: AgentKeyScope[];
  createdAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  lastUsedAt: string | null;
};
export type Agent = {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
  keys: AgentKey[];
};
export type IssuedAgentKey = {
  id: string;
  key: string;
  scopes: AgentKeyScope[];
};
export type PaymentRequest = {
  id: string;
  agent: { name: string };
  amountCents: number;
  purpose: string;
  merchant: string;
  task: string | null;
  aiReason: string | null;
  aiProvider: string | null;
  status: string;
  approveUrl: string | null;
  orderId: string | null;
  captureId: string | null;
  createdAt: string;
};
export type ApiErrorResponse = {
  statusCode: number;
  message: string;
  path: string;
};
