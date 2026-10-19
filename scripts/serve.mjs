import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const MIME = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.webp', 'image/webp'],
]);

function safeFilePath(root, requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, 'http://localhost').pathname);
  const candidate = path.resolve(root, `.${pathname}`);
  const relative = path.relative(root, candidate);
  if (relative.startsWith('..') || path.isAbsolute(relative)) return null;
  return candidate;
}

export async function startStaticServer({ root = process.cwd(), port = 4173, host = '127.0.0.1' } = {}) {
  const resolvedRoot = path.resolve(root);
  const server = http.createServer(async (request, response) => {
    if (!['GET', 'HEAD'].includes(request.method ?? 'GET')) {
      response.writeHead(405, { Allow: 'GET, HEAD' });
      response.end('Method not allowed');
      return;
    }

    try {
      let filePath = safeFilePath(resolvedRoot, request.url ?? '/');
      if (!filePath) throw Object.assign(new Error('Forbidden'), { code: 'EACCES' });
      let fileStat = await stat(filePath);
      if (fileStat.isDirectory()) {
        filePath = path.join(filePath, 'index.html');
        fileStat = await stat(filePath);
      }

      const extension = path.extname(filePath).toLowerCase();
      response.writeHead(200, {
        'Content-Type': MIME.get(extension) ?? 'application/octet-stream',
        'Content-Length': fileStat.size,
        'Cache-Control': extension === '.html' ? 'no-store' : 'public, max-age=3600',
      });
      if (request.method === 'HEAD') response.end();
      else createReadStream(filePath).pipe(response);
    } catch (error) {
      const status = error?.code === 'ENOENT' ? 404 : 403;
      response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end(status === 404 ? 'Not found' : 'Forbidden');
    }
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, resolve);
  });
  const address = server.address();
  const actualPort = typeof address === 'object' && address ? address.port : port;
  return { server, url: `http://${host}:${actualPort}` };
}

function argumentValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const port = Number.parseInt(argumentValue('--port', process.env.PORT ?? '4173'), 10);
  const host = argumentValue('--host', '127.0.0.1');
  const { url } = await startStaticServer({ port, host });
  console.log(`启星程校服 V4 本地预览：${url}`);
}
