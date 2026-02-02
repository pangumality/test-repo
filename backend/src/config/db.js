import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config({ override: true }); // Ensure env vars are loaded and override system defaults

const prisma = new PrismaClient();

export default prisma;
