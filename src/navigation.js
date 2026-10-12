export const pageFiles = {home:'index.html',stock:'stock.html',sold:'sold.html',request:'request.html',contact:'contact.html',admin:'admin.html',phone:'phone.html'};
export const productPath = id => `./phone.html?id=${encodeURIComponent(id)}`;
export const ownerLoginURL = (href, base = './') => new URL('admin.html', new URL(base, href)).href;
export function legacyDestination(hash) {
  const value = hash.replace(/^#/, '');
  if (value.startsWith('phone/')) return productPath(value.slice(6));
  if (value === 'visit') return './contact.html';
  return pageFiles[value] ? './' + pageFiles[value] : null;
}
