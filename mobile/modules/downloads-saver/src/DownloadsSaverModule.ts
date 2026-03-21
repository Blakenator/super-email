import { requireNativeModule } from 'expo';

interface DownloadsSaverModuleType {
  saveToDownloads(sourceUri: string, filename: string, mimeType: string): Promise<string>;
}

export default requireNativeModule<DownloadsSaverModuleType>('DownloadsSaver');
