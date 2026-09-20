import type { Config, Context } from "@netlify/edge-functions"

export default async function basicAuth(request: Request, context: Context) {
	return context.next()
}

export const config: Config = {
	path: "/*",
}
