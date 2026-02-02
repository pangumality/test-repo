import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storePath = path.resolve(__dirname, '../../departments.json');

function readStore() {
  try {
    if (!fs.existsSync(storePath)) return {};
    const raw = fs.readFileSync(storePath, 'utf-8');
    return JSON.parse(raw || '{}');
  } catch (err) {
    console.error('Error reading department store:', err);
    return {};
  }
}

function writeStore(data) {
  try {
    const dir = path.dirname(storePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(storePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing department store:', err);
    return false;
  }
}

export function getDepartmentStaff(dept, schoolId) {
  const data = readStore();
  const byDept = data[dept] || {};
  const ids = byDept[schoolId] || [];
  return Array.isArray(ids) ? ids : [];
}

export function setDepartmentStaff(dept, schoolId, userIds) {
  const data = readStore();
  if (!data[dept]) data[dept] = {};
  data[dept][schoolId] = Array.isArray(userIds) ? userIds : [];
  writeStore(data);
  return data[dept][schoolId];
}

export function listDepartments() {
  return [
    'inventory',
    'transport',
    'library',
    'hostel',
    'reception',
    'radio',
    'finance',
    'sports',
    'exams',
  ];
}
