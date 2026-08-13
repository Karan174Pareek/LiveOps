import http from 'http';
import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './config/db.js';
import { initSocketManager } from './sockets/socketManager.js';

dotenv.config();

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.io Server Gateway
const io = initSocketManager(server);

// Connect DB & start HTTP + Socket server
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`[LiveOps Server & Sockets] Listening on http://localhost:${PORT} (${process.env.NODE_ENV || 'development'} mode)`);
  });
});

export { app, server, io };
