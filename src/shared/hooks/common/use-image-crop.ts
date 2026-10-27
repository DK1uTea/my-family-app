'use client'

import { useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import type { PixelCrop } from 'react-image-crop'

/**
 * Crops against the actually-rendered <img> element (not a freshly loaded
 * Image()) because react-image-crop's PixelCrop is relative to that
 * element's on-screen size — naturalWidth/naturalHeight vs width/height give
 * the scale factor back to the source image's real pixels.
 */
function drawCropped(image: HTMLImageElement, crop: PixelCrop): Promise<Blob | null> {
  const scaleX = image.naturalWidth / image.width
  const scaleY = image.naturalHeight / image.height
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(crop.width * scaleX))
  canvas.height = Math.max(1, Math.round(crop.height * scaleY))
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.resolve(null)
  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height,
  )
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.92))
}

export function useImageCrop() {
  const [preview, setPreview] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [lastCrop, setLastCrop] = useState<PixelCrop | null>(null)

  const generateNow = async (image: HTMLImageElement, crop: PixelCrop) => {
    setIsGenerating(true)
    try {
      const blob = await drawCropped(image, crop)
      setPreview(blob ? URL.createObjectURL(blob) : '')
    } finally {
      setIsGenerating(false)
    }
  }

  const generatePreviewDebounced = useDebouncedCallback(generateNow, 250)

  /**
   * `immediate` skips the debounce — used for the initial auto-crop and for
   * switching aspect mode (16:9/Custom), so the preview reflects that crop
   * right away instead of only updating after the debounce window, or only
   * once the user starts dragging the selection.
   */
  const onCropComplete = (image: HTMLImageElement, crop: PixelCrop, immediate = false) => {
    if (crop.width <= 0 || crop.height <= 0) return
    setLastCrop(crop)
    if (immediate) {
      generatePreviewDebounced.cancel()
      generateNow(image, crop)
    } else {
      generatePreviewDebounced(image, crop)
    }
  }

  const getCroppedFile = async (image: HTMLImageElement, fileName: string): Promise<File | null> => {
    if (!lastCrop) return null
    const blob = await drawCropped(image, lastCrop)
    return blob ? new File([blob], fileName, { type: 'image/jpeg' }) : null
  }

  const reset = () => {
    generatePreviewDebounced.cancel()
    if (preview) URL.revokeObjectURL(preview)
    setPreview('')
    setLastCrop(null)
  }

  return { preview, isGenerating, onCropComplete, getCroppedFile, reset }
}
