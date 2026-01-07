import fs from 'fs';
import path from 'path';

const LOG_FILE = path.join(process.cwd(), 'audit.log');

export const logAudit = async (userId, action, resource, details = '', ip = 'unknown') => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] User:${userId} | Action:${action} | Resource:${resource} | IP:${ip} | Details:${JSON.stringify(details)}\n`;
  
  try {
    await fs.promises.appendFile(LOG_FILE, logEntry);
  } catch (err) {
    console.error('Failed to write to audit log:', err);
  }
};
