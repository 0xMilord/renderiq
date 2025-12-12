#!/usr/bin/env node

/**
 * Renderiq SketchUp Plugin - Local Web Server
 * Serves the modern React UI and provides bridge API for Ruby ↔ JavaScript communication
 */

const express = require('express');
const path = require('path');
const { createServer } = require('http');

const app = express();
const server = createServer(app);
const port = process.argv[2] || 3000;

// Serve static files from build directory
const buildPath = path.join(__dirname, 'dist');
app.use(express.static(buildPath));

// JSON body parser
app.use(express.json());

// Bridge API endpoint for Ruby → JavaScript communication
app.post('/api/bridge', (req, res) => {
  const { action, data } = req.body;
  
  console.log(`[Bridge] Received action: ${action}`, data);
  
  // Handle different actions
  switch (action) {
    case 'render_complete':
      // Broadcast to all connected clients
      io.emit('render_complete', data);
      break;
    case 'render_progress':
      io.emit('render_progress', data);
      break;
    case 'error':
      io.emit('error', data);
      break;
  }
  
  res.json({ success: true });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', port });
});

// Serve index.html for all routes (React Router)
app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

// Start server
server.listen(port, '127.0.0.1', () => {
  console.log(`🚀 Renderiq UI Server running on http://localhost:${port}`);
  console.log(`📦 Serving files from: ${buildPath}`);
});

// WebSocket support for real-time updates
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log(`[WebSocket] Client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`[WebSocket] Client disconnected: ${socket.id}`);
  });
  
  socket.on('action', (data) => {
    console.log(`[WebSocket] Received action:`, data);
    // Forward to Ruby plugin via callback mechanism
    // (Implementation depends on Ruby bridge)
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});


