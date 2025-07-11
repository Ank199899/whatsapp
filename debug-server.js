import express from 'express';

console.log('Starting debug server...');

try {
  console.log('Node.js version:', process.version);
  console.log('Current working directory:', process.cwd());
  console.log('Express loaded successfully');
  
  const app = express();
  const port = 5000;
  
  console.log('Setting up middleware...');
  app.use(express.json());
  
  console.log('Setting up routes...');
  app.get('/api/test', (req, res) => {
    console.log('Test route called');
    res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
  });
  
  app.get('/api/conversations', (req, res) => {
    console.log('Conversations route called');
    res.json([
      {
        id: 1,
        contactName: "Test Contact",
        contactPhone: "+1234567890",
        lastMessage: "Hello World!",
        lastMessageAt: new Date().toISOString(),
        unreadCount: 1
      }
    ]);
  });
  
  console.log('Starting server...');
  app.listen(port, () => {
    console.log(`✅ Debug server running on port ${port}`);
    console.log(`🌐 Open http://localhost:${port}/api/test in your browser`);
  });
  
} catch (error) {
  console.error('Error starting server:', error);
  process.exit(1);
}

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
