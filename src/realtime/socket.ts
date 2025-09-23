import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { config } from '../utils/config';  // Assuming config exports redisUrl and secretKey

const REDIS_URL = config.redisUrl;
const JWT_SECRET = config.secretKey;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*';

const pubClient = createClient({ url: REDIS_URL });
const subClient = pubClient.duplicate();

const rateLimiter = new RateLimiterRedis({
  storeClient: pubClient,
  points: 10, // 10 events
  duration: 60, // per 60 seconds
  keyPrefix: 'socket-rate-limit',
});
export let io: Server;

export const initSocket = (httpServer: any) => {
  io = new Server(httpServer, {
    cors: { origin: '*' },  // Adjust for production
  });

  Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
    io.adapter(createAdapter(pubClient, subClient));
    console.log('Redis adapter connected');
  }).catch(err => {
    console.error('Redis connection error:', err);
  });

  const realtime = io.of('/realtime');

realtime.use((socket: Socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
  if (!token) return next(new Error('Authentication error: No token provided'));

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    socket.data.user = {
      id: decoded._id || decoded.id,  // ensure id exists
      email: decoded.email,
      role: (decoded.role || 'USER').toUpperCase(), // normalize role
    };
    next();
  } catch (err) {
    next(new Error('Authentication error: Invalid token'));
  }
});

  realtime.on('connection', (socket: Socket) => {
  console.log('User connected:', socket.data.user.id);

  // User specific room
  socket.join(`user:${socket.data.user.id}`);

  // Admins room
  if (socket.data.user.role === "ADMIN") {
    socket.join('admins');
  }

    const rateLimit: { [event: string]: { count: number; lastReset: number } } = {};
    const MAX_EVENTS_PER_MIN = 10;
    const checkRateLimit = (event: string) => {
      const now = Date.now();
      if (!rateLimit[event] || now - rateLimit[event].lastReset > 60000) {
        rateLimit[event] = { count: 1, lastReset: now };
        return true;
      }
      if (rateLimit[event].count >= MAX_EVENTS_PER_MIN) {
        socket.emit('error', 'Rate limit exceeded');
        return false;
      }
      rateLimit[event].count++;
      return true;
    };

    socket.on('message', (data) => {
      if (!checkRateLimit('message')) return;
      realtime.to('admins').emit('message', { from: socket.data.user.id, content: data.content });
    });

    socket.on('notification', (data) => {
      if (!checkRateLimit('notification')) return;
      if (data.toUserId) {
        realtime.to(`user:${data.toUserId}`).emit('notification', { content: data.content });
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.data.user.id);
    });
  });
};