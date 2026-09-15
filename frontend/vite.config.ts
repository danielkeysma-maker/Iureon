import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { existsSync, readFileSync, readdirSync, renameSync, rmSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { join, resolve } from 'node:path'
import { resolverRutaDeVercel } from './scripts/rutas-de-vercel.mjs'

/*
 * LA PORTADA EN `/` Y LA APLICACIÓN EN LO DEMÁS (14 sep 2026).
 *
 * Vercel da prioridad a los archivos sobre las reescrituras: si el build deja
 * un `index.html` en la raíz, `/` lo sirve siempre y ninguna regla de
 * `vercel.json` puede mandar a la aplicación los enlaces viejos `/?entrar=1`,
 * `/?restablecer=1#…`. Por eso el build NO deja archivo en la raíz: la
 * aplicación sale como `app.html` y la portada como `portada.html`, y es
 * `vercel.json` quien decide qué sirve `/` según la consulta.
 *
 * El código fuente no cambia de sitio —`index.html` sigue siendo la entrada de
 * Vite y `public/landing/index.html` la portada—: solo se renombran al terminar
 * el build.
 *
 * Y como ni `vite` ni `vite preview` leen `vercel.json`, el mismo emulador que
 * usa `check:rutas` las aplica en local, releyendo el archivo en cada petición.
 */
const rutasDeVercel = (): Plugin => {
  let raiz = process.cwd()
  let salida = 'dist'
  let esBuild = false

  const archivoDe: Record<string, { dev: string; preview: string }> = {
    '/app': { dev: '/index.html', preview: '/app.html' },
    '/portada': { dev: '/landing/index.html', preview: '/portada.html' }
  }

  /* Lo que en local cuenta como «archivo que existe»: todo lo que lleva extensión y lo interno de Vite. */
  const esArchivo = (ruta: string): boolean =>
    ruta.includes('.') || ruta.startsWith('/@') || ruta.startsWith('/__') || ruta.startsWith('/src/') || ruta.startsWith('/node_modules/')

  const intermediario =
    (modo: 'dev' | 'preview') =>
    (req: IncomingMessage, res: ServerResponse, next: () => void): void => {
      const url = new URL(req.url ?? '/', 'http://local')
      const config = JSON.parse(readFileSync(join(raiz, 'vercel.json'), 'utf8'))
      const resultado = resolverRutaDeVercel(config, url.pathname, url.searchParams, esArchivo)
      if (!resultado) return next()
      if (resultado.tipo === 'redirect') {
        res.statusCode = 308
        res.setHeader('Location', resultado.destino)
        res.end()
        return
      }
      req.url = `${archivoDe[resultado.destino]?.[modo] ?? resultado.destino}${url.search}`
      next()
    }

  return {
    name: 'iureon-rutas-de-vercel',
    configResolved(config) {
      raiz = config.root
      salida = config.build.outDir
      esBuild = config.command === 'build'
    },
    configureServer(server) {
      server.middlewares.use(intermediario('dev'))
    },
    configurePreviewServer(server) {
      server.middlewares.use(intermediario('preview'))
    },
    closeBundle() {
      if (!esBuild) return
      const dist = resolve(raiz, salida)
      const aplicacion = join(dist, 'index.html')
      if (existsSync(aplicacion)) renameSync(aplicacion, join(dist, 'app.html'))
      const carpetaPortada = join(dist, 'landing')
      const portada = join(carpetaPortada, 'index.html')
      if (existsSync(portada)) {
        renameSync(portada, join(dist, 'portada.html'))
        if (readdirSync(carpetaPortada).length === 0) rmSync(carpetaPortada, { recursive: true })
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), rutasDeVercel()],
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
