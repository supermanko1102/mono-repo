import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { prisma } from "@/app/lib/db";
import { jsonError, jsonOk } from "@/app/lib/http";
import { requireUser } from "@/app/lib/session";

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

export async function POST(req: Request) {
  const me = await requireUser().catch(() => null);
  if (!me) return jsonError("Unauthorized", 401);

  const form = await req.formData().catch(() => null);
  if (!form) return jsonError("Invalid form", 400);

  const file = form.get("file");
  if (!(file instanceof File)) return jsonError("Missing file", 400);
  if (!file.type.startsWith("image/")) return jsonError("Only image uploads supported", 400);
  if (file.size > 5 * 1024 * 1024) return jsonError("Max file size is 5MB", 400);

  const ext = path.extname(file.name);
  const base = safeName(path.basename(file.name, ext));
  const id = crypto.randomBytes(10).toString("hex");
  const filename = `${id}_${base || "image"}${ext || ".png"}`;

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });

  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(uploadsDir, filename), buf);

  const upload = await prisma.upload.create({
    data: {
      ownerId: me.id,
      path: `/uploads/${filename}`,
      mime: file.type,
      sizeBytes: file.size,
    },
    select: { id: true, path: true },
  });

  return jsonOk({ uploadId: upload.id, path: upload.path });
}
