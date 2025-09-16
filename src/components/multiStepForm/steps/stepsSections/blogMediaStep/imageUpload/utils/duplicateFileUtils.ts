// 📁 imageUpload/utils/duplicateFileUtils.ts

import { createLogger } from './loggerUtils';
import type { DuplicateFileResult } from '../types/imageUploadTypes';

const logger = createLogger('DUPLICATE_UTILS');

// 🔑 파일 식별자 인터페이스 (파일명 + 크기 + 수정일 조합)
interface FileIdentifier {
  readonly name: string;
  readonly size: number;
  readonly lastModified: number;
  readonly type: string;
}

// 🔑 파일 해시 캐시 (성능 최적화용)
interface FileHashCache {
  readonly [key: string]: string;
}

// 🔑 전역 해시 캐시 (메모리 효율성)
const globalFileHashCache: FileHashCache = {};

function validateSingleFile(file: File): boolean {
  try {
    const hasName =
      file?.name && typeof file.name === 'string' && file.name.length > 0;
    const hasSize = file && typeof file.size === 'number' && file.size >= 0;
    const hasLastModified =
      file && typeof file.lastModified === 'number' && file.lastModified > 0;
    const hasType = file && typeof file.type === 'string';

    return Boolean(hasName && hasSize && hasLastModified && hasType);
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
    return (
      Array.isArray(strings) &&
      strings.every((str) => typeof str === 'string' && str.length > 0)
    );
  } catch {
    return false;
  }
}

// 🔑 파일 고유 식별자 생성 (파일명 + 크기 + 수정일 + 타입)
const createFileIdentifier = (file: File): FileIdentifier => {
  const { name, size, lastModified, type } = file;

  return {
    name: name || 'unknown',
    size: size || 0,
    lastModified: lastModified || 0,
    type: type || 'unknown',
  };
};

// 🔑 파일 식별자를 문자열 키로 변환
const fileIdentifierToKey = (identifier: FileIdentifier): string => {
  const { name, size, lastModified, type } = identifier;
  return `${name}|${size}|${lastModified}|${type}`;
};

// 🔑 파일 객체를 고유 키로 변환 (빠른 중복 체크용)
const createFileKey = (file: File): string => {
  const identifier = createFileIdentifier(file);
  return fileIdentifierToKey(identifier);
};

// 🔑 파일 내용 해시 생성 (심화 중복 체크용)
const createFileContentHash = async (file: File): Promise<string> => {
  const fileKey = createFileKey(file);

  // 캐시된 해시가 있으면 반환
  const cachedHash = Reflect.get(globalFileHashCache, fileKey);
  if (typeof cachedHash === 'string' && cachedHash.length > 0) {
    console.log('📋 [HASH_CACHE] 캐시된 해시 사용:', {
      파일명: file.name,
      캐시된해시: cachedHash.slice(0, 8) + '...',
    });
    return cachedHash;
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');

    // 캐시에 저장
    const mutableCache = globalFileHashCache;
    Reflect.set(mutableCache, fileKey, hashHex);

    console.log('🔐 [HASH_GENERATE] 새 파일 해시 생성:', {
      파일명: file.name,
      파일크기: file.size,
      생성된해시: hashHex.slice(0, 8) + '...',
    });

    return hashHex;
  } catch (hashError) {
    logger.error('파일 해시 생성 실패', {
      fileName: file.name,
      error: hashError,
    });

    // 해시 생성 실패 시 fallback 키 반환
    return `fallback-${fileKey}`;
  }
};

// 🔑 기본 중복 체크 (파일 식별자 기반)
const checkBasicDuplicate = (
  targetFile: File,
  existingFileNames: string[],
  processingFileNames: string[]
): boolean => {
  const { name: targetFileName } = targetFile;

  // 1차: 파일명 기반 중복 체크
  const isDuplicateInExisting = existingFileNames.includes(targetFileName);
  const isDuplicateInProcessing = processingFileNames.includes(targetFileName);

  const hasBasicDuplicate = isDuplicateInExisting || isDuplicateInProcessing;

  console.log('🔍 [BASIC_CHECK] 기본 중복 체크:', {
    파일명: targetFileName,
    기존파일중복: isDuplicateInExisting,
    처리중파일중복: isDuplicateInProcessing,
    기본중복여부: hasBasicDuplicate,
  });

  return hasBasicDuplicate;
};

// 🔑 고급 중복 체크 (파일 객체 비교)
const checkAdvancedDuplicate = (
  targetFile: File,
  comparisonFiles: File[]
): boolean => {
  if (comparisonFiles.length === 0) {
    return false;
  }

  const targetIdentifier = createFileIdentifier(targetFile);
  const targetKey = fileIdentifierToKey(targetIdentifier);

  for (let fileIndex = 0; fileIndex < comparisonFiles.length; fileIndex++) {
    const comparisonFile = comparisonFiles[fileIndex];

    if (!validateSingleFile(comparisonFile)) {
      continue;
    }

    const comparisonIdentifier = createFileIdentifier(comparisonFile);
    const comparisonKey = fileIdentifierToKey(comparisonIdentifier);

    const isIdenticalFile = targetKey === comparisonKey;

    if (isIdenticalFile) {
      console.log('🔍 [ADVANCED_CHECK] 고급 중복 발견:', {
        타겟파일: targetIdentifier.name,
        비교파일: comparisonIdentifier.name,
        타겟키: targetKey,
        비교키: comparisonKey,
        동일파일: true,
      });
      return true;
    }
  }

  console.log('🔍 [ADVANCED_CHECK] 고급 중복 없음:', {
    타겟파일: targetIdentifier.name,
    비교파일개수: comparisonFiles.length,
    타겟키: targetKey,
  });

  return false;
};

// 🔑 파일 배치 내 중복 체크
const checkBatchDuplicates = (files: File[]): File[] => {
  if (files.length <= 1) {
    return files;
  }

  const uniqueFiles: File[] = [];
  const seenKeys = new Set<string>();

  for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
    const currentFile = files[fileIndex];

    if (!validateSingleFile(currentFile)) {
      logger.warn('배치 내 유효하지 않은 파일 건너뜀', {
        fileIndex,
        fileName: currentFile?.name || 'unknown',
      });
      continue;
    }

    const fileKey = createFileKey(currentFile);
    const isAlreadySeen = seenKeys.has(fileKey);

    if (isAlreadySeen) {
      console.log('🚫 [BATCH_CHECK] 배치 내 중복 파일 제외:', {
        파일명: currentFile.name,
        파일키: fileKey,
        인덱스: fileIndex,
      });
    } else {
      seenKeys.add(fileKey);
      uniqueFiles.push(currentFile);
      console.log('✅ [BATCH_CHECK] 배치 내 고유 파일 추가:', {
        파일명: currentFile.name,
        파일키: fileKey,
        인덱스: fileIndex,
      });
    }
  }

  console.log('📊 [BATCH_CHECK] 배치 내 중복 제거 완료:', {
    원본파일개수: files.length,
    고유파일개수: uniqueFiles.length,
    제거된중복개수: files.length - uniqueFiles.length,
  });

  return uniqueFiles;
};

// 🎯 핵심: 강화된 중복 파일 필터링 (다단계 검증)
export const filterDuplicateFilesWithProcessing = (
  files: File[],
  existingFileNames: string[],
  processingFileNames: string[] = []
): DuplicateFileResult => {
  if (!validateFileArray(files)) {
    logger.error('유효하지 않은 파일 배열', { hasFiles: Boolean(files) });
    return { uniqueFiles: [], duplicateFiles: [] };
  }

  if (!validateStringArray(existingFileNames)) {
    logger.error('유효하지 않은 기존 파일명 배열');
    return { uniqueFiles: files.slice(), duplicateFiles: [] };
  }

  if (
    !validateStringArray(processingFileNames) &&
    processingFileNames.length > 0
  ) {
    logger.warn('유효하지 않은 처리 중 파일명 배열 - 무시하고 진행');
  }

  const safeProcessingFileNames = validateStringArray(processingFileNames)
    ? processingFileNames
    : [];

  console.log('🔧 [ENHANCED_DUPLICATE] 강화된 중복 체크 시작:', {
    입력파일개수: files.length,
    기존파일개수: existingFileNames.length,
    처리중파일개수: safeProcessingFileNames.length,
    enhancedDuplicateCheck: true,
    timestamp: new Date().toLocaleTimeString(),
  });

  // 1단계: 배치 내 중복 제거 (파일 객체 기반)
  const batchUniqueFiles = checkBatchDuplicates(files);

  console.log('📋 [ENHANCED_DUPLICATE] 1단계 배치 중복 제거:', {
    처리전파일개수: files.length,
    처리후파일개수: batchUniqueFiles.length,
    배치내중복제거개수: files.length - batchUniqueFiles.length,
  });

  // 2단계: 기존 파일과의 중복 체크 (파일명 기반)
  const uniqueFiles: File[] = [];
  const duplicateFiles: File[] = [];

  for (let fileIndex = 0; fileIndex < batchUniqueFiles.length; fileIndex++) {
    const currentFile = batchUniqueFiles[fileIndex];

    if (!validateSingleFile(currentFile)) {
      logger.warn('유효하지 않은 파일 건너뜀', {
        fileIndex,
        fileName: currentFile?.name || 'unknown',
      });
      continue;
    }

    // 2-1: 기본 중복 체크 (파일명 기반)
    const hasBasicDuplicate = checkBasicDuplicate(
      currentFile,
      existingFileNames,
      safeProcessingFileNames
    );

    if (hasBasicDuplicate) {
      duplicateFiles.push(currentFile);
      console.log('🚫 [ENHANCED_DUPLICATE] 2단계 기본 중복 발견:', {
        파일명: currentFile.name,
        중복타입: '파일명기반',
      });
      continue;
    }

    // 2-2: 통과된 파일은 고유 파일로 분류
    uniqueFiles.push(currentFile);
    console.log('✅ [ENHANCED_DUPLICATE] 2단계 고유 파일 확인:', {
      파일명: currentFile.name,
      파일크기: currentFile.size,
      파일타입: currentFile.type,
    });
  }

  const finalResult: DuplicateFileResult = { uniqueFiles, duplicateFiles };

  logger.info('강화된 중복 파일 필터링 완료', {
    전체입력파일: files.length,
    배치내고유파일: batchUniqueFiles.length,
    최종고유파일: uniqueFiles.length,
    최종중복파일: duplicateFiles.length,
    고유파일명들: uniqueFiles.map((file) => file.name),
    중복파일명들: duplicateFiles.map((file) => file.name),
    enhancedProcessing: true,
    multiStageValidation: true,
    timestamp: new Date().toLocaleTimeString(),
  });

  return finalResult;
};

// 🔑 심화 중복 체크 (파일 내용 해시 기반) - 옵션
export const filterDuplicateFilesWithContentHash = async (
  files: File[],
  existingFiles: File[] = []
): Promise<DuplicateFileResult> => {
  if (!validateFileArray(files)) {
    logger.error('유효하지 않은 파일 배열');
    return { uniqueFiles: [], duplicateFiles: [] };
  }

  console.log('🔐 [CONTENT_HASH] 내용 해시 기반 중복 체크 시작:', {
    입력파일개수: files.length,
    기존파일개수: existingFiles.length,
    contentHashCheck: true,
  });

  const uniqueFiles: File[] = [];
  const duplicateFiles: File[] = [];
  const processedHashes = new Set<string>();

  // 기존 파일들의 해시 생성
  const existingHashes = new Set<string>();
  for (const existingFile of existingFiles) {
    if (validateSingleFile(existingFile)) {
      try {
        const existingHash = await createFileContentHash(existingFile);
        existingHashes.add(existingHash);
      } catch (hashError) {
        logger.warn('기존 파일 해시 생성 실패', {
          fileName: existingFile.name,
          error: hashError,
        });
      }
    }
  }

  // 새 파일들 처리
  for (const currentFile of files) {
    if (!validateSingleFile(currentFile)) {
      continue;
    }

    try {
      const currentHash = await createFileContentHash(currentFile);

      // 기존 파일과 중복 체크
      const isDuplicateWithExisting = existingHashes.has(currentHash);

      // 현재 배치 내 중복 체크
      const isDuplicateInBatch = processedHashes.has(currentHash);

      const isDuplicate = isDuplicateWithExisting || isDuplicateInBatch;

      if (isDuplicate) {
        duplicateFiles.push(currentFile);
        console.log('🚫 [CONTENT_HASH] 내용 기반 중복 발견:', {
          파일명: currentFile.name,
          해시: currentHash.slice(0, 8) + '...',
          기존파일중복: isDuplicateWithExisting,
          배치내중복: isDuplicateInBatch,
        });
      } else {
        uniqueFiles.push(currentFile);
        processedHashes.add(currentHash);
        console.log('✅ [CONTENT_HASH] 내용 기반 고유 파일:', {
          파일명: currentFile.name,
          해시: currentHash.slice(0, 8) + '...',
        });
      }
    } catch (hashError) {
      logger.error('파일 해시 처리 실패', {
        fileName: currentFile.name,
        error: hashError,
      });

      // 해시 실패 시 고유 파일로 처리 (안전한 방향)
      uniqueFiles.push(currentFile);
    }
  }

  console.log('🔐 [CONTENT_HASH] 내용 해시 기반 중복 체크 완료:', {
    고유파일개수: uniqueFiles.length,
    중복파일개수: duplicateFiles.length,
    처리된해시개수: processedHashes.size,
  });

  return { uniqueFiles, duplicateFiles };
};

// 🔧 기존 함수 유지 (하위 호환성)
export const checkDuplicateFile = (
  newFile: File,
  existingFileNames: string[]
): boolean => {
  if (!validateSingleFile(newFile)) {
    logger.error('유효하지 않은 파일 입력');
    return false;
  }

  if (!validateStringArray(existingFileNames)) {
    logger.error('유효하지 않은 파일명 배열');
    return false;
  }

  const { name: fileName } = newFile;
  const isDuplicate = existingFileNames.includes(fileName);

  logger.debug('중복 파일 체크', {
    fileName,
    isDuplicate,
    existingFileNamesCount: existingFileNames.length,
  });

  return isDuplicate;
};

export const filterDuplicateFiles = (
  files: File[],
  existingFileNames: string[]
): DuplicateFileResult => {
  return filterDuplicateFilesWithProcessing(files, existingFileNames, []);
};

export const getDuplicateFileCount = (
  files: File[],
  existingFileNames: string[]
): number => {
  if (!validateFileArray(files)) {
    return 0;
  }

  const filterResult = filterDuplicateFiles(files, existingFileNames);
  return filterResult.duplicateFiles.length;
};

export const getUniqueFileNames = (files: File[]): string[] => {
  if (!validateFileArray(files) || files.length === 0) {
    return [];
  }

  const validFiles = files.filter(validateSingleFile);
  const allFileNames = validFiles.map((file) => file.name);
  const uniqueFileNames: string[] = [];

  for (let i = 0; i < allFileNames.length; i++) {
    const fileName = allFileNames[i];
    if (!uniqueFileNames.includes(fileName)) {
      uniqueFileNames.push(fileName);
    }
  }

  return uniqueFileNames;
};

// 🔑 추가 유틸리티: 파일 키 생성 (외부 사용용)
export const createFileUniqueKey = (file: File): string => {
  if (!validateSingleFile(file)) {
    return 'invalid-file';
  }

  return createFileKey(file);
};

// 🔑 추가 유틸리티: 해시 캐시 관리
export const clearFileHashCache = (): void => {
  const mutableCache = globalFileHashCache;
  const cacheKeys = Object.keys(mutableCache);

  cacheKeys.forEach((key) => {
    Reflect.deleteProperty(mutableCache, key);
  });

  console.log('🗑️ [CACHE_CLEAR] 파일 해시 캐시 초기화:', {
    정리된키개수: cacheKeys.length,
    timestamp: new Date().toLocaleTimeString(),
  });
};

export const getFileHashCacheSize = (): number => {
  return Object.keys(globalFileHashCache).length;
};
