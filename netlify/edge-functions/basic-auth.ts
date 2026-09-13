import type { Config, Context } from '@netlify/edge-functions'

/**
 * Back-office auth is intentionally disabled by product requirement.
 * Keep this edge function mounted so Netlify deploy wiring stays stable.
 */
export default async function basicAuth(
  _request: Request,
  context: Context,
): Promise<Response> {
  return context.next()
}

export const config: Config = {
  // Keep broad matcher unchanged to avoid deployment config drift.
  path: '/*',
}
