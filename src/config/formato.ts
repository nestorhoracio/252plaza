// Los precios se guardan como número (390) y se formatean solo al mostrarlos.
export function formatearPrecio(precio: number): string {
  return '$' + new Intl.NumberFormat('es-UY', { maximumFractionDigits: 0 }).format(precio);
}
