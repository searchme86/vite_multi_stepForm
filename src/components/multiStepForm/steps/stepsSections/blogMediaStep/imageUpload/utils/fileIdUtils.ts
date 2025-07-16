// 📁 imageUpload/utils/fileIdUtils.ts

import { createLogger } from './loggerUtils';

const logger = createLogger('FILE_ID_UTILS');

interface FileIdValidationResult {
  readonly isValid: boolean;
  readonly fileId: string;
  readonly issues: readonly string[];
  readonly sanitizedId: string;
}

interface PlaceholderInfo {
  readonly fileId: string;
  readonly fileName: string;
  readonly timestamp: number;
  readonly isProcessing: boolean;
}

interface FileIdMappingEntry {
  readonly fileId: string;
  readonly fileName: string;
  readonly originalFileName: string;
  readonly url: string;
  readonly placeholderUrl: string;
  readonly status: 'pending' | 'processing' | 'completed' | 'failed';
  readonly createdAt: number;
  readonly lastUpdated: number;
}

interface FileIdRegistry {
  mappings: Map<string, FileIdMappingEntry>;
  fileNameToIdMap: Map<string, string>;
  placeholderToIdMap: Map<string, string>;
  urlToIdMap: Map<string, string>;
}

const fileIdRegistry: FileIdRegistry = {
  mappings: new Map(),
  fileNameToIdMap: new Map(),
  placeholderToIdMap: new Map(),
  urlToIdMap: new Map(),
};

export const generateSecureFileId = (fileName: string): string => {
  try {
    if (!fileName || typeof fileName !== 'string') {
      logger.warn('유효하지 않은 파일명으로 ID 생성 시도:', { fileName });
      return `file-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    }

    const sanitizedFileName = fileName
      .replace(/[^a-zA-Z0-9.-]/g, '')
      .slice(0, 50);

    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 10);
    const fileId = `file-${sanitizedFileName}-${timestamp}-${randomSuffix}`;

    console.log('🔑 [GENERATE_ID] 보안 파일 ID 생성:', {
      원본파일명: fileName,
      정제된파일명: sanitizedFileName,
      생성된파일ID: fileId,
      timestamp,
    });

    return fileId;
  } catch (error) {
    logger.error('파일 ID 생성 실패:', { fileName, error });
    return `fallback-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 8)}`;
  }
};

export const validateFileId = (fileId: string): FileIdValidationResult => {
  const issues: string[] = [];
  let sanitizedId = '';

  try {
    if (!fileId || typeof fileId !== 'string') {
      issues.push('파일 ID가 문자열이 아님');
      sanitizedId = `invalid-${Date.now()}`;
    } else {
      sanitizedId = fileId.trim();

      if (sanitizedId.length === 0) {
        issues.push('파일 ID가 빈 문자열');
        sanitizedId = `empty-${Date.now()}`;
      } else if (sanitizedId.length > 200) {
        issues.push('파일 ID가 너무 김 (200자 초과)');
        sanitizedId = sanitizedId.slice(0, 200);
      }

      if (!/^[a-zA-Z0-9._-]+$/.test(sanitizedId)) {
        issues.push('파일 ID에 허용되지 않은 문자 포함');
        sanitizedId = sanitizedId.replace(/[^a-zA-Z0-9._-]/g, '');
      }

      if (
        !sanitizedId.startsWith('file-') &&
        !sanitizedId.startsWith('placeholder-')
      ) {
        issues.push('파일 ID 형식이 올바르지 않음');
      }
    }

    const result: FileIdValidationResult = {
      isValid: issues.length === 0,
      fileId,
      issues,
      sanitizedId,
    };

    if (!result.isValid) {
      logger.warn('파일 ID 검증 실패:', {
        원본ID: fileId,
        정제된ID: sanitizedId,
        이슈개수: issues.length,
        이슈목록: issues.join(', '),
      });
    }

    return result;
  } catch (error) {
    logger.error('파일 ID 검증 중 오류:', { fileId, error });
    return {
      isValid: false,
      fileId,
      issues: ['검증 프로세스 오류'],
      sanitizedId: `error-${Date.now()}`,
    };
  }
};

export const createPlaceholderUrl = (
  fileId: string,
  fileName: string
): string => {
  try {
    const validation = validateFileId(fileId);
    const validFileId = validation.isValid ? fileId : validation.sanitizedId;

    const sanitizedFileName = fileName
      .replace(/[^a-zA-Z0-9.-]/g, '')
      .slice(0, 30);

    const timestamp = Date.now();
    const placeholderUrl = `placeholder-${validFileId}-${sanitizedFileName}-${timestamp}-processing`;

    console.log('🔗 [PLACEHOLDER] 플레이스홀더 URL 생성:', {
      파일ID: validFileId,
      파일명: fileName,
      정제된파일명: sanitizedFileName,
      플레이스홀더URL: placeholderUrl,
    });

    return placeholderUrl;
  } catch (error) {
    logger.error('플레이스홀더 URL 생성 실패:', { fileId, fileName, error });
    return `placeholder-error-${Date.now()}-processing`;
  }
};

export const extractFileIdFromPlaceholder = (
  placeholderUrl: string
): string => {
  try {
    if (!placeholderUrl || typeof placeholderUrl !== 'string') {
      return '';
    }

    const placeholderMatch = placeholderUrl.match(
      /^placeholder-([^-]+(?:-[^-]+)*)-[^-]+-\d+-processing$/
    );

    if (placeholderMatch && placeholderMatch[1]) {
      const extractedId = placeholderMatch[1];

      console.log('🔍 [EXTRACT_ID] 플레이스홀더에서 파일 ID 추출:', {
        플레이스홀더URL: placeholderUrl,
        추출된파일ID: extractedId,
      });

      return extractedId;
    }

    logger.warn('플레이스홀더 URL 패턴 불일치:', { placeholderUrl });
    return '';
  } catch (error) {
    logger.error('플레이스홀더에서 파일 ID 추출 실패:', {
      placeholderUrl,
      error,
    });
    return '';
  }
};

export const isPlaceholderUrl = (url: string): boolean => {
  try {
    if (!url || typeof url !== 'string') {
      return false;
    }

    const isPlaceholder =
      url.startsWith('placeholder-') && url.includes('-processing');

    if (isPlaceholder) {
      console.log('🔍 [IS_PLACEHOLDER] 플레이스홀더 URL 확인:', {
        URL: url.slice(0, 50) + '...',
        isPlaceholder: true,
      });
    }

    return isPlaceholder;
  } catch (error) {
    logger.error('플레이스홀더 URL 확인 실패:', { url, error });
    return false;
  }
};

export const parsePlaceholderInfo = (
  placeholderUrl: string
): PlaceholderInfo | null => {
  try {
    if (!isPlaceholderUrl(placeholderUrl)) {
      return null;
    }

    const parts = placeholderUrl.split('-');
    if (parts.length < 4) {
      return null;
    }

    const fileIdEndIndex = parts.findIndex((part, index) => {
      if (index < 2) return false;
      const nextPart = parts[index + 1];
      return nextPart && /^\d+$/.test(nextPart);
    });

    if (fileIdEndIndex === -1) {
      return null;
    }

    const fileIdParts = parts.slice(1, fileIdEndIndex);
    const fileId = fileIdParts.join('-');
    const fileName = parts[fileIdEndIndex] || 'unknown';
    const timestampStr = parts[fileIdEndIndex + 1];
    const timestamp = timestampStr ? parseInt(timestampStr, 10) : Date.now();

    const info: PlaceholderInfo = {
      fileId,
      fileName,
      timestamp,
      isProcessing: placeholderUrl.endsWith('-processing'),
    };

    console.log('🔍 [PARSE_PLACEHOLDER] 플레이스홀더 정보 파싱:', {
      플레이스홀더URL: placeholderUrl,
      파싱결과: info,
    });

    return info;
  } catch (error) {
    logger.error('플레이스홀더 정보 파싱 실패:', { placeholderUrl, error });
    return null;
  }
};

export const registerFileMapping = (
  fileId: string,
  fileName: string,
  url: string,
  placeholderUrl: string
): void => {
  try {
    const validation = validateFileId(fileId);
    const validFileId = validation.isValid ? fileId : validation.sanitizedId;

    const mapping: FileIdMappingEntry = {
      fileId: validFileId,
      fileName,
      originalFileName: fileName,
      url,
      placeholderUrl,
      status: 'pending',
      createdAt: Date.now(),
      lastUpdated: Date.now(),
    };

    fileIdRegistry.mappings.set(validFileId, mapping);
    fileIdRegistry.fileNameToIdMap.set(fileName, validFileId);
    fileIdRegistry.placeholderToIdMap.set(placeholderUrl, validFileId);

    if (url && !isPlaceholderUrl(url)) {
      fileIdRegistry.urlToIdMap.set(url, validFileId);
    }

    console.log('📝 [REGISTER] 파일 매핑 등록:', {
      파일ID: validFileId,
      파일명: fileName,
      URL: url.slice(0, 50) + '...',
      플레이스홀더: placeholderUrl.slice(0, 50) + '...',
      총매핑개수: fileIdRegistry.mappings.size,
    });

    logger.debug('파일 매핑 등록 완료', {
      fileId: validFileId,
      fileName,
      mappingsCount: fileIdRegistry.mappings.size,
    });
  } catch (error) {
    logger.error('파일 매핑 등록 실패:', { fileId, fileName, error });
  }
};

export const updateFileMapping = (
  fileId: string,
  updates: Partial<Pick<FileIdMappingEntry, 'url' | 'status' | 'fileName'>>
): boolean => {
  try {
    const existingMapping = fileIdRegistry.mappings.get(fileId);
    if (!existingMapping) {
      logger.warn('존재하지 않는 파일 ID로 매핑 업데이트 시도:', { fileId });
      return false;
    }

    const updatedMapping: FileIdMappingEntry = {
      ...existingMapping,
      ...updates,
      lastUpdated: Date.now(),
    };

    fileIdRegistry.mappings.set(fileId, updatedMapping);

    if (updates.url && !isPlaceholderUrl(updates.url)) {
      fileIdRegistry.urlToIdMap.set(updates.url, fileId);
    }

    if (updates.fileName && updates.fileName !== existingMapping.fileName) {
      fileIdRegistry.fileNameToIdMap.delete(existingMapping.fileName);
      fileIdRegistry.fileNameToIdMap.set(updates.fileName, fileId);
    }

    console.log('🔄 [UPDATE] 파일 매핑 업데이트:', {
      파일ID: fileId,
      업데이트내용: updates,
      이전URL: existingMapping.url.slice(0, 30) + '...',
      새URL: updatedMapping.url.slice(0, 30) + '...',
    });

    return true;
  } catch (error) {
    logger.error('파일 매핑 업데이트 실패:', { fileId, updates, error });
    return false;
  }
};

export const getFileMappingById = (
  fileId: string
): FileIdMappingEntry | undefined => {
  try {
    const mapping = fileIdRegistry.mappings.get(fileId);

    if (mapping) {
      console.log('🔍 [GET_BY_ID] 파일 ID로 매핑 조회:', {
        파일ID: fileId,
        파일명: mapping.fileName,
        상태: mapping.status,
        마지막업데이트: new Date(mapping.lastUpdated).toLocaleTimeString(),
      });
    }

    return mapping;
  } catch (error) {
    logger.error('파일 ID로 매핑 조회 실패:', { fileId, error });
    return undefined;
  }
};

export const getFileIdByName = (fileName: string): string | undefined => {
  try {
    const fileId = fileIdRegistry.fileNameToIdMap.get(fileName);

    if (fileId) {
      console.log('🔍 [GET_BY_NAME] 파일명으로 ID 조회:', {
        파일명: fileName,
        파일ID: fileId,
      });
    }

    return fileId;
  } catch (error) {
    logger.error('파일명으로 ID 조회 실패:', { fileName, error });
    return undefined;
  }
};

export const getFileIdByUrl = (url: string): string | undefined => {
  try {
    const fileId = fileIdRegistry.urlToIdMap.get(url);

    if (fileId) {
      console.log('🔍 [GET_BY_URL] URL로 ID 조회:', {
        URL: url.slice(0, 50) + '...',
        파일ID: fileId,
      });
    }

    return fileId;
  } catch (error) {
    logger.error('URL로 ID 조회 실패:', { url, error });
    return undefined;
  }
};

export const getFileIdByPlaceholder = (
  placeholderUrl: string
): string | undefined => {
  try {
    const fileId = fileIdRegistry.placeholderToIdMap.get(placeholderUrl);

    if (fileId) {
      console.log('🔍 [GET_BY_PLACEHOLDER] 플레이스홀더로 ID 조회:', {
        플레이스홀더: placeholderUrl.slice(0, 50) + '...',
        파일ID: fileId,
      });
    }

    return fileId;
  } catch (error) {
    logger.error('플레이스홀더로 ID 조회 실패:', { placeholderUrl, error });
    return undefined;
  }
};

export const removeFileMapping = (fileId: string): boolean => {
  try {
    const existingMapping = fileIdRegistry.mappings.get(fileId);
    if (!existingMapping) {
      logger.warn('존재하지 않는 파일 ID로 매핑 제거 시도:', { fileId });
      return false;
    }

    fileIdRegistry.mappings.delete(fileId);
    fileIdRegistry.fileNameToIdMap.delete(existingMapping.fileName);
    fileIdRegistry.placeholderToIdMap.delete(existingMapping.placeholderUrl);

    if (!isPlaceholderUrl(existingMapping.url)) {
      fileIdRegistry.urlToIdMap.delete(existingMapping.url);
    }

    console.log('🗑️ [REMOVE] 파일 매핑 제거:', {
      파일ID: fileId,
      파일명: existingMapping.fileName,
      남은매핑개수: fileIdRegistry.mappings.size,
    });

    return true;
  } catch (error) {
    logger.error('파일 매핑 제거 실패:', { fileId, error });
    return false;
  }
};

export const getAllFileMappings = (): Map<string, FileIdMappingEntry> => {
  try {
    const mappings = new Map(fileIdRegistry.mappings);

    console.log('📋 [GET_ALL] 모든 파일 매핑 조회:', {
      총매핑개수: mappings.size,
      파일ID목록: Array.from(mappings.keys()),
    });

    return mappings;
  } catch (error) {
    logger.error('모든 파일 매핑 조회 실패:', { error });
    return new Map();
  }
};

export const clearAllFileMappings = (): void => {
  try {
    const previousCount = fileIdRegistry.mappings.size;

    fileIdRegistry.mappings.clear();
    fileIdRegistry.fileNameToIdMap.clear();
    fileIdRegistry.placeholderToIdMap.clear();
    fileIdRegistry.urlToIdMap.clear();

    console.log('🧹 [CLEAR_ALL] 모든 파일 매핑 정리:', {
      이전매핑개수: previousCount,
      현재매핑개수: fileIdRegistry.mappings.size,
    });

    logger.debug('모든 파일 매핑 정리 완료', {
      clearedMappings: previousCount,
    });
  } catch (error) {
    logger.error('파일 매핑 정리 실패:', { error });
  }
};

export const getRegistryStatistics = () => {
  try {
    const stats = {
      totalMappings: fileIdRegistry.mappings.size,
      fileNameMappings: fileIdRegistry.fileNameToIdMap.size,
      placeholderMappings: fileIdRegistry.placeholderToIdMap.size,
      urlMappings: fileIdRegistry.urlToIdMap.size,
      statusCounts: {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
      },
      oldestMapping: 0,
      newestMapping: 0,
    };

    let oldestTime = Infinity;
    let newestTime = 0;

    fileIdRegistry.mappings.forEach((mapping) => {
      const status = mapping.status;
      if (status in stats.statusCounts) {
        stats.statusCounts[status as keyof typeof stats.statusCounts]++;
      }

      if (mapping.createdAt < oldestTime) {
        oldestTime = mapping.createdAt;
      }
      if (mapping.createdAt > newestTime) {
        newestTime = mapping.createdAt;
      }
    });

    stats.oldestMapping = oldestTime === Infinity ? 0 : oldestTime;
    stats.newestMapping = newestTime;

    console.log('📊 [STATISTICS] 파일 ID 레지스트리 통계:', stats);

    return stats;
  } catch (error) {
    logger.error('레지스트리 통계 조회 실패:', { error });
    return {
      totalMappings: 0,
      fileNameMappings: 0,
      placeholderMappings: 0,
      urlMappings: 0,
      statusCounts: { pending: 0, processing: 0, completed: 0, failed: 0 },
      oldestMapping: 0,
      newestMapping: 0,
    };
  }
};
