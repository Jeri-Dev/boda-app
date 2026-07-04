import type { Viewport } from 'next'

/**
 * Passthrough layout for the guest-facing routes. Its only job is to keep the
 * warm editorial chrome (status-bar / theme color) for the public invitation +
 * info, while the back-office uses the cool minimal theme set at the root.
 */
export const viewport: Viewport = {
  themeColor: '#FBF7F1',
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
