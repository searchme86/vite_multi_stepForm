// src/components/previewPanel/hooks/useStoreData.ts - Phase 4: 실시간 동기화 시스템 구현

import { useMemo, useEffect, useState, useCallback } from 'react';
import { useEditorCoreStore } from '../../../store/editorCore/editorCoreStore';
import { useMultiStepFormStore } from '../../multiStepForm/store/multiStepForm/multiStepFormStore';

// 🔧 Phase 4: 실시간 동기화를 위한 확장된 폼 데이터 타입 정의 (16개 필드)
interface FormData {
  userImage: string | undefined;
  nickname: string;
  emailPrefix: string;
  emailDomain: string;
  bio: string | undefined;
  title: string;
  description: string;
  mainImage: string | null | undefined;
  media: string[] | undefined;
  sliderImages: string[] | undefined;
  editorCompletedContent: string;
  isEditorCompleted: boolean;
  // Phase 4에서 추가된 에디터 메타데이터 필드들
  editorContainerCount: number;
  editorParagraphCount: number;
  editorSectionInputCount: number;
  editorValidSectionInputCount: number;
}

// 커스텀 갤러리 뷰 타입 정의
interface CustomGalleryView {
  id: string;
  name: string;
  images: string[];
}

// 🔧 실제 스토어 타입에 맞춘 안전한 에디터 컨테이너 타입
interface SafeEditorContainer {
  id: string;
  content: string;
  order: number;
}

// 🔧 실제 스토어 타입에 맞춘 안전한 에디터 단락 타입
interface SafeEditorParagraph {
  id: string;
  text: string;
  containerId: string | null;
}

// 🆕 Phase 4: 실시간 동기화 상태 타입
interface RealTimeSyncState {
  lastKnownStoreData: string;
  forceUpdateTrigger: number;
  syncInProgress: boolean;
  lastSyncTime: number;
  syncErrorCount: number;
}

// 🔧 강화된 훅 반환 타입 정의 (실시간 동기화 정보 추가)
interface UseStoreDataReturn {
  formData: FormData | null;
  customGalleryViews: CustomGalleryView[];
  editorContainers: SafeEditorContainer[];
  editorParagraphs: SafeEditorParagraph[];
  editorCompletedContent: string;
  isEditorCompleted: boolean;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  // 🆕 Phase 4: 실시간 동기화 상태 정보
  syncState: RealTimeSyncState;
}

// 🔧 타입 검증을 위한 Map 기반 타입 가드들
const createTypeGuardMaps = () => {
  console.log('🔧 [TYPE_GUARDS] Map 기반 타입 가드 생성');

  // 진실값을 나타내는 문자열들
  const truthyStringSet = new Set(['true', '1', 'yes', 'on', 'enabled']);

  // 거짓값을 나타내는 문자열들
  const falsyStringSet = new Set(['false', '0', 'no', 'off', 'disabled', '']);

  // 필수 컨테이너 필드들
  const requiredContainerFieldsSet = new Set(['id', 'content', 'order']);

  // 필수 단락 필드들 (id만 필수, content/text는 별도 검증)
  const requiredParagraphFieldsSet = new Set(['id']);

  const isValidStringType = (value: unknown): value is string => {
    return typeof value === 'string';
  };

  const isValidBooleanType = (value: unknown): value is boolean => {
    return typeof value === 'boolean';
  };

  const isValidNumberType = (value: unknown): value is number => {
    return typeof value === 'number' && Number.isFinite(value);
  };

  const isValidArrayType = (value: unknown): value is unknown[] => {
    return Array.isArray(value);
  };

  const isValidObjectType = (
    value: unknown
  ): value is Record<string, unknown> => {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  };

  console.log('✅ [TYPE_GUARDS] Map 기반 타입 가드 생성 완료');

  return {
    truthyStringSet,
    falsyStringSet,
    requiredContainerFieldsSet,
    requiredParagraphFieldsSet,
    isValidStringType,
    isValidBooleanType,
    isValidNumberType,
    isValidArrayType,
    isValidObjectType,
  };
};

// 🔧 타입 안전한 변환 함수들 (타입 단언 완전 제거)
const createSafeTypeConverters = () => {
  console.log(
    '🔧 [TYPE_CONVERTERS] 안전한 타입 변환기 생성 (타입 단언 완전 제거)'
  );

  const typeGuards = createTypeGuardMaps();
  const {
    truthyStringSet,
    falsyStringSet,
    requiredContainerFieldsSet,
    requiredParagraphFieldsSet,
    isValidStringType,
    isValidBooleanType,
    isValidNumberType,
    isValidArrayType,
    isValidObjectType,
  } = typeGuards;

  const convertToSafeString = (value: unknown, fallback: string): string => {
    if (value === null || value === undefined) {
      return fallback;
    }

    if (isValidStringType(value)) {
      return value;
    }

    if (isValidNumberType(value)) {
      return String(value);
    }

    if (isValidBooleanType(value)) {
      return value ? 'true' : 'false';
    }

    try {
      const stringValue = String(value);
      return stringValue;
    } catch {
      return fallback;
    }
  };

  const convertToSafeBoolean = (value: unknown, fallback: boolean): boolean => {
    if (isValidBooleanType(value)) {
      return value;
    }

    if (isValidStringType(value)) {
      const trimmedValue = value.trim().toLowerCase();

      if (truthyStringSet.has(trimmedValue)) {
        return true;
      }

      if (falsyStringSet.has(trimmedValue)) {
        return false;
      }
    }

    if (isValidNumberType(value)) {
      return value !== 0;
    }

    return fallback;
  };

  const convertToSafeNumber = (
    value: unknown,
    fallback: number = 0
  ): number => {
    if (isValidNumberType(value)) {
      return value;
    }

    if (isValidStringType(value)) {
      const parsedValue = parseInt(value, 10);
      return isValidNumberType(parsedValue) ? parsedValue : fallback;
    }

    if (isValidArrayType(value)) {
      return value.length;
    }

    return fallback;
  };

  const convertToSafeStringArray = (
    value: unknown,
    fallback: string[] = []
  ): string[] => {
    if (value === null || value === undefined) {
      return fallback;
    }

    if (!isValidArrayType(value)) {
      return isValidStringType(value) ? [value] : fallback;
    }

    const convertedArray: string[] = [];

    for (let i = 0; i < value.length; i++) {
      const item = value[i];
      if (isValidStringType(item)) {
        convertedArray.push(item);
      } else if (item !== null && item !== undefined) {
        try {
          const convertedItem = convertToSafeString(item, '');
          if (convertedItem.length > 0) {
            convertedArray.push(convertedItem);
          }
        } catch {
          // 변환 실패 시 해당 아이템 스킵
        }
      }
    }

    return convertedArray.length > 0 ? convertedArray : fallback;
  };

  const convertToSafeStringOrNull = (
    value: unknown,
    fallback: string | null = null
  ): string | null => {
    if (value === null) {
      return null;
    }

    if (value === undefined) {
      return fallback;
    }

    if (isValidStringType(value)) {
      return value.trim().length === 0 ? null : value;
    }

    try {
      const convertedValue = convertToSafeString(value, '');
      return convertedValue.length > 0 ? convertedValue : null;
    } catch {
      return fallback;
    }
  };

  // 🆕 Map/Set을 활용한 안전한 에디터 컨테이너 변환 (타입 단언 완전 제거)
  const convertToSafeEditorContainer = (
    rawContainer: unknown
  ): SafeEditorContainer | null => {
    if (!isValidObjectType(rawContainer)) {
      return null;
    }

    // Reflect.get을 사용한 안전한 프로퍼티 접근
    const rawId = Reflect.get(rawContainer, 'id');
    const rawContent = Reflect.get(rawContainer, 'content');
    const rawOrder = Reflect.get(rawContainer, 'order');

    // 필수 필드 검증을 Set으로 수행
    const hasRequiredFields = Array.from(requiredContainerFieldsSet).every(
      (field) => {
        return Reflect.has(rawContainer, field);
      }
    );

    if (!hasRequiredFields) {
      return null;
    }

    const safeId = convertToSafeString(rawId, '');
    const safeContent = convertToSafeString(rawContent, '');
    const safeOrder = convertToSafeNumber(rawOrder, 0);

    if (safeId.length === 0) {
      return null;
    }

    return {
      id: safeId,
      content: safeContent,
      order: safeOrder,
    };
  };

  // 🆕 Map/Set을 활용한 안전한 에디터 단락 변환 (타입 단언 완전 제거)
  const convertToSafeEditorParagraph = (
    rawParagraph: unknown
  ): SafeEditorParagraph | null => {
    if (!isValidObjectType(rawParagraph)) {
      return null;
    }

    // Reflect.get을 사용한 안전한 프로퍼티 접근
    const rawId = Reflect.get(rawParagraph, 'id');
    const rawText = Reflect.get(rawParagraph, 'text');
    const rawContent = Reflect.get(rawParagraph, 'content');
    const rawContainerId = Reflect.get(rawParagraph, 'containerId');

    // 🔧 필수 필드 검증을 Set으로 수행 (requiredParagraphFieldsSet 사용)
    const hasRequiredParagraphFields = Array.from(
      requiredParagraphFieldsSet
    ).every((field) => {
      return Reflect.has(rawParagraph, field);
    });

    if (!hasRequiredParagraphFields) {
      console.warn('⚠️ [TYPE_CONVERTER] 단락 필수 필드 누락:', {
        requiredFields: Array.from(requiredParagraphFieldsSet),
        availableFields: Object.keys(rawParagraph),
      });
      return null;
    }

    // 🔧 content 또는 text 필드 중 하나는 반드시 있어야 함
    const hasContentField =
      Reflect.has(rawParagraph, 'content') || Reflect.has(rawParagraph, 'text');
    if (!hasContentField) {
      console.warn('⚠️ [TYPE_CONVERTER] 단락 content 또는 text 필드 누락:', {
        availableFields: Object.keys(rawParagraph),
      });
      return null;
    }

    const safeId = convertToSafeString(rawId, '');

    // text 필드가 없으면 content 필드를 사용 (fallback)
    const textValue = rawText !== undefined ? rawText : rawContent;
    const safeText = convertToSafeString(textValue, '');

    const safeContainerId =
      rawContainerId !== undefined
        ? convertToSafeString(rawContainerId, '') || null
        : null;

    if (safeId.length === 0) {
      return null;
    }

    return {
      id: safeId,
      text: safeText,
      containerId: safeContainerId,
    };
  };

  console.log(
    '✅ [TYPE_CONVERTERS] 안전한 타입 변환기 생성 완료 (타입 단언 완전 제거)'
  );

  return {
    convertToSafeString,
    convertToSafeBoolean,
    convertToSafeNumber,
    convertToSafeStringArray,
    convertToSafeStringOrNull,
    convertToSafeEditorContainer,
    convertToSafeEditorParagraph,
  };
};

// 🔧 안전한 에러 메시지 추출 (타입 단언 완전 제거)
const extractSafeErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    const { message = '', name = '' } = error;
    return message.length > 0 ? `${name}: ${message}` : name || 'Error 객체';
  }

  if (typeof error === 'string') {
    const trimmedMessage = error.trim();
    return trimmedMessage.length > 0 ? trimmedMessage : '빈 에러 메시지';
  }

  if (error === null) {
    return 'null 에러';
  }

  if (error === undefined) {
    return 'undefined 에러';
  }

  // Reflect.has를 사용한 안전한 프로퍼티 확인
  if (typeof error === 'object' && Reflect.has(error, 'message')) {
    const messageValue = Reflect.get(error, 'message');
    if (typeof messageValue === 'string' && messageValue.trim().length > 0) {
      return messageValue.trim();
    }
  }

  try {
    const seen = new WeakSet();
    const serializedError = JSON.stringify(
      error,
      (_: string, value: unknown) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[순환참조]';
          }
          seen.add(value);
        }
        return value;
      }
    );

    return serializedError && serializedError.length > 2
      ? serializedError.length > 200
        ? serializedError.substring(0, 200) + '...'
        : serializedError
      : '빈 객체 에러';
  } catch {
    return `에러 직렬화 실패 (타입: ${typeof error})`;
  }
};

// 🔧 안전한 객체 키 추출 함수 (타입 단언 완전 제거)
const extractSafeObjectKeys = (obj: unknown): string[] => {
  if (obj === null || obj === undefined) {
    return [];
  }

  if (typeof obj !== 'object') {
    return [];
  }

  try {
    return Object.keys(obj);
  } catch {
    return [];
  }
};

// 🔧 Reflect.get 기반 안전한 프로퍼티 추출
const extractSafeProperty = (obj: unknown, propertyName: string): unknown => {
  if (obj === null || obj === undefined) {
    return undefined;
  }

  if (typeof obj !== 'object') {
    return undefined;
  }

  try {
    return Reflect.get(obj, propertyName);
  } catch {
    return undefined;
  }
};

// 🔧 Map 기반 배열 길이 계산
const calculateArrayLength = (value: unknown): number => {
  if (!Array.isArray(value)) {
    return 0;
  }

  try {
    return value.length;
  } catch {
    return 0;
  }
};

// 🆕 Phase 4: 실시간 동기화 시스템 생성 함수
const createRealTimeSyncSystem = () => {
  console.log('🔄 [REAL_TIME_SYNC] 실시간 동기화 시스템 생성');

  const createInitialSyncState = (): RealTimeSyncState => {
    return {
      lastKnownStoreData: '',
      forceUpdateTrigger: 0,
      syncInProgress: false,
      lastSyncTime: 0,
      syncErrorCount: 0,
    };
  };

  const calculateSyncStateStats = (syncState: RealTimeSyncState) => {
    const currentTime = Date.now();
    const timeSinceLastSync = currentTime - syncState.lastSyncTime;
    const hasRecentSync = timeSinceLastSync < 1000; // 1초 이내

    return {
      timeSinceLastSync,
      hasRecentSync,
      isHealthy: syncState.syncErrorCount < 5,
      dataLength: syncState.lastKnownStoreData.length,
    };
  };

  const createSafeStringComparer = () => {
    return {
      compareStrings: (str1: string, str2: string): boolean => {
        try {
          return str1 === str2;
        } catch {
          return false;
        }
      },

      calculateStringStats: (str: string) => {
        try {
          return {
            length: str.length,
            isEmpty: str.length === 0,
            hash: str.slice(0, 10) + '...' + str.slice(-10),
          };
        } catch {
          return {
            length: 0,
            isEmpty: true,
            hash: 'invalid',
          };
        }
      },
    };
  };

  console.log('✅ [REAL_TIME_SYNC] 실시간 동기화 시스템 생성 완료');

  return {
    createInitialSyncState,
    calculateSyncStateStats,
    createSafeStringComparer,
  };
};

/**
 * 스토어 데이터를 안전하게 가져오는 훅 - Phase 4 버전 (실시간 동기화 시스템 포함)
 */
export function useStoreData(): UseStoreDataReturn {
  console.log(
    '🔄 [STORE_DATA_PHASE4] 스토어 데이터 훅 호출 (Phase 4: 실시간 동기화 시스템)'
  );

  // 🆕 Phase 4: 실시간 동기화 상태 관리
  const [realTimeSyncState, setRealTimeSyncState] = useState<RealTimeSyncState>(
    () => {
      const syncSystem = createRealTimeSyncSystem();
      return syncSystem.createInitialSyncState();
    }
  );

  // 📊 MultiStepForm 스토어에서 폼 데이터 가져오기
  const multiStepFormStore = useMultiStepFormStore();

  // 구조분해할당과 fallback을 사용한 안전한 접근
  const { getFormValues: formDataGetter = () => null } =
    multiStepFormStore || {};

  // 📝 EditorCore 스토어에서 에디터 데이터 가져오기
  const editorCoreStore = useEditorCoreStore();

  // 🔗 강화된 스토어 연결 상태 검증 (타입 단언 완전 제거)
  console.log('🔗 [STORE_CONNECTION_PHASE4] 스토어 연결 상태 검증 (Phase 4):', {
    hasMultiStepFormStore: !!multiStepFormStore,
    hasGetFormValues: typeof formDataGetter === 'function',
    hasEditorCoreStore: !!editorCoreStore,
    hasGetCompletedContent:
      typeof editorCoreStore?.getCompletedContent === 'function',
    hasGetIsCompleted: typeof editorCoreStore?.getIsCompleted === 'function',
    // 추가 에디터 메서드 확인
    hasGetContainers: typeof editorCoreStore?.getContainers === 'function',
    hasGetParagraphs: typeof editorCoreStore?.getParagraphs === 'function',
    hasGetSectionInputs:
      typeof editorCoreStore?.getSectionInputs === 'function',
    hasGetValidSectionInputs:
      typeof editorCoreStore?.getValidSectionInputs === 'function',
    // Phase 4: 실시간 동기화 상태
    syncState: realTimeSyncState,
    timestamp: new Date().toISOString(),
  });

  // 🚨 스토어 연결 실패 시 에러 처리 (early return 사용)
  if (!multiStepFormStore || typeof formDataGetter !== 'function') {
    console.error('❌ [STORE_CONNECTION_PHASE4] multiStepFormStore 연결 실패');
    return {
      formData: null,
      customGalleryViews: [],
      editorContainers: [],
      editorParagraphs: [],
      editorCompletedContent: '',
      isEditorCompleted: false,
      isLoading: false,
      error: 'multiStepFormStore 연결 실패',
      lastUpdated: null,
      syncState: realTimeSyncState,
    };
  }

  if (!editorCoreStore) {
    console.error('❌ [STORE_CONNECTION_PHASE4] editorCoreStore 연결 실패');
    return {
      formData: null,
      customGalleryViews: [],
      editorContainers: [],
      editorParagraphs: [],
      editorCompletedContent: '',
      isEditorCompleted: false,
      isLoading: false,
      error: 'editorCoreStore 연결 실패',
      lastUpdated: null,
      syncState: realTimeSyncState,
    };
  }

  // 🆕 강화된 에디터 데이터 추출 함수 (타입 단언 완전 제거)
  const getEditorData = useCallback(() => {
    console.log('⚙️ [EDITOR_DATA_PHASE4] 에디터 데이터 추출 시작 (Phase 4)');

    // early return을 사용한 에러 처리
    if (!editorCoreStore) {
      console.warn('⚠️ [EDITOR_DATA_PHASE4] editorCoreStore가 없음');
      return {
        editorCompletedContent: '',
        isEditorCompleted: false,
        containerCount: 0,
        paragraphCount: 0,
        sectionInputCount: 0,
        validSectionInputCount: 0,
      };
    }

    // 구조분해할당과 fallback을 사용한 안전한 메서드 호출
    const {
      getCompletedContent = () => '',
      getIsCompleted = () => false,
      getContainers = () => [],
      getParagraphs = () => [],
      getSectionInputs = () => [],
      getValidSectionInputs = () => [],
    } = editorCoreStore;

    const editorCompletedContent = getCompletedContent();
    const isEditorCompleted = getIsCompleted();
    const containers = getContainers();
    const paragraphs = getParagraphs();
    const sectionInputs = getSectionInputs();
    const validSectionInputs = getValidSectionInputs();

    console.log('⚙️ [EDITOR_DATA_PHASE4] 에디터 데이터 추출 완료 (Phase 4):', {
      contentLength: editorCompletedContent?.length || 0,
      isCompleted: !!isEditorCompleted,
      containerCount: calculateArrayLength(containers),
      paragraphCount: calculateArrayLength(paragraphs),
      sectionInputCount: calculateArrayLength(sectionInputs),
      validSectionInputCount: calculateArrayLength(validSectionInputs),
      hasContainers: calculateArrayLength(containers) > 0,
      hasParagraphs: calculateArrayLength(paragraphs) > 0,
      timestamp: new Date().toISOString(),
    });

    return {
      editorCompletedContent: editorCompletedContent || '',
      isEditorCompleted: !!isEditorCompleted,
      containerCount: calculateArrayLength(containers),
      paragraphCount: calculateArrayLength(paragraphs),
      sectionInputCount: calculateArrayLength(sectionInputs),
      validSectionInputCount: calculateArrayLength(validSectionInputs),
    };
  }, [editorCoreStore]);

  // 🆕 Phase 4: 실시간 동기화 시스템 (BlogMediaStep 패턴 적용)
  useEffect(() => {
    console.log(
      '🔄 [REAL_TIME_SYNC_PHASE4] 실시간 동기화 시스템 활성화 (Phase 4)'
    );

    const syncSystem = createRealTimeSyncSystem();
    const stringComparer = syncSystem.createSafeStringComparer();

    const syncStoreToData = () => {
      if (!multiStepFormStore || typeof formDataGetter !== 'function') {
        return;
      }

      if (realTimeSyncState.syncInProgress) {
        return; // 이미 동기화 진행 중이면 스킵
      }

      try {
        setRealTimeSyncState((previousState) => ({
          ...previousState,
          syncInProgress: true,
        }));

        const currentStoreData = formDataGetter();
        const currentStoreDataString = JSON.stringify(currentStoreData);

        const hasStoreChanged = !stringComparer.compareStrings(
          currentStoreDataString,
          realTimeSyncState.lastKnownStoreData
        );

        if (hasStoreChanged) {
          const currentStringStats = stringComparer.calculateStringStats(
            currentStoreDataString
          );
          const previousStringStats = stringComparer.calculateStringStats(
            realTimeSyncState.lastKnownStoreData
          );

          console.log(
            '📊 [REAL_TIME_SYNC_PHASE4] 스토어 변경 감지 (Phase 4):',
            {
              previousDataLength: previousStringStats.length,
              currentDataLength: currentStringStats.length,
              previousHash: previousStringStats.hash,
              currentHash: currentStringStats.hash,
              changeDetected: hasStoreChanged,
              timestamp: new Date().toISOString(),
            }
          );

          setRealTimeSyncState((previousState) => ({
            ...previousState,
            lastKnownStoreData: currentStoreDataString,
            forceUpdateTrigger: previousState.forceUpdateTrigger + 1,
            lastSyncTime: Date.now(),
            syncInProgress: false,
          }));
        } else {
          setRealTimeSyncState((previousState) => ({
            ...previousState,
            syncInProgress: false,
          }));
        }
      } catch (syncError) {
        const safeErrorMessage = extractSafeErrorMessage(syncError);
        console.error(
          '❌ [REAL_TIME_SYNC_PHASE4] 동기화 실패 (Phase 4):',
          safeErrorMessage
        );

        setRealTimeSyncState((previousState) => ({
          ...previousState,
          syncInProgress: false,
          syncErrorCount: previousState.syncErrorCount + 1,
        }));
      }
    };

    // 200ms마다 동기화 확인 (BlogMediaStep과 동일한 간격)
    const syncInterval = setInterval(syncStoreToData, 200);

    console.log(
      '✅ [REAL_TIME_SYNC_PHASE4] 실시간 동기화 활성화 완료 (200ms 간격, Phase 4)'
    );

    return () => {
      clearInterval(syncInterval);
      console.log('🔄 [REAL_TIME_SYNC_PHASE4] 실시간 동기화 해제 (Phase 4)');
    };
  }, [
    multiStepFormStore,
    formDataGetter,
    realTimeSyncState.lastKnownStoreData,
    realTimeSyncState.syncInProgress,
  ]);

  // 📋 강화된 폼 데이터 메모이제이션 (Phase 4: forceUpdateTrigger 의존성 추가)
  const formData = useMemo((): FormData | null => {
    console.log(
      '📋 [STORE_DATA_PHASE4] 폼 데이터 메모이제이션 시작 (Phase 4: 실시간 동기화 적용)'
    );

    // early return을 사용한 검증
    if (typeof formDataGetter !== 'function') {
      console.warn('⚠️ [STORE_DATA_PHASE4] 폼 데이터 getter 함수 없음');
      return null;
    }

    try {
      const rawFormData = formDataGetter();

      // early return을 사용한 유효성 검사
      if (rawFormData === null || rawFormData === undefined) {
        console.warn('⚠️ [STORE_DATA_PHASE4] 폼 데이터 없음');
        return null;
      }

      console.log('📊 [STORE_DATA_PHASE4] Raw 폼 데이터 상태 (Phase 4):', {
        hasValidRawFormData: !!rawFormData,
        rawFormDataType: typeof rawFormData,
        rawFormDataKeys: extractSafeObjectKeys(rawFormData),
        forceUpdateTrigger: realTimeSyncState.forceUpdateTrigger,
        timestamp: new Date().toISOString(),
      });

      // 타입 변환기 생성
      const typeConverters = createSafeTypeConverters();
      const {
        convertToSafeString,
        convertToSafeBoolean,
        convertToSafeStringArray,
        convertToSafeStringOrNull,
        convertToSafeNumber,
      } = typeConverters;

      // Reflect.get을 사용한 안전한 필드 추출
      const userImageValue = extractSafeProperty(rawFormData, 'userImage');
      const nicknameValue = extractSafeProperty(rawFormData, 'nickname');
      const emailPrefixValue = extractSafeProperty(rawFormData, 'emailPrefix');
      const emailDomainValue = extractSafeProperty(rawFormData, 'emailDomain');
      const bioValue = extractSafeProperty(rawFormData, 'bio');
      const titleValue = extractSafeProperty(rawFormData, 'title');
      const descriptionValue = extractSafeProperty(rawFormData, 'description');
      const mainImageValue = extractSafeProperty(rawFormData, 'mainImage');
      const mediaValue = extractSafeProperty(rawFormData, 'media');
      const sliderImagesValue = extractSafeProperty(
        rawFormData,
        'sliderImages'
      );

      // 각 필드별 상세 로깅
      console.log('🔍 [STORE_DATA_PHASE4] 각 필드별 상세 데이터 (Phase 4):', {
        // 사용자 정보
        userImage: userImageValue
          ? `있음(${convertToSafeString(userImageValue, '').length}자)`
          : '없음',
        nickname: convertToSafeString(nicknameValue, '') || '없음',
        emailPrefix: convertToSafeString(emailPrefixValue, '') || '없음',
        emailDomain: convertToSafeString(emailDomainValue, '') || '없음',
        bio: bioValue
          ? `있음(${convertToSafeString(bioValue, '').length}자)`
          : '없음',

        // 블로그 기본 정보
        title: convertToSafeString(titleValue, '') || '없음',
        description: convertToSafeString(descriptionValue, '') || '없음',

        // 미디어 정보
        mainImage: mainImageValue ? '있음' : '없음',
        mediaCount: calculateArrayLength(mediaValue),
        sliderImagesCount: calculateArrayLength(sliderImagesValue),

        // Phase 4: 실시간 동기화 정보
        syncTrigger: realTimeSyncState.forceUpdateTrigger,
        timestamp: new Date().toISOString(),
      });

      // 강화된 에디터 데이터 추출 (타입 단언 완전 제거)
      const rawEditorData = getEditorData();
      const {
        editorCompletedContent: rawEditorContent,
        isEditorCompleted: rawIsCompleted,
        containerCount: rawContainerCount,
        paragraphCount: rawParagraphCount,
        sectionInputCount: rawSectionInputCount,
        validSectionInputCount: rawValidSectionInputCount,
      } = rawEditorData;

      // 타입 안전한 에디터 데이터 변환
      const editorCompletedContent = convertToSafeString(rawEditorContent, '');
      const isEditorCompleted = convertToSafeBoolean(rawIsCompleted, false);
      const containerCount = convertToSafeNumber(rawContainerCount, 0);
      const paragraphCount = convertToSafeNumber(rawParagraphCount, 0);
      const sectionInputCount = convertToSafeNumber(rawSectionInputCount, 0);
      const validSectionInputCount = convertToSafeNumber(
        rawValidSectionInputCount,
        0
      );

      console.log(
        '📝 [STORE_DATA_PHASE4] 에디터 메타데이터 (타입 안전, Phase 4):',
        {
          editorContentLength: editorCompletedContent.length,
          isEditorCompleted,
          containerCount,
          paragraphCount,
          sectionInputCount,
          validSectionInputCount,
          timestamp: new Date().toISOString(),
        }
      );

      // 확장된 FormData 생성 (16개 필드, 타입 단언 완전 제거)
      const processedFormData: FormData = {
        // 기존 12개 필드 - 삼항연산자 사용
        userImage:
          userImageValue !== undefined
            ? convertToSafeString(userImageValue, '') || undefined
            : undefined,
        nickname: convertToSafeString(nicknameValue, ''),
        emailPrefix: convertToSafeString(emailPrefixValue, ''),
        emailDomain: convertToSafeString(emailDomainValue, ''),
        bio:
          bioValue !== undefined
            ? convertToSafeString(bioValue, '') || undefined
            : undefined,
        title: convertToSafeString(titleValue, ''),
        description: convertToSafeString(descriptionValue, ''),
        mainImage: convertToSafeStringOrNull(mainImageValue),
        media: convertToSafeStringArray(mediaValue, undefined),
        sliderImages: convertToSafeStringArray(sliderImagesValue, undefined),
        editorCompletedContent,
        isEditorCompleted,
        // 추가된 4개 에디터 메타데이터 필드
        editorContainerCount: containerCount,
        editorParagraphCount: paragraphCount,
        editorSectionInputCount: sectionInputCount,
        editorValidSectionInputCount: validSectionInputCount,
      };

      console.log(
        '✅ [STORE_DATA_PHASE4] 최종 처리된 폼 데이터 (16개 필드, 타입 단언 완전 제거, Phase 4):',
        {
          // 기존 필드 정보
          hasUserImage: !!processedFormData.userImage,
          hasNickname: !!processedFormData.nickname,
          hasEmailPrefix: !!processedFormData.emailPrefix,
          hasEmailDomain: !!processedFormData.emailDomain,
          hasBio: !!processedFormData.bio,
          hasTitle: !!processedFormData.title,
          hasDescription: !!processedFormData.description,
          hasMainImage: !!processedFormData.mainImage,
          mediaCount: calculateArrayLength(processedFormData.media),
          sliderImagesCount: calculateArrayLength(
            processedFormData.sliderImages
          ),
          editorContentLength: processedFormData.editorCompletedContent.length,
          isEditorCompleted: processedFormData.isEditorCompleted,
          // 추가된 에디터 메타데이터 정보
          editorContainerCount: processedFormData.editorContainerCount,
          editorParagraphCount: processedFormData.editorParagraphCount,
          editorSectionInputCount: processedFormData.editorSectionInputCount,
          editorValidSectionInputCount:
            processedFormData.editorValidSectionInputCount,
          totalFields: extractSafeObjectKeys(processedFormData).length,
          // Phase 4: 실시간 동기화 정보
          syncTrigger: realTimeSyncState.forceUpdateTrigger,
          timestamp: new Date().toISOString(),
        }
      );

      return processedFormData;
    } catch (formDataError) {
      console.error(
        '❌ [STORE_DATA_PHASE4] 폼 데이터 처리 실패 (Phase 4):',
        extractSafeErrorMessage(formDataError)
      );
      return null;
    }
  }, [formDataGetter, getEditorData, realTimeSyncState.forceUpdateTrigger]);

  // 📝 강화된 에디터 완료 콘텐츠 메모이제이션 (타입 단언 완전 제거)
  const editorCompletedContent = useMemo(() => {
    console.log(
      '📝 [STORE_DATA_PHASE4] 에디터 완료 콘텐츠 메모이제이션 (Phase 4)'
    );

    // early return을 사용한 검증
    if (!editorCoreStore) {
      console.warn('⚠️ [STORE_DATA_PHASE4] 에디터 스토어 없음');
      return '';
    }

    // 구조분해할당과 fallback을 사용한 안전한 메서드 접근
    const { getCompletedContent = () => '' } = editorCoreStore;

    if (typeof getCompletedContent !== 'function') {
      console.warn('⚠️ [STORE_DATA_PHASE4] 에디터 완료 콘텐츠 getter 없음');
      return '';
    }

    try {
      const completedContent = getCompletedContent();
      const typeConverters = createSafeTypeConverters();
      const { convertToSafeString } = typeConverters;
      const validCompletedContent = convertToSafeString(completedContent, '');

      console.log('✅ [STORE_DATA_PHASE4] 에디터 완료 콘텐츠 처리 (Phase 4):', {
        contentLength: validCompletedContent.length,
        hasContent: validCompletedContent.length > 0,
        syncTrigger: realTimeSyncState.forceUpdateTrigger,
        timestamp: new Date().toISOString(),
      });

      return validCompletedContent;
    } catch (contentError) {
      console.error(
        '❌ [STORE_DATA_PHASE4] 에디터 콘텐츠 추출 실패:',
        extractSafeErrorMessage(contentError)
      );
      return '';
    }
  }, [editorCoreStore, realTimeSyncState.forceUpdateTrigger]);

  // ✅ 강화된 에디터 완료 상태 메모이제이션 (타입 단언 완전 제거)
  const isEditorCompleted = useMemo(() => {
    console.log(
      '✅ [STORE_DATA_PHASE4] 에디터 완료 상태 메모이제이션 (Phase 4)'
    );

    // early return을 사용한 검증
    if (!editorCoreStore) {
      console.warn('⚠️ [STORE_DATA_PHASE4] 에디터 스토어 없음');
      return false;
    }

    // 구조분해할당과 fallback을 사용한 안전한 메서드 접근
    const { getIsCompleted = () => false } = editorCoreStore;

    if (typeof getIsCompleted !== 'function') {
      console.warn('⚠️ [STORE_DATA_PHASE4] 에디터 완료 상태 getter 없음');
      return false;
    }

    try {
      const completedStatus = getIsCompleted();
      const typeConverters = createSafeTypeConverters();
      const { convertToSafeBoolean } = typeConverters;
      const validCompletedStatus = convertToSafeBoolean(completedStatus, false);

      console.log('✅ [STORE_DATA_PHASE4] 에디터 완료 상태 처리 (Phase 4):', {
        isCompleted: validCompletedStatus,
        syncTrigger: realTimeSyncState.forceUpdateTrigger,
        timestamp: new Date().toISOString(),
      });

      return validCompletedStatus;
    } catch (statusError) {
      console.error(
        '❌ [STORE_DATA_PHASE4] 에디터 상태 추출 실패:',
        extractSafeErrorMessage(statusError)
      );
      return false;
    }
  }, [editorCoreStore, realTimeSyncState.forceUpdateTrigger]);

  // 🎨 기존 코드와의 호환성을 위한 임시 데이터들
  const customGalleryViews = useMemo(() => {
    console.log(
      '🎨 [STORE_DATA_PHASE4] 커스텀 갤러리 뷰 메모이제이션 (임시 빈 배열, Phase 4)'
    );
    const emptyGalleryViews: CustomGalleryView[] = [];
    return emptyGalleryViews;
  }, []);

  // 🔧 강화된 에디터 컨테이너 메모이제이션 (타입 단언 완전 제거)
  const editorContainers = useMemo((): SafeEditorContainer[] => {
    console.log(
      '📦 [STORE_DATA_PHASE4] 에디터 컨테이너 메모이제이션 (타입 단언 완전 제거, Phase 4)'
    );

    try {
      // 구조분해할당과 fallback을 사용한 안전한 메서드 접근
      const { getContainers = () => [] } = editorCoreStore || {};

      if (typeof getContainers !== 'function') {
        console.warn('⚠️ [STORE_DATA_PHASE4] 에디터 컨테이너 getter 없음');
        return [];
      }

      const rawContainers = getContainers();

      // early return을 사용한 유효성 검사
      if (!Array.isArray(rawContainers)) {
        console.warn('⚠️ [STORE_DATA_PHASE4] 유효하지 않은 컨테이너 데이터');
        return [];
      }

      const typeConverters = createSafeTypeConverters();
      const { convertToSafeEditorContainer } = typeConverters;
      const safeContainers: SafeEditorContainer[] = [];

      for (let i = 0; i < rawContainers.length; i++) {
        const rawContainer = rawContainers[i];
        const safeContainer = convertToSafeEditorContainer(rawContainer);

        // 삼항연산자를 사용한 조건부 추가
        safeContainer !== null ? safeContainers.push(safeContainer) : undefined;
      }

      console.log(
        '✅ [STORE_DATA_PHASE4] 에디터 컨테이너 변환 성공 (Phase 4):',
        {
          rawCount: rawContainers.length,
          safeCount: safeContainers.length,
          containerIds: safeContainers.map((c) => c.id),
          syncTrigger: realTimeSyncState.forceUpdateTrigger,
        }
      );

      return safeContainers;
    } catch (containerError) {
      console.error(
        '❌ [STORE_DATA_PHASE4] 에디터 컨테이너 추출 실패:',
        extractSafeErrorMessage(containerError)
      );
      return [];
    }
  }, [editorCoreStore, realTimeSyncState.forceUpdateTrigger]);

  // 🔧 강화된 에디터 단락 메모이제이션 (타입 단언 완전 제거)
  const editorParagraphs = useMemo((): SafeEditorParagraph[] => {
    console.log(
      '📄 [STORE_DATA_PHASE4] 에디터 단락 메모이제이션 (타입 단언 완전 제거, Phase 4)'
    );

    try {
      // 구조분해할당과 fallback을 사용한 안전한 메서드 접근
      const { getParagraphs = () => [] } = editorCoreStore || {};

      if (typeof getParagraphs !== 'function') {
        console.warn('⚠️ [STORE_DATA_PHASE4] 에디터 단락 getter 없음');
        return [];
      }

      const rawParagraphs = getParagraphs();

      // early return을 사용한 유효성 검사
      if (!Array.isArray(rawParagraphs)) {
        console.warn('⚠️ [STORE_DATA_PHASE4] 유효하지 않은 단락 데이터');
        return [];
      }

      const typeConverters = createSafeTypeConverters();
      const { convertToSafeEditorParagraph } = typeConverters;
      const safeParagraphs: SafeEditorParagraph[] = [];

      for (let i = 0; i < rawParagraphs.length; i++) {
        const rawParagraph = rawParagraphs[i];
        const safeParagraph = convertToSafeEditorParagraph(rawParagraph);

        // 삼항연산자를 사용한 조건부 추가
        safeParagraph !== null ? safeParagraphs.push(safeParagraph) : undefined;
      }

      console.log('✅ [STORE_DATA_PHASE4] 에디터 단락 변환 성공 (Phase 4):', {
        rawCount: rawParagraphs.length,
        safeCount: safeParagraphs.length,
        paragraphIds: safeParagraphs.map((p) => p.id),
        syncTrigger: realTimeSyncState.forceUpdateTrigger,
      });

      return safeParagraphs;
    } catch (paragraphError) {
      console.error(
        '❌ [STORE_DATA_PHASE4] 에디터 단락 추출 실패:',
        extractSafeErrorMessage(paragraphError)
      );
      return [];
    }
  }, [editorCoreStore, realTimeSyncState.forceUpdateTrigger]);

  // 🎯 강화된 최종 데이터 반환 (16개 필드 검증 포함, 타입 단언 완전 제거, Phase 4 실시간 동기화)
  const finalData = useMemo((): UseStoreDataReturn => {
    console.log(
      '🎯 [STORE_DATA_PHASE4] 최종 데이터 반환 객체 생성 (타입 단언 완전 제거, Phase 4 실시간 동기화)'
    );

    // early return을 사용한 성공 케이스 처리
    if (formData === null) {
      console.error(
        '🚨 [STORE_DATA_PHASE4] 심각한 문제: 폼 데이터를 가져올 수 없습니다! (Phase 4)'
      );
      console.error('🔍 [STORE_DATA_PHASE4] 디버깅 정보 (Phase 4):', {
        hasMultiStepFormStore: !!multiStepFormStore,
        hasFormDataGetter: typeof formDataGetter === 'function',
        hasEditorCoreStore: !!editorCoreStore,
        syncState: realTimeSyncState,
      });

      const errorResult: UseStoreDataReturn = {
        formData: null,
        customGalleryViews: [],
        editorContainers: [],
        editorParagraphs: [],
        editorCompletedContent: '',
        isEditorCompleted: false,
        isLoading: false,
        error: '폼 데이터 로드 실패',
        lastUpdated: null,
        syncState: realTimeSyncState,
      };

      console.log(
        '❌ [STORE_DATA_PHASE4] 최종 데이터 반환 완료 (실패, Phase 4):',
        {
          error: errorResult.error,
          timestamp: new Date().toISOString(),
        }
      );

      return errorResult;
    }

    // 성공 케이스
    const result: UseStoreDataReturn = {
      formData,
      customGalleryViews,
      editorContainers,
      editorParagraphs,
      editorCompletedContent,
      isEditorCompleted,
      isLoading: false,
      error: null,
      lastUpdated: new Date(),
      syncState: realTimeSyncState,
    };

    // 안전한 필드 개수 추출 및 검증
    const formDataKeys = extractSafeObjectKeys(formData);
    const fieldCount = formDataKeys.length;

    // Phase 4: 실시간 동기화 상태 통계
    const syncSystem = createRealTimeSyncSystem();
    const syncStats = syncSystem.calculateSyncStateStats(realTimeSyncState);

    console.log(
      '✅ [STORE_DATA_PHASE4] 최종 데이터 반환 완료 (성공, 타입 단언 완전 제거, Phase 4):',
      {
        hasFormData: !!result.formData,
        formDataFieldCount: fieldCount,
        formDataFields: formDataKeys,
        customGalleryViewsCount: result.customGalleryViews.length,
        editorContainersCount: result.editorContainers.length,
        editorParagraphsCount: result.editorParagraphs.length,
        editorContentLength: result.editorCompletedContent.length,
        isEditorCompleted: result.isEditorCompleted,
        // 에디터 메타데이터 로깅
        editorContainerCount: result.formData?.editorContainerCount || 0,
        editorParagraphCount: result.formData?.editorParagraphCount || 0,
        editorSectionInputCount: result.formData?.editorSectionInputCount || 0,
        editorValidSectionInputCount:
          result.formData?.editorValidSectionInputCount || 0,
        isLoading: result.isLoading,
        hasError: !!result.error,
        lastUpdated: result.lastUpdated?.toISOString(),
        // Phase 4: 실시간 동기화 상태
        syncState: result.syncState,
        syncStats,
        timestamp: new Date().toISOString(),
      }
    );

    // 필드 개수 검증 (16개 필드 기대)
    const expectedFieldCount = 16;
    const isCorrectFieldCount = fieldCount === expectedFieldCount;

    // 삼항연산자를 사용한 로깅
    isCorrectFieldCount
      ? console.log(
          '✅ [STORE_DATA_PHASE4] 필드 개수 검증 통과 (16개 필드 완료, Phase 4)'
        )
      : console.warn(
          '⚠️ [STORE_DATA_PHASE4] 예상과 다른 필드 개수 (Phase 4):',
          {
            expected: expectedFieldCount,
            actual: fieldCount,
            fields: formDataKeys,
            missingFields:
              fieldCount < expectedFieldCount
                ? 'Phase 4 필드 누락 가능성'
                : 'Phase 4 추가 필드 존재',
          }
        );

    return result;
  }, [
    formData,
    customGalleryViews,
    editorContainers,
    editorParagraphs,
    editorCompletedContent,
    isEditorCompleted,
    multiStepFormStore,
    formDataGetter,
    editorCoreStore,
    realTimeSyncState,
  ]);

  return finalData;
}
