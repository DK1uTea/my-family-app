import { beforeEach, describe, expect, it, vi } from 'vitest';

import { downloadFilesAsZip } from '@/lib/download-file';

const zipMocks = vi.hoisted(() => ({
  entries: [] as Array<{ name: string; input: Response }>,
  downloadZip: vi.fn(),
}));

vi.mock('client-zip', () => ({
  downloadZip: zipMocks.downloadZip,
}));

describe('downloadFilesAsZip', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    zipMocks.entries = [];
    zipMocks.downloadZip.mockImplementation((inputs: AsyncIterable<{ name: string; input: Response }>) => ({
      blob: async () => {
        for await (const entry of inputs) zipMocks.entries.push(entry);
        return new Blob(['zip']);
      },
    }));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('file')));
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn().mockReturnValue('blob:zip'),
      revokeObjectURL: vi.fn(),
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  });

  it('fetches every file and downloads them in one zip', async () => {
    await downloadFilesAsZip(
      [
        { url: 'https://cdn.test/first.pdf', fileName: 'first.pdf' },
        { url: 'https://cdn.test/second.pdf', fileName: 'second.pdf' },
      ],
      'proof-task-1.zip',
    );

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(zipMocks.entries.map(({ name }) => name)).toEqual(['first.pdf', 'second.pdf']);
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:zip');
  });

  it('makes duplicate filenames unique', async () => {
    await downloadFilesAsZip(
      [
        { url: 'https://cdn.test/one/proof.pdf', fileName: 'proof.pdf' },
        { url: 'https://cdn.test/two/proof.pdf', fileName: 'proof.pdf' },
      ],
      'proofs.zip',
    );

    expect(zipMocks.entries.map(({ name }) => name)).toEqual(['proof.pdf', 'proof-1.pdf']);
  });

  it('rejects the download when a file request fails', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 403 }));

    await expect(downloadFilesAsZip(
      [{ url: 'https://cdn.test/blocked.pdf', fileName: 'blocked.pdf' }],
      'proofs.zip',
    )).rejects.toThrow('Download failed');

    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
});
