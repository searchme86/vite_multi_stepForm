// bridges/editorMultiStepBridge/reverseDataProcessor.ts

import type {
  MultiStepFormSnapshotForBridge,
  MultiStepToEditorDataTransformationResult,
  TransformationStrategyType,
  ValidationResult,
} from './modernBridgeTypes';
import type { FormValues } from '../../components/multiStepForm/types/formTypes';

// 🔧 역변환 처리 인터페이스 정의
interface ExtractedMultiStepContent {
  readonly editorContent: string;
  readonly isCompleted: boolean;
  readonly formMetadata: Map<string, unknown>;
  readonly contentQuality: ContentQualityMetrics;
}

interface ContentQualityMetrics {
  readonly wordCount: number;
  readonly characterCount: number;
  readonly lineCount: number;
  readonly hasMarkdownSyntax: boolean;
  readonly hasStructuredContent: boolean;
  readonly qualityScore: number;
}

// 🔧 안전한 타입 변환 유틸리티
function createSafeReverseTypeConverter() {
  const convertToSafeString = (
    value: unknown,
    fallbackValue: string
  ): string => {
    return typeof value === 'string' ? value : fallbackValue;
  };

  const convertToSafeBoolean = (
    value: unknown,
    fallbackValue: boolean
  ): boolean => {
    return typeof value === 'boolean' ? value : fallbackValue;
  };

  const convertToSafeNumber = (
    value: unknown,
    fallbackValue: number
  ): number => {
    return typeof value === 'number' && !Number.isNaN(value)
      ? value
      : fallbackValue;
  };

  const convertToSafeMap = (value: unknown): Map<string, unknown> => {
    return value instanceof Map ? new Map(value) : new Map();
  };

  const extractFormValueProperty = (
    formValues: unknown,
    propertyName: string
  ): unknown => {
    const isValidObject = formValues && typeof formValues === 'object';
    if (!isValidObject) {
      return null;
    }

    const hasProperty = propertyName in formValues;
    if (!hasProperty) {
      return null;
    }

    return Reflect.get(formValues, propertyName);
  };

  const extractMultipleFormProperties = (
    formValues: unknown,
    propertyKeys: readonly string[]
  ): Map<string, unknown> => {
    const propertiesMap = new Map<string, unknown>();

    propertyKeys.forEach((propertyKey) => {
      const propertyValue = extractFormValueProperty(formValues, propertyKey);
      if (propertyValue !== null) {
        propertiesMap.set(propertyKey, propertyValue);
      }
    });

    return propertiesMap;
  };

  return {
    convertToSafeString,
    convertToSafeBoolean,
    convertToSafeNumber,
    convertToSafeMap,
    extractFormValueProperty,
    extractMultipleFormProperties,
  };
}

// 🔧 타입 가드 모듈
function createReverseTypeGuardModule() {
  const isValidMultiStepSnapshot = (
    candidate: unknown
  ): candidate is MultiStepFormSnapshotForBridge => {
    const isValidObject = candidate !== null && typeof candidate === 'object';
    if (!isValidObject) {
      return false;
    }

    const snapshotObj = candidate;
    const hasRequiredProperties =
      'formCurrentStep' in snapshotObj &&
      'formValues' in snapshotObj &&
      'snapshotTimestamp' in snapshotObj;

    if (!hasRequiredProperties) {
      return false;
    }

    const formCurrentStepValue = Reflect.get(snapshotObj, 'formCurrentStep');
    const formValuesValue = Reflect.get(snapshotObj, 'formValues');
    const snapshotTimestampValue = Reflect.get(
      snapshotObj,
      'snapshotTimestamp'
    );

    const hasValidTypes =
      typeof formCurrentStepValue === 'number' &&
      formValuesValue !== null &&
      typeof formValuesValue === 'object' &&
      typeof snapshotTimestampValue === 'number';

    return hasValidTypes;
  };

  const isValidFormValues = (candidate: unknown): candidate is FormValues => {
    const isValidObject = candidate !== null && typeof candidate === 'object';
    if (!isValidObject) {
      return false;
    }

    // FormValues는 관대하게 검증 (최소한의 구조만 확인)
    return true;
  };

  const isValidContentMetadata = (
    candidate: unknown
  ): candidate is Map<string, unknown> => {
    return candidate instanceof Map;
  };

  const hasValidStringProperty = (
    targetObject: unknown,
    propertyName: string
  ): boolean => {
    const isValidObject = targetObject && typeof targetObject === 'object';
    if (!isValidObject) {
      return false;
    }

    const hasProperty = propertyName in targetObject;
    if (!hasProperty) {
      return false;
    }

    const propertyValue = Reflect.get(targetObject, propertyName);
    return typeof propertyValue === 'string';
  };

  const hasValidBooleanProperty = (
    targetObject: unknown,
    propertyName: string
  ): boolean => {
    const isValidObject = targetObject && typeof targetObject === 'object';
    if (!isValidObject) {
      return false;
    }

    const hasProperty = propertyName in targetObject;
    if (!hasProperty) {
      return false;
    }

    const propertyValue = Reflect.get(targetObject, propertyName);
    return typeof propertyValue === 'boolean';
  };

  return {
    isValidMultiStepSnapshot,
    isValidFormValues,
    isValidContentMetadata,
    hasValidStringProperty,
    hasValidBooleanProperty,
  };
}

// 🔧 스냅샷 검증 모듈
function createSnapshotValidationModule() {
  const { isValidMultiStepSnapshot, isValidFormValues } =
    createReverseTypeGuardModule();

  const validateSnapshotStructure = (
    snapshot: MultiStepFormSnapshotForBridge | null
  ): ValidationResult => {
    console.log('🔍 [REVERSE] 스냅샷 구조 검증 시작');

    const validationErrors: string[] = [];
    const validationWarnings: string[] = [];
    const errorDetails = new Map<string, string>();
    const validationMetrics = new Map<string, number>();
    const validationFlags = new Set<string>();

    // Early Return: null 스냅샷 검증
    if (!snapshot) {
      const errorMessage = '멀티스텝 스냅샷이 null입니다';
      validationErrors.push(errorMessage);
      errorDetails.set('snapshotNull', errorMessage);
      validationFlags.add('SNAPSHOT_NULL');

      return createValidationFailure(
        validationErrors,
        validationWarnings,
        errorDetails,
        validationMetrics,
        validationFlags
      );
    }

    // 스냅샷 타입 검증
    const isValidSnapshot = isValidMultiStepSnapshot(snapshot);
    if (!isValidSnapshot) {
      const errorMessage = '스냅샷 구조가 유효하지 않습니다';
      validationErrors.push(errorMessage);
      errorDetails.set('invalidStructure', errorMessage);
      validationFlags.add('INVALID_STRUCTURE');

      return createValidationFailure(
        validationErrors,
        validationWarnings,
        errorDetails,
        validationMetrics,
        validationFlags
      );
    }

    // 🔧 구조분해할당 + Fallback으로 데이터 추출
    const {
      formCurrentStep = 0,
      formValues = null,
      snapshotTimestamp = 0,
      formMetadata = new Map(),
    } = snapshot;

    validationMetrics.set('currentStep', formCurrentStep);
    validationMetrics.set('timestamp', snapshotTimestamp);
    validationMetrics.set(
      'metadataSize',
      formMetadata instanceof Map ? formMetadata.size : 0
    );

    // FormValues 검증
    const isValidFormData = isValidFormValues(formValues);
    if (!isValidFormData) {
      const warningMessage = 'FormValues가 유효하지 않지만 계속 진행';
      validationWarnings.push(warningMessage);
      validationFlags.add('INVALID_FORM_VALUES');
    } else {
      validationFlags.add('VALID_FORM_VALUES');
    }

    // 스텝 검증
    const isValidStep = formCurrentStep > 0 && formCurrentStep <= 10;
    if (!isValidStep) {
      const warningMessage = `현재 스텝이 유효하지 않습니다: ${formCurrentStep}`;
      validationWarnings.push(warningMessage);
      validationFlags.add('INVALID_STEP');
    } else {
      validationFlags.add('VALID_STEP');
    }

    // 타임스탬프 검증
    const isValidTimestamp = snapshotTimestamp > 0;
    if (!isValidTimestamp) {
      const warningMessage = '타임스탬프가 유효하지 않습니다';
      validationWarnings.push(warningMessage);
      validationFlags.add('INVALID_TIMESTAMP');
    } else {
      validationFlags.add('VALID_TIMESTAMP');
    }

    validationFlags.add('STRUCTURE_VALIDATED');

    const validationResult: ValidationResult = {
      isValidForTransfer: true, // 관대한 모드로 대부분 허용
      validationErrors,
      validationWarnings,
      hasMinimumContent: Boolean(formValues),
      hasRequiredStructure: true,
      errorDetails,
      validationMetrics,
      validationFlags,
    };

    console.log('✅ [REVERSE] 스냅샷 구조 검증 완료:', {
      isValid: true,
      errorCount: validationErrors.length,
      warningCount: validationWarnings.length,
      currentStep: formCurrentStep,
    });

    return validationResult;
  };

  const createValidationFailure = (
    errors: string[],
    warnings: string[],
    details: Map<string, string>,
    metrics: Map<string, number>,
    flags: Set<string>
  ): ValidationResult => {
    return {
      isValidForTransfer: false,
      validationErrors: errors,
      validationWarnings: warnings,
      hasMinimumContent: false,
      hasRequiredStructure: false,
      errorDetails: details,
      validationMetrics: metrics,
      validationFlags: flags,
    };
  };

  return {
    validateSnapshotStructure,
  };
}

// 🔧 콘텐츠 추출 모듈
function createContentExtractionModule() {
  const {
    convertToSafeString,
    convertToSafeBoolean,
    extractMultipleFormProperties,
  } = createSafeReverseTypeConverter();
  const { hasValidStringProperty, hasValidBooleanProperty } =
    createReverseTypeGuardModule();

  const extractEditorContentFromSnapshot = (
    snapshot: MultiStepFormSnapshotForBridge
  ): ExtractedMultiStepContent => {
    console.log('🔍 [REVERSE] 에디터 콘텐츠 추출 시작');

    try {
      // 🔧 구조분해할당 + Fallback으로 FormValues 추출
      const { formValues = null } = snapshot;

      // Early Return: FormValues가 없는 경우
      if (!formValues || typeof formValues !== 'object') {
        console.warn('⚠️ [REVERSE] FormValues가 유효하지 않음, 빈 콘텐츠 반환');
        return createEmptyExtractedContent();
      }

      // 🔧 FormValues에서 개별 속성을 안전하게 추출
      const formValuesObj = formValues;

      // 에디터 콘텐츠 추출
      const hasEditorContent = hasValidStringProperty(
        formValuesObj,
        'editorCompletedContent'
      );
      const editorContent = hasEditorContent
        ? convertToSafeString(
            Reflect.get(formValuesObj, 'editorCompletedContent'),
            ''
          )
        : '';

      // 완료 상태 추출
      const hasCompletionStatus = hasValidBooleanProperty(
        formValuesObj,
        'isEditorCompleted'
      );
      const isCompleted = hasCompletionStatus
        ? convertToSafeBoolean(
            Reflect.get(formValuesObj, 'isEditorCompleted'),
            false
          )
        : false;

      // 폼 메타데이터 추출
      const formMetadataKeys = [
        'title',
        'description',
        'tags',
        'nickname',
        'emailPrefix',
        'emailDomain',
      ] as const;
      const formMetadata = extractMultipleFormProperties(
        formValuesObj,
        formMetadataKeys
      );

      // 콘텐츠 품질 분석
      const contentQuality = analyzeContentQuality(editorContent);

      const extractedContent: ExtractedMultiStepContent = {
        editorContent,
        isCompleted,
        formMetadata,
        contentQuality,
      };

      console.log('✅ [REVERSE] 콘텐츠 추출 완료:', {
        contentLength: editorContent.length,
        isCompleted,
        qualityScore: contentQuality.qualityScore,
        metadataCount: formMetadata.size,
      });

      return extractedContent;
    } catch (extractionError) {
      console.error('❌ [REVERSE] 콘텐츠 추출 실패:', extractionError);
      return createEmptyExtractedContent();
    }
  };

  const analyzeContentQuality = (content: string): ContentQualityMetrics => {
    const wordArray = content.split(/\s+/).filter((word) => word.length > 0);
    const wordCount = wordArray.length;
    const characterCount = content.length;
    const lineArray = content.split('\n');
    const lineCount = lineArray.length;

    // 마크다운 문법 검사
    const markdownPattern = /[#*`\[\]_~]/;
    const hasMarkdownSyntax = markdownPattern.test(content);

    // 구조화된 콘텐츠 검사 (헤더, 리스트 등)
    const structurePattern = /^(#{1,6}\s|[-*+]\s|\d+\.\s)/m;
    const hasStructuredContent = structurePattern.test(content);

    // 품질 점수 계산 (100점 만점)
    let qualityScore = 0;
    qualityScore += Math.min(wordCount * 2, 40); // 단어 수 (최대 40점)
    qualityScore += hasMarkdownSyntax ? 20 : 0; // 마크다운 사용 (20점)
    qualityScore += hasStructuredContent ? 20 : 0; // 구조화 (20점)
    qualityScore += lineCount > 1 ? 10 : 0; // 여러 줄 (10점)
    qualityScore += characterCount > 500 ? 10 : 0; // 충분한 길이 (10점)

    return {
      wordCount,
      characterCount,
      lineCount,
      hasMarkdownSyntax,
      hasStructuredContent,
      qualityScore: Math.min(qualityScore, 100),
    };
  };

  const createEmptyExtractedContent = (): ExtractedMultiStepContent => {
    return {
      editorContent: '',
      isCompleted: false,
      formMetadata: new Map(),
      contentQuality: {
        wordCount: 0,
        characterCount: 0,
        lineCount: 0,
        hasMarkdownSyntax: false,
        hasStructuredContent: false,
        qualityScore: 0,
      },
    };
  };

  return {
    extractEditorContentFromSnapshot,
  };
}

// 🔧 변환 전략 모듈
function createReverseTransformationStrategyModule() {
  const determineReverseStrategy = (
    extractedContent: ExtractedMultiStepContent
  ): TransformationStrategyType => {
    console.log('🔍 [REVERSE] 역변환 전략 결정 시작');

    const { editorContent, contentQuality } = extractedContent;
    const { qualityScore, wordCount, hasStructuredContent } = contentQuality;

    // Early Return: 고품질 콘텐츠인 경우
    const isHighQualityContent = qualityScore >= 70 && wordCount >= 50;
    if (isHighQualityContent) {
      console.log('✅ [REVERSE] 전략 결정: EXISTING_CONTENT (고품질)');
      return 'EXISTING_CONTENT';
    }

    // Early Return: 구조화된 콘텐츠인 경우
    const hasGoodStructure = hasStructuredContent && editorContent.length > 100;
    if (hasGoodStructure) {
      console.log('✅ [REVERSE] 전략 결정: REBUILD_FROM_CONTAINERS (구조화)');
      return 'REBUILD_FROM_CONTAINERS';
    }

    // Default: 기본 콘텐츠 전략
    console.log('✅ [REVERSE] 전략 결정: PARAGRAPH_FALLBACK (기본)');
    return 'PARAGRAPH_FALLBACK';
  };

  const applyReverseTransformationStrategy = (
    strategy: TransformationStrategyType,
    extractedContent: ExtractedMultiStepContent
  ): string => {
    console.log(`🔄 [REVERSE] 전략 적용: ${strategy}`);

    const { editorContent } = extractedContent;

    switch (strategy) {
      case 'EXISTING_CONTENT':
        return editorContent.trim();

      case 'REBUILD_FROM_CONTAINERS':
        return enhanceContentStructure(editorContent);

      case 'PARAGRAPH_FALLBACK':
        return editorContent.trim() || '';

      default:
        console.warn('⚠️ [REVERSE] 알 수 없는 전략, 기본 콘텐츠 반환');
        return editorContent.trim();
    }
  };

  const enhanceContentStructure = (content: string): string => {
    console.log('🔄 [REVERSE] 콘텐츠 구조 개선');

    try {
      // 간단한 구조 개선 로직
      const lines = content.split('\n');
      const enhancedLines: string[] = [];

      lines.forEach((line) => {
        const trimmedLine = line.trim();

        // 빈 줄 유지
        if (trimmedLine.length === 0) {
          enhancedLines.push('');
          return;
        }

        // 헤더가 아닌 긴 줄을 헤더로 변환 (첫 번째 줄만)
        const isFirstContent =
          enhancedLines.filter((l) => l.trim().length > 0).length === 0;
        const isLongLine = trimmedLine.length > 30;
        const isNotHeader = !trimmedLine.startsWith('#');

        const shouldMakeHeader = isFirstContent && isLongLine && isNotHeader;
        if (shouldMakeHeader) {
          enhancedLines.push(`## ${trimmedLine}`);
        } else {
          enhancedLines.push(trimmedLine);
        }
      });

      const enhancedContent = enhancedLines.join('\n');

      console.log('✅ [REVERSE] 콘텐츠 구조 개선 완료');
      return enhancedContent;
    } catch (enhanceError) {
      console.error('❌ [REVERSE] 구조 개선 실패, 원본 반환:', enhanceError);
      return content;
    }
  };

  return {
    determineReverseStrategy,
    applyReverseTransformationStrategy,
  };
}

// 🔧 메타데이터 생성 모듈
function createReverseMetadataModule() {
  const createContentMetadata = (
    extractedContent: ExtractedMultiStepContent,
    transformationDuration: number,
    transformationSuccess: boolean
  ): Map<string, unknown> => {
    console.log('🔄 [REVERSE] 콘텐츠 메타데이터 생성');

    const { editorContent, isCompleted, contentQuality, formMetadata } =
      extractedContent;
    const contentMetadata = new Map<string, unknown>();

    // 기본 정보
    contentMetadata.set('contentLength', editorContent.length);
    contentMetadata.set('isCompleted', isCompleted);
    contentMetadata.set('transformationSuccess', transformationSuccess);
    contentMetadata.set('transformationDuration', transformationDuration);

    // 품질 정보
    contentMetadata.set('wordCount', contentQuality.wordCount);
    contentMetadata.set('qualityScore', contentQuality.qualityScore);
    contentMetadata.set('hasMarkdown', contentQuality.hasMarkdownSyntax);
    contentMetadata.set('hasStructure', contentQuality.hasStructuredContent);

    // 폼 정보
    contentMetadata.set('formMetadataCount', formMetadata.size);
    contentMetadata.set('hasTitle', formMetadata.has('title'));
    contentMetadata.set('hasDescription', formMetadata.has('description'));

    // 처리 정보
    contentMetadata.set('transformerVersion', '2.0.0');
    contentMetadata.set('sourceType', 'MULTISTEP_FORM');
    contentMetadata.set('targetType', 'EDITOR_STATE');
    contentMetadata.set('processedAt', new Date().toISOString());

    console.log('✅ [REVERSE] 콘텐츠 메타데이터 생성 완료');
    return contentMetadata;
  };

  return {
    createContentMetadata,
  };
}

// 🔧 메인 역변환 처리 모듈
function createMainReverseProcessorModule() {
  const { validateSnapshotStructure } = createSnapshotValidationModule();
  const { extractEditorContentFromSnapshot } = createContentExtractionModule();
  const { determineReverseStrategy, applyReverseTransformationStrategy } =
    createReverseTransformationStrategyModule();
  const { createContentMetadata } = createReverseMetadataModule();

  const transformMultiStepToEditor = (
    snapshot: MultiStepFormSnapshotForBridge | null
  ): MultiStepToEditorDataTransformationResult => {
    console.log('🚀 [REVERSE] MultiStep → Editor 역변환 시작');
    const transformationStartTime = performance.now();

    try {
      // 1단계: 스냅샷 검증
      const validationResult = validateSnapshotStructure(snapshot);
      const { isValidForTransfer, validationWarnings } = validationResult;

      // Early Return: 검증 실패 (치명적인 경우만)
      if (!isValidForTransfer) {
        throw new Error('스냅샷 검증 실패로 변환 중단');
      }

      // null 체크 (이미 검증됨)
      if (!snapshot) {
        throw new Error('검증된 스냅샷이 null입니다');
      }

      // 2단계: 콘텐츠 추출
      const extractedContent = extractEditorContentFromSnapshot(snapshot);
      const { editorContent, isCompleted } = extractedContent;

      // 3단계: 변환 전략 결정 및 적용
      const transformationStrategy = determineReverseStrategy(extractedContent);
      const finalContent = applyReverseTransformationStrategy(
        transformationStrategy,
        extractedContent
      );

      // 4단계: 결과 검증
      const hasValidContent = finalContent.length > 0;
      const transformationSuccess = true;

      const transformationEndTime = performance.now();
      const transformationDuration =
        transformationEndTime - transformationStartTime;

      // 5단계: 메타데이터 생성
      const contentMetadata = createContentMetadata(
        extractedContent,
        transformationDuration,
        transformationSuccess
      );

      // 6단계: 최종 결과 구성
      const transformationResult: MultiStepToEditorDataTransformationResult = {
        editorContent: finalContent,
        editorIsCompleted: isCompleted,
        transformationSuccess,
        transformationErrors: [],
        transformedTimestamp: Date.now(),
        contentMetadata,
        reverseTransformationStrategy: transformationStrategy,
        dataIntegrityValidation: hasValidContent,
      };

      console.log('✅ [REVERSE] MultiStep → Editor 역변환 완료:', {
        strategy: transformationStrategy,
        contentLength: finalContent.length,
        isCompleted,
        hasValidContent,
        warningCount: validationWarnings.length,
        duration: `${transformationDuration.toFixed(2)}ms`,
      });

      return transformationResult;
    } catch (reverseError) {
      console.error('❌ [REVERSE] 역변환 실패:', reverseError);

      const transformationEndTime = performance.now();
      const transformationDuration =
        transformationEndTime - transformationStartTime;
      const errorMessage =
        reverseError instanceof Error
          ? reverseError.message
          : String(reverseError);

      // 실패 시 기본 메타데이터 생성
      const failureMetadata = new Map<string, unknown>();
      failureMetadata.set('transformationSuccess', false);
      failureMetadata.set('transformationDuration', transformationDuration);
      failureMetadata.set('errorOccurred', true);
      failureMetadata.set('errorMessage', errorMessage);

      const failureResult: MultiStepToEditorDataTransformationResult = {
        editorContent: '',
        editorIsCompleted: false,
        transformationSuccess: false,
        transformationErrors: [errorMessage],
        transformedTimestamp: Date.now(),
        contentMetadata: failureMetadata,
        reverseTransformationStrategy: 'PARAGRAPH_FALLBACK',
        dataIntegrityValidation: false,
      };

      return failureResult;
    }
  };

  return {
    transformMultiStepToEditor,
  };
}

// 🔧 변환 결과 검증 모듈
function createResultValidationModule() {
  const { isValidContentMetadata } = createReverseTypeGuardModule();

  const validateReverseTransformation = (
    result: MultiStepToEditorDataTransformationResult
  ): boolean => {
    console.log('🔍 [REVERSE] 변환 결과 검증 시작');

    // Early Return: 결과가 객체가 아닌 경우
    const isValidObject = result && typeof result === 'object';
    if (!isValidObject) {
      console.error('❌ [REVERSE] 결과가 유효한 객체가 아님');
      return false;
    }

    // 🔧 구조분해할당 + Fallback으로 필수 속성 검증
    const {
      editorContent = '',
      editorIsCompleted = false,
      transformationSuccess = false,
      transformationErrors = [],
      transformedTimestamp = 0,
      contentMetadata = null,
    } = result;

    const hasValidContent = typeof editorContent === 'string';
    const hasValidCompleted = typeof editorIsCompleted === 'boolean';
    const hasValidSuccess = typeof transformationSuccess === 'boolean';
    const hasValidErrors = Array.isArray(transformationErrors);
    const hasValidTimestamp =
      typeof transformedTimestamp === 'number' && transformedTimestamp > 0;
    const hasValidMetadata = isValidContentMetadata(contentMetadata);

    const isCompletelyValid =
      hasValidContent &&
      hasValidCompleted &&
      hasValidSuccess &&
      hasValidErrors &&
      hasValidTimestamp &&
      hasValidMetadata;

    console.log('📊 [REVERSE] 변환 결과 검증 완료:', {
      isValid: isCompletelyValid,
      hasValidContent,
      hasValidCompleted,
      hasValidSuccess,
      hasValidErrors,
      hasValidTimestamp,
      hasValidMetadata,
      contentLength: hasValidContent ? editorContent.length : 0,
    });

    return isCompletelyValid;
  };

  const extractMultiStepContent = (
    snapshot: MultiStepFormSnapshotForBridge | null
  ): string => {
    console.log('🔍 [REVERSE] 멀티스텝 콘텐츠 직접 추출');

    // Early Return: 스냅샷이 없는 경우
    if (!snapshot) {
      console.warn('⚠️ [REVERSE] 스냅샷이 없어 빈 콘텐츠 반환');
      return '';
    }

    try {
      const { extractEditorContentFromSnapshot } =
        createContentExtractionModule();
      const extractedContent = extractEditorContentFromSnapshot(snapshot);
      const { editorContent: extractedText } = extractedContent;

      console.log('✅ [REVERSE] 콘텐츠 직접 추출 완료:', {
        contentLength: extractedText.length,
      });

      return extractedText;
    } catch (extractionError) {
      console.error('❌ [REVERSE] 콘텐츠 직접 추출 실패:', extractionError);
      return '';
    }
  };

  return {
    validateReverseTransformation,
    extractMultiStepContent,
  };
}

// 🔧 메인 팩토리 함수
export function createReverseDataProcessor() {
  console.log('🏭 [REVERSE_FACTORY] 역데이터 처리기 생성 시작');

  const { transformMultiStepToEditor } = createMainReverseProcessorModule();
  const { validateReverseTransformation, extractMultiStepContent } =
    createResultValidationModule();

  console.log('✅ [REVERSE_FACTORY] 역데이터 처리기 생성 완료');

  return {
    transformMultiStepToEditor,
    extractMultiStepContent,
    validateReverseTransformation,
  };
}

console.log('🏗️ [REVERSE_DATA_PROCESSOR] 역데이터 처리 모듈 초기화 완료');
console.log('📊 [REVERSE_DATA_PROCESSOR] 제공 기능:', {
  reverseTransformation: 'MultiStep → Editor 변환',
  contentExtraction: '콘텐츠 추출 및 분석',
  qualityAnalysis: '콘텐츠 품질 평가',
  strategySelection: '최적 변환 전략 선택',
});
console.log('✅ [REVERSE_DATA_PROCESSOR] 모든 역변환 기능 준비 완료');
