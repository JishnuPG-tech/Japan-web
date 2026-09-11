import http from 'node:http';
import { readFile } from 'node:fs/promises';

const files = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/world.js', ['world.js', 'text/javascript; charset=utf-8']],
  ['/scene.js', ['scene.js', 'text/javascript; charset=utf-8']],
  ['/favicon.svg', ['favicon.svg', 'image/svg+xml']],
]);
const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.');
}
const server = http.createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end();
    return;
  }
  const pathname = (request.url || '/').split('?')[0];
  const file = files.get(pathname);
  if (!file) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }
  try {
    const content = await readFile(new URL(file[0], import.meta.url));
    response.writeHead(200, {
      'Content-Type': file[1],
      'Content-Length': content.length,
      'X-Content-Type-Options': 'nosniff',
    });
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch (error) {
    console.error(error);
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Unable to load this resource');
  }
});
server.listen(port, process.env.HOST || '127.0.0.1', () => {
  console.log(`Komorebi is ready at http://localhost:${port}`);
});
