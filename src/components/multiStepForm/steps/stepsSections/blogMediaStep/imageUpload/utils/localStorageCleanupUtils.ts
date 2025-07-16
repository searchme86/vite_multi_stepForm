// 📁 imageUpload/utils/localStorageCleanupUtils.ts

import { createLogger } from './loggerUtils';

const logger = createLogger('LOCALSTORAGE_CLEANUP');

// 🔧 플레이스홀더 감지 함수
const isPlaceholderUrl = (url: string): boolean => {
  return url.startsWith('placeholder-') && url.includes('-processing');
};

// 🔧 영속성 키 목록
const PERSISTENCE_KEYS = [
  'blogMediaSliderPersistenceBackup',
  'blogMediaMainImageBackup',
  'blogMediaStep_media',
  'blogMediaStep_selectedFileNames',
  'blogMediaStep_mainImage',
] as const;

// 🔧 영속성 데이터 검증 함수
const validatePersistenceData = (key: string, data: unknown): boolean => {
  try {
    if (!data || typeof data !== 'object') {
      return false;
    }

    // 미디어 파일 검증
    if (key.includes('media') && Array.isArray(data)) {
      const hasPlaceholders = data.some(
        (item) => typeof item === 'string' && isPlaceholderUrl(item)
      );

      if (hasPlaceholders) {
        console.log('🚨 [PERSISTENCE_VALIDATION] 플레이스홀더 발견:', {
          key,
          dataCount: data.length,
          placeholderCount: data.filter(
            (item) => typeof item === 'string' && isPlaceholderUrl(item)
          ).length,
        });
        return false;
      }
    }

    // 백업 데이터 검증
    if (key.includes('Backup')) {
      const timestamp = Reflect.get(data, 'timestamp');
      const currentTime = Date.now();
      const isExpired = currentTime - timestamp > 60 * 60 * 1000; // 1시간

      if (isExpired) {
        console.log('🚨 [PERSISTENCE_VALIDATION] 만료된 백업 데이터:', {
          key,
          timestamp,
          currentTime,
          ageInMinutes: Math.floor((currentTime - timestamp) / (60 * 1000)),
        });
        return false;
      }
    }

    return true;
  } catch (error) {
    logger.error('영속성 데이터 검증 실패', { key, error });
    return false;
  }
};

// 🔧 손상된 영속성 데이터 정리
export const cleanupCorruptedPersistenceData = (): void => {
  console.log('🧹 [CLEANUP_START] 손상된 영속성 데이터 정리 시작');

  let cleanedCount = 0;
  let totalChecked = 0;

  PERSISTENCE_KEYS.forEach((key) => {
    try {
      totalChecked++;
      const rawData = localStorage.getItem(key);

      if (!rawData) {
        console.log(`ℹ️ [CLEANUP] ${key}: 데이터 없음`);
        return;
      }

      const parsedData = JSON.parse(rawData);
      const isValid = validatePersistenceData(key, parsedData);

      if (!isValid) {
        localStorage.removeItem(key);
        cleanedCount++;
        console.log(`🗑️ [CLEANUP] ${key}: 손상된 데이터 제거`);
      } else {
        console.log(`✅ [CLEANUP] ${key}: 유효한 데이터`);
      }
    } catch (error) {
      localStorage.removeItem(key);
      cleanedCount++;
      console.log(`🗑️ [CLEANUP] ${key}: 파싱 실패로 제거`);
    }
  });

  console.log('✅ [CLEANUP_COMPLETE] 영속성 데이터 정리 완료:', {
    totalChecked,
    cleanedCount,
    remainingCount: totalChecked - cleanedCount,
  });

  logger.info('영속성 데이터 정리 완료', {
    totalChecked,
    cleanedCount,
    remainingCount: totalChecked - cleanedCount,
  });
};

// 🔧 특정 키의 영속성 데이터 정리
export const cleanupSpecificPersistenceData = (targetKey: string): void => {
  try {
    const rawData = localStorage.getItem(targetKey);

    if (!rawData) {
      console.log(`ℹ️ [SPECIFIC_CLEANUP] ${targetKey}: 데이터 없음`);
      return;
    }

    const parsedData = JSON.parse(rawData);
    const isValid = validatePersistenceData(targetKey, parsedData);

    if (!isValid) {
      localStorage.removeItem(targetKey);
      console.log(`🗑️ [SPECIFIC_CLEANUP] ${targetKey}: 손상된 데이터 제거`);
    } else {
      console.log(`✅ [SPECIFIC_CLEANUP] ${targetKey}: 유효한 데이터`);
    }
  } catch (error) {
    localStorage.removeItem(targetKey);
    console.log(`🗑️ [SPECIFIC_CLEANUP] ${targetKey}: 파싱 실패로 제거`);
  }
};

// 🔧 모든 영속성 데이터 강제 정리
export const forceCleanupAllPersistenceData = (): void => {
  console.log('🧹 [FORCE_CLEANUP] 모든 영속성 데이터 강제 정리 시작');

  let removedCount = 0;

  PERSISTENCE_KEYS.forEach((key) => {
    try {
      const hadData = localStorage.getItem(key) !== null;

      if (hadData) {
        localStorage.removeItem(key);
        removedCount++;
        console.log(`🗑️ [FORCE_CLEANUP] ${key}: 제거됨`);
      } else {
        console.log(`ℹ️ [FORCE_CLEANUP] ${key}: 데이터 없음`);
      }
    } catch (error) {
      console.error(`❌ [FORCE_CLEANUP] ${key}: 제거 실패:`, error);
    }
  });

  console.log('✅ [FORCE_CLEANUP] 강제 정리 완료:', {
    removedCount,
    totalKeys: PERSISTENCE_KEYS.length,
  });

  logger.info('모든 영속성 데이터 강제 정리 완료', {
    removedCount,
    totalKeys: PERSISTENCE_KEYS.length,
  });
};

// 🔧 페이지 로드 시 자동 정리
export const initializeCleanupOnPageLoad = (): void => {
  console.log('🚀 [INIT_CLEANUP] 페이지 로드 시 자동 정리 시작');

  // DOM이 로드된 후 실행
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      cleanupCorruptedPersistenceData();
    });
  } else {
    cleanupCorruptedPersistenceData();
  }
};

// 🔧 개발 모드에서만 실행되는 디버깅 함수
export const debugPersistenceData = (): void => {
  console.log('🔍 [DEBUG_PERSISTENCE] 영속성 데이터 디버깅 시작');

  const debugInfo: Record<string, unknown> = {};

  PERSISTENCE_KEYS.forEach((key) => {
    try {
      const rawData = localStorage.getItem(key);

      if (rawData) {
        const parsedData = JSON.parse(rawData);
        const isValid = validatePersistenceData(key, parsedData);

        debugInfo[key] = {
          exists: true,
          isValid,
          dataType: typeof parsedData,
          dataSize: rawData.length,
          preview: Array.isArray(parsedData)
            ? `Array(${parsedData.length})`
            : typeof parsedData === 'object'
            ? Object.keys(parsedData).join(', ')
            : String(parsedData).slice(0, 50),
        };
      } else {
        debugInfo[key] = {
          exists: false,
          isValid: false,
          dataType: 'undefined',
          dataSize: 0,
          preview: 'No data',
        };
      }
    } catch (error) {
      debugInfo[key] = {
        exists: true,
        isValid: false,
        dataType: 'corrupted',
        dataSize: 0,
        preview: 'Parse error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  console.table(debugInfo);
  console.log('✅ [DEBUG_PERSISTENCE] 영속성 데이터 디버깅 완료');
};

// 🔧 사용 예시
/*
// 페이지 로드 시 자동 정리
initializeCleanupOnPageLoad();

// 수동 정리
cleanupCorruptedPersistenceData();

// 디버깅 (개발 모드에서만)
if (process.env.NODE_ENV === 'development') {
  debugPersistenceData();
}

// 강제 정리 (문제 해결 시)
forceCleanupAllPersistenceData();
*/
