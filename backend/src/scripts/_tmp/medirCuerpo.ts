import { consultarVigencia } from '../../modules/legislation/officialArticle.service';
const main = async () => {
  // Se calienta el esquema de red primero: el primer intento paga el 443 muerto.
  await consultarVigencia({ codigo: 'LEY 820 DE 2003', articulo: 9 }, 40_000);
  for (const c of [
    { codigo: 'LEY 820 DE 2003', articulo: 8 },
    { codigo: 'LEY 820 DE 2003', articulo: 35 },
    { codigo: 'CODIGO CIVIL', articulo: 2035 }
  ]) {
    const t0 = Date.now();
    const r = await consultarVigencia(c, 40_000);
    console.log(`${c.codigo} art.${c.articulo} :: ${r.estado} :: ${Date.now() - t0} ms :: "${r.rubrica}" :: ${r.cuerpo?.length ?? 0} chars`);
    console.log('   ---> ' + (r.cuerpo ?? '').slice(0, 300));
  }
};
void main();
