'use client';

import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import Video from 'yet-another-react-lightbox/plugins/video';
import Download from 'yet-another-react-lightbox/plugins/download';
import type { Slide } from 'yet-another-react-lightbox';
import { useTranslations } from 'next-intl';
import type { HTMLAttributes } from 'react';
import { downloadFile } from '@/lib/download-file';
import { getFilename } from '@/lib/file-utils';
import { useOverlayPortalContainer } from '@/shared/components/ui/overlay-portal-context';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';

export type MediaLightboxItem = {
  src: string;
  alt?: string;
};

type Props = {
  items: MediaLightboxItem[];
  index: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
};

const VIDEO_MIME_TYPES: Record<string, string> = {
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  avi: 'video/x-msvideo',
};

function getExtension(src: string): string {
  return src.split('?')[0]?.split('.').pop()?.toLowerCase() ?? '';
}

function slideSource(slide: Slide): string | undefined {
  if ('src' in slide && typeof slide.src === 'string') return slide.src;
  if ('sources' in slide && Array.isArray(slide.sources)) return slide.sources[0]?.src;
  return undefined;
}

function toSlide(item: MediaLightboxItem): Slide {
  const mimeType = VIDEO_MIME_TYPES[getExtension(item.src)];
  if (mimeType) {
    return {
      type: 'video',
      sources: [{ src: item.src, type: mimeType }],
      controls: true,
      autoPlay: true,
      download: { url: item.src, filename: item.alt || getFilename(item.src) || 'download' },
    };
  }
  return {
    src: item.src,
    alt: item.alt,
    download: { url: item.src, filename: item.alt || getFilename(item.src) || 'download' },
  };
}

export function MediaLightbox({ items, index, open, onOpenChange, className }: Props) {
  const t = useTranslations('common');
  const overlayPortalContainer = useOverlayPortalContainer();

  return (
    <Lightbox
      open={open}
      className={className}
      close={() => onOpenChange(false)}
      portal={{
        root: overlayPortalContainer,
        container: { 'data-media-lightbox': 'open' } as HTMLAttributes<HTMLDivElement>,
      }}
      slides={items.map(toSlide)}
      index={index}
      plugins={[Zoom, Thumbnails, Video, Download]}
      toolbar={{ buttons: ['download', 'close'] }}
      labels={{ Download: t('downloadImage') }}
      download={{
        download: ({ slide }) => {
          const src = slideSource(slide);
          if (!src) return;
          const name = ('download' in slide && typeof slide.download === 'object' && slide.download?.filename)
            || ('alt' in slide ? slide.alt : undefined)
            || getFilename(src)
            || 'download';
          void downloadFile(src, name);
        },
      }}
    />
  );
}
