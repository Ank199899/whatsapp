const http = require('http');

const server = http.createServer((req, res) => {
  console.log('Request:', req.method, req.url);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.url === '/api/conversations') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([
      {
        id: 1,
        contactName: "Test Contact",
        contactPhone: "+1234567890",
        lastMessage: "Hello from minimal server!",
        lastMessageAt: new Date().toISOString(),
        unreadCount: 1
      }
    ]));
  } else if (req.url === '/api/test') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Minimal server working!', timestamp: new Date().toISOString() }));
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

const port = 5000;
server.listen(port, () => {
  console.log(`Minimal server running on http://localhost:${port}`);
  console.log(`Test it: http://localhost:${port}/api/test`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection:', reason);
});
