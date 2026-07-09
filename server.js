const http = require('http');
const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const frontendDir = path.join(rootDir, 'Frontend');
const envPath = path.join(frontendDir, '.env');
const port = process.env.PORT || 3000;

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};

  const contents = fs.readFileSync(filePath, 'utf8');
  const env = {};

  contents.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) return;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');
    env[key] = value;
  });

  return env;
}

const envConfig = parseEnvFile(envPath);
const razorpayKey = process.env.RAZORPAY_PUBLIC_KEY || envConfig.RAZORPAY_PUBLIC_KEY || '';

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function sendFile(res, filePath, contentType) {
  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
}

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  const requestedUrl = req.url === '/' ? '/payment.html' : req.url;

  if (requestedUrl === '/config') {
    sendJson(res, 200, { key: razorpayKey });
    return;
  }

  const safePath = path.normalize(requestedUrl).replace(/^\.+/, '');
  const filePath = path.join(frontendDir, safePath);

  if (!filePath.startsWith(frontendDir)) {
    sendJson(res, 403, { error: 'Forbidden' });
    return;
  }

  const extension = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[extension] || 'application/octet-stream';
  sendFile(res, filePath, contentType);
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
