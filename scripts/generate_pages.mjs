import {readFile, writeFile} from 'node:fs/promises';
const pages = {
  index: ['home', 'iPhones by Shah — A whole new feeling.'],
  stock: ['stock', 'Current stock | iPhones by Shah'],
  sold: ['sold', 'Sold stock | iPhones by Shah'],
  request: ['request', 'Request a phone | iPhones by Shah'],
  contact: ['contact', 'Visit & contact | iPhones by Shah'],
  phone: ['phone', 'Your next iPhone | iPhones by Shah'],
  admin: ['admin', 'Owner workspace | iPhones by Shah']
};
const shell = await readFile(new URL('../src/page-shell.html', import.meta.url), 'utf8');
for (const [file, [page, title]] of Object.entries(pages)) {
  let html = shell.replace('__PAGE__', page).replace(/<title>.*?<\/title>/, `<title>${title}</title>`);
  html = html.replace(/(<meta property="og:title" content=")[^"]+/, `$1${title}`);
  html = html.replace('href="#page-content"', `href="#${page === 'admin' ? 'admin-site' : 'public-site'}"`);
  html = html.replace(/<([a-z][\w-]*)([^>]*\bdata-pages="([^"]+)"[^>]*)>/g, (match, tag, attrs, views) => `<${tag}${attrs}${views.split(' ').includes(page) ? '' : ' hidden'}>`);
  if (page !== 'home') html = html.replace(/\s*<link[^>]+data-home-preload>/, '');
  if (page === 'stock' || page === 'sold') html = html.replace('<h2 id="stock-title">', '<h1 id="stock-title">').replace('</em></h2></div><div class="collection-note">', '</em></h1></div><div class="collection-note">');
  if (page === 'request') html = html.replace('<h2>Your wish list.', '<h1>Your wish list.').replace('We’re listening.</em></h2>', 'We’re listening.</em></h1>');
  if (page === 'contact') html = html.replace('<h2>See it.', '<h1>See it.').replace('Make it yours.</em></h2>', 'Make it yours.</em></h1>');
  if (page === 'sold') html = html.replace('Fresh stock.<br><em>Your next favourite.</em>', 'Good finds.<br><em>Already found.</em>');
  html = html.replaceAll('https://bilalsaeed10b.github.io/iphones_by_shah/">', `https://bilalsaeed10b.github.io/iphones_by_shah/${file === 'index' ? '' : file + '.html'}">`);
  await writeFile(new URL(`../${file}.html`, import.meta.url), html);
}
console.log('Prepared seven separate website pages.');
