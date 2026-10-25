export type HealthResponse = { status: 'ok' };
export type OwnerSession = { id: string; email: string };
export type ApiErrorResponse = {
  statusCode: number;
  message: string;
  path: string;
};
