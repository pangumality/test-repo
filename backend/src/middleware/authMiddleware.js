import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-this';

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Debug logging
    // console.log('Decoded Token:', decoded);

    if (!decoded.userId) {
      console.error('Auth Middleware: Token missing userId', decoded);
      return res.status(401).json({ error: 'Unauthorized: Invalid token payload' });
    }

    // Fetch fresh user data including role
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Unauthorized: User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
