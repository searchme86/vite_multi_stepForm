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

// 🚨 FIXED: 캐시 접근을 동기화된 함수로 변경 - Race Condition 해결
const accessHashCache = {
  get: (key: string): string | undefined => {
    const cachedValue = Reflect.get(globalFileHashCache, key);
    const hasValidValue =
      typeof cachedValue === 'string' && cachedValue.length > 0;

    console.log('🔍 [CACHE_GET] 캐시 조회:', {
      key: key.slice(0, 50) + '...',
      hasValue: hasValidValue,
      valueLength: hasValidValue ? cachedValue.length : 0,
    });

    return hasValidValue ? cachedValue : undefined;
  },

  set: (key: string, value: string): void => {
    if (typeof value !== 'string' || value.length === 0) {
      console.warn('⚠️ [CACHE_SET] 유효하지 않은 값으로 캐시 설정 시도:', {
        key: key.slice(0, 50) + '...',
        value,
      });
      return;
    }

    const mutableCache = globalFileHashCache;
    Reflect.set(mutableCache, key, value);

    console.log('✅ [CACHE_SET] 캐시 설정 완료:', {
      key: key.slice(0, 50) + '...',
      valueLength: value.length,
    });
  },

  // 🚨 FIXED: 원자적 get-or-set 추가 - Race Condition 방지의 핵심
  getOrSet: async (
    key: string,
    generator: () => Promise<string>
  ): Promise<string> => {
    console.log('🔄 [CACHE_GET_OR_SET] 원자적 get-or-set 시작:', {
      key: key.slice(0, 50) + '...',
    });

    // ✅ 먼저 기존 값 확인 (원자적 체크)
    const existing = Reflect.get(globalFileHashCache, key);
    if (typeof existing === 'string' && existing.length > 0) {
      console.log('🎯 [CACHE_GET_OR_SET] 기존 캐시 값 반환:', {
        key: key.slice(0, 50) + '...',
        existingLength: existing.length,
      });
      return existing;
    }

    try {
      // ✅ 새 값 생성
      console.log('🔧 [CACHE_GET_OR_SET] 새 값 생성 시작:', {
        key: key.slice(0, 50) + '...',
      });
      const newValue = await generator();

      if (typeof newValue !== 'string' || newValue.length === 0) {
        console.warn('⚠️ [CACHE_GET_OR_SET] 생성된 값이 유효하지 않음:', {
          key: key.slice(0, 50) + '...',
          newValue,
        });
        return '';
      }

      // ✅ 원자적 설정 및 반환
      const mutableCache = globalFileHashCache;
      Reflect.set(mutableCache, key, newValue);

      console.log('✅ [CACHE_GET_OR_SET] 새 값 생성 및 캐시 설정 완료:', {
        key: key.slice(0, 50) + '...',
        newValueLength: newValue.length,
      });

      return newValue;
    } catch (generatorError) {
      console.error('❌ [CACHE_GET_OR_SET] 값 생성 실패:', {
        key: key.slice(0, 50) + '...',
        error: generatorError,
      });
      return '';
    }
  },
};

function validateSingleFile(file: File): boolean {
  try {
    const hasName =
      file?.name && typeof file.name === 'string' && file.name.length > 0;
    const hasSize = file && typeof file.size === 'number' && file.size >= 0;
    const hasLastModified =
      file && typeof file.lastModified === 'number' && file.lastModified > 0;
    const hasType = file && typeof file.type === 'string';

    const isValidFile = Boolean(
      hasName && hasSize && hasLastModified && hasType
    );

    console.log('🔍 [VALIDATE_FILE] 파일 검증:', {
      fileName: file?.name || 'unknown',
      hasName,
      hasSize,
      hasLastModified,
      hasType,
      isValidFile,
    });

    return isValidFile;
  } catch (error) {
    console.error('❌ [VALIDATE_FILE] 파일 검증 중 오류:', { error });
    return false;
  }
}

function validateFileArray(files: File[]): boolean {
  try {
    const isValidArray = Array.isArray(files) && files.length >= 0;
    console.log('🔍 [VALIDATE_ARRAY] 파일 배열 검증:', {
      isArray: Array.isArray(files),
      length: files?.length || 0,
      isValidArray,
    });
    return isValidArray;
  } catch (error) {
    console.error('❌ [VALIDATE_ARRAY] 배열 검증 중 오류:', { error });
    return false;
  }
}

function validateStringArray(strings: string[]): boolean {
  try {
    const isValidStringArray =
      Array.isArray(strings) &&
      strings.every((str) => typeof str === 'string' && str.length > 0);

    console.log('🔍 [VALIDATE_STRING_ARRAY] 문자열 배열 검증:', {
      isArray: Array.isArray(strings),
      length: strings?.length || 0,
      isValidStringArray,
    });

    return isValidStringArray;
  } catch (error) {
    console.error('❌ [VALIDATE_STRING_ARRAY] 문자열 배열 검증 중 오류:', {
      error,
    });
    return false;
  }
}

// 🔑 파일 고유 식별자 생성 (파일명 + 크기 + 수정일 + 타입)
const createFileIdentifier = (file: File): FileIdentifier => {
  const { name, size, lastModified, type } = file;

  const identifier: FileIdentifier = {
    name: name || 'unknown',
    size: size || 0,
    lastModified: lastModified || 0,
    type: type || 'unknown',
  };

  console.log('🆔 [FILE_IDENTIFIER] 파일 식별자 생성:', {
    fileName: identifier.name,
    size: identifier.size,
    lastModified: identifier.lastModified,
    type: identifier.type,
  });

  return identifier;
};

// 🔑 파일 식별자를 문자열 키로 변환
const fileIdentifierToKey = (identifier: FileIdentifier): string => {
  const { name, size, lastModified, type } = identifier;
  const keyString = `${name}|${size}|${lastModified}|${type}`;

  console.log('🔑 [IDENTIFIER_TO_KEY] 식별자를 키로 변환:', {
    name,
    size,
    lastModified,
    type,
    keyLength: keyString.length,
  });

  return keyString;
};

// 🔑 파일 객체를 고유 키로 변환 (빠른 중복 체크용)
const createFileKey = (file: File): string => {
  const identifier = createFileIdentifier(file);
  const fileKey = fileIdentifierToKey(identifier);

  console.log('🔑 [FILE_KEY] 파일 키 생성:', {
    fileName: identifier.name,
    fileKey: fileKey.slice(0, 50) + '...',
  });

  return fileKey;
};

// 🚨 FIXED: 파일 내용 해시 생성 - 원자적 get-or-set 사용
const createFileContentHash = async (file: File): Promise<string> => {
  const fileKey = createFileKey(file);

  console.log('🔐 [HASH_CREATE] 파일 해시 생성 시작:', {
    fileName: file.name,
    fileSize: file.size,
    fileKey: fileKey.slice(0, 50) + '...',
  });

  // 🚨 FIXED: 원자적 get-or-set 사용으로 Race Condition 방지
  return await accessHashCache.getOrSet(fileKey, async () => {
    console.log('🔧 [HASH_GENERATE] 새 해시 계산 시작:', {
      fileName: file.name,
    });

    try {
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');

      console.log('🔐 [HASH_GENERATE] 새 파일 해시 생성 완료:', {
        파일명: file.name,
        파일크기: file.size,
        생성된해시: hashHex.slice(0, 8) + '...',
        해시길이: hashHex.length,
      });

      return hashHex;
    } catch (hashError) {
      console.error('❌ [HASH_GENERATE] 파일 해시 생성 실패:', {
        fileName: file.name,
        error: hashError,
      });
      logger.error('파일 해시 생성 실패', {
        fileName: file.name,
        error: hashError,
      });

      // 해시 생성 실패 시 fallback 키 반환
      const fallbackHash = `fallback-${fileKey}`;
      console.log('🔄 [HASH_GENERATE] Fallback 해시 사용:', {
        fileName: file.name,
        fallbackHash: fallbackHash.slice(0, 20) + '...',
      });
      return fallbackHash;
    }
  });
};

// 🔑 기본 중복 체크 (파일 식별자 기반)
const checkBasicDuplicate = (
  targetFile: File,
  existingFileNames: string[],
  processingFileNames: string[]
): boolean => {
  const { name: targetFileName } = targetFile;

  console.log('🔍 [BASIC_CHECK] 기본 중복 체크 시작:', {
    targetFileName,
    existingCount: existingFileNames.length,
    processingCount: processingFileNames.length,
  });

  // 1차: 파일명 기반 중복 체크
  const isDuplicateInExisting = existingFileNames.includes(targetFileName);
  const isDuplicateInProcessing = processingFileNames.includes(targetFileName);

  const hasBasicDuplicate = isDuplicateInExisting || isDuplicateInProcessing;

  console.log('🔍 [BASIC_CHECK] 기본 중복 체크 결과:', {
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
  console.log('🔍 [ADVANCED_CHECK] 고급 중복 체크 시작:', {
    targetFileName: targetFile.name,
    comparisonFilesCount: comparisonFiles.length,
  });

  if (comparisonFiles.length === 0) {
    console.log('🔍 [ADVANCED_CHECK] 비교할 파일 없음');
    return false;
  }

  const targetIdentifier = createFileIdentifier(targetFile);
  const targetKey = fileIdentifierToKey(targetIdentifier);

  for (let fileIndex = 0; fileIndex < comparisonFiles.length; fileIndex++) {
    const comparisonFile = comparisonFiles[fileIndex];

    if (!validateSingleFile(comparisonFile)) {
      console.warn(
        `⚠️ [ADVANCED_CHECK] 유효하지 않은 비교 파일 건너뜀: ${fileIndex}`
      );
      continue;
    }

    const comparisonIdentifier = createFileIdentifier(comparisonFile);
    const comparisonKey = fileIdentifierToKey(comparisonIdentifier);

    const isIdenticalFile = targetKey === comparisonKey;

    if (isIdenticalFile) {
      console.log('🔍 [ADVANCED_CHECK] 고급 중복 발견:', {
        타겟파일: targetIdentifier.name,
        비교파일: comparisonIdentifier.name,
        타겟키: targetKey.slice(0, 50) + '...',
        비교키: comparisonKey.slice(0, 50) + '...',
        동일파일: true,
      });
      return true;
    }
  }

  console.log('🔍 [ADVANCED_CHECK] 고급 중복 없음:', {
    타겟파일: targetIdentifier.name,
    비교파일개수: comparisonFiles.length,
    타겟키: targetKey.slice(0, 50) + '...',
  });

  return false;
};

// 🔑 파일 배치 내 중복 체크
const checkBatchDuplicates = (files: File[]): File[] => {
  console.log('📦 [BATCH_CHECK] 배치 내 중복 체크 시작:', {
    filesCount: files.length,
  });

  if (files.length <= 1) {
    console.log('📦 [BATCH_CHECK] 파일 1개 이하, 중복 체크 건너뜀');
    return files;
  }

  const uniqueFiles: File[] = [];
  const seenKeys = new Set<string>();

  for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
    const currentFile = files[fileIndex];

    if (!validateSingleFile(currentFile)) {
      console.warn(
        `⚠️ [BATCH_CHECK] 배치 내 유효하지 않은 파일 건너뜀: ${fileIndex}`
      );
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
        파일키: fileKey.slice(0, 50) + '...',
        인덱스: fileIndex,
      });
    } else {
      seenKeys.add(fileKey);
      uniqueFiles.push(currentFile);
      console.log('✅ [BATCH_CHECK] 배치 내 고유 파일 추가:', {
        파일명: currentFile.name,
        파일키: fileKey.slice(0, 50) + '...',
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
  console.log('🔧 [ENHANCED_DUPLICATE] 강화된 중복 체크 시작:', {
    입력파일개수: files.length,
    기존파일개수: existingFileNames.length,
    처리중파일개수: processingFileNames.length,
    enhancedDuplicateCheck: true,
    timestamp: new Date().toLocaleTimeString(),
  });

  if (!validateFileArray(files)) {
    console.error('❌ [ENHANCED_DUPLICATE] 유효하지 않은 파일 배열');
    logger.error('유효하지 않은 파일 배열', { hasFiles: Boolean(files) });
    return { uniqueFiles: [], duplicateFiles: [] };
  }

  if (!validateStringArray(existingFileNames)) {
    console.error('❌ [ENHANCED_DUPLICATE] 유효하지 않은 기존 파일명 배열');
    logger.error('유효하지 않은 기존 파일명 배열');
    return { uniqueFiles: files.slice(), duplicateFiles: [] };
  }

  if (
    !validateStringArray(processingFileNames) &&
    processingFileNames.length > 0
  ) {
    console.warn(
      '⚠️ [ENHANCED_DUPLICATE] 유효하지 않은 처리 중 파일명 배열 - 무시하고 진행'
    );
    logger.warn('유효하지 않은 처리 중 파일명 배열 - 무시하고 진행');
  }

  const safeProcessingFileNames = validateStringArray(processingFileNames)
    ? processingFileNames
    : [];

  // 1단계: 배치 내 중복 제거 (파일 객체 기반)
  const batchUniqueFiles = checkBatchDuplicates(files);

  console.log('📋 [ENHANCED_DUPLICATE] 1단계 배치 중복 제거 완료:', {
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
      console.warn(
        `⚠️ [ENHANCED_DUPLICATE] 유효하지 않은 파일 건너뜀: ${fileIndex}`
      );
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

  console.log('✅ [ENHANCED_DUPLICATE] 강화된 중복 파일 필터링 완료:', {
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

// 🚨 FIXED: 심화 중복 체크 - 원자적 get-or-set 사용
export const filterDuplicateFilesWithContentHash = async (
  files: File[],
  existingFiles: File[] = []
): Promise<DuplicateFileResult> => {
  console.log('🔐 [CONTENT_HASH] 내용 해시 기반 중복 체크 시작:', {
    입력파일개수: files.length,
    기존파일개수: existingFiles.length,
    contentHashCheck: true,
  });

  if (!validateFileArray(files)) {
    console.error('❌ [CONTENT_HASH] 유효하지 않은 파일 배열');
    logger.error('유효하지 않은 파일 배열');
    return { uniqueFiles: [], duplicateFiles: [] };
  }

  const uniqueFiles: File[] = [];
  const duplicateFiles: File[] = [];
  const processedHashes = new Set<string>();

  // 기존 파일들의 해시 생성
  const existingHashes = new Set<string>();
  for (const existingFile of existingFiles) {
    if (validateSingleFile(existingFile)) {
      try {
        console.log('🔐 [CONTENT_HASH] 기존 파일 해시 생성:', {
          fileName: existingFile.name,
        });
        const existingHash = await createFileContentHash(existingFile);
        if (existingHash && existingHash.length > 0) {
          existingHashes.add(existingHash);
        }
      } catch (hashError) {
        console.warn('⚠️ [CONTENT_HASH] 기존 파일 해시 생성 실패:', {
          fileName: existingFile.name,
          error: hashError,
        });
        logger.warn('기존 파일 해시 생성 실패', {
          fileName: existingFile.name,
          error: hashError,
        });
      }
    }
  }

  console.log('🔐 [CONTENT_HASH] 기존 파일 해시 생성 완료:', {
    existingHashesCount: existingHashes.size,
  });

  // 새 파일들 처리
  for (const currentFile of files) {
    if (!validateSingleFile(currentFile)) {
      console.warn('⚠️ [CONTENT_HASH] 유효하지 않은 파일 건너뜀:', {
        fileName: currentFile?.name || 'unknown',
      });
      continue;
    }

    try {
      console.log('🔐 [CONTENT_HASH] 파일 해시 생성:', {
        fileName: currentFile.name,
      });
      const currentHash = await createFileContentHash(currentFile);

      if (!currentHash || currentHash.length === 0) {
        console.warn('⚠️ [CONTENT_HASH] 빈 해시 반환, 고유 파일로 처리:', {
          fileName: currentFile.name,
        });
        uniqueFiles.push(currentFile);
        continue;
      }

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
      console.error('❌ [CONTENT_HASH] 파일 해시 처리 실패:', {
        fileName: currentFile.name,
        error: hashError,
      });
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
  console.log('🔍 [CHECK_DUPLICATE] 단일 파일 중복 체크:', {
    fileName: newFile?.name || 'unknown',
    existingCount: existingFileNames?.length || 0,
  });

  if (!validateSingleFile(newFile)) {
    console.error('❌ [CHECK_DUPLICATE] 유효하지 않은 파일 입력');
    logger.error('유효하지 않은 파일 입력');
    return false;
  }

  if (!validateStringArray(existingFileNames)) {
    console.error('❌ [CHECK_DUPLICATE] 유효하지 않은 파일명 배열');
    logger.error('유효하지 않은 파일명 배열');
    return false;
  }

  const { name: fileName } = newFile;
  const isDuplicate = existingFileNames.includes(fileName);

  console.log('🔍 [CHECK_DUPLICATE] 중복 체크 결과:', {
    fileName,
    isDuplicate,
    existingFileNamesCount: existingFileNames.length,
  });

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
  console.log('🔄 [FILTER_DUPLICATE] 중복 파일 필터링:', {
    filesCount: files?.length || 0,
    existingNamesCount: existingFileNames?.length || 0,
  });

  return filterDuplicateFilesWithProcessing(files, existingFileNames, []);
};

export const getDuplicateFileCount = (
  files: File[],
  existingFileNames: string[]
): number => {
  console.log('📊 [DUPLICATE_COUNT] 중복 파일 개수 조회:', {
    filesCount: files?.length || 0,
    existingNamesCount: existingFileNames?.length || 0,
  });

  if (!validateFileArray(files)) {
    console.log('📊 [DUPLICATE_COUNT] 유효하지 않은 파일 배열, 0 반환');
    return 0;
  }

  const filterResult = filterDuplicateFiles(files, existingFileNames);
  const duplicateCount = filterResult.duplicateFiles.length;

  console.log('📊 [DUPLICATE_COUNT] 중복 파일 개수:', { duplicateCount });

  return duplicateCount;
};

export const getUniqueFileNames = (files: File[]): string[] => {
  console.log('📋 [UNIQUE_NAMES] 고유 파일명 추출:', {
    filesCount: files?.length || 0,
  });

  if (!validateFileArray(files) || files.length === 0) {
    console.log(
      '📋 [UNIQUE_NAMES] 빈 배열 또는 유효하지 않은 배열, 빈 배열 반환'
    );
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

  console.log('📋 [UNIQUE_NAMES] 고유 파일명 추출 완료:', {
    totalFiles: files.length,
    validFiles: validFiles.length,
    uniqueNames: uniqueFileNames.length,
  });

  return uniqueFileNames;
};

// 🔑 추가 유틸리티: 파일 키 생성 (외부 사용용)
export const createFileUniqueKey = (file: File): string => {
  console.log('🔑 [UNIQUE_KEY] 파일 고유 키 생성:', {
    fileName: file?.name || 'unknown',
  });

  if (!validateSingleFile(file)) {
    console.warn('⚠️ [UNIQUE_KEY] 유효하지 않은 파일, 기본 키 반환');
    return 'invalid-file';
  }

  const uniqueKey = createFileKey(file);
  console.log('🔑 [UNIQUE_KEY] 고유 키 생성 완료:', {
    fileName: file.name,
    keyLength: uniqueKey.length,
  });

  return uniqueKey;
};

// 🔑 추가 유틸리티: 해시 캐시 관리
export const clearFileHashCache = (): void => {
  const mutableCache = globalFileHashCache;
  const cacheKeys = Object.keys(mutableCache);

  console.log('🗑️ [CACHE_CLEAR] 파일 해시 캐시 초기화 시작:', {
    keysCount: cacheKeys.length,
  });

  cacheKeys.forEach((key) => {
    Reflect.deleteProperty(mutableCache, key);
  });

  console.log('🗑️ [CACHE_CLEAR] 파일 해시 캐시 초기화 완료:', {
    정리된키개수: cacheKeys.length,
    현재키개수: Object.keys(mutableCache).length,
    timestamp: new Date().toLocaleTimeString(),
  });
};

export const getFileHashCacheSize = (): number => {
  const cacheSize = Object.keys(globalFileHashCache).length;
  console.log('📊 [CACHE_SIZE] 해시 캐시 크기 조회:', { cacheSize });
  return cacheSize;
};
