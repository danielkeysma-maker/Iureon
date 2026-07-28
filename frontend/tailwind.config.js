/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        legal: ['"Lora"', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        agent: {
          bg: '#F8FAFC',       // Fondo ejecutivo sobrio claro
          surface: '#FFFFFF',  // Superficie blanca limpia
          border: '#E2E8F0',   // Líneas divisoras sutiles
          accent: '#1E3A8A',   // Azul Judicial Real Elegante (Navy)
          success: '#059669',  // Verde Esmeralda Corporativo
          text: '#0F172A',     // Texto Principal Pizarra Oscuro
          muted: '#64748B'     // Texto Secundario Pizarra
        }
      }
    },
  },
  plugins: [],
}
