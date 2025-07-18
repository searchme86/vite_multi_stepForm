// bridges/editorMultiStepBridge/dataTransformProcessor.ts

import type {
  EditorStateSnapshotForBridge,
  EditorToMultiStepDataTransformationResult,
  TransformationMetadata,
  TransformationStrategyType,
} from './modernBridgeTypes';
import type { Container, ParagraphBlock } from '../../store/shared/commonTypes';

// 🔧 변환 처리 인터페이스 정의
interface ValidatedDataSet {
  readonly containers: readonly Container[];
  readonly paragraphs: readonly ParagraphBlock[];
  readonly completedContent: string;
  readonly isCompleted: boolean;
}

interface ContentGenerationResult {
  readonly generatedContent: string;
  readonly contentLength: number;
  readonly generationSuccess: boolean;
  readonly generationErrors: readonly string[];
  readonly generationStrategy: TransformationStrategyType;
}

interface ProcessingMetrics {
  readonly extractionTime: number;
  readonly validationTime: number;
  readonly transformationTime: number;
  readonly totalProcessingTime: number;
  readonly qualityScore: number;
}

// 🔧 안전한 타입 검증 모듈
function createTransformTypeGuardModule() {
  const isValidSnapshot = (
    candidate: unknown
  ): candidate is EditorStateSnapshotForBridge => {
    const isValidObject = candidate !== null && typeof candidate === 'object';
    if (!isValidObject) {
      console.error('❌ [TRANSFORM] 스냅샷이 객체가 아님');
      return false;
    }

    const snapshotObj = candidate;
    const requiredFields = [
      'editorContainers',
      'editorParagraphs',
      'editorCompletedContent',
      'editorIsCompleted',
      'extractedTimestamp',
    ];

    const hasAllRequiredFields = requiredFields.every(
      (field) => field in snapshotObj
    );
    if (!hasAllRequiredFields) {
      console.error('❌ [TRANSFORM] 필수 필드 누락');
      return false;
    }

    const editorContainers = Reflect.get(snapshotObj, 'editorContainers');
    const editorParagraphs = Reflect.get(snapshotObj, 'editorParagraphs');
    const editorCompletedContent = Reflect.get(
      snapshotObj,
      'editorCompletedContent'
    );
    const editorIsCompleted = Reflect.get(snapshotObj, 'editorIsCompleted');
    const extractedTimestamp = Reflect.get(snapshotObj, 'extractedTimestamp');

    const hasValidTypes =
      Array.isArray(editorContainers) &&
      Array.isArray(editorParagraphs) &&
      typeof editorCompletedContent === 'string' &&
      typeof editorIsCompleted === 'boolean' &&
      typeof extractedTimestamp === 'number';

    return hasValidTypes;
  };

  const isValidContainer = (candidate: unknown): candidate is Container => {
    const isValidObject = candidate !== null && typeof candidate === 'object';
    if (!isValidObject) {
      return false;
    }

    const containerObj = candidate;
    const hasRequiredProperties =
      'id' in containerObj && 'name' in containerObj && 'order' in containerObj;

    if (!hasRequiredProperties) {
      return false;
    }

    const idValue = Reflect.get(containerObj, 'id');
    const nameValue = Reflect.get(containerObj, 'name');
    const orderValue = Reflect.get(containerObj, 'order');

    const hasValidTypes =
      typeof idValue === 'string' &&
      typeof nameValue === 'string' &&
      typeof orderValue === 'number';

    return hasValidTypes && idValue.length > 0 && nameValue.length > 0;
  };

  const isValidParagraph = (
    candidate: unknown
  ): candidate is ParagraphBlock => {
    const isValidObject = candidate !== null && typeof candidate === 'object';
    if (!isValidObject) {
      return false;
    }

    const paragraphObj = candidate;
    const hasRequiredProperties =
      'id' in paragraphObj &&
      'content' in paragraphObj &&
      'order' in paragraphObj &&
      'containerId' in paragraphObj;

    if (!hasRequiredProperties) {
      return false;
    }

    const idValue = Reflect.get(paragraphObj, 'id');
    const contentValue = Reflect.get(paragraphObj, 'content');
    const orderValue = Reflect.get(paragraphObj, 'order');
    const containerIdValue = Reflect.get(paragraphObj, 'containerId');

    const hasValidTypes =
      typeof idValue === 'string' &&
      typeof contentValue === 'string' &&
      typeof orderValue === 'number' &&
      (containerIdValue === null || typeof containerIdValue === 'string');

    return hasValidTypes && idValue.length > 0;
  };

  return {
    isValidSnapshot,
    isValidContainer,
    isValidParagraph,
  };
}

// 🔧 데이터 추출 및 검증 모듈
function createDataExtractionModule() {
  const { isValidSnapshot, isValidContainer, isValidParagraph } =
    createTransformTypeGuardModule();

  const extractValidatedDataSet = (
    snapshot: EditorStateSnapshotForBridge
  ): ValidatedDataSet | null => {
    console.log('🔍 [TRANSFORM] 검증된 데이터셋 추출 시작');

    // Early Return: 스냅샷 유효성 검사
    if (!isValidSnapshot(snapshot)) {
      console.error('❌ [TRANSFORM] 유효하지 않은 스냅샷');
      return null;
    }

    // 🔧 구조분해할당 + Fallback으로 안전한 데이터 추출
    const {
      editorContainers: rawContainers = [],
      editorParagraphs: rawParagraphs = [],
      editorCompletedContent: completedContent = '',
      editorIsCompleted: isCompleted = false,
    } = snapshot;

    // 유효한 데이터만 필터링
    const validContainers = Array.isArray(rawContainers)
      ? rawContainers.filter(isValidContainer)
      : [];

    const validParagraphs = Array.isArray(rawParagraphs)
      ? rawParagraphs.filter(isValidParagraph)
      : [];

    const safeCompletedContent =
      typeof completedContent === 'string' ? completedContent : '';

    const safeIsCompleted =
      typeof isCompleted === 'boolean' ? isCompleted : false;

    const validatedDataSet: ValidatedDataSet = {
      containers: validContainers,
      paragraphs: validParagraphs,
      completedContent: safeCompletedContent,
      isCompleted: safeIsCompleted,
    };

    console.log('✅ [TRANSFORM] 검증된 데이터셋 추출 완료:', {
      containerCount: validContainers.length,
      paragraphCount: validParagraphs.length,
      contentLength: safeCompletedContent.length,
      isCompleted: safeIsCompleted,
    });

    return validatedDataSet;
  };

  const validateDataQuality = (
    dataSet: ValidatedDataSet
  ): { quality: number; warnings: Set<string> } => {
    console.log('📊 [TRANSFORM] 데이터 품질 분석 시작');

    const { containers, paragraphs, completedContent } = dataSet;
    const warnings = new Set<string>();

    // 기본 품질 점수 계산
    let qualityScore = 0;

    // 컨테이너 품질 평가
    const hasContainers = containers.length > 0;
    const containerQuality = hasContainers
      ? Math.min(containers.length * 10, 30)
      : 0;
    qualityScore += containerQuality;

    // 문단 품질 평가
    const hasParagraphs = paragraphs.length > 0;
    const paragraphQuality = hasParagraphs
      ? Math.min(paragraphs.length * 5, 25)
      : 0;
    qualityScore += paragraphQuality;

    // 콘텐츠 품질 평가
    const hasContent = completedContent.length > 0;
    const contentQuality = hasContent
      ? Math.min(completedContent.length / 10, 30)
      : 0;
    qualityScore += contentQuality;

    // 구조적 일관성 평가
    const assignedParagraphs = paragraphs.filter(
      ({ containerId }) => containerId !== null
    );
    const hasAssignedContent = assignedParagraphs.length > 0;
    const structuralQuality = hasAssignedContent ? 15 : 0;
    qualityScore += structuralQuality;

    // 경고 생성
    !hasContainers ? warnings.add('컨테이너가 없습니다') : null;
    !hasParagraphs ? warnings.add('문단이 없습니다') : null;
    !hasContent ? warnings.add('완성된 콘텐츠가 없습니다') : null;
    !hasAssignedContent ? warnings.add('할당된 문단이 없습니다') : null;

    const finalQuality = Math.min(Math.max(qualityScore, 0), 100);

    console.log('📊 [TRANSFORM] 데이터 품질 분석 완료:', {
      qualityScore: finalQuality,
      warningCount: warnings.size,
      hasContainers,
      hasParagraphs,
      hasContent,
    });

    return { quality: finalQuality, warnings };
  };

  return {
    extractValidatedDataSet,
    validateDataQuality,
  };
}

// 🔧 변환 전략 결정 모듈
function createStrategySelectionModule() {
  const determineOptimalStrategy = (
    dataSet: ValidatedDataSet
  ): TransformationStrategyType => {
    console.log('🎯 [TRANSFORM] 최적 변환 전략 결정 시작');

    const { containers, paragraphs, completedContent } = dataSet;

    // 기존 콘텐츠 전략 우선 검토
    const hasSubstantialContent = completedContent.trim().length > 100;
    if (hasSubstantialContent) {
      console.log('✅ [TRANSFORM] 전략 선택: EXISTING_CONTENT');
      return 'EXISTING_CONTENT';
    }

    // 컨테이너 기반 재구성 전략 검토
    const hasContainers = containers.length > 0;
    const hasAssignedParagraphs = paragraphs.some(
      ({ containerId }) => containerId !== null
    );
    const canRebuildFromContainers = hasContainers && hasAssignedParagraphs;

    if (canRebuildFromContainers) {
      console.log('✅ [TRANSFORM] 전략 선택: REBUILD_FROM_CONTAINERS');
      return 'REBUILD_FROM_CONTAINERS';
    }

    // 하이브리드 접근법 검토
    const hasUnassignedParagraphs = paragraphs.some(
      ({ containerId }) => containerId === null
    );
    const hasSomeContent = completedContent.trim().length > 10;
    const canUseHybridApproach = hasUnassignedParagraphs || hasSomeContent;

    if (canUseHybridApproach) {
      console.log('✅ [TRANSFORM] 전략 선택: HYBRID_APPROACH');
      return 'HYBRID_APPROACH';
    }

    // 기본 문단 폴백 전략
    console.log('✅ [TRANSFORM] 전략 선택: PARAGRAPH_FALLBACK');
    return 'PARAGRAPH_FALLBACK';
  };

  const selectTransformationStrategy = (
    dataSet: ValidatedDataSet,
    forceStrategy?: TransformationStrategyType
  ): TransformationStrategyType => {
    console.log('🔍 [TRANSFORM] 변환 전략 선택 시작');

    // Early Return: 강제 전략이 있는 경우
    const hasForceStrategy =
      forceStrategy !== undefined && forceStrategy !== null;
    if (hasForceStrategy) {
      console.log(`🎯 [TRANSFORM] 강제 전략 사용: ${forceStrategy}`);
      return forceStrategy;
    }

    const optimalStrategy = determineOptimalStrategy(dataSet);

    console.log('✅ [TRANSFORM] 변환 전략 선택 완료:', {
      selectedStrategy: optimalStrategy,
      containerCount: dataSet.containers.length,
      paragraphCount: dataSet.paragraphs.length,
      contentLength: dataSet.completedContent.length,
    });

    return optimalStrategy;
  };

  return {
    selectTransformationStrategy,
  };
}

// 🔧 콘텐츠 생성 모듈
function createContentGenerationModule() {
  const generateContentFromExisting = (
    completedContent: string
  ): ContentGenerationResult => {
    console.log('📄 [TRANSFORM] 기존 콘텐츠 활용 생성');

    const trimmedContent = completedContent.trim();
    const contentLength = trimmedContent.length;
    const hasValidContent = contentLength > 0;

    return {
      generatedContent: trimmedContent,
      contentLength,
      generationSuccess: hasValidContent,
      generationErrors: hasValidContent ? [] : ['기존 콘텐츠가 비어있습니다'],
      generationStrategy: 'EXISTING_CONTENT',
    };
  };

  const generateContentFromContainers = (
    containers: readonly Container[],
    paragraphs: readonly ParagraphBlock[]
  ): ContentGenerationResult => {
    console.log('🏗️ [TRANSFORM] 컨테이너 기반 콘텐츠 생성');

    try {
      const sortedContainers = [...containers].sort(
        (a, b) => a.order - b.order
      );
      const contentParts: string[] = [];

      sortedContainers.forEach((container) => {
        const { id: containerId, name: containerName } = container;

        // 해당 컨테이너의 문단들 찾기
        const containerParagraphs = paragraphs
          .filter(
            ({ containerId: paragraphContainerId }) =>
              paragraphContainerId === containerId
          )
          .sort((a, b) => a.order - b.order);

        const hasValidParagraphs = containerParagraphs.length > 0;
        if (hasValidParagraphs) {
          contentParts.push(`## ${containerName}`);

          containerParagraphs.forEach(({ content }) => {
            const hasValidContent = content && content.trim().length > 0;
            hasValidContent ? contentParts.push(content.trim()) : null;
          });

          contentParts.push('');
        }
      });

      const generatedContent = contentParts.join('\n').trim();
      const contentLength = generatedContent.length;

      return {
        generatedContent,
        contentLength,
        generationSuccess: contentLength > 0,
        generationErrors:
          contentLength > 0 ? [] : ['컨테이너에서 콘텐츠를 생성할 수 없습니다'],
        generationStrategy: 'REBUILD_FROM_CONTAINERS',
      };
    } catch (generationError) {
      const errorMessage =
        generationError instanceof Error
          ? generationError.message
          : '컨테이너 기반 생성 실패';

      return {
        generatedContent: '',
        contentLength: 0,
        generationSuccess: false,
        generationErrors: [errorMessage],
        generationStrategy: 'REBUILD_FROM_CONTAINERS',
      };
    }
  };

  const generateContentFromParagraphs = (
    paragraphs: readonly ParagraphBlock[]
  ): ContentGenerationResult => {
    console.log('📝 [TRANSFORM] 문단 기반 콘텐츠 생성');

    try {
      const unassignedParagraphs = paragraphs
        .filter(({ containerId }) => containerId === null)
        .sort((a, b) => a.order - b.order);

      const contentParts = unassignedParagraphs
        .map(({ content }) => content.trim())
        .filter((content) => content.length > 0);

      const generatedContent = contentParts.join('\n\n');
      const contentLength = generatedContent.length;

      return {
        generatedContent,
        contentLength,
        generationSuccess: contentLength > 0,
        generationErrors:
          contentLength > 0 ? [] : ['문단에서 콘텐츠를 생성할 수 없습니다'],
        generationStrategy: 'PARAGRAPH_FALLBACK',
      };
    } catch (generationError) {
      const errorMessage =
        generationError instanceof Error
          ? generationError.message
          : '문단 기반 생성 실패';

      return {
        generatedContent: '',
        contentLength: 0,
        generationSuccess: false,
        generationErrors: [errorMessage],
        generationStrategy: 'PARAGRAPH_FALLBACK',
      };
    }
  };

  const generateHybridContent = (
    containers: readonly Container[],
    paragraphs: readonly ParagraphBlock[],
    existingContent: string
  ): ContentGenerationResult => {
    console.log('🔀 [TRANSFORM] 하이브리드 콘텐츠 생성');

    try {
      const contentParts: string[] = [];

      // 기존 콘텐츠가 있으면 우선 사용
      const hasExistingContent = existingContent.trim().length > 0;
      if (hasExistingContent) {
        contentParts.push(existingContent.trim());
      }

      // 컨테이너 기반 콘텐츠 추가
      const containerResult = generateContentFromContainers(
        containers,
        paragraphs
      );
      const hasContainerContent = containerResult.generationSuccess;
      if (hasContainerContent) {
        contentParts.push(containerResult.generatedContent);
      }

      // 할당되지 않은 문단들 추가
      const paragraphResult = generateContentFromParagraphs(paragraphs);
      const hasParagraphContent = paragraphResult.generationSuccess;
      if (hasParagraphContent) {
        contentParts.push(paragraphResult.generatedContent);
      }

      const generatedContent = contentParts.join('\n\n').trim();
      const contentLength = generatedContent.length;

      return {
        generatedContent,
        contentLength,
        generationSuccess: contentLength > 0,
        generationErrors:
          contentLength > 0
            ? []
            : ['하이브리드 방식으로 콘텐츠를 생성할 수 없습니다'],
        generationStrategy: 'HYBRID_APPROACH',
      };
    } catch (generationError) {
      const errorMessage =
        generationError instanceof Error
          ? generationError.message
          : '하이브리드 생성 실패';

      return {
        generatedContent: '',
        contentLength: 0,
        generationSuccess: false,
        generationErrors: [errorMessage],
        generationStrategy: 'HYBRID_APPROACH',
      };
    }
  };

  const applyTransformationStrategy = (
    strategy: TransformationStrategyType,
    dataSet: ValidatedDataSet
  ): ContentGenerationResult => {
    console.log(`🚀 [TRANSFORM] 변환 전략 실행: ${strategy}`);

    const { containers, paragraphs, completedContent } = dataSet;

    const strategyImplementations = new Map<
      TransformationStrategyType,
      () => ContentGenerationResult
    >([
      ['EXISTING_CONTENT', () => generateContentFromExisting(completedContent)],
      [
        'REBUILD_FROM_CONTAINERS',
        () => generateContentFromContainers(containers, paragraphs),
      ],
      ['PARAGRAPH_FALLBACK', () => generateContentFromParagraphs(paragraphs)],
      [
        'HYBRID_APPROACH',
        () => generateHybridContent(containers, paragraphs, completedContent),
      ],
      [
        'EMERGENCY_RECOVERY',
        () => generateContentFromExisting(completedContent),
      ],
    ]);

    const strategyImplementation = strategyImplementations.get(strategy);

    // Early Return: 구현이 없는 전략인 경우
    if (!strategyImplementation) {
      console.warn(`⚠️ [TRANSFORM] 알 수 없는 전략: ${strategy}, 폴백 사용`);
      return generateContentFromExisting(completedContent);
    }

    const result = strategyImplementation();

    console.log('✅ [TRANSFORM] 변환 전략 실행 완료:', {
      strategy,
      success: result.generationSuccess,
      contentLength: result.contentLength,
      errorCount: result.generationErrors.length,
    });

    return result;
  };

  return {
    applyTransformationStrategy,
  };
}

// 🔧 메타데이터 생성 모듈
function createMetadataGenerationModule() {
  const generateTransformationMetadata = (
    dataSet: ValidatedDataSet,
    contentResult: ContentGenerationResult,
    processingMetrics: ProcessingMetrics,
    strategy: TransformationStrategyType
  ): TransformationMetadata => {
    console.log('📊 [TRANSFORM] 변환 메타데이터 생성 시작');

    const { containers, paragraphs } = dataSet;
    const { contentLength } = contentResult;

    // 기본 통계 계산
    const assignedParagraphs = paragraphs.filter(
      ({ containerId }) => containerId !== null
    );
    const unassignedParagraphs = paragraphs.filter(
      ({ containerId }) => containerId === null
    );

    // 경고 수집
    const validationWarnings = new Set<string>();

    containers.length === 0
      ? validationWarnings.add('컨테이너가 없습니다')
      : null;
    paragraphs.length === 0 ? validationWarnings.add('문단이 없습니다') : null;
    contentLength === 0
      ? validationWarnings.add('생성된 콘텐츠가 비어있습니다')
      : null;
    unassignedParagraphs.length > 0
      ? validationWarnings.add(
          `${unassignedParagraphs.length}개의 할당되지 않은 문단이 있습니다`
        )
      : null;

    // 성능 메트릭스 맵 생성
    const performanceMetrics = new Map<string, number>();
    performanceMetrics.set('extractionTime', processingMetrics.extractionTime);
    performanceMetrics.set('validationTime', processingMetrics.validationTime);
    performanceMetrics.set(
      'transformationTime',
      processingMetrics.transformationTime
    );
    performanceMetrics.set(
      'totalProcessingTime',
      processingMetrics.totalProcessingTime
    );
    performanceMetrics.set('qualityScore', processingMetrics.qualityScore);

    const transformationMetadata: TransformationMetadata = {
      containerCount: containers.length,
      paragraphCount: paragraphs.length,
      assignedParagraphCount: assignedParagraphs.length,
      unassignedParagraphCount: unassignedParagraphs.length,
      totalContentLength: contentLength,
      lastModifiedDate: new Date(),
      processingTimeMs: processingMetrics.totalProcessingTime,
      validationWarnings,
      performanceMetrics,
      transformationStrategy: strategy,
    };

    console.log('✅ [TRANSFORM] 변환 메타데이터 생성 완료:', {
      containerCount: containers.length,
      paragraphCount: paragraphs.length,
      contentLength,
      warningCount: validationWarnings.size,
      strategy,
    });

    return transformationMetadata;
  };

  return {
    generateTransformationMetadata,
  };
}

// 🔧 메인 변환 처리 모듈
function createMainTransformationModule() {
  const { extractValidatedDataSet, validateDataQuality } =
    createDataExtractionModule();
  const { selectTransformationStrategy } = createStrategySelectionModule();
  const { applyTransformationStrategy } = createContentGenerationModule();
  const { generateTransformationMetadata } = createMetadataGenerationModule();

  const transformEditorStateToMultiStep = (
    editorSnapshot: EditorStateSnapshotForBridge
  ): EditorToMultiStepDataTransformationResult => {
    console.log('🚀 [TRANSFORM] Editor → MultiStep 변환 시작');
    const transformationStartTime = performance.now();
    const operationId = `transform_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 8)}`;

    try {
      // 1단계: 데이터 추출 및 검증
      const extractionStartTime = performance.now();
      const validatedDataSet = extractValidatedDataSet(editorSnapshot);

      // Early Return: 데이터 추출 실패
      if (!validatedDataSet) {
        throw new Error('유효한 데이터를 추출할 수 없습니다');
      }

      const { quality, warnings } = validateDataQuality(validatedDataSet);
      const extractionEndTime = performance.now();

      // 2단계: 변환 전략 선택
      const strategyStartTime = performance.now();
      const selectedStrategy = selectTransformationStrategy(validatedDataSet);
      const strategyEndTime = performance.now();

      // 3단계: 콘텐츠 변환 실행
      const transformationContentStartTime = performance.now();
      const contentResult = applyTransformationStrategy(
        selectedStrategy,
        validatedDataSet
      );
      const transformationContentEndTime = performance.now();

      // 4단계: 완료 상태 결정
      const { generatedContent, generationSuccess } = contentResult;
      const transformedIsCompleted =
        validatedDataSet.isCompleted || generatedContent.length > 0;

      // 5단계: 성능 메트릭스 계산
      const transformationEndTime = performance.now();
      const processingMetrics: ProcessingMetrics = {
        extractionTime: extractionEndTime - extractionStartTime,
        validationTime: strategyEndTime - strategyStartTime,
        transformationTime:
          transformationContentEndTime - transformationContentStartTime,
        totalProcessingTime: transformationEndTime - transformationStartTime,
        qualityScore: quality,
      };

      // 6단계: 메타데이터 생성
      const transformedMetadata = generateTransformationMetadata(
        validatedDataSet,
        contentResult,
        processingMetrics,
        selectedStrategy
      );

      // 7단계: 결과 구성
      const qualityMetrics = new Map<string, number>();
      qualityMetrics.set('overallQuality', quality);
      qualityMetrics.set('contentLength', generatedContent.length);
      qualityMetrics.set(
        'processingEfficiency',
        Math.max(0, 100 - processingMetrics.totalProcessingTime / 10)
      );

      const contentHash = `hash_${generatedContent.length}_${Date.now()}`;

      const transformationResult: EditorToMultiStepDataTransformationResult = {
        transformedContent: generatedContent,
        transformedIsCompleted,
        transformedMetadata,
        transformationSuccess: generationSuccess,
        transformationErrors: contentResult.generationErrors,
        transformationStrategy: selectedStrategy,
        transformationTimestamp: Date.now(),
        qualityMetrics,
        contentIntegrityHash: contentHash,
      };

      console.log('✅ [TRANSFORM] Editor → MultiStep 변환 완료:', {
        operationId,
        strategy: selectedStrategy,
        success: generationSuccess,
        contentLength: generatedContent.length,
        isCompleted: transformedIsCompleted,
        qualityScore: quality,
        duration: `${processingMetrics.totalProcessingTime.toFixed(2)}ms`,
      });

      return transformationResult;
    } catch (transformationError) {
      console.error('❌ [TRANSFORM] 변환 실패:', transformationError);

      const transformationEndTime = performance.now();
      const errorMessage =
        transformationError instanceof Error
          ? transformationError.message
          : String(transformationError);

      // 실패 시 기본 메타데이터 생성
      const fallbackMetrics = new Map<string, number>();
      fallbackMetrics.set(
        'processingTime',
        transformationEndTime - transformationStartTime
      );

      const fallbackWarnings = new Set<string>();
      fallbackWarnings.add('변환 프로세스에서 오류 발생');

      const fallbackMetadata: TransformationMetadata = {
        containerCount: 0,
        paragraphCount: 0,
        assignedParagraphCount: 0,
        unassignedParagraphCount: 0,
        totalContentLength: 0,
        lastModifiedDate: new Date(),
        processingTimeMs: transformationEndTime - transformationStartTime,
        validationWarnings: fallbackWarnings,
        performanceMetrics: fallbackMetrics,
        transformationStrategy: 'EMERGENCY_RECOVERY',
      };

      const failureResult: EditorToMultiStepDataTransformationResult = {
        transformedContent: '',
        transformedIsCompleted: false,
        transformedMetadata: fallbackMetadata,
        transformationSuccess: false,
        transformationErrors: [errorMessage],
        transformationStrategy: 'EMERGENCY_RECOVERY',
        transformationTimestamp: Date.now(),
        qualityMetrics: new Map([['quality', 0]]),
        contentIntegrityHash: 'error_hash',
      };

      return failureResult;
    }
  };

  return {
    transformEditorStateToMultiStep,
  };
}

// 🔧 메인 팩토리 함수
export function createDataStructureTransformer() {
  console.log('🏭 [TRANSFORMER_FACTORY] 데이터 구조 변환기 생성 시작');

  const { selectTransformationStrategy } = createStrategySelectionModule();
  const { applyTransformationStrategy } = createContentGenerationModule();
  const { transformEditorStateToMultiStep } = createMainTransformationModule();

  console.log('✅ [TRANSFORMER_FACTORY] 데이터 구조 변환기 생성 완료');

  return {
    transformEditorStateToMultiStep,
    selectTransformationStrategy: (dataSet: ValidatedDataSet) =>
      selectTransformationStrategy(dataSet),
    applyTransformationStrategy: (
      strategy: TransformationStrategyType,
      dataSet: ValidatedDataSet
    ) => applyTransformationStrategy(strategy, dataSet),
  };
}

console.log(
  '🏗️ [DATA_TRANSFORM_PROCESSOR] 데이터 변환 프로세서 모듈 초기화 완료'
);
console.log('📊 [DATA_TRANSFORM_PROCESSOR] 제공 기능:', {
  strategySelection: '최적 변환 전략 선택',
  contentGeneration: '다양한 콘텐츠 생성 방식',
  qualityAnalysis: '데이터 품질 분석',
  performanceTracking: '변환 성능 추적',
});
console.log('✅ [DATA_TRANSFORM_PROCESSOR] 모든 변환 기능 준비 완료');
