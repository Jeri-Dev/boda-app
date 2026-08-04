/**
 * Contenido de la landing de invitación (Jeriel & Esther).
 *
 * Todo es editable aquí sin tocar los componentes. Cuando quieras conectar los
 * datos reales de la tabla `wedding` (Drizzle), mapea esos campos a esta forma
 * y pásalos por props — la UI ya está desacoplada.
 *
 * ⚠️ Los valores marcados con «TODO» son marcadores de posición: reemplázalos
 * por los datos reales antes de compartir el enlace.
 */

export type BankAccount = {
  bank: string
  holder: string
  type: string
  /** Número de cuenta / IBAN. */
  number: string
  /** Opcional: cédula/RNC o alias para transferencias rápidas. */
  reference?: string
}

export type EventPlace = {
  label: string
  time: string
  place: string
  address: string
  /** URL de Google Maps que abre las direcciones reales. */
  mapUrl: string
}

export type TimelineIcon = 'ceremonia' | 'brindis' | 'cena' | 'fiesta'

export type TimelineItem = {
  time: string
  title: string
  detail?: string
  /** Icono del hito (SVG line-art; ver details-section). */
  icon: TimelineIcon
}

export type WeddingContent = {
  couple: {
    first: string
    second: string
    /** Monograma, p. ej. «J & E». */
    monogram: string
    hashtag: string
  }
  /** Fecha y hora del evento en ISO local (sin zona). Usado por la cuenta atrás. */
  dateISO: string
  city: string
  /** Frase corta del hero. */
  tagline: string
  /** Mensaje de bienvenida bajo los nombres. */
  welcome: string
  story: string[]
  /** Versículo / cita para la banda oscura entre secciones. */
  quote: {
    text: string
    attribution: string
  }
  ceremony: EventPlace
  reception: EventPlace
  timeline: TimelineItem[]
  dressCode: {
    title: string
    note: string
  }
  gifts: {
    intro: string
    /** Nota sutil, tono cálido — nunca «pidiendo dinero». */
    note: string
    accounts: BankAccount[]
  }
  contact: {
    /** Teléfono en formato E.164 para el enlace de WhatsApp (sin +). */
    whatsapp: string
    /** Texto visible del contacto. */
    label: string
  }
}

export const wedding: WeddingContent = {
  couple: {
    first: 'Jeriel',
    second: 'Esther',
    monogram: 'J & E',
    hashtag: '#JerielYEsther',
  },
  // TODO: fecha real de la boda (formato ISO local).
  dateISO: '2026-12-05T16:00:00',
  city: 'Santo Domingo, República Dominicana', // TODO
  tagline: 'Nos casamos',
  welcome:
    'Con la bendición de Dios y de nuestras familias, queremos compartir contigo el día en que uniremos nuestras vidas. Tu presencia hará este momento inolvidable.',
  story: [
    'Lo que empezó como una amistad se convirtió, sin darnos cuenta, en la certeza de que queríamos caminar juntos el resto de la vida.',
    'Después de años de risas, viajes y sueños compartidos, decidimos dar el paso más importante. Y no imaginamos ese día sin ti a nuestro lado.',
  ],
  ceremony: {
    label: 'Ceremonia',
    time: '4:00 PM',
    place: 'Parroquia Santa Ana', // TODO
    address: 'Calle Padre Billini, Zona Colonial, Santo Domingo', // TODO
    // TODO: reemplaza por el enlace real (comparte ubicación en Google Maps).
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Parroquia+Santa+Ana+Santo+Domingo',
  },
  reception: {
    label: 'Recepción',
    time: '6:30 PM',
    place: 'Salón Los Jardines', // TODO
    address: 'Av. Anacaona 12, Santo Domingo', // TODO
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Los+Jardines+Santo+Domingo',
  },
  quote: {
    text: 'El amor todo lo cree, todo lo espera, todo lo soporta. El amor nunca deja de ser.',
    attribution: '1 Corintios 13, 7-8',
  },
  timeline: [
    { time: '4:00 PM', title: 'Ceremonia religiosa', detail: 'Recíbenos con tu mejor sonrisa', icon: 'ceremonia' },
    { time: '6:00 PM', title: 'Cóctel de bienvenida', detail: 'Brindis y aperitivos', icon: 'brindis' },
    { time: '7:00 PM', title: 'Cena y celebración', icon: 'cena' },
    { time: '9:00 PM', title: 'Fiesta', detail: '¡A bailar hasta el amanecer!', icon: 'fiesta' },
  ],
  dressCode: {
    title: 'Etiqueta formal',
    note: 'Nos encantaría verte elegante. Te pedimos reservar el blanco para la novia.',
  },
  gifts: {
    intro: 'Tu compañía es nuestro regalo',
    note: 'Lo más importante para nosotros es contar contigo ese día. Si además deseas tener un detalle, aquí te dejamos, con cariño y total libertad, la información por si prefieres una transferencia.',
    accounts: [
      {
        bank: 'Banco Popular Dominicano', // TODO
        holder: 'Jeriel Gómez', // TODO
        type: 'Cuenta de ahorros',
        number: '000-0000000-0', // TODO
      },
      {
        bank: 'Banreservas', // TODO
        holder: 'Esther —', // TODO
        type: 'Cuenta de ahorros',
        number: '000-0000000-0', // TODO
      },
    ],
  },
  contact: {
    whatsapp: '18090000000', // TODO: número en formato internacional sin «+»
    label: 'Escríbenos por WhatsApp',
  },
}
