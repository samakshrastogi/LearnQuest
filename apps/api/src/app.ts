import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDB } from './config/db.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middlewares/error.js';
import { localUploadsDir } from './routes/media.js';

const app = express();
const server = http.createServer(app);

// 1. Socket.IO Setup
const allowedOrigins = env.CORS_ORIGINS.split(',').map(o => o.trim().replace(/\/$/, ''));

const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  logger.info(`🔌 Socket client connected: ${socket.id}`);
  
  socket.on('join_clan', (clanId: string) => {
    socket.join(`clan_${clanId}`);
    logger.info(`👥 Client joined clan room: clan_${clanId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`🔌 Socket client disconnected: ${socket.id}`);
  });
});

// Attach socket server to express request to access it inside controllers if needed
app.use((req: any, res, next) => {
  req.io = io;
  next();
});

// 2. Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Required to allow loading local static uploads in front-end img/video tags
}));

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Serve Local Uploads statically
app.use('/uploads', express.static(localUploadsDir));

// 4. Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    code: 'TOO_MANY_REQUESTS',
  },
});
app.use('/api', limiter);

// 5. Versioned API Router
app.use('/api/v1', apiRouter);

// 6. Health Check Endpoints
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is healthy', timestamp: new Date() });
});

app.get('/ready', async (req, res) => {
  // Check DB state
  const mongoose = await import('mongoose');
  const dbState = mongoose.connection.readyState;
  if (dbState === 1) {
    res.status(200).json({ success: true, message: 'Ready' });
  } else {
    res.status(503).json({ success: false, message: 'Database connection unstable' });
  }
});

// 7. Error Handling Middleware
app.use(errorHandler);

// 8. DB Connection & Bootstrap
const PORT = env.PORT;
const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    logger.info(`🚀 LearnQuest API running in ${env.NODE_ENV} mode at http://localhost:${PORT}`);
  });
};

// Auto start server if not running tests
if (process.env.NODE_ENV !== 'test') {
  startServer().catch((err) => {
    logger.error(`❌ Server crash on startup: ${err.message}`);
    process.exit(1);
  });
}

export { app, server, io };
export default app;
