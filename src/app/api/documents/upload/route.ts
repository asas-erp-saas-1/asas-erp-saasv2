import { withEEK } from '@/eek/withEEK';
import { NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import { join } from "path"
import { documents } from "@/db/schema"

export const POST = withEEK({
  resource: 'system',
  action: 'write',
  handler: async (ctx, req: NextRequest) => {
  try {
    const identity = await { tenantId: ctx.organizationId, userId: ctx.session.user.id })
    const { filename, category, dataUrl, dealId, portalUpload, entityType } = await req.json()

    const actualEntityType = entityType || 'deal'
    const actualEntityId = dealId

    if (!filename || !dataUrl || !actualEntityId) {
      return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 })
    }

    // Parse base64 content
    const base64Parts = dataUrl.split(";base64,")
    const mimeType = base64Parts[0].split(":")[1] || "application/octet-stream"
    const base64Data = base64Parts[1]

    if (!base64Data) {
      return NextResponse.json({ error: "Données de fichier invalides" }, { status: 400 })
    }

    const buffer = Buffer.from(base64Data, "base64")
    const sizeBytes = buffer.length

    // Define storage path
    const uploadDirName = "uploads"
    const publicDir = join(process.cwd(), "public")
    const uploadDir = join(publicDir, uploadDirName)

    // Ensure upload directory exists
    try {
      await fs.access(uploadDir)
    } catch {
      await fs.mkdir(uploadDir, { recursive: true })
    }

    // Generate unique safe filename
    const timestamp = Date.now()
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_")
    const finalFilename = `${timestamp}-${sanitizedFilename}`
    const relativeUrl = `/${uploadDirName}/${finalFilename}`
    const absolutePath = join(uploadDir, finalFilename)

    // Write file to local disk
    await fs.writeFile(absolutePath, buffer)

    // Insert into enterprise documents table
    const [newDoc] = await db.insert(documents).values({
       organizationId: identity.tenantId,
       entityType: actualEntityType,
       entityId: parseInt(actualEntityId),
       name: filename,
       category: category || "Autre",
       fileUrl: relativeUrl,
       fileType: mimeType,
       fileSize: sizeBytes,
       uploadedBy: portalUpload ? "Client" : "Agent"
    }).returning();

    // Also inject a legacy activity note for timeline visibility, but the source of truth is now `documents`.
    const vaultPayload = {
      filename,
      category: category || "Autre",
      url: relativeUrl,
      size: sizeBytes,
      uploadedBy: portalUpload ? "Client" : "Agent",
      mimeType,
      timestamp
    }
    await fetch(`${req.nextUrl.origin}/api/activities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deal_id: actualEntityId,
        type: "note",
        description: `[VAULT-JSON] ${JSON.stringify(vaultPayload)}`
      })
    }).catch(e => console.warn('Silently failed to push timeline note:', e));

    return NextResponse.json({
      success: true,
      data: newDoc
    })
  } catch (error: any) {
    console.error("Document Upload Router Error:", error)
    return NextResponse.json({ error: error.message || "Erreur de téléversement" }, { status: 500 })
  }
  }
});
