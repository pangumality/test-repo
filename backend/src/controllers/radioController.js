import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { Prisma } from '@prisma/client';
import prisma from '../config/db.js';

const require = createRequire(import.meta.url);
const pdfParseModule = require('pdf-parse');
const pdfParse = pdfParseModule?.default || pdfParseModule;

const extractPdfText = async (pdfBuffer) => {
  if (!pdfBuffer) return '';

  try {
    if (typeof pdfParse === 'function') {
      const parsed = await pdfParse(pdfBuffer);
      return typeof parsed?.text === 'string' ? parsed.text : '';
    }

    if (pdfParse && typeof pdfParse.PDFParse === 'function') {
      const parser = new pdfParse.PDFParse({ data: pdfBuffer });
      try {
        const parsed = await parser.getText();
        return typeof parsed?.text === 'string' ? parsed.text : '';
      } finally {
        if (typeof parser.destroy === 'function') {
          await parser.destroy();
        }
      }
    }

    return '';
  } catch {
    return '';
  }
};

const toUploadsDiskPath = (fileUrl) => {
  if (!fileUrl || typeof fileUrl !== 'string') return null;
  const idx = fileUrl.indexOf('/uploads/');
  if (idx === -1) return null;
  const rel = fileUrl.slice(idx + 1).split(/[?#]/)[0];
  if (!rel) return null;
  return path.normalize(rel);
};

const AUDIO_EXTS = new Set(['mp3', 'wav', 'ogg', 'm4a']);

const parseDateTime = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
};

const parsePositiveInt = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const i = Math.floor(n);
  if (i <= 0) return null;
  return i;
};

const hasRadioDelegate =
  prisma &&
  prisma.radioProgram &&
  typeof prisma.radioProgram.findMany === 'function' &&
  typeof prisma.radioProgram.create === 'function';

const radioFindMany = async ({ schoolId, scheduledForGte, scheduledForLte, orderByScheduledFor = 'asc' }) => {
  if (hasRadioDelegate) {
    const where = { schoolId };
    if (scheduledForGte || scheduledForLte) {
      where.scheduledFor = {
        ...(scheduledForGte ? { gte: scheduledForGte } : null),
        ...(scheduledForLte ? { lte: scheduledForLte } : null),
      };
    }
    return prisma.radioProgram.findMany({
      where,
      orderBy: { scheduledFor: orderByScheduledFor },
    });
  }

  const dir = Prisma.raw(orderByScheduledFor === 'desc' ? 'DESC' : 'ASC');

  return prisma.$queryRaw(
    Prisma.sql`
      SELECT *
      FROM "RadioProgram"
      WHERE "schoolId" = ${schoolId}
      ${scheduledForGte ? Prisma.sql`AND "scheduledFor" >= ${scheduledForGte}` : Prisma.empty}
      ${scheduledForLte ? Prisma.sql`AND "scheduledFor" <= ${scheduledForLte}` : Prisma.empty}
      ORDER BY "scheduledFor" ${dir}
    `
  );
};

const radioFindFirst = async ({ id, schoolId }) => {
  if (hasRadioDelegate) {
    return prisma.radioProgram.findFirst({ where: { id, schoolId } });
  }
  const rows = await prisma.$queryRaw(
    Prisma.sql`SELECT * FROM "RadioProgram" WHERE "id" = ${id} AND "schoolId" = ${schoolId} LIMIT 1`
  );
  return rows?.[0] || null;
};

const radioCreate = async ({
  id,
  schoolId,
  title,
  description,
  content,
  fileUrl,
  fileType,
  scheduledFor,
  durationSeconds,
  status,
}) => {
  if (hasRadioDelegate) {
    return prisma.radioProgram.create({
      data: {
        id,
        schoolId,
        title,
        description,
        content,
        fileUrl,
        fileType,
        scheduledFor,
        durationSeconds,
        status,
      },
    });
  }

  const rows = await prisma.$queryRaw(
    Prisma.sql`
      INSERT INTO "RadioProgram" (
        "id",
        "schoolId",
        "title",
        "description",
        "content",
        "fileUrl",
        "fileType",
        "scheduledFor",
        "durationSeconds",
        "status"
      )
      VALUES (
        ${id},
        ${schoolId},
        ${title},
        ${description},
        ${content},
        ${fileUrl},
        ${fileType},
        ${scheduledFor},
        ${durationSeconds},
        ${status}
      )
      RETURNING *
    `
  );
  return rows?.[0] || null;
};

const radioUpdate = async ({ id, schoolId, data }) => {
  if (hasRadioDelegate) {
    return prisma.radioProgram.update({ where: { id }, data });
  }

  const sets = [];
  const values = [];
  if (data.title !== undefined) {
    values.push(data.title);
    sets.push(`"title" = $${values.length}`);
  }
  if (data.description !== undefined) {
    values.push(data.description);
    sets.push(`"description" = $${values.length}`);
  }
  if (data.content !== undefined) {
    values.push(data.content);
    sets.push(`"content" = $${values.length}`);
  }
  if (data.fileUrl !== undefined) {
    values.push(data.fileUrl);
    sets.push(`"fileUrl" = $${values.length}`);
  }
  if (data.fileType !== undefined) {
    values.push(data.fileType);
    sets.push(`"fileType" = $${values.length}`);
  }
  if (data.scheduledFor !== undefined) {
    values.push(data.scheduledFor);
    sets.push(`"scheduledFor" = $${values.length}`);
  }
  if (data.durationSeconds !== undefined) {
    values.push(data.durationSeconds);
    sets.push(`"durationSeconds" = $${values.length}`);
  }
  if (data.status !== undefined) {
    values.push(data.status);
    sets.push(`"status" = $${values.length}`);
  }

  if (sets.length === 0) {
    return radioFindFirst({ id, schoolId });
  }

  values.push(id);
  const idParam = `$${values.length}`;
  values.push(schoolId);
  const schoolIdParam = `$${values.length}`;

  const sql = `UPDATE "RadioProgram" SET ${sets.join(', ')} WHERE "id" = ${idParam} AND "schoolId" = ${schoolIdParam} RETURNING *`;
  const rows = await prisma.$queryRawUnsafe(sql, ...values);
  return rows?.[0] || null;
};

const radioDelete = async ({ id, schoolId }) => {
  if (hasRadioDelegate) {
    await prisma.radioProgram.deleteMany({ where: { id, schoolId } });
    return;
  }
  await prisma.$executeRaw(
    Prisma.sql`DELETE FROM "RadioProgram" WHERE "id" = ${id} AND "schoolId" = ${schoolId}`
  );
};

export const createProgram = async (req, res) => {
  try {
    const { title, description, scheduledFor, durationSeconds, content } = req.body;
    const { schoolId } = req.user;
    const file = req.file;

    if (!title || !scheduledFor) {
      return res.status(400).json({ error: 'Title and scheduled time are required' });
    }

    const scheduledAt = parseDateTime(scheduledFor);
    if (!scheduledAt) {
      return res.status(400).json({ error: 'Invalid scheduled time' });
    }

    let finalContent = typeof content === 'string' ? content : '';
    let fileUrl = '';
    let fileType = '';

    if (file) {
      // Correct the path for public access (assuming app serves 'uploads' folder)
      fileUrl = `/uploads/${file.filename}`;
      const ext = file.originalname.split('.').pop().toLowerCase();
      
      if (ext === 'pdf') {
        fileType = 'PDF';
        try {
          const dataBuffer = fs.readFileSync(file.path);
          finalContent = await extractPdfText(dataBuffer);
        } catch (e) {
          console.error('PDF Parse Error', e);
        }

        if (!String(finalContent || '').trim()) {
          return res.status(400).json({
            error:
              'Could not extract readable text from this PDF. Please upload a text-based PDF or paste text content.',
          });
        }
      } else if (AUDIO_EXTS.has(ext)) {
        fileType = 'AUDIO';
      }
    }

    if (!fileType) {
      fileType = finalContent ? 'TEXT' : '';
    }

    if (!fileType) {
      return res.status(400).json({ error: 'Please provide a PDF/audio file or text content' });
    }

    // Estimate duration for PDF if not provided
    const providedDuration = parsePositiveInt(durationSeconds);
    let finalDuration = providedDuration || 300;
    if (fileType === 'PDF' && !providedDuration && finalContent) {
      const wordCount = finalContent.split(/\s+/).filter(Boolean).length;
      finalDuration = Math.max(10, Math.ceil(wordCount / 2.5));
    }

    const program = await radioCreate({
      id: randomUUID(),
      schoolId,
      title,
      description: description || null,
      content: finalContent || null,
      fileUrl: fileUrl || null,
      fileType,
      scheduledFor: scheduledAt,
      durationSeconds: finalDuration,
      status: 'SCHEDULED',
    });

    res.status(201).json(program);
  } catch (error) {
    console.error('Error creating radio program:', error);
    res.status(500).json({ error: 'Failed to create program' });
  }
};

export const getSchedule = async (req, res) => {
  try {
    const { schoolId } = req.user;
    const { date } = req.query; 

    let start;
    let end;
    if (date) {
      start = new Date(date);
      start.setHours(0, 0, 0, 0);
      end = new Date(date);
      end.setHours(23, 59, 59, 999);
    }

    const programs = await radioFindMany({
      schoolId,
      scheduledForGte: start,
      scheduledForLte: end,
      orderByScheduledFor: 'asc',
    });

    res.json(programs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
};

export const updateProgram = async (req, res) => {
  try {
    const { id } = req.params;
    const { schoolId } = req.user;
    const { title, description, scheduledFor, durationSeconds, content } = req.body;
    const file = req.file;

    const existing = await radioFindFirst({ id, schoolId });
    if (!existing) {
      return res.status(404).json({ error: 'Radio program not found' });
    }

    const data = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description || null;
    if (scheduledFor !== undefined) {
      const scheduledAt = parseDateTime(scheduledFor);
      if (!scheduledAt) {
        return res.status(400).json({ error: 'Invalid scheduled time' });
      }
      data.scheduledFor = scheduledAt;
    }

    if (durationSeconds !== undefined) {
      const parsed = parsePositiveInt(durationSeconds);
      if (!parsed) {
        return res.status(400).json({ error: 'Invalid durationSeconds' });
      }
      data.durationSeconds = parsed;
    }

    let finalContent = typeof content === 'string' ? content : undefined;
    let fileType = undefined;
    let fileUrl = undefined;

    if (file) {
      fileUrl = `/uploads/${file.filename}`;
      const ext = file.originalname.split('.').pop().toLowerCase();

      if (ext === 'pdf') {
        fileType = 'PDF';
        try {
          const dataBuffer = fs.readFileSync(file.path);
          finalContent = await extractPdfText(dataBuffer);
        } catch (e) {
          console.error('PDF Parse Error', e);
          finalContent = '';
        }

        if (!String(finalContent || '').trim()) {
          return res.status(400).json({
            error:
              'Could not extract readable text from this PDF. Please upload a text-based PDF or paste text content.',
          });
        }
      } else if (AUDIO_EXTS.has(ext)) {
        fileType = 'AUDIO';
      }
    }

    if (finalContent !== undefined) {
      data.content = finalContent || null;
      if (!fileType) {
        fileType = finalContent ? 'TEXT' : '';
      }
    }

    if (fileType !== undefined) data.fileType = fileType || null;
    if (fileUrl !== undefined) data.fileUrl = fileUrl || null;

    const updated = await radioUpdate({ id, schoolId, data });

    res.json(updated);
  } catch (error) {
    console.error('Error updating radio program:', error);
    res.status(500).json({ error: 'Failed to update program' });
  }
};

export const getCurrentProgram = async (req, res) => {
  try {
    const { schoolId } = req.user;
    const now = new Date();

    // Find programs scheduled in the last 24 hours (just to be safe)
    // We filter in memory to find the one that overlaps with 'now'
    const recentPrograms = await radioFindMany({
      schoolId,
      scheduledForGte: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      scheduledForLte: now,
      orderByScheduledFor: 'desc',
    });

    let current = recentPrograms.find((p) => {
      const startTime = new Date(p.scheduledFor).getTime();
      const durationSeconds = Number(p.durationSeconds) || 300;
      const endTime = startTime + durationSeconds * 1000;
      return now.getTime() < endTime;
    });

    if (current) {
      if (current.fileType === 'PDF' && !String(current.content || '').trim() && current.fileUrl) {
        const diskPath = toUploadsDiskPath(current.fileUrl);
        if (diskPath && fs.existsSync(diskPath)) {
          const dataBuffer = fs.readFileSync(diskPath);
          const extracted = await extractPdfText(dataBuffer);
          if (String(extracted || '').trim()) {
            current = { ...current, content: extracted };
            await radioUpdate({ id: current.id, schoolId, data: { content: extracted } });
          }
        }
      }

      const startMs = new Date(current.scheduledFor).getTime();
      const durationSeconds = Number(current.durationSeconds) || 300;
      const offset = Math.max(0, Math.min(durationSeconds, (now.getTime() - startMs) / 1000));
      return res.json({ ...current, currentOffset: offset });
    }

    res.json(null);
  } catch (error) {
    console.error('getCurrentProgram Error:', error);
    res.status(500).json({ error: 'Failed to get current program', details: error.message });
  }
};

export const getLivePrograms = async (req, res) => {
  try {
    const { schoolId } = req.user;
    const now = new Date();

    const recentPrograms = await radioFindMany({
      schoolId,
      scheduledForGte: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      scheduledForLte: now,
      orderByScheduledFor: 'desc',
    });

    const live = [];
    for (const program of recentPrograms) {
      const startMs = new Date(program.scheduledFor).getTime();
      const durationSeconds = Number(program.durationSeconds) || 300;
      const endMs = startMs + durationSeconds * 1000;
      if (now.getTime() >= startMs && now.getTime() < endMs) {
        live.push(program);
      }
    }

    const enriched = [];
    for (const program of live) {
      let current = program;

      if (current.fileType === 'PDF' && !String(current.content || '').trim() && current.fileUrl) {
        const diskPath = toUploadsDiskPath(current.fileUrl);
        if (diskPath && fs.existsSync(diskPath)) {
          const dataBuffer = fs.readFileSync(diskPath);
          const extracted = await extractPdfText(dataBuffer);
          if (String(extracted || '').trim()) {
            current = { ...current, content: extracted };
            await radioUpdate({ id: current.id, schoolId, data: { content: extracted } });
          }
        }
      }

      const startMs = new Date(current.scheduledFor).getTime();
      const durationSeconds = Number(current.durationSeconds) || 300;
      const offset = Math.max(0, Math.min(durationSeconds, (now.getTime() - startMs) / 1000));
      enriched.push({ ...current, currentOffset: offset });
    }

    res.json(enriched);
  } catch (error) {
    console.error('getLivePrograms Error:', error);
    res.status(500).json({ error: 'Failed to get live programs', details: error.message });
  }
};

export const deleteProgram = async (req, res) => {
    try {
        const { id } = req.params;
        const { schoolId } = req.user;

        await radioDelete({ id, schoolId });
        
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete' });
    }
};
