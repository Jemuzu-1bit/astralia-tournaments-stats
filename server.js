const fs = require('fs');
const path = require('path');
const http = require('http');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const PORT = Number(process.env.PORT || 8000);
const CHALLONGE_API_KEY = process.env.CHALLONGE_API_KEY;
const CHALLONGE_API_BASE = 'https://api.challonge.com/v1';
const ROOT = __dirname;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

function sendJson(res, status, body){
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function normalizeTournamentSlug(value){
  const input = String(value || '').trim();
  if(!input) return '';

  try{
    const candidate = /^https?:\/\//i.test(input) ? input : `https://${input}`;
    const parsed = new URL(candidate);
    if(parsed.hostname.toLowerCase().includes('challonge.com')){
      const segments = parsed.pathname.split('/').filter(Boolean);
      return decodeURIComponent(segments[segments.length - 1] || '');
    }
  }catch(error){
    // Treat non-URL values as regular Challonge slugs.
  }

  return input.replace(/^\/+|\/+$/g, '');
}

async function proxyChallonge(res, slug, resource){
  if(!CHALLONGE_API_KEY){
    sendJson(res, 500, { error: 'CHALLONGE_API_KEY non configurata nel file .env.local' });
    return;
  }

  const normalizedSlug = normalizeTournamentSlug(slug);
  if(!normalizedSlug){
    sendJson(res, 400, { error: 'Codice torneo non valido' });
    return;
  }

  const basePath = `${CHALLONGE_API_BASE}/tournaments/${encodeURIComponent(normalizedSlug)}`;
  const url = resource === 'tournament'
    ? `${basePath}.json?api_key=${encodeURIComponent(CHALLONGE_API_KEY)}`
    : `${basePath}/${resource}.json?api_key=${encodeURIComponent(CHALLONGE_API_KEY)}`;

  const response = await fetch(url);
  const body = await response.text();
  res.writeHead(response.status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(body);
}

function serveStatic(req, res){
  const requestedPath = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
  const relativePath = requestedPath === '/' ? 'index.html' : requestedPath.slice(1);
  const filePath = path.resolve(ROOT, relativePath);

  if(!filePath.startsWith(ROOT + path.sep)){
    sendJson(res, 403, { error: 'Accesso negato' });
    return;
  }

  fs.readFile(filePath, (error, content)=>{
    if(error){ sendJson(res, 404, { error: 'File non trovato' }); return; }
    const contentType = mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-store, no-cache, must-revalidate'
    });
    res.end(content);
  });
}

const server = http.createServer(async (req, res)=>{
  try{
    const requestUrl = new URL(req.url, `http://${req.headers.host}`);
    const match = requestUrl.pathname.match(/^\/api\/tournaments\/([^/]+)\/(participants|matches|tournament)$/);
    if(req.method === 'GET' && match){
      const resource = match[2] === 'tournament' ? 'tournament' : match[2];
      await proxyChallonge(res, decodeURIComponent(match[1]), resource);
      return;
    }
    if(req.method !== 'GET'){
      sendJson(res, 405, { error: 'Metodo non supportato' });
      return;
    }
    serveStatic(req, res);
  }catch(error){
    console.error(error);
    sendJson(res, 500, { error: 'Errore interno del server' });
  }
});

server.listen(PORT, ()=>{
  console.log(`Sito disponibile su http://localhost:${PORT}`);
});
