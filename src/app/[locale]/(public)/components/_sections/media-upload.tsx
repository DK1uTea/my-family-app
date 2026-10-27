'use client'

import { useState } from 'react'

import { MediaUpload } from '@/shared/components/ui/media-upload'

export function MediaUploadSection() {
  const [images, setImages] = useState<string[]>([])
  const [documents, setDocuments] = useState<string[]>([])

  return (
    <section className="space-y-4">
      <h2 className="border-b border-border pb-2 text-lg font-semibold text-foreground">
        Media Upload
      </h2>
      <p className="text-sm text-muted-foreground">
        Generic upload UI (image / video / document) with preview and click-to-enlarge lightbox.
        The actual upload request is owned by the caller — this component only reports the picked
        files via <code>onDrop</code>.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Image + Video</p>
          <MediaUpload
            value={images}
            kinds={['image', 'video']}
            onDrop={(files) => setImages([...images, ...files.map((f) => URL.createObjectURL(f))])}
            onRemove={(i) => setImages(images.filter((_, idx) => idx !== i))}
            minCount={3}
            title="Activation media"
            description="Upload at least 3 photos or videos"
          />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Document</p>
          <MediaUpload
            value={documents}
            kinds={['document']}
            onDrop={(files) => setDocuments([...documents, ...files.map((f) => URL.createObjectURL(f))])}
            onRemove={(i) => setDocuments(documents.filter((_, idx) => idx !== i))}
            hintText="PDF, DOC, XLS — max 50 MB"
          />
        </div>
      </div>
    </section>
  )
}
