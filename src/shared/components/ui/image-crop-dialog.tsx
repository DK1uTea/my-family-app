'use client'

import { useEffect, useState } from 'react'
import ReactCrop, { centerCrop, convertToPixelCrop, makeAspectCrop, type Crop, type PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useImageCrop } from '@/shared/hooks/common/use-image-crop'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'

const ASPECT_16_9 = 16 / 9
type AspectMode = '16:9' | 'custom'

type Props = {
  open: boolean
  image: string
  fileName: string
  onClose: () => void
  onSave: (file: File) => void | Promise<void>
}

// Starts from 100% width so the default selection covers as much of the
// image as the aspect ratio allows (clamped/centered by centerCrop) —
// starting from a smaller percentage would crop off edges unnecessarily
// even when the whole image already fits (or nearly fits) 16:9.
function centeredAspectCrop(width: number, height: number, aspect: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 100 }, aspect, width, height),
    width,
    height,
  )
}

export function ImageCropDialog({ open, image, fileName, onClose, onSave }: Props) {
  const t = useTranslations('imageCropDialog')
  // A callback ref (state), not useRef — Dialog/Portal can mount the <img>
  // a tick after this component itself mounts, so a plain useRef read
  // inside a `[image]`-only effect can fire before the node is attached and
  // silently bail out with nothing to retry it. Tracking the node as state
  // makes the effect below re-run the moment it actually attaches.
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null)
  const [mode, setMode] = useState<AspectMode>('16:9')
  const [crop, setCrop] = useState<Crop>()
  const [isSaving, setIsSaving] = useState(false)
  const { preview, isGenerating, onCropComplete, getCroppedFile, reset } = useImageCrop()

  // Crops immediately whenever the crop rectangle changes — on the initial
  // load and on every aspect-mode switch — instead of waiting for the user
  // to drag the selection. ReactCrop's own onComplete only fires after a
  // drag interaction, so it wouldn't run for a crop we set programmatically.
  const applyCrop = (nextCrop: Crop, img: HTMLImageElement) => {
    setCrop(nextCrop)
    onCropComplete(img, convertToPixelCrop(nextCrop, img.width, img.height), true)
  }

  // Attached imperatively (not via a JSX `onLoad` prop) so jsx-a11y doesn't
  // flag a load listener on a plain, non-interactive <img>. Depends on
  // `imgEl` (not just `image`) so it re-runs once the node actually attaches.
  useEffect(() => {
    if (!imgEl) return
    const applyInitialCrop = () => applyCrop(centeredAspectCrop(imgEl.width, imgEl.height, ASPECT_16_9), imgEl)
    if (imgEl.complete && imgEl.naturalWidth > 0) {
      applyInitialCrop()
      return
    }
    imgEl.addEventListener('load', applyInitialCrop)
    return () => imgEl.removeEventListener('load', applyInitialCrop)
  }, [imgEl, image])

  const handleModeChange = (next: AspectMode) => {
    setMode(next)
    if (!imgEl) return
    applyCrop(
      next === '16:9'
        ? centeredAspectCrop(imgEl.width, imgEl.height, ASPECT_16_9)
        : { unit: '%', x: 5, y: 5, width: 90, height: 90 },
      imgEl,
    )
  }

  const handleComplete = (pixelCrop: PixelCrop) => {
    if (imgEl) onCropComplete(imgEl, pixelCrop)
  }

  const handleClose = () => {
    reset()
    setCrop(undefined)
    setMode('16:9')
    onClose()
  }

  const handleSave = async () => {
    if (!imgEl) return
    setIsSaving(true)
    try {
      const file = await getCroppedFile(imgEl, fileName)
      if (!file) return
      await onSave(file)
      handleClose()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <DialogContent className="flex flex-col gap-4 sm:max-w-2xl!">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription className="sr-only">{t('description')}</DialogDescription>
        </DialogHeader>

        <div className="flex max-h-100 items-center justify-center overflow-hidden rounded-lg border bg-muted p-2">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={handleComplete}
            aspect={mode === '16:9' ? ASPECT_16_9 : undefined}
            keepSelection
          >
            {/* react-image-crop's own CSS (`.ReactCrop__child-wrapper>img{max-height:inherit}`)
                has higher specificity than a bare Tailwind class and overrides max-height to
                `none`, letting the source image overflow the container and get hard-clipped by
                its `overflow-hidden` (looks like object-cover instead of the full image). The
                `!` modifier forces these to win. */}
            <img ref={setImgEl} src={image} alt="" className="max-h-96! max-w-full!" />
          </ReactCrop>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={mode === '16:9' ? 'default' : 'outline'}
            onClick={() => handleModeChange('16:9')}
          >
            {t('aspect169')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === 'custom' ? 'default' : 'outline'}
            onClick={() => handleModeChange('custom')}
          >
            {t('aspectCustom')}
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">{t('preview')}</p>
          <div className="relative mx-auto aspect-video h-54 w-auto max-w-full overflow-hidden rounded-lg border bg-muted">
            {isGenerating && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {preview && (
              <img src={preview} alt={t('previewAlt')} className={cn('size-full object-contain', isGenerating && 'opacity-50')} />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>{t('cancel')}</Button>
          <Button
            data-testid="crop-save-button"
            disabled={!preview || isSaving}
            isLoading={isSaving}
            onClick={handleSave}
          >
            {t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
