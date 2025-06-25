// bridges/editorMultiStepBridge/editorMultiStepBridge.ts

// 🔧 올바른 타입 import 추가
import {
  EditorStateSnapshotForBridge,
  SnapshotMetadata,
} from './bridgeDataTypes';
import { Container, ParagraphBlock } from '../../store/shared/commonTypes';
import { createEditorStateExtractor } from './editorDataExtractor';

// 🎯 editorStateExtractor에서 함수들 가져오기
const editorStateExtractor = createEditorStateExtractor();

// 🔧 타입 에러 수정 예시 - 1053번째 줄 근처 (snapshotMetadata 타입 에러 해결)
export function createBridgeOperations() {
  const extractEditorStateForBridge =
    (): EditorStateSnapshotForBridge | null => {
      const extractionStartTime = performance.now();

      try {
        // editorStateExtractor에서 데이터 추출
        const extractedStateData = editorStateExtractor.extractEditorState();

        const isNullExtractedData = !extractedStateData;

        // Early Return: 추출된 데이터가 null인 경우
        if (isNullExtractedData) {
          return null;
        }

        const extractionEndTime = performance.now();

        // 🔧 올바른 SnapshotMetadata 객체 생성 (Map이 아님)
        const snapshotMetadata: SnapshotMetadata = {
          extractionTimestamp: Date.now(),
          processingDurationMs: extractionEndTime - extractionStartTime,
          validationStatus: true,
          dataIntegrity: true,
          sourceInfo: {
            coreStoreVersion: '1.0.0',
            uiStoreVersion: '1.0.0',
          },
        };

        // 🎯 타입 안전한 할당 (1053번째 줄 근처 수정)
        const bridgeSnapshot: EditorStateSnapshotForBridge = {
          ...extractedStateData,
          snapshotMetadata: snapshotMetadata, // ✅ 올바른 객체 타입으로 할당
        };

        return bridgeSnapshot;
      } catch (bridgeExtractionError) {
        console.error('❌ Bridge 상태 추출 실패:', bridgeExtractionError);
        return null;
      }
    };

  // 🔧 boolean 속성 에러 수정 - 67번째 줄 근처
  const validateBridgeContainers = (
    containersForValidation: readonly Container[] // readonly 입력
  ): boolean => {
    try {
      // 🎯 readonly 배열을 mutable 배열로 안전하게 변환
      const mutableContainersArray = [...containersForValidation]; // ✅ 타입 호환성 해결

      // 🔧 validateDataStructure 함수 올바른 사용 (67번째 줄 수정)
      const validationResult = editorStateExtractor.validateDataStructure(
        mutableContainersArray, // ✅ 변환된 mutable 배열 전달
        [] // 빈 문단 배열
      );

      // ✅ ValidationResultDataInfo 객체에서 isValid 속성 접근
      const isValidResult =
        typeof validationResult === 'object' &&
        validationResult !== null &&
        'isValid' in validationResult;

      // Early Return: 유효하지 않은 결과 객체인 경우
      if (!isValidResult) {
        console.error('❌ 검증 결과가 유효하지 않음');
        return false;
      }

      return Boolean(validationResult.isValid); // 이제 올바르게 작동함
    } catch (validationError) {
      console.error('❌ 컨테이너 검증 실패:', validationError);
      return false;
    }
  };

  // 🔧 boolean 속성 에러 수정 - 87번째 줄 근처
  const validateBridgeParagraphs = (
    paragraphsForValidation: readonly ParagraphBlock[] // readonly 입력
  ): boolean => {
    try {
      // 🎯 readonly 배열을 mutable 배열로 안전하게 변환
      const mutableParagraphsArray = [...paragraphsForValidation]; // ✅ 타입 호환성 해결

      // 🔧 validateDataStructure 함수 올바른 사용 (87번째 줄 수정)
      const validationResult = editorStateExtractor.validateDataStructure(
        [], // 빈 컨테이너 배열
        mutableParagraphsArray // ✅ 변환된 mutable 배열 전달
      );

      // ✅ ValidationResultDataInfo 객체에서 isValid 속성 접근
      const isValidResult =
        typeof validationResult === 'object' &&
        validationResult !== null &&
        'isValid' in validationResult;

      // Early Return: 유효하지 않은 결과 객체인 경우
      if (!isValidResult) {
        console.error('❌ 검증 결과가 유효하지 않음');
        return false;
      }

      return Boolean(validationResult.isValid); // 이제 올바르게 작동함
    } catch (validationError) {
      console.error('❌ 문단 검증 실패:', validationError);
      return false;
    }
  };

  const processBridgeData = (bridgeInputData: {
    readonly containers: readonly Container[];
    readonly paragraphs: readonly ParagraphBlock[];
  }) => {
    // 🔧 구조분해할당으로 readonly 데이터 추출
    const {
      containers: readonlyContainerList,
      paragraphs: readonlyParagraphList,
    } = bridgeInputData;

    // 🎯 안전한 배열 변환
    const mutableContainerList = [...readonlyContainerList]; // ✅ 타입 변환
    const mutableParagraphList = [...readonlyParagraphList]; // ✅ 타입 변환

    // 검증 및 처리
    const containerValidationResult = validateBridgeContainers(
      readonlyContainerList
    );
    const paragraphValidationResult = validateBridgeParagraphs(
      readonlyParagraphList
    );

    const isValidContainers = containerValidationResult ? true : false;
    const isValidParagraphs = paragraphValidationResult ? true : false;
    const overallValidation = isValidContainers && isValidParagraphs;

    // Early Return: 검증 실패인 경우
    if (!overallValidation) {
      throw new Error('Bridge 데이터 검증 실패');
    }

    // 콘텐츠 생성
    const generatedContent = editorStateExtractor.generateContentFromState(
      mutableContainerList, // ✅ mutable 배열 전달
      mutableParagraphList // ✅ mutable 배열 전달
    );

    return {
      success: true,
      content: generatedContent,
      containerCount: mutableContainerList.length,
      paragraphCount: mutableParagraphList.length,
    };
  };

  // 🎯 추가적인 유틸리티 함수들
  const createSnapshot = (
    containerList: readonly Container[],
    paragraphList: readonly ParagraphBlock[]
  ): EditorStateSnapshotForBridge | null => {
    try {
      // 안전한 배열 변환
      const mutableContainerList = [...containerList];
      const mutableParagraphList = [...paragraphList];

      // 메타데이터 생성
      const snapshotMetadata: SnapshotMetadata = {
        extractionTimestamp: Date.now(),
        processingDurationMs: 0,
        validationStatus: true,
        dataIntegrity:
          mutableContainerList.length > 0 || mutableParagraphList.length > 0,
        sourceInfo: {
          coreStoreVersion: '1.0.0',
          uiStoreVersion: '1.0.0',
        },
      };

      // 스냅샷 생성
      const createdSnapshot: EditorStateSnapshotForBridge = {
        editorContainers: containerList, // readonly 배열 그대로 할당 (인터페이스가 readonly이므로 호환)
        editorParagraphs: paragraphList, // readonly 배열 그대로 할당
        editorCompletedContent: '',
        editorIsCompleted: false,
        editorActiveParagraphId: null,
        editorSelectedParagraphIds: [],
        editorIsPreviewOpen: false,
        extractedTimestamp: Date.now(),
        snapshotMetadata: snapshotMetadata, // ✅ 올바른 객체 타입
      };

      return createdSnapshot;
    } catch (snapshotError) {
      console.error('❌ 스냅샷 생성 실패:', snapshotError);
      return null;
    }
  };

  // 🔧 추가적인 검증 함수 - 더 구체적인 정보 제공
  const validateBridgeDataWithDetails = (bridgeInputData: {
    readonly containers: readonly Container[];
    readonly paragraphs: readonly ParagraphBlock[];
  }) => {
    const {
      containers: readonlyContainerList,
      paragraphs: readonlyParagraphList,
    } = bridgeInputData;

    // 안전한 배열 변환
    const mutableContainerList = [...readonlyContainerList];
    const mutableParagraphList = [...readonlyParagraphList];

    // 🎯 전체 검증 결과 반환 (boolean이 아닌 상세 정보)
    const validationResult = editorStateExtractor.validateDataStructure(
      mutableContainerList,
      mutableParagraphList
    );

    const isValidResult =
      typeof validationResult === 'object' &&
      validationResult !== null &&
      'isValid' in validationResult &&
      'containerCount' in validationResult &&
      'paragraphCount' in validationResult;

    // Early Return: 유효하지 않은 결과인 경우
    if (!isValidResult) {
      return {
        isValid: false,
        containerCount: 0,
        paragraphCount: 0,
        hasContainers: false,
        hasParagraphs: false,
        hasAnyContent: false,
      };
    }

    const { isValid, containerCount, paragraphCount } = validationResult;

    return {
      isValid: isValid,
      containerCount: containerCount,
      paragraphCount: paragraphCount,
      hasContainers: containerCount > 0,
      hasParagraphs: paragraphCount > 0,
      hasAnyContent: containerCount > 0 || paragraphCount > 0,
    };
  };

  return {
    extractEditorStateForBridge,
    validateBridgeContainers,
    validateBridgeParagraphs,
    processBridgeData,
    createSnapshot,
    validateBridgeDataWithDetails, // 🎯 추가된 상세 검증 함수
  };
}

// 🚀 Bridge 인스턴스 생성 및 내보내기
export const editorMultiStepBridge = createBridgeOperations();

// 🔧 추가적인 유틸리티 함수들
export function createBridgeHelpers() {
  // readonly 배열을 안전하게 mutable 배열로 변환하는 헬퍼
  const convertReadonlyToMutable = <T>(readonlyArray: readonly T[]): T[] => {
    return [...readonlyArray];
  };

  // 스냅샷 메타데이터 생성 헬퍼
  const createMetadata = (
    startTime: number,
    endTime: number,
    isValid: boolean,
    hasData: boolean
  ): SnapshotMetadata => {
    return {
      extractionTimestamp: Date.now(),
      processingDurationMs: endTime - startTime,
      validationStatus: isValid,
      dataIntegrity: hasData,
      sourceInfo: {
        coreStoreVersion: '1.0.0',
        uiStoreVersion: '1.0.0',
      },
    };
  };

  // 🔧 배열 검증 헬퍼 - 디버깅용
  const validateArrayStructure = <T>(
    arrayToValidate: readonly T[],
    arrayName: string
  ): { isValid: boolean; count: number; isEmpty: boolean } => {
    console.log(`🔍 [BRIDGE_HELPER] ${arrayName} 검증 시작`);

    const isValidArray = Array.isArray(arrayToValidate);
    const arrayCount = isValidArray ? arrayToValidate.length : 0;
    const isEmptyArray = arrayCount === 0;

    console.log(`📊 [BRIDGE_HELPER] ${arrayName} 결과:`, {
      isValid: isValidArray,
      count: arrayCount,
      isEmpty: isEmptyArray,
    });

    return {
      isValid: isValidArray,
      count: arrayCount,
      isEmpty: isEmptyArray,
    };
  };

  return {
    convertReadonlyToMutable,
    createMetadata,
    validateArrayStructure, // 🎯 추가된 배열 검증 헬퍼
  };
}

// 🎯 타입 안전성을 위한 추가 타입 가드 - 모든 타입 단언 제거
export function createBridgeTypeGuards() {
  // ✅ 완전히 안전한 타입 가드 - 모든 타입 단언 제거
  const isValidSnapshot = (
    candidateSnapshot: unknown
  ): candidateSnapshot is EditorStateSnapshotForBridge => {
    const isNullOrUndefined = !candidateSnapshot;

    // Early Return: null 또는 undefined인 경우
    if (isNullOrUndefined) {
      return false;
    }

    const isObjectType = typeof candidateSnapshot === 'object';

    // Early Return: 객체가 아닌 경우
    if (!isObjectType) {
      return false;
    }

    // 🔧 필수 속성 존재 확인
    const hasEditorContainers = 'editorContainers' in candidateSnapshot;
    const hasEditorParagraphs = 'editorParagraphs' in candidateSnapshot;
    const hasEditorCompletedContent =
      'editorCompletedContent' in candidateSnapshot;
    const hasEditorIsCompleted = 'editorIsCompleted' in candidateSnapshot;
    const hasExtractedTimestamp = 'extractedTimestamp' in candidateSnapshot;
    const hasSnapshotMetadata = 'snapshotMetadata' in candidateSnapshot;

    const hasAllRequiredProperties =
      hasEditorContainers &&
      hasEditorParagraphs &&
      hasEditorCompletedContent &&
      hasEditorIsCompleted &&
      hasExtractedTimestamp &&
      hasSnapshotMetadata;

    // Early Return: 필수 속성이 없는 경우
    if (!hasAllRequiredProperties) {
      return false;
    }

    // 🎯 Reflect.get()으로 타입 단언 완전 제거
    const editorContainers = Reflect.get(candidateSnapshot, 'editorContainers');
    const editorParagraphs = Reflect.get(candidateSnapshot, 'editorParagraphs');
    const editorCompletedContent = Reflect.get(
      candidateSnapshot,
      'editorCompletedContent'
    );
    const editorIsCompleted = Reflect.get(
      candidateSnapshot,
      'editorIsCompleted'
    );
    const extractedTimestamp = Reflect.get(
      candidateSnapshot,
      'extractedTimestamp'
    );

    const isValidContainers = Array.isArray(editorContainers);
    const isValidParagraphs = Array.isArray(editorParagraphs);
    const isValidContent = typeof editorCompletedContent === 'string';
    const isValidCompleted = typeof editorIsCompleted === 'boolean';
    const isValidTimestamp = typeof extractedTimestamp === 'number';

    const hasValidTypes =
      isValidContainers &&
      isValidParagraphs &&
      isValidContent &&
      isValidCompleted &&
      isValidTimestamp;

    // Early Return: 타입이 유효하지 않은 경우
    if (!hasValidTypes) {
      return false;
    }

    const snapshotMetadata = Reflect.get(candidateSnapshot, 'snapshotMetadata');
    const isValidMetadata =
      snapshotMetadata && typeof snapshotMetadata === 'object';

    // Early Return: 메타데이터가 유효하지 않은 경우
    if (!isValidMetadata) {
      return false;
    }

    return true;
  };

  // ✅ 완전히 안전한 메타데이터 타입 가드
  const isValidMetadata = (
    candidateMetadata: unknown
  ): candidateMetadata is SnapshotMetadata => {
    const isNullOrUndefined = !candidateMetadata;

    // Early Return: null 또는 undefined인 경우
    if (isNullOrUndefined) {
      return false;
    }

    const isObjectType = typeof candidateMetadata === 'object';

    // Early Return: 객체가 아닌 경우
    if (!isObjectType) {
      return false;
    }

    // 🔧 필수 속성 존재 확인
    const hasExtractionTimestamp = 'extractionTimestamp' in candidateMetadata;
    const hasProcessingDurationMs = 'processingDurationMs' in candidateMetadata;
    const hasValidationStatus = 'validationStatus' in candidateMetadata;
    const hasDataIntegrity = 'dataIntegrity' in candidateMetadata;
    const hasSourceInfo = 'sourceInfo' in candidateMetadata;

    const hasAllRequiredProperties =
      hasExtractionTimestamp &&
      hasProcessingDurationMs &&
      hasValidationStatus &&
      hasDataIntegrity &&
      hasSourceInfo;

    // Early Return: 필수 속성이 없는 경우
    if (!hasAllRequiredProperties) {
      return false;
    }

    // 🎯 Reflect.get()으로 타입 단언 완전 제거
    const extractionTimestamp = Reflect.get(
      candidateMetadata,
      'extractionTimestamp'
    );
    const processingDurationMs = Reflect.get(
      candidateMetadata,
      'processingDurationMs'
    );
    const validationStatus = Reflect.get(candidateMetadata, 'validationStatus');
    const dataIntegrity = Reflect.get(candidateMetadata, 'dataIntegrity');

    const isValidTimestamp = typeof extractionTimestamp === 'number';
    const isValidDuration = typeof processingDurationMs === 'number';
    const isValidStatus = typeof validationStatus === 'boolean';
    const isValidIntegrity = typeof dataIntegrity === 'boolean';

    const hasValidPrimitiveTypes =
      isValidTimestamp && isValidDuration && isValidStatus && isValidIntegrity;

    // Early Return: 원시 타입이 유효하지 않은 경우
    if (!hasValidPrimitiveTypes) {
      return false;
    }

    const sourceInfo = Reflect.get(candidateMetadata, 'sourceInfo');
    const isValidSourceInfo = sourceInfo && typeof sourceInfo === 'object';

    // Early Return: sourceInfo가 유효하지 않은 경우
    if (!isValidSourceInfo) {
      return false;
    }

    const hasCoreStoreVersion = 'coreStoreVersion' in sourceInfo;
    const hasUIStoreVersion = 'uiStoreVersion' in sourceInfo;

    // Early Return: sourceInfo 속성이 없는 경우
    if (!hasCoreStoreVersion || !hasUIStoreVersion) {
      return false;
    }

    const coreStoreVersion = Reflect.get(sourceInfo, 'coreStoreVersion');
    const uiStoreVersion = Reflect.get(sourceInfo, 'uiStoreVersion');

    const isValidCoreVersion = typeof coreStoreVersion === 'string';
    const isValidUIVersion = typeof uiStoreVersion === 'string';

    const hasValidVersions = isValidCoreVersion && isValidUIVersion;

    return hasValidVersions;
  };

  // 🔧 ValidationResultDataInfo 타입 가드 - 타입 단언 완전 제거
  const isValidationResult = (
    candidateResult: unknown
  ): candidateResult is {
    isValid: boolean;
    containerCount: number;
    paragraphCount: number;
  } => {
    const isNullOrUndefined = !candidateResult;

    // Early Return: null 또는 undefined인 경우
    if (isNullOrUndefined) {
      return false;
    }

    const isObjectType = typeof candidateResult === 'object';

    // Early Return: 객체가 아닌 경우
    if (!isObjectType) {
      return false;
    }

    // 🎯 필수 속성 존재 확인
    const hasIsValid = 'isValid' in candidateResult;
    const hasContainerCount = 'containerCount' in candidateResult;
    const hasParagraphCount = 'paragraphCount' in candidateResult;

    const hasAllRequiredProperties =
      hasIsValid && hasContainerCount && hasParagraphCount;

    // Early Return: 필수 속성이 없는 경우
    if (!hasAllRequiredProperties) {
      return false;
    }

    // 🔧 Reflect.get()으로 타입 단언 완전 제거
    const isValid = Reflect.get(candidateResult, 'isValid');
    const containerCount = Reflect.get(candidateResult, 'containerCount');
    const paragraphCount = Reflect.get(candidateResult, 'paragraphCount');

    const isValidBoolean = typeof isValid === 'boolean';
    const isValidContainerCount = typeof containerCount === 'number';
    const isValidParagraphCount = typeof paragraphCount === 'number';

    const hasValidTypes =
      isValidBoolean && isValidContainerCount && isValidParagraphCount;

    return hasValidTypes;
  };

  // 🎯 추가 타입 가드 - Container 배열 검증
  const isValidContainerArray = (
    candidateArray: unknown
  ): candidateArray is readonly Container[] => {
    const isArrayType = Array.isArray(candidateArray);

    // Early Return: 배열이 아닌 경우
    if (!isArrayType) {
      return false;
    }

    // 빈 배열은 유효함
    const isEmpty = candidateArray.length === 0;

    if (isEmpty) {
      return true;
    }

    // 각 요소가 Container 인터페이스를 만족하는지 확인
    const allElementsValid = candidateArray.every((arrayItem) => {
      const isNullOrUndefined = !arrayItem;

      if (isNullOrUndefined) {
        return false;
      }

      const isObjectType = typeof arrayItem === 'object';

      if (!isObjectType) {
        return false;
      }

      // Container의 필수 속성들 확인 - Reflect.get() 사용
      const hasId = 'id' in arrayItem;
      const idValue = hasId ? Reflect.get(arrayItem, 'id') : null;
      const isValidId = typeof idValue === 'string';

      return isValidId;
    });

    return allElementsValid;
  };

  // 🎯 추가 타입 가드 - ParagraphBlock 배열 검증
  const isValidParagraphArray = (
    candidateArray: unknown
  ): candidateArray is readonly ParagraphBlock[] => {
    const isArrayType = Array.isArray(candidateArray);

    // Early Return: 배열이 아닌 경우
    if (!isArrayType) {
      return false;
    }

    // 빈 배열은 유효함
    const isEmpty = candidateArray.length === 0;

    if (isEmpty) {
      return true;
    }

    // 각 요소가 ParagraphBlock 인터페이스를 만족하는지 확인
    const allElementsValid = candidateArray.every((arrayItem) => {
      const isNullOrUndefined = !arrayItem;

      if (isNullOrUndefined) {
        return false;
      }

      const isObjectType = typeof arrayItem === 'object';

      if (!isObjectType) {
        return false;
      }

      // ParagraphBlock의 필수 속성들 확인 - Reflect.get() 사용
      const hasId = 'id' in arrayItem;
      const idValue = hasId ? Reflect.get(arrayItem, 'id') : null;
      const isValidId = typeof idValue === 'string';

      return isValidId;
    });

    return allElementsValid;
  };

  return {
    isValidSnapshot,
    isValidMetadata,
    isValidationResult,
    isValidContainerArray,
    isValidParagraphArray,
  };
}

// 🔧 디버깅용 함수들 - 타입 안전성 강화
export function createBridgeDebugHelpers() {
  const logValidationResult = (
    validationResult: unknown,
    functionName: string
  ) => {
    console.log(`🐛 [DEBUG] ${functionName} 검증 결과:`, validationResult);

    const isBooleanResult = typeof validationResult === 'boolean';

    if (isBooleanResult) {
      console.warn(
        `⚠️ [DEBUG] ${functionName}이 boolean을 반환했습니다. 객체를 반환해야 합니다.`
      );
    } else {
      const isObjectResult =
        validationResult && typeof validationResult === 'object';

      if (isObjectResult) {
        console.log(`✅ [DEBUG] ${functionName}이 올바른 객체를 반환했습니다.`);
      } else {
        console.error(
          `❌ [DEBUG] ${functionName}이 예상치 못한 타입을 반환했습니다:`,
          typeof validationResult
        );
      }
    }
  };

  const debugFunctionCall = (
    functionName: string,
    parameterList: unknown[]
  ) => {
    console.log(`🔍 [DEBUG] ${functionName} 호출됨:`, {
      paramCount: parameterList.length,
      paramTypes: parameterList.map((currentParam) => typeof currentParam),
    });
  };

  // 🎯 추가 디버깅 함수 - 타입 가드 결과 로깅
  const debugTypeGuardResult = <T>(
    candidateValue: unknown,
    guardFunction: (candidate: unknown) => candidate is T,
    guardName: string
  ): boolean => {
    const guardResult = guardFunction(candidateValue);
    console.log(`🔍 [TYPE_GUARD] ${guardName} 결과:`, {
      isValid: guardResult,
      candidateType: typeof candidateValue,
      candidateValue: candidateValue,
    });
    return guardResult;
  };

  return {
    logValidationResult,
    debugFunctionCall,
    debugTypeGuardResult,
  };
}
