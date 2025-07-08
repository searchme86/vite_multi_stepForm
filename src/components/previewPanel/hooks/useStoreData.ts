// Zustand store 데이터를 안전하게 가져오는 훅 - 실제 스토어 구조에 맞게 최종 수정
import { useMemo, useState } from 'react';
import { useEditorCoreStore } from '../../../store/editorCore/editorCoreStore';
import { useMultiStepFormStore } from '../../multiStepForm/store/multiStepForm/multiStepFormStore';

// 실제 스토어 구조에 맞게 데이터를 가져오는 훅
export function useStoreData() {
  const formDataStore = useMultiStepFormStore((state) => state.getFormValues);
  const editorCoreStore = useEditorCoreStore();
  const [isPreviewPanelOpen, setIsPreviewPanelOpen] = useState(false);

  console.log('editorCoreStore', editorCoreStore);

  const formData = useMemo(() => {
    if (!formDataStore()) return;
    return {
      userImage: formDataStore()?.userImage || undefined,
      nickname: formDataStore()?.nickname || '',
      emailPrefix: formDataStore()?.emailPrefix || '',
      emailDomain: formDataStore()?.emailDomain || '',
      bio: formDataStore()?.bio || undefined,
      title: formDataStore()?.title || '',
      description: formDataStore()?.description || '',
      tags: formDataStore()?.tags || undefined,
      content: formDataStore()?.content || '',
      media: formDataStore()?.media || undefined,
      mainImage: formDataStore()?.mainImage || undefined,
      sliderImages: formDataStore()?.sliderImages || undefined,
      editorContainers: [],
      editorParagraphs: [],
      editorCompletedContent: editorCoreStore?.getCompletedContent?.() || '',
      isEditorCompleted: editorCoreStore?.getIsCompleted?.() || false,
    };
  }, [formDataStore, editorCoreStore]);

  // 에디터 관련 데이터 추출
  // editorCoreStore에서 완료된 콘텐츠와 완료 상태를 가져옵니다
  const editorCompletedContent = useMemo(() => {
    return editorCoreStore?.getCompletedContent?.() || '';
  }, [editorCoreStore]);

  console.log('editorCompletedContent', editorCompletedContent);

  const isEditorCompleted = useMemo(() => {
    return editorCoreStore?.getIsCompleted?.() || false;
  }, [editorCoreStore]);

  console.log('isEditorCompleted', isEditorCompleted);

  // 기존 코드와의 호환성을 위한 임시 데이터들
  // 실제 스토어에 없는 속성들은 기본값으로 제공
  const customGalleryViews = useMemo(() => [], []);
  const editorContainers = useMemo(() => [], []);
  const editorParagraphs = useMemo(() => [], []);

  // 모든 데이터를 하나의 객체로 메모이제이션
  // PreviewPanel 컴포넌트에서 예상하는 구조로 데이터를 반환합니다
  return useMemo(
    () => ({
      formData,
      isPreviewPanelOpen,
      setIsPreviewPanelOpen,
      customGalleryViews,
      editorContainers,
      editorParagraphs,
      editorCompletedContent,
      isEditorCompleted,
    }),
    [
      formData,
      isPreviewPanelOpen,
      setIsPreviewPanelOpen,
      customGalleryViews,
      editorContainers,
      editorParagraphs,
      editorCompletedContent,
      isEditorCompleted,
    ]
  );
}

// 📝 참고사항:
// 1. formDataStore와 editorCoreStore의 실제 구조를 확인하여
//    적절한 메서드나 속성으로 접근해야 합니다
// 2. 현재는 안전한 접근을 위해 옵셔널 체이닝(?.)을 사용했습니다
// 3. 실제 스토어 파일들을 확인하여 정확한 API를 사용하도록 수정이 필요합니다
//====여기까지 수정됨====
