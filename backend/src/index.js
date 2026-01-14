import app, { prisma } from './app.js';
import dotenv from 'dotenv';
import { randomUUID } from 'node:crypto';
import http from 'http';
import { Server } from 'socket.io';

dotenv.config();

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all for dev
    methods: ['GET', 'POST']
  }
});

// Socket.io Signaling
const rooms = {};

io.on('connection', (socket) => {
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    // Send both userId and socketId so clients can signal to the correct socket
    socket.to(roomId).emit('user-connected', { userId, socketId: socket.id });

    socket.on('disconnect', () => {
      // Send socketId so clients can remove the correct peer
      socket.to(roomId).emit('user-disconnected', socket.id);
    });
  });

  socket.on('offer', (payload) => {
    io.to(payload.target).emit('offer', payload);
  });

  socket.on('answer', (payload) => {
    io.to(payload.target).emit('answer', payload);
  });

  socket.on('ice-candidate', (payload) => {
    io.to(payload.target).emit('ice-candidate', payload);
  });
});

// Attempt to connect to DB on start
async function startServer() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    const email = 'admin@system.com';
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      await prisma.user.create({
        data: {
          id: randomUUID(),
          schoolId: null,
          firstName: 'Super',
          lastName: 'Admin',
          email,
          password: 'Admin@123',
          role: 'admin',
          isActive: true
        }
      });
      console.log('✅ Super admin inserted:', email);
    } else {
      await prisma.user.update({
        where: { email },
        data: {
          schoolId: null,
          firstName: existing.firstName || 'Super',
          lastName: existing.lastName || 'Admin',
          password: 'Admin@123',
          role: 'admin',
          isActive: true
        }
      });
      console.log('✅ Super admin updated:', email);
    }
    
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

startServer();
