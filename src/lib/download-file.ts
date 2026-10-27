import { downloadZip } from 'client-zip';

export type DownloadableFile = {
  url: string;
  fileName: string;
};

export async function downloadFile(url: string, fileName: string): Promise<void> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Download failed');
    const objectUrl = URL.createObjectURL(await response.blob());
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

function uniqueFileName(fileName: string, usedNames: Set<string>): string {
  if (!usedNames.has(fileName)) return fileName;

  const extensionIndex = fileName.lastIndexOf('.');
  const baseName = extensionIndex > 0 ? fileName.slice(0, extensionIndex) : fileName;
  const extension = extensionIndex > 0 ? fileName.slice(extensionIndex) : '';
  let suffix = 1;
  let candidate = `${baseName}-${suffix}${extension}`;

  while (usedNames.has(candidate)) {
    suffix += 1;
    candidate = `${baseName}-${suffix}${extension}`;
  }

  return candidate;
}

async function* fetchFiles(files: DownloadableFile[]) {
  const usedNames = new Set<string>();

  for (const file of files) {
    const response = await fetch(file.url);
    if (!response.ok) throw new Error('Download failed');

    const name = uniqueFileName(file.fileName, usedNames);
    usedNames.add(name);
    yield { name, input: response };
  }
}

export async function downloadFilesAsZip(files: DownloadableFile[], zipName: string): Promise<void> {
  const blob = await downloadZip(fetchFiles(files)).blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');

  try {
    link.href = objectUrl;
    link.download = zipName;
    document.body.appendChild(link);
    link.click();
  } finally {
    link.remove();
    URL.revokeObjectURL(objectUrl);
  }
}
