// blogMediaStep/imageUpload/utils/fileIdUtils.ts

let globalFileIdCounter = 0;

export const generateSecureFileId = (fileNameForId: string): string => {
  const currentTimestamp = Date.now();
  const incrementedCounter = ++globalFileIdCounter;
  const randomIdentifier = Math.random().toString(36).substring(2, 9);
  const fileNameHash = fileNameForId.slice(0, 5).replace(/[^a-zA-Z0-9]/g, '');

  const secureFileId = `file-${currentTimestamp}-${incrementedCounter}-${randomIdentifier}-${fileNameHash}`;

  console.log('🆔 [FILE_ID] 안전한 파일 ID 생성:', {
    fileNameForId: fileNameForId.slice(0, 20) + '...',
    secureFileId,
    counter: incrementedCounter,
    timestamp: new Date().toLocaleTimeString(),
  });

  return secureFileId;
};
