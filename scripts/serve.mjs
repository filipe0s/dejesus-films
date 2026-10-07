
import http from 'node:http';
import { stat, readFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
const production = process.argv.includes('--production');
const root = path.resolve(production ? 'dist' : 'public');
const port = Number(process.argv.find(argument => argument.startsWith('--port='))?.split('=')[1] || 4173);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Porta local inválida.');
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.txt':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8','.svg':'image/svg+xml','.mp4':'video/mp4','.webm':'video/webm','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2','.vtt':'text/vtt; charset=utf-8'};
const server = http.createServer(async (req,res)=>{
  try {
    if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
    const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const target = path.resolve(root,'.'+(pathname === '/' ? '/index.html' : pathname));
    if (target !== root && !target.startsWith(root + path.sep)) {res.writeHead(403);res.end();return;}
    const info = await stat(target);
    if (!info.isFile()) throw new Error('not found');
    const headers={'Content-Type':mime[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store','Accept-Ranges':'bytes','X-Content-Type-Options':'nosniff'};
    if (req.headers.range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      if (!match) {res.writeHead(416,{'Content-Range':'bytes */'+info.size});res.end();return;}
      const start = match[1] ? Number(match[1]) : Math.max(0,info.size-Number(match[2]));
      const end = match[1] && match[2] ? Math.min(Number(match[2]),info.size-1) : info.size-1;
      if (start>end || start>=info.size) {res.writeHead(416,{'Content-Range':'bytes */'+info.size});res.end();return;}
      res.writeHead(206,{...headers,'Content-Length':end-start+1,'Content-Range':'bytes '+start+'-'+end+'/'+info.size});
      if(req.method==='HEAD')res.end();else createReadStream(target,{start,end}).pipe(res);return;
    }
    res.writeHead(200,{...headers,'Content-Length':info.size});if(req.method==='HEAD')res.end();else createReadStream(target).pipe(res);
  } catch(error) {res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Arquivo não encontrado.');}
});
server.listen(port,'127.0.0.1',()=>console.log('deJesus Films — '+(production?'produção local':'prévia local')+': http://127.0.0.1:'+port));
