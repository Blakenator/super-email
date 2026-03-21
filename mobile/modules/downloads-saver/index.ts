import DownloadsSaverModule from './src/DownloadsSaverModule';

export async function saveToDownloads(
  sourceUri: string,
  filename: string,
  mimeType: string,
): Promise<string> {
  return DownloadsSaverModule.saveToDownloads(sourceUri, filename, mimeType);
}
