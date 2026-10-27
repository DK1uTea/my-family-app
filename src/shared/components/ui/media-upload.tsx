'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { useDropzone, type Accept } from 'react-dropzone'
import { FileIcon, ImageIcon, Loader2Icon, UploadIcon, VideoIcon, XIcon } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { getFilename } from '@/lib/file-utils'
import { MediaLightbox } from '@/shared/components/ui/media-lightbox'

export type MediaUploadKind = 'image' | 'video' | 'document'

const KIND_ACCEPT: Record<MediaUploadKind, Accept> = {
  image: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
  video: { 'video/mp4': [], 'video/quicktime': [], 'video/webm': [] },
  document: {
    'application/pdf': [],
    'application/msword': [],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [],
    'application/vnd.ms-excel': [],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [],
  },
}

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif']
const VIDEO_EXTENSIONS = ['mp4', 'mov', 'webm', 'avi']

function getExtension(url: string): string {
  return url.split('?')[0]?.split('.').pop()?.toLowerCase() ?? ''
}

function getFileKind(url: string): MediaUploadKind {
  const ext = getExtension(url)
  if (IMAGE_EXTENSIONS.includes(ext)) return 'image'
  if (VIDEO_EXTENSIONS.includes(ext)) return 'video'
  return 'document'
}

function mergeAccept(kinds: MediaUploadKind[]): Accept {
  return kinds.reduce<Accept>((acc, kind) => ({ ...acc, ...KIND_ACCEPT[kind] }), {})
}

function DropzoneIcon({ kinds, uploading }: { kinds: MediaUploadKind[]; uploading?: boolean }) {
  if (uploading) return <Loader2Icon className="size-7 animate-spin text-muted-foreground" />
  if (kinds.length === 1 && kinds[0] === 'image') return <ImageIcon className="size-7 text-muted-foreground" />
  if (kinds.length === 1 && kinds[0] === 'video') return <VideoIcon className="size-7 text-muted-foreground" />
  if (kinds.length === 1 && kinds[0] === 'document') return <FileIcon className="size-7 text-muted-foreground" />
  return <UploadIcon className="size-7 text-muted-foreground" />
}

type Props = {
  /** Already-uploaded file URLs — this component never calls an upload API itself. */
  value: string[]
  fileNames?: string[]
  fileKinds?: MediaUploadKind[]
  fileMeta?: ReactNode[]
  /** Called with the raw, dropzone-accepted files — the caller owns the actual upload request and appends the resulting URL(s) to `value`. */
  onDrop: (files: File[]) => void
  onRemove: (index: number) => void
  uploading?: boolean
  /** Which file kinds are accepted. Defaults to image + video. */
  kinds?: MediaUploadKind[]
  /** Override the accept map entirely instead of deriving it from `kinds`. */
  accept?: Accept
  maxSizeBytes?: number
  maxFiles?: number
  /** Shown as "{value.length} / {minCount}" below the file list when provided. */
  minCount?: number
  title?: string
  description?: string
  dropText?: string
  browseText?: string
  hintText?: string
  errorTooLargeText?: string
  errorInvalidTypeText?: string
  errorTooManyFilesText?: string
  className?: string
}

export function MediaUpload({
  value,
  fileNames,
  fileKinds,
  fileMeta,
  onDrop,
  onRemove,
  uploading,
  kinds = ['image', 'video'],
  accept,
  maxSizeBytes = 50 * 1024 * 1024,
  maxFiles = 20,
  minCount,
  title,
  description,
  dropText = 'Drop files here, or',
  browseText = 'click to browse',
  hintText,
  errorTooLargeText = 'File is too large',
  errorInvalidTypeText = 'Invalid file type',
  errorTooManyFilesText = 'Too many files',
  className,
}: Props) {
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryIndex, setGalleryIndex] = useState(0)

  const remainingSlots = Math.max(0, maxFiles - value.length)
  const isFull = remainingSlots === 0

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: accept ?? mergeAccept(kinds),
    maxSize: maxSizeBytes,
    maxFiles: remainingSlots,
    disabled: uploading || isFull,
    onDrop(accepted, rejected) {
      rejected.forEach(({ errors }) =>
        errors.forEach((e) => {
          if (e.code === 'file-too-large') toast.error(errorTooLargeText)
          else if (e.code === 'file-invalid-type') toast.error(errorInvalidTypeText)
          else if (e.code === 'too-many-files') toast.error(errorTooManyFilesText)
        }),
      )
      if (accepted.length) onDrop(accepted)
    },
  })

  const previewItems = value
    .map((url, index) => fileKinds?.[index] ?? getFileKind(url))
    .map((kind, i) => ({ kind, url: value[i] }))
    .filter((item) => item.kind !== 'document')
    .map((item) => ({ src: item.url, alt: '' }))

  function handleRowClick(url: string, index: number) {
    const kind = fileKinds?.[index] ?? getFileKind(url)
    if (kind === 'document') {
      window.open(url, '_blank', 'noopener,noreferrer')
      return
    }
    const previewIndex = previewItems.findIndex((item) => item.src === url)
    setGalleryIndex(Math.max(0, previewIndex))
    setGalleryOpen(true)
  }

  return (
    <div className={cn('w-full min-w-0 space-y-3', className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && <p className="text-sm font-semibold">{title}</p>}
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      )}

      <div
        {...getRootProps()}
        className={cn(
          'flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-center transition-colors',
          isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary',
          (uploading || isFull) && 'cursor-not-allowed opacity-50',
        )}
      >
        <input {...getInputProps()} />
        <DropzoneIcon kinds={kinds} uploading={uploading} />
        <p className="text-sm text-muted-foreground">
          {dropText} <span className="text-primary underline">{browseText}</span>
        </p>
        {hintText && <p className="text-xs text-muted-foreground">{hintText}</p>}
      </div>

      {value.length > 0 && (
        <div className="min-w-0 space-y-2">
          {value.map((url, i) => {
            const kind = fileKinds?.[i] ?? getFileKind(url)
            return (
              <div
                key={`${url}-${i}`}
                role="button"
                tabIndex={0}
                onClick={() => handleRowClick(url, i)}
                onKeyDown={(e) => e.key === 'Enter' && handleRowClick(url, i)}
                className="flex min-w-0 max-w-full cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2 transition-colors hover:bg-muted/50"
              >
                {kind === 'image' ? (
                  <img
                    src={url}
                    alt=""
                    className="size-10 shrink-0 rounded object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                  />
                ) : kind === 'video' ? (
                  <VideoIcon className="size-10 shrink-0 text-muted-foreground" />
                ) : (
                  <FileIcon className="size-10 shrink-0 text-muted-foreground" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-muted-foreground">
                    {fileNames?.[i] ?? getFilename(url)}
                  </p>
                  {fileMeta?.[i]}
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onRemove(i) }}
                  className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <XIcon className="size-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {minCount !== undefined && (
        <p className="text-xs text-muted-foreground">
          {value.length} / {minCount}
        </p>
      )}

      <MediaLightbox
        items={previewItems}
        index={galleryIndex}
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
      />
    </div>
  )
}
