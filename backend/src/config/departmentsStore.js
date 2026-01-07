import fs from 'fs';
import path from 'path';

const storePath = path.resolve(process.cwd(), 'backend', 'departments.json');

function readStore() {
  try {
    if (!fs.existsSync(storePath)) return {};
    const raw = fs.readFileSync(storePath, 'utf-8');
    return JSON.parse(raw || '{}');
  } catch {
    return {};
  }
}

function writeStore(data) {
  try {
    fs.writeFileSync(storePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch {
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
  return ['finance', 'library', 'transport', 'sports', 'exams'];
}
