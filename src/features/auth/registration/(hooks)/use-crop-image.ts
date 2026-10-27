'use client'

import { useCallback, useEffect, useState } from 'react'

import { Area } from 'react-easy-crop'
import { useDebouncedCallback } from 'use-debounce'

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new window.Image()

    image.addEventListener('load', () => resolve(image))

    image.addEventListener('error', reject)

    image.setAttribute('crossOrigin', 'anonymous')

    image.src = url
  })

const getRadianAngle = (degreeValue: number) => {
  return (degreeValue * Math.PI) / 180
}

const rotateSize = (width: number, height: number, rotation: number) => {
  const rotRad = getRadianAngle(rotation)

  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height)
  }
}

export const useCropImage = (image: string) => {
  const [crop, setCrop] = useState({
    x: 0,
    y: 0
  })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [preview, setPreview] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const generatePreview = useDebouncedCallback(
    async (source: string, area: Area, rotate: number) => {
      if (!source) return

      try {
        setIsGenerating(true)
        const sourceImage = await createImage(source)
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        const rotRad = getRadianAngle(rotate)
        const { width, height } = rotateSize(sourceImage.width, sourceImage.height, rotate)
        canvas.width = width
        canvas.height = height
        ctx.translate(width / 2, height / 2)
        ctx.rotate(rotRad)
        ctx.drawImage(sourceImage, -sourceImage.width / 2, -sourceImage.height / 2)
        const imageData = ctx.getImageData(area.x, area.y, area.width, area.height)
        canvas.width = area.width
        canvas.height = area.height
        ctx.putImageData(imageData, 0, 0)
        const base64 = canvas.toDataURL('image/jpeg', 0.9)
        setPreview(base64)
      } catch {
        setPreview('')
      } finally {
        setIsGenerating(false)
      }
    },
    300
  )

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels)
  }, [])

  useEffect(() => {
    if (!image || !croppedAreaPixels) {
      return
    }
    generatePreview(image, croppedAreaPixels, rotation)

    return () => {
      generatePreview.cancel()
    }
  }, [image, rotation, croppedAreaPixels, generatePreview])

  const reset = () => {
    generatePreview.cancel()
    setCrop({
      x: 0,
      y: 0
    })

    setZoom(1)
    setRotation(0)
    setPreview('')
    setCroppedAreaPixels(null)
  }

  return {
    crop,
    zoom,
    rotation,
    preview,
    isGenerating,

    setCrop,
    setZoom,
    setRotation,

    onCropComplete,
    reset
  }
}
