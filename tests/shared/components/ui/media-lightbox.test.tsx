import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';

import { MediaLightbox } from '@/shared/components/ui/media-lightbox';
import { OverlayPortalProvider } from '@/shared/components/ui/overlay-portal-context';
import messages from '@/messages/en.json';

const downloadFile = vi.fn();

vi.mock('@/lib/download-file', () => ({
  downloadFile: (...args: unknown[]) => downloadFile(...args),
}));

describe('MediaLightbox', () => {
  it('shows a download control in the toolbar and saves the current image', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <MediaLightbox
          items={[{ src: 'https://cdn.test/photo.jpg', alt: 'photo.jpg' }]}
          index={0}
          open
          onOpenChange={vi.fn()}
        />
      </NextIntlClientProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Download' }));

    expect(downloadFile).toHaveBeenCalledWith('https://cdn.test/photo.jpg', 'photo.jpg');
  });

  it('mounts in the nearest overlay portal when one is available', async () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <OverlayPortalProvider>
          <MediaLightbox
            items={[{ src: 'https://cdn.test/photo.jpg', alt: 'photo.jpg' }]}
            index={0}
            open
            onOpenChange={vi.fn()}
          />
        </OverlayPortalProvider>
      </NextIntlClientProvider>,
    );

    await waitFor(() => {
      const overlayContainer = document.querySelector('.contents');
      expect(overlayContainer?.querySelector('[role="dialog"]')).toBeInTheDocument();
      expect(overlayContainer?.querySelector('[data-media-lightbox="open"]')).toBeInTheDocument();
    });
  });
});
