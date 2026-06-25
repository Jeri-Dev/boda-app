/**
 * Privacy notice (U2.6). Light by design — the app collects only the minimum to
 * organize the wedding (name, attendance, menu, optional message; allergies were
 * removed entirely). Shown where personal data is collected (the RSVP form) and
 * on the public info page. `contact` is the couple's channel for data rights.
 */
export function PrivacyNotice({ contact }: { contact: string | null }) {
  return (
    <p className="text-xs leading-relaxed text-[var(--color-muted-foreground)]">
      Tus datos (nombre, asistencia, menú y, si lo dejas, un mensaje) se usan
      únicamente para organizar la boda y no se comparten con terceros. Puedes
      acceder, rectificar o eliminar tus datos
      {contact ? (
        <>
          {' '}
          escribiendo a{' '}
          <span className="text-[var(--color-foreground)]">{contact}</span>.
        </>
      ) : (
        ' contactando con los novios.'
      )}
    </p>
  )
}
