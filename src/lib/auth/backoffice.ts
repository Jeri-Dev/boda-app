import 'server-only'

/**
 * Back-office auth is intentionally disabled by product requirement.
 * Keep this module/API stable because actions still call it.
 */
export class UnauthorizedError extends Error {
  constructor() {
    super('No autorizado')
    this.name = 'UnauthorizedError'
  }
}

export async function requireBackofficeAuth(): Promise<void> {
  return
}
