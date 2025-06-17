import {
  EditorStateSnapshotForBridge,
  EditorToMultiStepDataTransformationResult,
  EditorContentMetadataForBridge,
} from './bridgeTypes';
import { generateCompletedContent } from '../../store/shared/utilityFunctions';

// 에디터 데이터를 멀티스텝 폼에 맞는 형식으로 변환하는 핸들러 생성 함수
// 복잡한 에디터 구조를 단순한 텍스트 기반 폼 데이터로 평탄화
export const createEditorToMultiStepDataTransformer = () => {
  // 에디터 스냅샷으로부터 메타데이터를 계산하는 함수
  // 통계 정보, 품질 지표, 데이터 특성 등을 수집하여 분석 자료 제공
  const calculateComprehensiveEditorMetadata = (
    editorSnapshot: EditorStateSnapshotForBridge
  ): EditorContentMetadataForBridge => {
    console.log('📊 [TRANSFORMER] 에디터 메타데이터 계산 시작');

    // 스냅샷에서 메타데이터 계산에 필요한 핵심 데이터 추출
    const {
      editorContainers: rawContainerData = [],
      editorParagraphs: rawParagraphData = [],
      editorCompletedContent: rawCompletedContent = '',
    } = editorSnapshot;

    // 타입 안전성을 보장하는 데이터 정제 과정
    const safeContainerArray = Array.isArray(rawContainerData)
      ? rawContainerData
      : [];
    const safeParagraphArray = Array.isArray(rawParagraphData)
      ? rawParagraphData
      : [];
    const safeContentString =
      typeof rawCompletedContent === 'string' ? rawCompletedContent : '';

    // 컨테이너에 할당된 문단들 식별 - 구조화된 콘텐츠 수량 파악
    const paragraphsAssignedToContainers = safeParagraphArray.filter(
      (paragraph) => {
        const { containerId: paragraphContainerId = null } = paragraph || {};
        return paragraphContainerId !== null; // 컨테이너 ID가 있는 문단만 할당된 것으로 간주
      }
    );

    // 아직 할당되지 않은 문단들 식별 - 미완료 작업량 파악
    const paragraphsNotYetAssigned = safeParagraphArray.filter((paragraph) => {
      const { containerId: paragraphContainerId = null } = paragraph || {};
      return paragraphContainerId === null; // 컨테이너 ID가 없는 문단은 미할당
    });

    // 종합적인 메타데이터 객체 구성
    const comprehensiveMetadata: EditorContentMetadataForBridge = {
      containerCount: safeContainerArray.length, // 전체 컨테이너 개수
      paragraphCount: safeParagraphArray.length, // 전체 문단 개수
      assignedParagraphCount: paragraphsAssignedToContainers.length, // 구조화 완료된 문단 수
      unassignedParagraphCount: paragraphsNotYetAssigned.length, // 구조화 대기 중인 문단 수
      totalContentLength: safeContentString.length, // 총 콘텐츠 글자 수
      lastModified: new Date(), // 메타데이터 생성 시점 기록
    };

    console.log(
      '✅ [TRANSFORMER] 메타데이터 계산 완료:',
      comprehensiveMetadata
    );
    return comprehensiveMetadata;
  };

  // 에디터의 복잡한 구조를 단순한 문자열로 변환하는 함수
  // 컨테이너-문단 관계를 평탄화하여 멀티스텝 폼에서 사용 가능한 형태로 변환
  const convertEditorStructureToPlainText = (
    editorSnapshot: EditorStateSnapshotForBridge
  ): string => {
    console.log('🔄 [TRANSFORMER] 콘텐츠 문자열 변환 시작');

    // 변환에 필요한 핵심 데이터 추출
    const {
      editorContainers: rawContainerData = [],
      editorParagraphs: rawParagraphData = [],
      editorCompletedContent: rawCompletedContent = '',
    } = editorSnapshot;

    // 타입 안전성 보장 및 기본값 설정
    const safeContainerArray = Array.isArray(rawContainerData)
      ? rawContainerData
      : [];
    const safeParagraphArray = Array.isArray(rawParagraphData)
      ? rawParagraphData
      : [];
    const fallbackContentString =
      typeof rawCompletedContent === 'string' ? rawCompletedContent : '';

    // 변환에 필요한 최소 데이터가 없는 경우 기본 콘텐츠 반환
    if (safeContainerArray.length === 0 || safeParagraphArray.length === 0) {
      console.warn('⚠️ [TRANSFORMER] 컨테이너나 문단이 없음, 기본 콘텐츠 사용');
      return fallbackContentString;
    }

    try {
      // 외부 유틸리티 함수를 사용하여 구조화된 콘텐츠 생성
      // 컨테이너 순서에 따라 문단들을 정렬하고 결합
      const structurallyGeneratedContent = generateCompletedContent(
        safeContainerArray,
        safeParagraphArray
      );

      // 생성된 콘텐츠가 없으면 원본 콘텐츠 사용 (안전장치)
      const finalTransformedContent =
        structurallyGeneratedContent || fallbackContentString;

      console.log('✅ [TRANSFORMER] 콘텐츠 변환 완료:', {
        originalLength: fallbackContentString.length,
        generatedLength: structurallyGeneratedContent.length,
        finalLength: finalTransformedContent.length,
      });

      return finalTransformedContent;
    } catch (contentTransformationError) {
      console.error(
        '❌ [TRANSFORMER] 콘텐츠 변환 중 오류:',
        contentTransformationError
      );
      return fallbackContentString; // 오류 발생 시 안전한 기본값 반환
    }
  };

  // 변환 작업 전 입력 데이터의 유효성을 사전 검증하는 함수
  // 잘못된 데이터로 인한 변환 실패를 미리 방지
  const validateTransformationInputData = (
    editorSnapshot: EditorStateSnapshotForBridge
  ): string[] => {
    console.log('🔍 [TRANSFORMER] 변환 입력 검증 시작');

    const inputValidationErrors: string[] = [];

    // 스냅샷 자체의 존재성 검증
    if (!editorSnapshot) {
      inputValidationErrors.push('스냅샷이 null 또는 undefined');
      return inputValidationErrors; // 더 이상 검증 불가능
    }

    // 스냅샷 내 각 필드의 타입 및 유효성 검증
    const {
      editorContainers,
      editorParagraphs,
      editorCompletedContent,
      editorIsCompleted,
      extractedTimestamp,
    } = editorSnapshot;

    // 컨테이너 데이터 타입 검증
    if (!Array.isArray(editorContainers)) {
      inputValidationErrors.push('컨테이너가 배열이 아님');
    }

    // 문단 데이터 타입 검증
    if (!Array.isArray(editorParagraphs)) {
      inputValidationErrors.push('문단이 배열이 아님');
    }

    // 완성된 콘텐츠 타입 검증
    if (typeof editorCompletedContent !== 'string') {
      inputValidationErrors.push('완성된 콘텐츠가 문자열이 아님');
    }

    // 완료 상태 타입 검증
    if (typeof editorIsCompleted !== 'boolean') {
      inputValidationErrors.push('완성 상태가 불린이 아님');
    }

    // 타임스탬프 유효성 검증
    if (typeof extractedTimestamp !== 'number' || extractedTimestamp <= 0) {
      inputValidationErrors.push('추출 타임스탬프가 유효하지 않음');
    }

    console.log('📊 [TRANSFORMER] 입력 검증 결과:', {
      errorCount: inputValidationErrors.length,
      errors: inputValidationErrors,
    });

    return inputValidationErrors;
  };

  // 에디터 상태를 멀티스텝 폼 형식으로 종합적으로 변환하는 메인 함수
  // 검증, 변환, 메타데이터 생성을 통합적으로 처리
  const performCompleteEditorToMultiStepTransformation = (
    editorSnapshot: EditorStateSnapshotForBridge
  ): EditorToMultiStepDataTransformationResult => {
    console.log('🔄 [TRANSFORMER] 에디터 → 멀티스텝 변환 시작');

    const transformationProcessStartTime = performance.now();

    // 1단계: 입력 데이터 사전 검증
    const inputValidationErrors =
      validateTransformationInputData(editorSnapshot);

    // 입력 검증 실패 시 실패 결과 즉시 반환
    if (inputValidationErrors.length > 0) {
      console.error('❌ [TRANSFORMER] 입력 검증 실패:', inputValidationErrors);

      return {
        transformedContent: '', // 빈 콘텐츠로 안전 처리
        transformedIsCompleted: false, // 미완료 상태로 설정
        transformedMetadata: {
          // 기본값으로 구성된 안전한 메타데이터
          containerCount: 0,
          paragraphCount: 0,
          assignedParagraphCount: 0,
          unassignedParagraphCount: 0,
          totalContentLength: 0,
          lastModified: new Date(),
        },
        transformationSuccess: false, // 변환 실패 명시
        transformationErrors: inputValidationErrors, // 실패 원인 포함
      };
    }

    try {
      // 2단계: 실제 콘텐츠 변환 수행
      const convertedTextContent =
        convertEditorStructureToPlainText(editorSnapshot);

      // 3단계: 메타데이터 생성
      const generatedMetadata =
        calculateComprehensiveEditorMetadata(editorSnapshot);

      // 4단계: 완료 상태 추출 및 타입 안전성 보장
      const { editorIsCompleted: rawCompletionStatus = false } = editorSnapshot;

      // 성공적인 변환 결과 구성
      const successfulTransformationResult: EditorToMultiStepDataTransformationResult =
        {
          transformedContent: convertedTextContent,
          transformedIsCompleted: Boolean(rawCompletionStatus), // 명시적 불린 변환
          transformedMetadata: generatedMetadata,
          transformationSuccess: true, // 성공 상태 명시
          transformationErrors: [], // 오류 없음
        };

      const transformationProcessEndTime = performance.now();
      const totalTransformationDuration =
        transformationProcessEndTime - transformationProcessStartTime;

      console.log('✅ [TRANSFORMER] 변환 완료:', {
        contentLength: convertedTextContent.length,
        isCompleted: successfulTransformationResult.transformedIsCompleted,
        duration: `${totalTransformationDuration.toFixed(2)}ms`,
        metadata: generatedMetadata,
      });

      return successfulTransformationResult;
    } catch (unexpectedTransformationError) {
      console.error(
        '❌ [TRANSFORMER] 변환 중 예상치 못한 오류:',
        unexpectedTransformationError
      );

      // 예상치 못한 오류 발생 시 안전한 오류 처리
      const errorMessage =
        unexpectedTransformationError instanceof Error
          ? unexpectedTransformationError.message
          : '알 수 없는 변환 오류';

      return {
        transformedContent: '', // 안전한 빈 콘텐츠
        transformedIsCompleted: false, // 안전한 미완료 상태
        transformedMetadata: {
          // 안전한 기본 메타데이터
          containerCount: 0,
          paragraphCount: 0,
          assignedParagraphCount: 0,
          unassignedParagraphCount: 0,
          totalContentLength: 0,
          lastModified: new Date(),
        },
        transformationSuccess: false, // 실패 상태 명시
        transformationErrors: [errorMessage], // 오류 정보 포함
      };
    }
  };

  return {
    calculateEditorMetadata: calculateComprehensiveEditorMetadata,
    transformContentToString: convertEditorStructureToPlainText,
    validateTransformationInput: validateTransformationInputData,
    transformEditorStateToMultiStep:
      performCompleteEditorToMultiStepTransformation,
  };
};
