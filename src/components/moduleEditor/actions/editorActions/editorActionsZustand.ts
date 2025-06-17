import { EditorInternalState } from '../../types/editor';
import { Container } from '../../../../store/shared/commonTypes';
import {
  LocalParagraph,
  EditorUIStoreActions,
  EditorCoreStoreActions,
} from '../../hooks/editorStateHooks/editorStateTypes';
import { useEditorUIStore } from '../../../../store/editorUI/editorUIStore';
import { useEditorCoreStore } from '../../../../store/editorCore/editorCoreStore';

const createInitialInternalState = (
  _hasContext: boolean,
  _editorUIStoreActions: EditorUIStoreActions
): EditorInternalState => {
  try {
    return {
      currentSubStep: 'structure',
      isTransitioning: false,
      activeParagraphId: null,
      isPreviewOpen: true,
      selectedParagraphIds: [],
      targetContainerId: '',
    };
  } catch (error) {
    console.error('❌ [INIT] 내부 상태 초기화 실패:', error);
    return {
      currentSubStep: 'structure',
      isTransitioning: false,
      activeParagraphId: null,
      isPreviewOpen: true,
      selectedParagraphIds: [],
      targetContainerId: '',
    };
  }
};

const createInitialParagraphs = (
  _hasContext: boolean,
  _editorCoreStoreActions: EditorCoreStoreActions
): LocalParagraph[] => {
  try {
    console.log('🔄 [INIT] 단락 초기화 - 항상 빈 배열로 시작');
    return [];
  } catch (error) {
    console.error('❌ [INIT] 단락 초기화 실패:', error);
    return [];
  }
};

const createInitialContainers = (
  _hasContext: boolean,
  _editorCoreStoreActions: EditorCoreStoreActions
): Container[] => {
  try {
    console.log('🔄 [INIT] 컨테이너 초기화 - 항상 빈 배열로 시작');
    return [];
  } catch (error) {
    console.error('❌ [INIT] 컨테이너 초기화 실패:', error);
    return [];
  }
};

const handleStructureComplete = (sectionInputs: string[]): void => {
  try {
    if (!Array.isArray(sectionInputs) || sectionInputs.length < 2) {
      console.error('❌ [STRUCTURE] 최소 2개 이상의 섹션이 필요합니다');
      return;
    }

    const validSections = sectionInputs.filter(
      (section) => typeof section === 'string' && section.trim().length > 0
    );

    if (validSections.length < 2) {
      console.error('❌ [STRUCTURE] 유효한 섹션이 2개 미만입니다');
      return;
    }

    console.log('🔄 [STRUCTURE] 컨테이너 생성 시작:', validSections);

    const editorCoreStore = useEditorCoreStore.getState();
    const editorUIStore = useEditorUIStore.getState();

    console.log('🔄 [STRUCTURE] 에디터 상태 초기화');
    editorCoreStore.resetEditorState();

    const createdContainers: Container[] = [];

    validSections.forEach((sectionName, index) => {
      const containerId = `container-${Date.now()}-${index}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const newContainer: Container = {
        id: containerId,
        name: sectionName.trim(),
        order: index + 1,
        createdAt: new Date(),
      };

      console.log(
        `📦 [STRUCTURE] 컨테이너 추가: "${sectionName}" (order: ${index + 1})`
      );

      editorCoreStore.addContainer(newContainer);
      createdContainers.push(newContainer);
    });

    setTimeout(() => {
      try {
        const storeContainers = editorCoreStore.getSortedContainers();
        console.log('✅ [STRUCTURE] 생성된 컨테이너 검증:', {
          예상개수: validSections.length,
          실제개수: storeContainers.length,
          생성성공: storeContainers.length === validSections.length,
          컨테이너목록: storeContainers.map((c) => ({
            id: c.id,
            name: c.name,
            order: c.order,
          })),
        });

        if (storeContainers.length === validSections.length) {
          console.log('🔄 [STRUCTURE] UI 상태를 글쓰기 단계로 전환');
          editorUIStore.goToWritingStep();

          console.log('🎉 [STRUCTURE] 구조 설정 완료!');
          console.log(`   📊 총 ${storeContainers.length}개 컨테이너 생성`);
          console.log(`   🚀 글쓰기 단계로 이동 완료`);
        } else {
          console.error('❌ [STRUCTURE] 컨테이너 생성 실패 - 개수 불일치');
          console.error(
            `   예상: ${validSections.length}개, 실제: ${storeContainers.length}개`
          );
        }
      } catch (verificationError) {
        console.error('❌ [STRUCTURE] 결과 검증 실패:', verificationError);
      }
    }, 200);

    console.log(`🎯 [STRUCTURE] ${validSections.length}개 섹션 처리 시작`);
  } catch (error) {
    console.error('❌ [STRUCTURE] 구조 완료 처리 실패:', error);
    console.error(
      'Stack trace:',
      error instanceof Error ? error.stack : 'Unknown error'
    );

    try {
      console.log('🔄 [STRUCTURE] 에러 복구 시도 - UI 상태 안전화');
    } catch (recoveryError) {
      console.error('❌ [STRUCTURE] 에러 복구 실패:', recoveryError);
    }
  }
};

export {
  createInitialInternalState,
  createInitialParagraphs,
  createInitialContainers,
  handleStructureComplete,
};
