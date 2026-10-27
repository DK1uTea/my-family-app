'use client';

import { useEffect, useState } from 'react';
import NextImage from 'next/image';
import { useTranslations } from 'next-intl';
import { useDropzone } from 'react-dropzone';
import { FileIcon, XIcon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/ui/button';
import { MediaLightbox } from '@/shared/components/ui/media-lightbox';
import { ImageCropDialog } from '@/shared/components/ui/image-crop-dialog';

export type UploadFile = {
  name: string;
  size?: number;
  preview: string;
  file?: File;
  url?: string;
  key?: string;
  isUploaded?: boolean;
};

/** @deprecated Use UploadFile; the dropzone also supports non-image documents. */
export type ImageFile = UploadFile;

type Props = {
  value?: UploadFile[];
  onChange: (files: UploadFile[]) => void;
  /** Mime-type -> extensions map passed straight to react-dropzone. Defaults to image-only. */
  accept?: Record<string, string[]>;
  maxFiles?: number;
  maxSizeBytes?: number;
  disabled?: boolean;
  invalid?: boolean;
  /** Accessible name for the hidden file input — pass the field's own label. */
  label?: string;
  dropText?: string;
  browseText?: string;
  hintText?: string;
  errorTooLargeText?: string;
  errorInvalidTypeText?: string;
  removeText?: string;
  removeAllText?: string;
  /** Opens ImageCropDialog (16:9 / Custom) immediately for every dropped image, before it's added to the list. */
  enableCrop?: boolean;
};

const DEFAULT_ACCEPT = { 'image/jpeg': [], 'image/png': [], 'image/webp': [] };
const IMAGE_EXTENSION_PATTERN = /\.(gif|heic|heif|jpe?g|png|webp)$/i;

function isImageUpload(file: UploadFile) {
  if (file.file) return file.file.type.startsWith('image/');
  return IMAGE_EXTENSION_PATTERN.test(file.name) || IMAGE_EXTENSION_PATTERN.test(file.preview);
}

export function UploadDropzone({
  value = [],
  onChange,
  accept = DEFAULT_ACCEPT,
  maxFiles = 10,
  maxSizeBytes = 10 * 1024 * 1024,
  disabled,
  invalid = false,
  label,
  dropText: dropTextProp,
  browseText: browseTextProp,
  hintText: hintTextProp,
  errorTooLargeText: errorTooLargeTextProp,
  errorInvalidTypeText: errorInvalidTypeTextProp,
  removeText: removeTextProp,
  removeAllText: removeAllTextProp,
  enableCrop = false,
}: Props) {
  const t = useTranslations('common.uploadDropzone');
  const dropText = dropTextProp ?? t('dropText');
  const browseText = browseTextProp ?? t('browseText');
  const hintText = hintTextProp ?? t('hintText');
  const errorTooLargeText = errorTooLargeTextProp ?? t('errorTooLarge');
  const errorInvalidTypeText = errorInvalidTypeTextProp ?? t('errorInvalidType');
  const removeText = removeTextProp ?? t('remove');
  const removeAllText = removeAllTextProp ?? t('removeAll');
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [cropQueue, setCropQueue] = useState<UploadFile[]>([]);
  const [cropTarget, setCropTarget] = useState<UploadFile | null>(null);
  const imageFiles = value.filter(isImageUpload);
  const isDropzoneDisabled = Boolean(disabled) || value.length >= maxFiles;

  // Pop the next queued image into the dialog once the current one resolves.
  useEffect(() => {
    if (cropTarget || cropQueue.length === 0) return;
    setCropTarget(cropQueue[0]);
    setCropQueue((q) => q.slice(1));
  }, [cropQueue, cropTarget]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    maxSize: maxSizeBytes,
    disabled: isDropzoneDisabled,
    onDrop(accepted, rejected) {
      rejected.forEach(({ errors }) =>
        errors.forEach((e) => {
          if (e.code === 'file-too-large') toast.error(errorTooLargeText);
          if (e.code === 'file-invalid-type') toast.error(errorInvalidTypeText);
        })
      );
      if (!accepted.length) return;
      const mapped: UploadFile[] = accepted.map((file) => ({
        name: file.name,
        size: file.size,
        preview: URL.createObjectURL(file),
        file,
      }));

      if (enableCrop) {
        const images = mapped.filter(isImageUpload);
        const nonImages = mapped.filter((f) => !isImageUpload(f));
        if (nonImages.length) onChange([...value, ...nonImages].slice(0, maxFiles));
        if (images.length) setCropQueue((q) => [...q, ...images]);
        return;
      }

        const nextValue = maxFiles === 1
          ? mapped.slice(0, 1)
          : [...value, ...mapped].slice(0, maxFiles);
        onChange(nextValue);
    },
  });

  const handleRemove = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    URL.revokeObjectURL(value[index].preview);
    onChange(value.filter((_, i) => i !== index));
  };

  const handleRemoveAll = () => {
    value.forEach((file) => URL.revokeObjectURL(file.preview));
    onChange([]);
  };

  const handleCropSave = async (croppedFile: File) => {
    if (!cropTarget) return;
    URL.revokeObjectURL(cropTarget.preview);
    const cropped: UploadFile = {
      name: cropTarget.name,
      size: croppedFile.size,
      preview: URL.createObjectURL(croppedFile),
      file: croppedFile,
    };
    onChange([...value, cropped].slice(0, maxFiles));
    setCropTarget(null);
  };

  const handleCropCancel = () => {
    if (cropTarget) URL.revokeObjectURL(cropTarget.preview);
    setCropTarget(null);
  };

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          'flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-center transition-colors',
          isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary',
          invalid && !isDragActive && 'border-destructive hover:border-destructive',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <input {...getInputProps()} aria-label={label ?? dropText} />
        <p className="text-sm text-muted-foreground">
          {dropText} <span className="text-primary">{browseText}</span>
        </p>
        <p className="text-xs text-muted-foreground">{hintText}</p>
      </div>

      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((file, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg border border-border px-3 py-2"
            >
              {isImageUpload(file) ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-lg"
                  onClick={() => {
                    setGalleryIndex(imageFiles.indexOf(file));
                    setGalleryOpen(true);
                  }}
                  className="size-10 rounded! p-0"
                >
                  <NextImage
                    src={file.preview}
                    alt={file.name}
                    width={40}
                    height={40}
                    className="size-10 rounded bg-muted object-contain"
                  />
                </Button>
              ) : (
                <FileIcon aria-hidden="true" className="size-10 shrink-0 text-muted-foreground" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium" translate="no">{file.name}</p>
                {file.size !== undefined && (
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                )}
              </div>
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`${removeText} ${file.name}`}
                  onClick={(e) => handleRemove(e, i)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <XIcon data-icon="inline-start" />
                </Button>
              )}
            </div>
          ))}
          {!disabled && (
            <div className="flex justify-end pt-1">
              <Button type="button" variant="outline-primary" size="sm" onClick={handleRemoveAll}>
                {removeAllText}
              </Button>
            </div>
          )}
        </div>
      )}

      <MediaLightbox
        items={imageFiles.map((file) => ({ src: file.preview, alt: file.name }))}
        index={galleryIndex}
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
      />

      {enableCrop && cropTarget && (
        <ImageCropDialog
          open
          image={cropTarget.preview}
          fileName={cropTarget.name}
          onClose={handleCropCancel}
          onSave={handleCropSave}
        />
      )}
    </div>
  );
}
