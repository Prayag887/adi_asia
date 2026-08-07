import type { Plugin, ViteDevServer } from 'vite';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Busboy from 'busboy';
import type { IncomingMessage, ServerResponse } from 'node:http';

function loadEnv(): Record<string, string> {
  const env: Record<string, string> = { ...process.env as Record<string, string> };
  try {
    const content = readFileSync(resolve('.env'), 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      if (key && !env[key]) env[key] = value;
    }
  } catch { /* .env not found, use process.env only */ }
  return env;
}

const env = loadEnv();

function getClient() {
  const endpoint = env.R2_ENDPOINT;
  const accessKeyId = env.R2_ACCESS_KEY_ID;
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error('Missing R2 environment variables (R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY).');
  }
  return new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });
}

function parseMultipart(req: IncomingMessage): Promise<{ filename: string; mimeType: string; data: Buffer }[]> {
  return new Promise((resolve, reject) => {
    const files: { filename: string; mimeType: string; data: Buffer }[] = [];
    const bb = Busboy({ headers: req.headers });

    bb.on('file', (_name: string, stream: NodeJS.ReadableStream, info: { filename: string; encoding: string; mimeType: string }) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', () => {
        files.push({ filename: info.filename, mimeType: info.mimeType, data: Buffer.concat(chunks) });
      });
    });

    bb.on('error', reject);
    bb.on('close', () => resolve(files));
    req.pipe(bb);
  });
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

function json(res: ServerResponse, status: number, body: Record<string, string>) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

export function r2UploadPlugin(): Plugin {
  return {
    name: 'r2-upload',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/api/blog-images', async (req, res) => {
        if (req.method !== 'POST') {
          return json(res, 405, { error: 'Method not allowed' });
        }

        try {
          const files = await parseMultipart(req);

          if (files.length === 0) {
            return json(res, 400, { error: 'No file uploaded' });
          }

          const file = files[0];

          if (!ALLOWED_TYPES.includes(file.mimeType)) {
            return json(res, 400, { error: `Unsupported file type: ${file.mimeType}. Allowed: ${ALLOWED_TYPES.join(', ')}` });
          }

          if (file.data.length > MAX_SIZE) {
            return json(res, 400, { error: 'File too large. Maximum size is 10 MB.' });
          }

          const ext = file.filename.split('.').pop()?.toLowerCase() || 'jpg';
          const hash = createHash('md5').update(file.data).digest('hex').slice(0, 12);
          const key = `blog-images/${hash}.${ext}`;

          const client = getClient();
          await client.send(new PutObjectCommand({
            Bucket: env.R2_BUCKET!,
            Key: key,
            Body: file.data,
            ContentType: file.mimeType,
          }));

          const publicUrl = `${env.PUBLIC_R2_URL || ''}/${key}`;
          json(res, 200, { url: publicUrl });
        } catch (err) {
          console.error('[r2-upload]', err);
          json(res, 500, { error: 'Upload failed' });
        }
      });
    },
  };
}
