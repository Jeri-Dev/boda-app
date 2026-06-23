import type { NextConfig } from "next";

// Derive the Supabase Storage hostname at config-eval time. `next/image`
// needs the allowlist before the server starts, so we accept a build-time
// inline value. Falls back to an empty `remotePatterns` array when the env
// var is unset so `pnpm build` succeeds on a fresh clone before Supabase
// exists. Mirrors my-app/next.config.ts.
const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return "";
  }
})();

const nextConfig: NextConfig = {
  // Drop the `X-Powered-By: Next.js` fingerprint header.
  poweredByHeader: false,
  // Already the default for `next start`; set explicitly so this file answers
  // the "are responses compressed?" checklist question without a doc dive.
  compress: true,
  turbopack: {
    // Pin the workspace root to this project. A stray lockfile in $HOME
    // otherwise makes Next infer the wrong root (see build warning).
    root: import.meta.dirname,
  },
  images: {
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
};

// NOTE: security headers() are added in U0.5; the Serwist PWA wrapper is added
// in U0.4 (subject to the Turbopack spike — see docs/solutions/).
export default nextConfig;
