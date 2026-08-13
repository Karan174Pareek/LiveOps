import http from 'http';
import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './config/db.js';

dotenv.config();

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Connect DB & start HTTP server
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`[LiveOps Server] Running on http://localhost:${PORT} (${process.env.NODE_ENV || 'development'} mode)`);
  });
});

export { app, server };
