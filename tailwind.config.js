/* =============================================================
   Savorealo · Tailwind config
   Extiende Tailwind con los tokens declarados en
   `src/styles/tokens.css`. Cualquier nuevo token semántico debe
   añadirse PRIMERO al CSS y luego mapearse aquí.
   ============================================================= */

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{html,ts}'],
	darkMode: ['selector', '[data-theme="dark"]'],
	theme: {
		extend: {
			colors: {
				/* Superficies */
				surface:                     'rgb(var(--rgb-surface) / <alpha-value>)',
				'surface-container':         'rgb(var(--rgb-surface-container) / <alpha-value>)',
				'surface-container-high':    'rgb(var(--rgb-surface-container-high) / <alpha-value>)',
				'surface-container-low':     'rgb(var(--rgb-surface-container-low) / <alpha-value>)',
				'on-surface':                'rgb(var(--rgb-on-surface) / <alpha-value>)',
				'on-surface-muted':          'rgb(var(--rgb-on-surface-muted) / <alpha-value>)',
				outline:                     'rgb(var(--rgb-outline) / <alpha-value>)',
				'outline-strong':            'rgb(var(--rgb-outline-strong) / <alpha-value>)',

				/* Marca */
				primary:                     'rgb(var(--rgb-primary) / <alpha-value>)',
				'on-primary':                'rgb(var(--rgb-on-primary) / <alpha-value>)',
				'primary-container':         'rgb(var(--rgb-primary-container) / <alpha-value>)',
				'on-primary-container':      'rgb(var(--rgb-on-primary-container) / <alpha-value>)',

				secondary:                   'rgb(var(--rgb-secondary) / <alpha-value>)',
				'on-secondary':              'rgb(var(--rgb-on-secondary) / <alpha-value>)',
				'secondary-container':       'rgb(var(--rgb-secondary-container) / <alpha-value>)',
				'on-secondary-container':    'rgb(var(--rgb-on-secondary-container) / <alpha-value>)',

				tertiary:                    'rgb(var(--rgb-tertiary) / <alpha-value>)',
				'on-tertiary':               'rgb(var(--rgb-on-tertiary) / <alpha-value>)',
				'tertiary-container':        'rgb(var(--rgb-tertiary-container) / <alpha-value>)',
				'on-tertiary-container':     'rgb(var(--rgb-on-tertiary-container) / <alpha-value>)',

				/* Error */
				error:                       'rgb(var(--rgb-error) / <alpha-value>)',
				'on-error':                  'rgb(var(--rgb-on-error) / <alpha-value>)',
				'error-container':           'rgb(var(--rgb-error-container) / <alpha-value>)',
				'on-error-container':        'rgb(var(--rgb-on-error-container) / <alpha-value>)',

				/* Inverso */
				'inverse-surface':           'rgb(var(--rgb-inverse-surface) / <alpha-value>)',
				'inverse-on-surface':        'rgb(var(--rgb-inverse-on-surface) / <alpha-value>)',
			},
			fontFamily: {
				display: ['var(--font-display)'],
				body:    ['var(--font-body)'],
				sans:    ['var(--font-body)'],
			},
			borderRadius: {
				xs:   'var(--radius-xs)',
				sm:   'var(--radius-sm)',
				md:   'var(--radius-md)',
				lg:   'var(--radius-lg)',
				xl:   'var(--radius-xl)',
				'2xl':'var(--radius-2xl)',
				'3xl':'var(--radius-3xl)',
				pill: 'var(--radius-pill)',
			},
			boxShadow: {
				1: 'var(--shadow-1)',
				2: 'var(--shadow-2)',
				3: 'var(--shadow-3)',
				4: 'var(--shadow-4)',
				5: 'var(--shadow-5)',
			},
			transitionTimingFunction: {
				standard:    'var(--ease-standard)',
				emphasized:  'var(--ease-emphasized)',
				decelerated: 'var(--ease-decelerated)',
				accelerated: 'var(--ease-accelerated)',
			},
			transitionDuration: {
				instant: 'var(--duration-instant)',
				fast:    'var(--duration-fast)',
				base:    'var(--duration-base)',
				slow:    'var(--duration-slow)',
				slower:  'var(--duration-slower)',
			},
		},
	},
	plugins: [],
}
