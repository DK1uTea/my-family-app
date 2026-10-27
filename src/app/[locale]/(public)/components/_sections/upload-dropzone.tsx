'use client'

import { useState } from 'react'

import { UploadDropzone, type ImageFile } from '@/shared/components/ui/upload-dropzone'

export function UploadDropzoneSection() {
  const [files, setFiles] = useState<ImageFile[]>([])

  return (
    <section className="space-y-4">
      <h2 className="border-b border-border pb-2 text-lg font-semibold text-foreground">
        Upload Dropzone
      </h2>
      <p className="text-sm text-muted-foreground">
        Drag-and-drop file uploader. Accepts JPG, PNG, WebP up to 10 MB. Max 10 files.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Default</p>
          <UploadDropzone
            value={files}
            onChange={setFiles}
            hintText="JPG, PNG, WebP — max 10 MB"
          />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Disabled</p>
          <UploadDropzone disabled onChange={() => { }} />
        </div>
      </div>
    </section>
  )
}
