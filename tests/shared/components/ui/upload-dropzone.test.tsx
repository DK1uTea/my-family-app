import { act, fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';

import { UploadDropzone } from '@/shared/components/ui/upload-dropzone';
import deMessages from '@/messages/de.json';
import enMessages from '@/messages/en.json';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

let dropzoneOptions: Record<string, unknown> = {};

vi.mock('react-dropzone', () => ({
  useDropzone: (options: Record<string, unknown>) => {
    dropzoneOptions = options;
    return { getRootProps: () => ({}), getInputProps: () => ({}), isDragActive: false };
  },
}));

vi.mock('@/shared/components/ui/media-lightbox', () => ({
  MediaLightbox: ({ items, open }: { items: { src: string }[]; open: boolean }) => (
    <div data-testid="media-lightbox" data-open={open} data-items={items.map((item) => item.src).join(',')} />
  ),
}));

vi.mock('@/shared/components/ui/image-crop-dialog', () => ({
  ImageCropDialog: ({
    image, onSave, onClose,
  }: { image: string; onSave: (file: File) => void; onClose: () => void }) => (
    <div data-testid="image-crop-dialog" data-image={image}>
      <button onClick={() => onSave(new File(['cropped'], 'cropped.jpg', { type: 'image/jpeg' }))}>
        save-crop
      </button>
      <button onClick={onClose}>cancel-crop</button>
    </div>
  ),
}));

const dropFile = (file: File) => {
  act(() => {
    (dropzoneOptions.onDrop as (accepted: File[], rejected: unknown[]) => void)([file], []);
  });
};

const renderWithLocale = (ui: React.ReactNode, locale: 'de' | 'en' = 'en') => render(
  <NextIntlClientProvider locale={locale} messages={locale === 'de' ? deMessages : enMessages}>
    {ui}
  </NextIntlClientProvider>,
);

describe('UploadDropzone accept configuration', () => {
  it('uses localized default copy when text overrides are omitted', () => {
    renderWithLocale(
      <UploadDropzone
        onChange={vi.fn()}
        value={[{ name: 'proof.pdf', preview: 'blob:proof' }]}
      />,
      'de',
    );

    expect(screen.getByText(/Bilder hier ablegen oder/)).toBeInTheDocument();
    expect(screen.getByText('zum Auswählen klicken')).toBeInTheDocument();
    expect(screen.getByText(/Maximal 10 Dateien/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entfernen proof.pdf' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Alle entfernen' })).toBeInTheDocument();
  });

  it('defaults to image-only mime types when no accept prop is given', () => {
    renderWithLocale(<UploadDropzone value={[]} onChange={vi.fn()} />);

    expect(dropzoneOptions.accept).toEqual({
      'image/jpeg': [],
      'image/png': [],
      'image/webp': [],
    });
  });

  it('uses a custom accept map when one is provided', () => {
    const customAccept = { 'application/pdf': ['.pdf'] };
    renderWithLocale(<UploadDropzone value={[]} onChange={vi.fn()} accept={customAccept} />);

    expect(dropzoneOptions.accept).toEqual(customAccept);
  });

  it('previews only images and renders a document icon for non-image files', () => {
    renderWithLocale(
      <UploadDropzone
        onChange={vi.fn()}
        value={[
          {
            name: 'photo.png',
            preview: 'blob:photo',
            file: new File(['photo'], 'photo.png', { type: 'image/png' }),
          },
          {
            name: 'proof.pdf',
            preview: 'blob:proof',
            file: new File(['proof'], 'proof.pdf', { type: 'application/pdf' }),
          },
        ]}
      />,
    );

    expect(screen.getByRole('img', { name: 'photo.png' })).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'proof.pdf' })).not.toBeInTheDocument();
    expect(screen.getByText('proof.pdf').closest('[role="button"]')).toBeNull();
    expect(screen.getByTestId('media-lightbox')).toHaveAttribute('data-items', 'blob:photo');

    fireEvent.click(screen.getByRole('button', { name: 'photo.png' }));
    expect(screen.getByTestId('media-lightbox')).toHaveAttribute('data-open', 'true');
  });

  it('removes every uploaded file from the list', () => {
    const onChange = vi.fn();
    renderWithLocale(
      <UploadDropzone
        onChange={onChange}
        removeAllText="Remove all"
        value={[
          { name: 'photo.png', preview: 'blob:photo' },
          { name: 'proof.pdf', preview: 'blob:proof' },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Remove all' }));

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('never shows a crop button in the list — only the remove (X) icon — even with enableCrop set', () => {
    renderWithLocale(
      <UploadDropzone
        enableCrop
        onChange={vi.fn()}
        value={[{ name: 'photo.png', preview: 'blob:photo', file: new File(['photo'], 'photo.png', { type: 'image/png' }) }]}
      />,
    );

    expect(screen.queryByRole('button', { name: /Crop/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove photo.png' })).toBeInTheDocument();
  });

  it('opens the crop dialog immediately for a newly dropped image when enableCrop is set, without adding it to the list yet', () => {
    const onChange = vi.fn();
    renderWithLocale(<UploadDropzone enableCrop onChange={onChange} value={[]} />);

    const file = new File(['photo'], 'photo.png', { type: 'image/png' });
    dropFile(file);

    expect(screen.getByTestId('image-crop-dialog')).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('adds the cropped result (not the original file) to the list once the crop dialog is saved', () => {
    const onChange = vi.fn();
    renderWithLocale(<UploadDropzone enableCrop onChange={onChange} value={[]} />);

    const file = new File(['photo'], 'photo.png', { type: 'image/png' });
    dropFile(file);
    fireEvent.click(screen.getByText('save-crop'));

    expect(onChange).toHaveBeenCalledTimes(1);
    const [savedFiles] = onChange.mock.calls[0];
    expect(savedFiles).toHaveLength(1);
    expect(savedFiles[0].name).toBe('photo.png');
    expect(savedFiles[0].file.name).toBe('cropped.jpg');
  });

  it('discards the dropped image and does not add it to the list when the crop dialog is cancelled', () => {
    const onChange = vi.fn();
    renderWithLocale(<UploadDropzone enableCrop onChange={onChange} value={[]} />);

    const file = new File(['photo'], 'photo.png', { type: 'image/png' });
    dropFile(file);
    fireEvent.click(screen.getByText('cancel-crop'));

    expect(screen.queryByTestId('image-crop-dialog')).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not open the crop dialog for a dropped image when enableCrop is not set', () => {
    const onChange = vi.fn();
    renderWithLocale(<UploadDropzone onChange={onChange} value={[]} />);

    const file = new File(['photo'], 'photo.png', { type: 'image/png' });
    dropFile(file);

    expect(screen.queryByTestId('image-crop-dialog')).not.toBeInTheDocument();
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('replaces the existing file when maxFiles is one', () => {
    const onChange = vi.fn();
    renderWithLocale(
      <UploadDropzone
        maxFiles={1}
        onChange={onChange}
        value={[{ name: 'old.png', preview: 'blob:old' }]}
      />,
    );

    dropFile(new File(['new'], 'new.png', { type: 'image/png' }));

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ name: 'new.png' }),
    ]);
  });
});

describe('UploadDropzone file-count and size limits', () => {
  it('passes the default 10MB size limit to react-dropzone', () => {
    renderWithLocale(<UploadDropzone value={[]} onChange={vi.fn()} />);

    expect(dropzoneOptions.maxSize).toBe(10 * 1024 * 1024);
  });

  // `isDropzoneDisabled = Boolean(disabled) || value.length >= maxFiles`
  // (upload-dropzone.tsx) — the dropzone disables itself once the file count
  // reaches maxFiles, in addition to honouring an explicit `disabled` prop.
  it('honours an explicit disabled prop from the caller regardless of file count', () => {
    renderWithLocale(<UploadDropzone value={[]} onChange={vi.fn()} disabled />);

    expect(dropzoneOptions.disabled).toBe(true);
  });

  it('disables itself once the file count reaches maxFiles, even without an explicit disabled prop', () => {
    const tenFiles = Array.from({ length: 10 }, (_, i) => ({ name: `file-${i}.png`, preview: `blob:${i}` }));
    renderWithLocale(<UploadDropzone value={tenFiles} onChange={vi.fn()} />);

    expect(dropzoneOptions.disabled).toBe(true);
  });

  it('is not disabled while the file count is still below maxFiles', () => {
    renderWithLocale(<UploadDropzone value={[]} onChange={vi.fn()} />);

    expect(dropzoneOptions.disabled).toBe(false);
  });

  it('respects a custom maxFiles/maxSizeBytes override', () => {
    renderWithLocale(<UploadDropzone value={[]} onChange={vi.fn()} maxFiles={3} maxSizeBytes={2 * 1024 * 1024} />);

    expect(dropzoneOptions.maxSize).toBe(2 * 1024 * 1024);
  });

  it('shows a toast and does not add the file when react-dropzone rejects it as too large', () => {
    const onChange = vi.fn();
    renderWithLocale(<UploadDropzone value={[]} onChange={onChange} errorTooLargeText="File too large" />);

    act(() => {
      (dropzoneOptions.onDrop as (accepted: File[], rejected: unknown[]) => void)([], [
        { file: new File(['x'], 'huge.png'), errors: [{ code: 'file-too-large', message: 'too large' }] },
      ]);
    });

    expect(toast.error).toHaveBeenCalledWith('File too large');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows a toast and does not add the file when react-dropzone rejects it for an invalid type', () => {
    const onChange = vi.fn();
    renderWithLocale(<UploadDropzone value={[]} onChange={onChange} errorInvalidTypeText="Invalid file type" />);

    act(() => {
      (dropzoneOptions.onDrop as (accepted: File[], rejected: unknown[]) => void)([], [
        { file: new File(['x'], 'file.exe'), errors: [{ code: 'file-invalid-type', message: 'invalid type' }] },
      ]);
    });

    expect(toast.error).toHaveBeenCalledWith('Invalid file type');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('truncates accepted files to maxFiles even if more than maxFiles are dropped at once', () => {
    const onChange = vi.fn();
    renderWithLocale(<UploadDropzone value={[]} onChange={onChange} maxFiles={2} />);

    const files = [
      new File(['a'], 'a.png', { type: 'image/png' }),
      new File(['b'], 'b.png', { type: 'image/png' }),
      new File(['c'], 'c.png', { type: 'image/png' }),
    ];
    act(() => {
      (dropzoneOptions.onDrop as (accepted: File[], rejected: unknown[]) => void)(files, []);
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    const [savedFiles] = onChange.mock.calls[0];
    expect(savedFiles).toHaveLength(2);
  });

  it('appends newly dropped files after existing ones so the most recent upload is last in the list', () => {
    const onChange = vi.fn();
    renderWithLocale(
      <UploadDropzone
        value={[{ name: 'old.png', preview: 'blob:old' }]}
        onChange={onChange}
      />,
    );

    const file = new File(['new'], 'new.png', { type: 'image/png' });
    dropFile(file);

    expect(onChange).toHaveBeenCalledTimes(1);
    const [savedFiles] = onChange.mock.calls[0];
    expect(savedFiles.map((f: { name: string }) => f.name)).toEqual(['old.png', 'new.png']);
  });

  it('removes a single file by its X icon without affecting the others', () => {
    const onChange = vi.fn();
    renderWithLocale(
      <UploadDropzone
        value={[
          { name: 'keep.png', preview: 'blob:keep' },
          { name: 'remove.png', preview: 'blob:remove' },
        ]}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Remove remove.png' }));

    expect(onChange).toHaveBeenCalledWith([{ name: 'keep.png', preview: 'blob:keep' }]);
  });
});
