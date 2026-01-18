import fs from 'fs';
import path from 'path';

const storePath = path.resolve(process.cwd(), 'backend', 'radio-programs.json');

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

export function getRadioPrograms(schoolId) {
  if (!schoolId) return [];
  const data = readStore();
  const programs = data[schoolId] || [];
  return Array.isArray(programs) ? programs : [];
}

export function saveRadioPrograms(schoolId, programs) {
  if (!schoolId) return [];
  const data = readStore();
  data[schoolId] = Array.isArray(programs) ? programs : [];
  writeStore(data);
  return data[schoolId];
}

