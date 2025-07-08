// blogMediaStep/imageUpload/utils/duplicateFileUtils.ts

import { type DuplicateFileResult } from '../types/imageUploadTypes';

export const checkDuplicateFile = (
  newFile: File,
  existingFileNames: string[]
): boolean => {
  const isDuplicate = existingFileNames.includes(newFile.name);

  console.log('🔍 [DUPLICATE_CHECK] 중복 파일 체크:', {
    fileName: newFile.name,
    fileSize: newFile.size,
    isDuplicate,
    existingFileNames,
    timestamp: new Date().toLocaleTimeString(),
  });

  return isDuplicate;
};

export const filterDuplicateFiles = (
  files: File[],
  existingFileNames: string[]
): DuplicateFileResult => {
  const uniqueFiles: File[] = [];
  const duplicateFiles: File[] = [];

  files.forEach((file) => {
    const isDuplicate = checkDuplicateFile(file, existingFileNames);

    const targetArray = isDuplicate ? duplicateFiles : uniqueFiles;
    targetArray.push(file);
  });

  console.log('🔄 [FILTER_DUPLICATES] 중복 파일 필터링 결과:', {
    totalFiles: files.length,
    uniqueFilesCount: uniqueFiles.length,
    duplicateFilesCount: duplicateFiles.length,
    uniqueFileNames: uniqueFiles.map((f) => f.name),
    duplicateFileNames: duplicateFiles.map((f) => f.name),
    timestamp: new Date().toLocaleTimeString(),
  });

  return { uniqueFiles, duplicateFiles };
};
