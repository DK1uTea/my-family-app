import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Sheet, SheetContent, SheetTitle } from '@/shared/components/ui/sheet';

describe('Sheet', () => {
  it('does not close when a media lightbox is open inside it', () => {
    const onOpenChange = vi.fn();

    render(
      <Sheet open onOpenChange={onOpenChange}>
        <SheetContent>
          <SheetTitle>Test sheet</SheetTitle>
          <div data-media-lightbox="open" />
        </SheetContent>
      </Sheet>,
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('closes on Escape when no media lightbox is open', () => {
    const onOpenChange = vi.fn();

    render(
      <Sheet open onOpenChange={onOpenChange}>
        <SheetContent>
          <SheetTitle>Test sheet</SheetTitle>
        </SheetContent>
      </Sheet>,
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
