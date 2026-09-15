'use client'

import { useActionState } from 'react'

import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { saveConfig, type ConfigActionState } from '@/lib/actions/configuracion'
import type { Wedding } from '@/lib/db/schema'
import { LANDING_ASSETS } from '@/lib/wedding-content'

import { GiftAccountsEditor } from './gift-accounts-editor'

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <fieldset className="grid gap-5 border-t border-[var(--color-border)] pt-7 first:border-t-0 first:pt-0">
      <div>
        <legend className="font-display text-lg text-[var(--color-foreground)]">{title}</legend>
        {description ? (
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{description}</p>
        ) : null}
      </div>
      {children}
    </fieldset>
  )
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-[var(--color-muted)] px-1.5 py-0.5 text-[0.8em] text-[var(--color-foreground)]">
      {children}
    </code>
  )
}

/**
 * Everything the guests see on «Nuestra boda» (/nuestra-boda and every
 * /i/[token] invitation) is edited here. Empty fields hide their block on the
 * landing, so the couple can publish progressively.
 */
export function ConfigForm({ wedding }: { wedding: Wedding | null }) {
  const [state, formAction, pending] = useActionState<ConfigActionState, FormData>(
    saveConfig,
    undefined,
  )

  const errs = state?.fieldErrors
  const dateValue = wedding?.eventDate
    ? new Date(wedding.eventDate).toISOString().slice(0, 10)
    : ''

  return (
    <form action={formAction} noValidate className="grid max-w-2xl gap-8 pb-24">
      {/* ── Los novios ─────────────────────────────────────────────────── */}
      <Section title="Los novios">
        <Field
          label="Nombres de la pareja"
          hint="Como aparecerán en la invitación, p. ej. «Esther & Jeriel»"
          error={errs?.coupleNames?.[0]}
        >
          <Input name="coupleNames" placeholder="Esther & Jeriel" defaultValue={wedding?.coupleNames ?? ''} />
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <Field label="Monograma" hint="Vacío = iniciales (E & J)" error={errs?.monogram?.[0]}>
            <Input name="monogram" placeholder="E & J" maxLength={12} defaultValue={wedding?.monogram ?? ''} />
          </Field>
          <Field label="Hashtag" error={errs?.hashtag?.[0]}>
            <Input name="hashtag" placeholder="#EstherYJeriel" defaultValue={wedding?.hashtag ?? ''} />
          </Field>
          <Field label="Frase del inicio" hint="Vacío = «Nos casamos»" error={errs?.tagline?.[0]}>
            <Input name="tagline" placeholder="Nos casamos" defaultValue={wedding?.tagline ?? ''} />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Padres de la novia" hint="Un nombre por línea" error={errs?.brideParents?.[0]}>
            <Textarea name="brideParents" rows={2} defaultValue={wedding?.brideParents ?? ''} />
          </Field>
          <Field label="Padres del novio" hint="Un nombre por línea" error={errs?.groomParents?.[0]}>
            <Textarea name="groomParents" rows={2} defaultValue={wedding?.groomParents ?? ''} />
          </Field>
        </div>
      </Section>

      {/* ── Fecha y lugar ──────────────────────────────────────────────── */}
      <Section
        title="Fecha y lugar"
        description="La fecha y la hora alimentan la cuenta atrás y el calendario; la ciudad va bajo los nombres."
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <Field label="Fecha" error={errs?.eventDate?.[0]}>
            <Input name="eventDate" type="date" defaultValue={dateValue} />
          </Field>
          <Field label="Hora" hint="p.ej. 4:30 PM" error={errs?.eventTime?.[0]}>
            <Input name="eventTime" placeholder="4:30 PM" defaultValue={wedding?.eventTime ?? ''} />
          </Field>
          <Field label="Ciudad" error={errs?.city?.[0]}>
            <Input name="city" placeholder="Santo Domingo, RD" defaultValue={wedding?.city ?? ''} />
          </Field>
        </div>

        <div className="grid gap-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <p className="text-sm font-medium text-[var(--color-foreground)]">Ceremonia</p>
          <Field label="Lugar" error={errs?.venue?.[0]}>
            <Input
              name="venue"
              placeholder="Parroquia Santa Ana"
              defaultValue={wedding?.venue ?? ''}
            />
          </Field>
          <Field label="Dirección" error={errs?.venueAddress?.[0]}>
            <Input name="venueAddress" placeholder="Calle Padre Billini, Zona Colonial" defaultValue={wedding?.venueAddress ?? ''} />
          </Field>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr_2fr]">
            <Field label="Hora de la ceremonia" hint="Vacío = la hora general" error={errs?.ceremonyStart?.[0]}>
              <Input name="ceremonyStart" placeholder="4:30 PM" defaultValue={wedding?.ceremonyStart ?? ''} />
            </Field>
            <Field label="Enlace al mapa" hint="Google Maps u otro" error={errs?.mapUrl?.[0]}>
              <Input name="mapUrl" type="url" placeholder="https://maps.app.goo.gl/…" defaultValue={wedding?.mapUrl ?? ''} />
            </Field>
          </div>
        </div>

        <div className="grid gap-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <div>
            <p className="text-sm font-medium text-[var(--color-foreground)]">Recepción</p>
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
              Déjalo vacío si es en el mismo lugar que la ceremonia (solo indica la hora).
            </p>
          </div>
          <Field label="Lugar" error={errs?.receptionPlace?.[0]}>
            <Input name="receptionPlace" placeholder="Salón Los Jardines" defaultValue={wedding?.receptionPlace ?? ''} />
          </Field>
          <Field label="Dirección" error={errs?.receptionAddress?.[0]}>
            <Input name="receptionAddress" defaultValue={wedding?.receptionAddress ?? ''} />
          </Field>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr_2fr]">
            <Field label="Hora de la recepción" error={errs?.receptionStart?.[0]}>
              <Input name="receptionStart" placeholder="7:00 PM" defaultValue={wedding?.receptionStart ?? ''} />
            </Field>
            <Field label="Enlace al mapa" error={errs?.receptionMapUrl?.[0]}>
              <Input name="receptionMapUrl" type="url" placeholder="https://maps.app.goo.gl/…" defaultValue={wedding?.receptionMapUrl ?? ''} />
            </Field>
          </div>
        </div>
      </Section>

      {/* ── La invitación ──────────────────────────────────────────────── */}
      <Section title="La invitación" description="El texto de la carta: bienvenida, vuestra historia y una cita.">
        <Field
          label="Mensaje de bienvenida"
          hint="Texto que verán los invitados bajo los nombres"
          error={errs?.message?.[0]}
        >
          <Textarea
            name="message"
            rows={4}
            placeholder="Con la bendición de Dios y de nuestras familias, queremos compartir contigo el día en que uniremos nuestras vidas…"
            defaultValue={wedding?.message ?? ''}
          />
        </Field>

        <Field label="Nuestra historia" hint="Un párrafo por línea (opcional)" error={errs?.story?.[0]}>
          <Textarea name="story" rows={4} defaultValue={wedding?.story ?? ''} />
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-[2fr_1fr]">
          <Field label="Cita o versículo" error={errs?.quoteText?.[0]}>
            <Textarea
              name="quoteText"
              rows={2}
              placeholder="El amor todo lo cree, todo lo espera, todo lo soporta."
              defaultValue={wedding?.quoteText ?? ''}
            />
          </Field>
          <Field label="Autor / referencia" error={errs?.quoteAttribution?.[0]}>
            <Input name="quoteAttribution" placeholder="1 Corintios 13, 7" defaultValue={wedding?.quoteAttribution ?? ''} />
          </Field>
        </div>

        <Field
          label="Foto de la pareja"
          hint={
            <>
              Sube tu foto a <Code>public{LANDING_ASSETS.coupleImage}</Code> y deja esto vacío,
              o pega un enlace https a la imagen.
            </>
          }
          error={errs?.coupleImageUrl?.[0]}
        >
          <Input name="coupleImageUrl" placeholder={LANDING_ASSETS.coupleImage} defaultValue={wedding?.coupleImageUrl ?? ''} />
        </Field>
      </Section>

      {/* ── Itinerario y detalles ──────────────────────────────────────── */}
      <Section title="Itinerario y detalles">
        <Field
          label="Horario / agenda"
          hint="Una línea por momento: «4:30 PM · Ceremonia · Recíbenos con tu mejor sonrisa». El icono se elige solo."
          error={errs?.schedule?.[0]}
        >
          <Textarea
            name="schedule"
            rows={5}
            placeholder={'4:30 PM · Ceremonia religiosa\n6:00 PM · Cóctel de bienvenida · Brindis y aperitivos\n7:00 PM · Cena\n9:00 PM · Fiesta · ¡A bailar hasta el amanecer!'}
            defaultValue={wedding?.schedule ?? ''}
          />
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Código de vestimenta" hint="Título corto" error={errs?.dressCode?.[0]}>
            <Input name="dressCode" placeholder="Etiqueta formal" defaultValue={wedding?.dressCode ?? ''} />
          </Field>
          <Field label="Nota de vestimenta" error={errs?.dressCodeNote?.[0]}>
            <Input
              name="dressCodeNote"
              placeholder="Te pedimos reservar el blanco para la novia."
              defaultValue={wedding?.dressCodeNote ?? ''}
            />
          </Field>
        </div>

        <Field
          label="Detalles prácticos"
          hint="Bloques separados por una línea en blanco; la primera línea es el título (Puntualidad, Solo adultos…)."
          error={errs?.guestNotes?.[0]}
        >
          <Textarea
            name="guestNotes"
            rows={5}
            placeholder={'Puntualidad\nLa ceremonia empieza a la hora indicada. Ven con tiempo.\n\nSolo adultos\nEsta vez, los niños descansan en casa.'}
            defaultValue={wedding?.guestNotes ?? ''}
          />
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Transporte" error={errs?.transport?.[0]}>
            <Textarea name="transport" rows={3} defaultValue={wedding?.transport ?? ''} />
          </Field>
          <Field label="Alojamiento" error={errs?.accommodation?.[0]}>
            <Textarea name="accommodation" rows={3} defaultValue={wedding?.accommodation ?? ''} />
          </Field>
        </div>
      </Section>

      {/* ── Mesa de regalos ────────────────────────────────────────────── */}
      <Section
        title="Mesa de regalos"
        description="La página pública no se indexa. Si todo está vacío, la sección no se muestra."
      >
        <Field label="Mensaje" error={errs?.giftMessage?.[0]}>
          <Textarea
            name="giftMessage"
            rows={3}
            placeholder="Tu compañía es lo que de verdad queremos ese día. Si además deseas tener un detalle con nosotros…"
            defaultValue={wedding?.giftMessage ?? ''}
          />
        </Field>

        <div className="grid gap-2">
          <p className="text-sm font-medium text-[var(--color-foreground)]">Cuentas para transferencia</p>
          <GiftAccountsEditor initial={wedding?.giftAccounts ?? []} error={errs?.giftAccounts?.[0]} />
        </div>

        <Field label="Lluvia de sobres" hint="Nota para quien prefiera entregarlo en persona" error={errs?.giftEnvelopeNote?.[0]}>
          <Input
            name="giftEnvelopeNote"
            placeholder="Si prefieres entregarlo en persona, habrá una lluvia de sobres en la recepción."
            defaultValue={wedding?.giftEnvelopeNote ?? ''}
          />
        </Field>

        <Field
          label="Datos para transferencia"
          hint="Texto libre adicional (p. ej. PayPal, Zelle, instrucciones)"
          error={errs?.giftDetails?.[0]}
        >
          <Textarea name="giftDetails" rows={3} defaultValue={wedding?.giftDetails ?? ''} />
        </Field>
      </Section>

      {/* ── Contacto y música ──────────────────────────────────────────── */}
      <Section title="Contacto y música">
        <Field
          label="WhatsApp de contacto"
          hint="Formato internacional; aparece como botón al final de la invitación"
          error={errs?.contactWhatsapp?.[0]}
        >
          <Input name="contactWhatsapp" inputMode="tel" placeholder="+1 809 555 0000" defaultValue={wedding?.contactWhatsapp ?? ''} />
        </Field>

        <Field
          label="Canción del reproductor"
          hint={
            <>
              Sube el archivo a <Code>public{LANDING_ASSETS.music}</Code> (MP3, ideal &lt; 5 MB).
              Aquí solo el título que se muestra, p. ej. «Perfect — Ed Sheeran».
            </>
          }
          error={errs?.musicTitle?.[0]}
        >
          <Input name="musicTitle" placeholder="Perfect — Ed Sheeran" defaultValue={wedding?.musicTitle ?? ''} />
        </Field>
      </Section>

      {/* ── Datos internos ─────────────────────────────────────────────── */}
      <Section
        title="Datos internos del lugar"
        description="Solo para vosotros. Nunca se muestran a los invitados."
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Teléfono del lugar" error={errs?.venuePhone?.[0]}>
            <Input name="venuePhone" defaultValue={wedding?.venuePhone ?? ''} />
          </Field>
          <Field label="Coordinador/a del lugar" error={errs?.venueCoordinator?.[0]}>
            <Input name="venueCoordinator" defaultValue={wedding?.venueCoordinator ?? ''} />
          </Field>
          <Field label="Ceremonia — fin" error={errs?.ceremonyEnd?.[0]}>
            <Input name="ceremonyEnd" defaultValue={wedding?.ceremonyEnd ?? ''} />
          </Field>
          <Field label="Recepción — fin" error={errs?.receptionEnd?.[0]}>
            <Input name="receptionEnd" defaultValue={wedding?.receptionEnd ?? ''} />
          </Field>
        </div>
      </Section>

      {/* ── Privacidad ─────────────────────────────────────────────────── */}
      <Section title="Privacidad">
        <Field
          label="Contacto para datos personales"
          hint="Email/teléfono para que los invitados ejerzan sus derechos (RGPD)"
          error={errs?.privacyContact?.[0]}
        >
          <Input name="privacyContact" placeholder="novios@ejemplo.com" defaultValue={wedding?.privacyContact ?? ''} />
        </Field>
      </Section>

      {/* ── Barra de guardado fija ─────────────────────────────────────── */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-border)] bg-[var(--color-background)]/90 backdrop-blur-md lg:left-60">
        <div className="flex w-full max-w-2xl items-center gap-3 px-6 py-3 sm:px-8 lg:px-10">
          <Button type="submit" variant="primary" disabled={pending} aria-busy={pending}>
            {pending ? 'Guardando…' : 'Guardar'}
          </Button>
          {state?.ok ? (
            <span role="status" className="text-sm text-[var(--color-success)]">
              Guardado ✓
            </span>
          ) : null}
          {state?.error ? (
            <span role="alert" className="text-sm text-[var(--color-destructive)]">
              {state.error}
            </span>
          ) : null}
          {errs && !state?.error ? (
            <span role="alert" className="text-sm text-[var(--color-destructive)]">
              Revisa los campos marcados.
            </span>
          ) : null}
          <a
            href="/nuestra-boda"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-sm text-[var(--color-accent)] underline-offset-4 hover:underline"
          >
            Ver la invitación ↗
          </a>
        </div>
      </div>
    </form>
  )
}
