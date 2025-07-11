// 📁 imageUpload/utils/duplicateFileUtils.ts

import { createLogger } from './loggerUtils';
import type { DuplicateFileResult } from '../types/imageUploadTypes';

const logger = createLogger('DUPLICATE_UTILS');

interface DuplicateCheckResult {
  isDuplicate: boolean;
  fileName: string;
  fileSize: number;
}

// 🔧 매우 단순한 타입 체크 함수들로 변경
function validateSingleFile(file: File): boolean {
  try {
    const hasName =
      file &&
      file.name &&
      typeof file.name === 'string' &&
      file.name.length > 0;
    const hasSize = file && typeof file.size === 'number' && file.size >= 0;
    return Boolean(hasName && hasSize);
  } catch {
    return false;
  }
}

function validateFileArray(files: File[]): boolean {
  try {
    return Array.isArray(files) && files.length >= 0;
  } catch {
    return false;
  }
}

function validateStringArray(strings: string[]): boolean {
  try {
    if (!Array.isArray(strings)) return false;
    return strings.every((str) => typeof str === 'string' && str.length > 0);
  } catch {
    return false;
  }
}

export const checkDuplicateFile = (
  newFile: File,
  existingFileNames: string[]
): boolean => {
  // 🔧 즉시 타입 검증 후 처리
  if (!validateSingleFile(newFile)) {
    logger.error('유효하지 않은 파일 입력', {
      hasFile: Boolean(newFile),
      fileType: typeof newFile,
    });
    return false;
  }

  if (!validateStringArray(existingFileNames)) {
    logger.error('유효하지 않은 파일명 배열', {
      hasArray: Boolean(existingFileNames),
      arrayType: typeof existingFileNames,
      arrayLength: Array.isArray(existingFileNames)
        ? existingFileNames.length
        : 0,
    });
    return false;
  }

  // 🔧 검증 통과 후 안전하게 접근
  const fileName = newFile.name;
  const fileSize = newFile.size;
  const isDuplicate = existingFileNames.includes(fileName);
  const duplicateStatus = isDuplicate ? 'duplicate-found' : 'unique-file';

  const checkResult: DuplicateCheckResult = {
    isDuplicate,
    fileName,
    fileSize,
  };

  logger.debug('중복 파일 체크', {
    fileName: checkResult.fileName,
    fileSize: checkResult.fileSize,
    isDuplicate: checkResult.isDuplicate,
    duplicateStatus,
    existingFileNamesCount: existingFileNames.length,
    timestamp: new Date().toLocaleTimeString(),
  });

  return checkResult.isDuplicate;
};

export const filterDuplicateFiles = (
  files: File[],
  existingFileNames: string[]
): DuplicateFileResult => {
  // 🔧 즉시 타입 검증 후 처리
  if (!validateFileArray(files)) {
    logger.error('유효하지 않은 파일 배열', {
      hasFiles: Boolean(files),
      filesType: typeof files,
      isArray: Array.isArray(files),
    });

    const emptyResult: DuplicateFileResult = {
      uniqueFiles: [],
      duplicateFiles: [],
    };
    return emptyResult;
  }

  if (!validateStringArray(existingFileNames)) {
    logger.error('유효하지 않은 기존 파일명 배열', {
      hasFileNames: Boolean(existingFileNames),
      arrayType: typeof existingFileNames,
      isArray: Array.isArray(existingFileNames),
    });

    const fallbackResult: DuplicateFileResult = {
      uniqueFiles: files.slice(),
      duplicateFiles: [],
    };
    return fallbackResult;
  }

  // 🔧 검증 통과 후 안전하게 배열 접근
  const uniqueFiles: File[] = [];
  const duplicateFiles: File[] = [];

  const totalFilesCount = files.length;
  const existingFileNamesCount = existingFileNames.length;

  logger.debug('중복 파일 필터링 시작', {
    totalFilesCount,
    existingFileNamesCount,
    timestamp: new Date().toLocaleTimeString(),
  });

  // 🔧 전통적인 for 루프로 안전하게 처리
  const filesLength = files.length;
  for (let fileIndex = 0; fileIndex < filesLength; fileIndex++) {
    const currentFile = files[fileIndex];

    if (!validateSingleFile(currentFile)) {
      logger.warn('유효하지 않은 파일 건너뜀', {
        fileIndex,
        hasFile: Boolean(currentFile),
        fileType: typeof currentFile,
      });
      continue;
    }

    const isDuplicate = checkDuplicateFile(currentFile, existingFileNames);
    const fileCategory = isDuplicate ? 'duplicate' : 'unique';

    if (isDuplicate) {
      duplicateFiles.push(currentFile);
    } else {
      uniqueFiles.push(currentFile);
    }

    logger.debug('파일 분류 완료', {
      fileIndex,
      fileName: currentFile.name,
      fileCategory,
      currentUniqueCount: uniqueFiles.length,
      currentDuplicateCount: duplicateFiles.length,
    });
  }

  // 🔧 최종 결과 생성
  const finalResult: DuplicateFileResult = {
    uniqueFiles,
    duplicateFiles,
  };

  const uniqueFilesCount = uniqueFiles.length;
  const duplicateFilesCount = duplicateFiles.length;
  const filteringEfficiency =
    totalFilesCount > 0
      ? Math.round((uniqueFilesCount / totalFilesCount) * 100)
      : 0;

  const uniqueFileNames = uniqueFiles.map((file) => file.name);
  const duplicateFileNames = duplicateFiles.map((file) => file.name);

  logger.info('중복 파일 필터링 결과', {
    totalFiles: totalFilesCount,
    uniqueFilesCount,
    duplicateFilesCount,
    uniqueFileNames,
    duplicateFileNames,
    filteringEfficiency,
    timestamp: new Date().toLocaleTimeString(),
  });

  return finalResult;
};

export const getDuplicateFileCount = (
  files: File[],
  existingFileNames: string[]
): number => {
  // 🔧 즉시 타입 검증 후 처리
  if (!validateFileArray(files)) {
    logger.debug('유효하지 않은 파일 배열로 중복 개수 조회', {
      hasFiles: Boolean(files),
      filesType: typeof files,
      isArray: Array.isArray(files),
    });
    return 0;
  }

  const filesLength = files.length;
  if (filesLength === 0) {
    logger.debug('빈 파일 배열로 중복 개수 조회', {
      filesLength: 0,
    });
    return 0;
  }

  const filterResult = filterDuplicateFiles(files, existingFileNames);
  const duplicateCount = filterResult.duplicateFiles.length;
  const totalFilesCount = filesLength;

  logger.debug('중복 파일 개수 조회 완료', {
    totalFiles: totalFilesCount,
    duplicateCount,
    duplicatePercentage: Math.round((duplicateCount / totalFilesCount) * 100),
  });

  return duplicateCount;
};

export const getUniqueFileNames = (files: File[]): string[] => {
  // 🔧 즉시 타입 검증 후 처리
  if (!validateFileArray(files)) {
    logger.debug('유효하지 않은 파일 배열로 고유 파일명 조회', {
      hasFiles: Boolean(files),
      filesType: typeof files,
      isArray: Array.isArray(files),
    });
    return [];
  }

  const filesLength = files.length;
  if (filesLength === 0) {
    logger.debug('빈 파일 배열로 고유 파일명 조회', {
      filesLength: 0,
    });
    return [];
  }

  // 🔧 안전한 필터링과 매핑
  const validFiles: File[] = [];

  for (let i = 0; i < filesLength; i++) {
    const currentFile = files[i];
    if (validateSingleFile(currentFile)) {
      validFiles.push(currentFile);
    }
  }

  const allFileNames = validFiles.map((file) => file.name);
  const uniqueFileNames: string[] = [];

  const allFileNamesLength = allFileNames.length;
  for (let i = 0; i < allFileNamesLength; i++) {
    const fileName = allFileNames[i];
    if (uniqueFileNames.indexOf(fileName) === -1) {
      uniqueFileNames.push(fileName);
    }
  }

  const totalFilesCount = filesLength;
  const validFilesCount = validFiles.length;
  const uniqueFileNamesCount = uniqueFileNames.length;

  logger.debug('고유 파일명 추출 완료', {
    totalFiles: totalFilesCount,
    validFilesCount,
    uniqueFileNamesCount,
    uniqueFileNames,
  });

  return uniqueFileNames;
};
