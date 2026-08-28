import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    /*
     * El commit que este build contiene, sellado en el bundle. Vercel expone
     * VERCEL_GIT_COMMIT_SHA al build; en local cae a 'dev'. Existe porque un
     * deploy "Ready" no prueba lo que un navegador esta corriendo — una
     * pestana vieja de una SPA sirve la version de ayer para siempre — y la
     * unica forma de dejar de adivinar es que la pantalla DIGA su commit.
     */
    __COMMIT__: JSON.stringify((process.env.VERCEL_GIT_COMMIT_SHA || 'dev').slice(0, 7))
  }
})
