'use client'

import { useState } from 'react'

import { ImageCropDialog } from '@/shared/components/ui/image-crop-dialog'
import { Button } from '@/shared/components/ui/button'

export function ImageCropSection() {
  const [source, setSource] = useState('')
  const [open, setOpen] = useState(false)
  const [result, setResult] = useState('')

  return (
    <section className="space-y-4">
      <h2 className="border-b border-border pb-2 text-lg font-semibold text-foreground">
        Image Crop
      </h2>
      <p className="text-sm text-muted-foreground">
        react-image-crop wrapper with a 16:9 (locked ratio, drag corners to resize) and a Custom
        (freeform) mode. The preview frame matches the 16:9 <code>object-contain</code> style used
        on the event detail page.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="file"
          accept="image/*"
          aria-label="Pick an image to crop"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) setSource(URL.createObjectURL(file))
          }}
        />
        <Button type="button" variant="outline" disabled={!source} onClick={() => setOpen(true)}>
          Crop image
        </Button>
      </div>

      {result && (
        <div className="relative mx-auto aspect-video h-54 w-auto max-w-full overflow-hidden rounded-lg border bg-muted">
          <img src={result} alt="Cropped result" className="size-full object-contain" />
        </div>
      )}

      {source && (
        <ImageCropDialog
          open={open}
          image={source}
          fileName="showcase-crop.jpg"
          onClose={() => setOpen(false)}
          onSave={(file) => setResult(URL.createObjectURL(file))}
        />
      )}
    </section>
  )
}
