/** The demo agent will ask the API to authorize purchases; it will never decide policy or call PayPal. */
export const PAYMESH_API_URL = process.env.PAYMESH_API_URL ?? 'http://localhost:3001';
