// bridges/editorMultiStepBridge/editorToMultiStepTransformer.ts

import {
  EditorStateSnapshotForBridge,
  EditorToMultiStepDataTransformationResult,
  TransformationMetadata,
} from './bridgeDataTypes';
import { Container, ParagraphBlock } from '../../store/shared/commonTypes';

// 🔧 변환 전략 타입 정의
type TransformationStrategy =
  | 'EXISTING_CONTENT'
  | 'REBUILD_FROM_CONTAINERS'
  | 'PARAGRAPH_FALLBACK';

// 🔧 변환 옵션 인터페이스
interface TransformationOptions {
  readonly strategy: TransformationStrategy;
  readonly includeMetadata: boolean;
  readonly validateResult: boolean;
}

// 🔧 타입 가드 모듈 - 완전한 타입 검증
function createTransformerTypeGuardModule() {
  const isValidString = (value: unknown): value is string => {
    return typeof value === 'string';
  };

  const isValidBoolean = (value: unknown): value is boolean => {
    return typeof value === 'boolean';
  };

  const isValidNumber = (value: unknown): value is number => {
    return typeof value === 'number' && !isNaN(value);
  };

  const isValidObject = (value: unknown): value is Record<string, unknown> => {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  };

  const isValidArray = (value: unknown): value is unknown[] => {
    return Array.isArray(value);
  };

  // EditorStateSnapshotForBridge 타입 가드
  const isValidEditorSnapshot = (
    snapshot: unknown
  ): snapshot is EditorStateSnapshotForBridge => {
    if (!isValidObject(snapshot)) return false;

    // 필수 속성들 검증
    return (
      'editorContainers' in snapshot &&
      'editorParagraphs' in snapshot &&
      'editorCompletedContent' in snapshot &&
      'editorIsCompleted' in snapshot &&
      'extractedTimestamp' in snapshot &&
      isValidArray(snapshot.editorContainers) &&
      isValidArray(snapshot.editorParagraphs) &&
      isValidString(snapshot.editorCompletedContent) &&
      isValidBoolean(snapshot.editorIsCompleted) &&
      isValidNumber(snapshot.extractedTimestamp)
    );
  };

  // Container 타입 가드
  const isValidContainer = (container: unknown): container is Container => {
    if (!isValidObject(container)) return false;

    return (
      'id' in container &&
      'name' in container &&
      'order' in container &&
      isValidString(container.id) &&
      isValidString(container.name) &&
      isValidNumber(container.order)
    );
  };

  // ParagraphBlock 타입 가드
  const isValidParagraph = (
    paragraph: unknown
  ): paragraph is ParagraphBlock => {
    if (!isValidObject(paragraph)) return false;

    return (
      'id' in paragraph &&
      'content' in paragraph &&
      'order' in paragraph &&
      isValidString(paragraph.id) &&
      isValidString(paragraph.content) &&
      isValidNumber(paragraph.order)
    );
  };

  return {
    isValidString,
    isValidBoolean,
    isValidNumber,
    isValidObject,
    isValidArray,
    isValidEditorSnapshot,
    isValidContainer,
    isValidParagraph,
  };
}

// 🔧 데이터 추출 모듈
function createDataExtractionModule() {
  const { isValidContainer, isValidParagraph } =
    createTransformerTypeGuardModule();

  const extractValidContainers = (
    rawContainers: readonly unknown[]
  ): Container[] => {
    console.log('🔍 [TRANSFORMER] 유효한 컨테이너 추출 시작');

    const validContainers = rawContainers.filter(isValidContainer);

    console.log('📊 [TRANSFORMER] 컨테이너 추출 결과:', {
      totalContainers: rawContainers.length,
      validContainers: validContainers.length,
    });

    return validContainers;
  };

  const extractValidParagraphs = (
    rawParagraphs: readonly unknown[]
  ): ParagraphBlock[] => {
    console.log('🔍 [TRANSFORMER] 유효한 문단 추출 시작');

    const validParagraphs = rawParagraphs.filter(isValidParagraph);

    console.log('📊 [TRANSFORMER] 문단 추출 결과:', {
      totalParagraphs: rawParagraphs.length,
      validParagraphs: validParagraphs.length,
    });

    return validParagraphs;
  };

  return {
    extractValidContainers,
    extractValidParagraphs,
  };
}

// 🔧 콘텐츠 생성 모듈
function createContentGenerationModule() {
  const generateContentFromContainers = (
    containers: Container[],
    paragraphs: ParagraphBlock[]
  ): string => {
    console.log('🔄 [TRANSFORMER] 컨테이너 기반 콘텐츠 생성');

    if (containers.length === 0) {
      console.warn('⚠️ [TRANSFORMER] 컨테이너가 없어 빈 콘텐츠 반환');
      return '';
    }

    // 컨테이너를 순서대로 정렬
    const sortedContainers = [...containers].sort((a, b) => a.order - b.order);

    const contentParts: string[] = [];

    sortedContainers.forEach((container) => {
      const { id: containerId, name: containerName } = container;

      // 해당 컨테이너의 문단들 찾기
      const containerParagraphs = paragraphs
        .filter((paragraph) => paragraph.containerId === containerId)
        .sort((a, b) => a.order - b.order);

      if (containerParagraphs.length > 0) {
        // 컨테이너 제목 추가
        contentParts.push(`## ${containerName}`);

        // 문단 내용 추가
        containerParagraphs.forEach((paragraph) => {
          if (paragraph.content.trim().length > 0) {
            contentParts.push(paragraph.content.trim());
          }
        });

        // 컨테이너 간 구분을 위한 빈 줄
        contentParts.push('');
      }
    });

    const generatedContent = contentParts.join('\n');

    console.log('✅ [TRANSFORMER] 컨테이너 기반 콘텐츠 생성 완료:', {
      contentLength: generatedContent.length,
      containerCount: sortedContainers.length,
    });

    return generatedContent;
  };

  const generateContentFromParagraphs = (
    paragraphs: ParagraphBlock[]
  ): string => {
    console.log('🔄 [TRANSFORMER] 문단 기반 콘텐츠 생성');

    if (paragraphs.length === 0) {
      console.warn('⚠️ [TRANSFORMER] 문단이 없어 빈 콘텐츠 반환');
      return '';
    }

    // 할당되지 않은 문단들을 순서대로 정렬
    const unassignedParagraphs = paragraphs
      .filter((paragraph) => paragraph.containerId === null)
      .sort((a, b) => a.order - b.order);

    const contentParts = unassignedParagraphs
      .map((paragraph) => paragraph.content.trim())
      .filter((content) => content.length > 0);

    const generatedContent = contentParts.join('\n\n');

    console.log('✅ [TRANSFORMER] 문단 기반 콘텐츠 생성 완료:', {
      contentLength: generatedContent.length,
      unassignedParagraphCount: unassignedParagraphs.length,
    });

    return generatedContent;
  };

  return {
    generateContentFromContainers,
    generateContentFromParagraphs,
  };
}

// 🔧 메타데이터 생성 모듈
function createMetadataGenerationModule() {
  const generateTransformationMetadata = (
    containers: Container[],
    paragraphs: ParagraphBlock[],
    transformedContent: string,
    transformationStartTime: number,
    transformationEndTime: number
  ): TransformationMetadata => {
    console.log('🔄 [TRANSFORMER] 변환 메타데이터 생성');

    const assignedParagraphs = paragraphs.filter(
      (paragraph) => paragraph.containerId !== null
    );
    const unassignedParagraphs = paragraphs.filter(
      (paragraph) => paragraph.containerId === null
    );

    const validationWarnings = new Set<string>();

    // 경고 조건 체크
    if (containers.length === 0) {
      validationWarnings.add('컨테이너가 없습니다');
    }

    if (unassignedParagraphs.length > 0) {
      validationWarnings.add(
        `${unassignedParagraphs.length}개의 할당되지 않은 문단이 있습니다`
      );
    }

    if (transformedContent.length === 0) {
      validationWarnings.add('변환된 콘텐츠가 비어있습니다');
    }

    const metadata: TransformationMetadata = {
      containerCount: containers.length,
      paragraphCount: paragraphs.length,
      assignedParagraphCount: assignedParagraphs.length,
      unassignedParagraphCount: unassignedParagraphs.length,
      totalContentLength: transformedContent.length,
      lastModified: new Date(),
      processingTimeMs: transformationEndTime - transformationStartTime,
      validationWarnings,
    };

    console.log('✅ [TRANSFORMER] 메타데이터 생성 완료:', {
      containerCount: metadata.containerCount,
      paragraphCount: metadata.paragraphCount,
      contentLength: metadata.totalContentLength,
      warningCount: metadata.validationWarnings.size,
    });

    return metadata;
  };

  return {
    generateTransformationMetadata,
  };
}

// 🔧 변환 전략 모듈
function createTransformationStrategyModule() {
  const { generateContentFromContainers, generateContentFromParagraphs } =
    createContentGenerationModule();

  const determineOptimalStrategy = (
    containers: Container[],
    paragraphs: ParagraphBlock[],
    existingContent: string
  ): TransformationStrategy => {
    console.log('🔍 [TRANSFORMER] 최적 변환 전략 결정');

    // Early Return: 기존 콘텐츠가 있고 충분히 긴 경우
    if (existingContent.trim().length > 100) {
      console.log('✅ [TRANSFORMER] 전략: EXISTING_CONTENT');
      return 'EXISTING_CONTENT';
    }

    // Early Return: 컨테이너와 할당된 문단이 있는 경우
    const assignedParagraphs = paragraphs.filter(
      (paragraph) => paragraph.containerId !== null
    );

    if (containers.length > 0 && assignedParagraphs.length > 0) {
      console.log('✅ [TRANSFORMER] 전략: REBUILD_FROM_CONTAINERS');
      return 'REBUILD_FROM_CONTAINERS';
    }

    // Default: 문단 기반 변환
    console.log('✅ [TRANSFORMER] 전략: PARAGRAPH_FALLBACK');
    return 'PARAGRAPH_FALLBACK';
  };

  const executeTransformationStrategy = (
    strategy: TransformationStrategy,
    containers: Container[],
    paragraphs: ParagraphBlock[],
    existingContent: string
  ): string => {
    console.log(`🔄 [TRANSFORMER] 전략 실행: ${strategy}`);

    switch (strategy) {
      case 'EXISTING_CONTENT':
        return existingContent.trim();

      case 'REBUILD_FROM_CONTAINERS':
        return generateContentFromContainers(containers, paragraphs);

      case 'PARAGRAPH_FALLBACK':
        const paragraphContent = generateContentFromParagraphs(paragraphs);
        return paragraphContent || existingContent.trim();

      default:
        console.warn('⚠️ [TRANSFORMER] 알 수 없는 전략, 기존 콘텐츠 반환');
        return existingContent.trim();
    }
  };

  return {
    determineOptimalStrategy,
    executeTransformationStrategy,
  };
}

// 🔧 메인 변환 모듈
function createMainTransformationModule() {
  const { isValidEditorSnapshot } = createTransformerTypeGuardModule();
  const { extractValidContainers, extractValidParagraphs } =
    createDataExtractionModule();
  const { generateTransformationMetadata } = createMetadataGenerationModule();
  const { determineOptimalStrategy, executeTransformationStrategy } =
    createTransformationStrategyModule();

  const transformEditorStateToMultiStep = (
    editorSnapshot: EditorStateSnapshotForBridge
  ): EditorToMultiStepDataTransformationResult => {
    console.log('🚀 [TRANSFORMER] Editor → MultiStep 변환 시작');
    const transformationStartTime = performance.now();

    try {
      // 1단계: 입력 검증
      if (!isValidEditorSnapshot(editorSnapshot)) {
        throw new Error('유효하지 않은 에디터 스냅샷');
      }

      // 2단계: 데이터 추출
      const {
        editorContainers,
        editorParagraphs,
        editorCompletedContent,
        editorIsCompleted,
      } = editorSnapshot;

      const validContainers = extractValidContainers(editorContainers);
      const validParagraphs = extractValidParagraphs(editorParagraphs);

      // 3단계: 변환 전략 결정
      const transformationStrategy = determineOptimalStrategy(
        validContainers,
        validParagraphs,
        editorCompletedContent
      );

      // 4단계: 콘텐츠 변환 실행
      const transformedContent = executeTransformationStrategy(
        transformationStrategy,
        validContainers,
        validParagraphs,
        editorCompletedContent
      );

      // 5단계: 완료 상태 결정
      const transformedIsCompleted = Boolean(
        editorIsCompleted || transformedContent.length > 0
      );

      const transformationEndTime = performance.now();

      // 6단계: 메타데이터 생성
      const transformedMetadata = generateTransformationMetadata(
        validContainers,
        validParagraphs,
        transformedContent,
        transformationStartTime,
        transformationEndTime
      );

      // 7단계: 결과 구성
      const transformationResult: EditorToMultiStepDataTransformationResult = {
        transformedContent,
        transformedIsCompleted,
        transformedMetadata,
        transformationSuccess: true,
        transformationErrors: [],
        transformationStrategy,
      };

      console.log('✅ [TRANSFORMER] Editor → MultiStep 변환 완료:', {
        strategy: transformationStrategy,
        contentLength: transformedContent.length,
        isCompleted: transformedIsCompleted,
        containerCount: validContainers.length,
        paragraphCount: validParagraphs.length,
        processingTime: `${(
          transformationEndTime - transformationStartTime
        ).toFixed(2)}ms`,
      });

      return transformationResult;
    } catch (transformationError) {
      console.error('❌ [TRANSFORMER] 변환 실패:', transformationError);

      const transformationEndTime = performance.now();
      const errorMessage =
        transformationError instanceof Error
          ? transformationError.message
          : String(transformationError);

      // 실패 시 기본 메타데이터 생성
      const fallbackMetadata = generateTransformationMetadata(
        [],
        [],
        '',
        transformationStartTime,
        transformationEndTime
      );

      const failureResult: EditorToMultiStepDataTransformationResult = {
        transformedContent: '',
        transformedIsCompleted: false,
        transformedMetadata: fallbackMetadata,
        transformationSuccess: false,
        transformationErrors: [errorMessage],
        transformationStrategy: 'PARAGRAPH_FALLBACK',
      };

      return failureResult;
    }
  };

  return {
    transformEditorStateToMultiStep,
  };
}

// 🔧 검증 모듈
function createValidationModule() {
  const { isValidString, isValidBoolean, isValidObject } =
    createTransformerTypeGuardModule();

  const validateTransformationResult = (
    result: EditorToMultiStepDataTransformationResult
  ): boolean => {
    console.log('🔍 [TRANSFORMER] 변환 결과 검증');

    if (!isValidObject(result)) {
      console.error('❌ [TRANSFORMER] 결과가 객체가 아님');
      return false;
    }

    const hasValidContent = isValidString(result.transformedContent);
    const hasValidCompleted = isValidBoolean(result.transformedIsCompleted);
    const hasValidSuccess = isValidBoolean(result.transformationSuccess);
    const hasValidMetadata = isValidObject(result.transformedMetadata);
    const hasValidErrors = Array.isArray(result.transformationErrors);

    const isValid =
      hasValidContent &&
      hasValidCompleted &&
      hasValidSuccess &&
      hasValidMetadata &&
      hasValidErrors;

    console.log('📊 [TRANSFORMER] 검증 결과:', {
      isValid,
      hasValidContent,
      hasValidCompleted,
      hasValidSuccess,
      hasValidMetadata,
      hasValidErrors,
    });

    return isValid;
  };

  return {
    validateTransformationResult,
  };
}

// 🔧 메인 팩토리 함수 - 이것이 export되는 함수입니다!
export function createDataStructureTransformer() {
  console.log('🏭 [TRANSFORMER_FACTORY] 데이터 구조 변환기 생성');

  const { transformEditorStateToMultiStep } = createMainTransformationModule();
  const { validateTransformationResult } = createValidationModule();

  console.log('✅ [TRANSFORMER_FACTORY] 데이터 구조 변환기 생성 완료');

  return {
    transformEditorStateToMultiStep,
    validateTransformationResult,
  };
}

// 🔧 추가 유틸리티 함수들
export function createTransformerUtils() {
  const { extractValidContainers, extractValidParagraphs } =
    createDataExtractionModule();
  const { generateContentFromContainers, generateContentFromParagraphs } =
    createContentGenerationModule();

  return {
    extractValidContainers,
    extractValidParagraphs,
    generateContentFromContainers,
    generateContentFromParagraphs,
  };
}
