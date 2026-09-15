export declare const resolverRutaDeVercel: (
  config: { redirects?: object[]; rewrites?: object[] },
  pathname: string,
  query: URLSearchParams,
  existeArchivo: (pathname: string) => boolean
) => { tipo: 'redirect' | 'rewrite'; destino: string } | null;
