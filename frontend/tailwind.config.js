/**
 * @type {import('tailwindcss').Config}
 *
 * LOS COLORES APUNTAN A VARIABLES CSS, y esa es la decisión que hace posible el
 * modo oscuro pedido: que siga al sistema operativo y no a un botón.
 *
 * Con colores literales habría que escribir `dark:` en cada clase de cada
 * pantalla — cientos de pares que se desincronizan en cuanto alguien olvida
 * uno, y el olvido no se ve hasta que un usuario abre la app de noche. Apuntando
 * a variables, `bg-surface` YA es correcto en los dos temas, y el tema entero
 * vive en un `@media (prefers-color-scheme: dark)` de `src/design/tokens.css`.
 *
 * El formato `rgb(var(--x) / <alpha-value>)` es lo que conserva los
 * modificadores de opacidad: `bg-surface/60` sigue funcionando. Un hex aquí los
 * mataría todos.
 */

/** Un color del sistema, compuesto desde su variable. */
const token = (nombre) => `rgb(var(--${nombre}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],

  /*
   * Los chips de estado se conservan aunque el escaneo no los vea.
   *
   * Tailwind purga lo que no encuentra escrito literalmente, y el estado de una
   * afirmación jurídica es justo lo que se compone en tiempo de ejecución:
   * `chip-${estado.toLowerCase()}`. Sin esta lista la clase desaparece del CSS
   * y el chip sale sin estilo — en producción, sobre el dato que más importa de
   * la aplicación, y sin un solo error en consola.
   */
  safelist: [
    'chip-verified',
    'chip-unverified',
    'chip-neutral',
    'chip-curated',
    'chip-auto',
    'chip-solid'
  ],
  theme: {
    extend: {
      fontFamily: {
        /*
         * Tres familias, un trabajo cada una.
         *
         * El mono NO es estilo: marca lo citable. Si un número está en mono, el
         * abogado lo puede pegar en un escrito; si está en sans, es interfaz.
         */
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        legal: ['"Source Serif 4"', 'Georgia', 'serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace']
      },

      /*
       * SIETE TAMAÑOS, en vez de text-[10px]…text-[13px] ad hoc.
       *
       * El salto 11 → 12 → 13 → 14 es pequeño porque la app es densa: lo que
       * separa jerarquías es el PESO y el COLOR, no el tamaño.
       */
      fontSize: {
        display: ['26px', { lineHeight: '31px', fontWeight: '600' }],
        title: ['20px', { lineHeight: '26px', fontWeight: '600' }],
        subtitle: ['16px', { lineHeight: '22px', fontWeight: '600' }],
        body: ['14px', { lineHeight: '22px' }],
        ui: ['13px', { lineHeight: '19px' }],
        meta: ['12px', { lineHeight: '17px' }],
        label: ['11px', { lineHeight: '14px', letterSpacing: '0.09em', fontWeight: '600' }]
      },

      colors: {
        ink: {
          900: token('ink-900'),
          700: token('ink-700'),
          500: token('ink-500'),
          400: token('ink-400')
        },
        line: {
          200: token('line-200'),
          100: token('line-100')
        },
        canvas: token('canvas'),
        surface: token('surface'),
        raised: token('raised'),
        brand: {
          50: token('brand-50'),
          700: token('brand-700'),
          800: token('brand-800')
        },
        nav: token('nav-900'),
        'on-brand': token('on-brand'),

        /* Los tres estados de una afirmación jurídica. */
        verified: token('verified'),
        unverified: token('unverified'),
        'neutral-fact': token('neutral-fact'),

        /* Solo acciones destructivas. No es un color de estado. */
        danger: token('danger'),

        /* El lienzo del escrito, que tiene su propia superficie. */
        paper: token('paper'),
        'paper-ink': token('paper-ink'),

        /*
         * La paleta anterior, viva mientras queden pantallas sin migrar.
         *
         * Se conserva a propósito: quitarla de golpe rompe toda la aplicación en
         * un commit y deja de haber forma de comparar lo migrado con lo que
         * funcionaba. Se retira cuando ninguna pantalla la use.
         */
        agent: {
          bg: '#F8FAFC',
          surface: '#FFFFFF',
          border: '#E2E8F0',
          accent: '#1E3A8A',
          success: '#059669',
          text: '#0F172A',
          muted: '#64748B'
        }
      },

      /* SEIS PASOS. Dentro de un control 8/12, entre bloques 16/24, márgenes 24. */
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        6: '24px',
        8: '32px'
      },

      /* TRES RADIOS: control, tarjeta, chip. */
      borderRadius: {
        control: '4px',
        card: '6px'
      },

      /* DOS ELEVACIONES. Nada tiene sombra por estar quieto. */
      boxShadow: {
        e1: 'var(--e1)',
        e2: 'var(--e2)'
      }
    }
  },
  plugins: []
};
