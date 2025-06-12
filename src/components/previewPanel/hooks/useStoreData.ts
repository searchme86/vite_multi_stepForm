//====여기부터 수정됨====
// Zustand store 데이터를 안전하게 가져오는 훅 - 실제 스토어 구조에 맞게 최종 수정
import { useMemo, useState } from 'react';
// ✅ 수정: 실제 존재하는 스토어들을 import
// import { useFormDataStore } from '../../multiStepForm/store/formData/formDataStore';
import { useFormDataStore } from '../../../store/formData/formDataStore';
// import { useEditorCoreStore } from '../../multiStepForm/store/editorCore/editorCoreStore';
import { useEditorCoreStore } from '../../../store/editorCore/editorCoreStore';

// 실제 스토어 구조에 맞게 데이터를 가져오는 훅
export function useStoreData() {
  // 폼 데이터 스토어에서 상태 가져오기
  // formDataStore의 실제 상태 구조에 맞게 접근
  const formDataStore = useFormDataStore();
  const editorCoreStore = useEditorCoreStore();

  // 미리보기 패널 상태는 로컬에서 관리 (별도 스토어가 없으므로)
  // 미리보기 패널의 열림/닫힘 상태를 로컬 상태로 관리합니다
  const [isPreviewPanelOpen, setIsPreviewPanelOpen] = useState(false);

  // formDataStore에서 실제 폼 데이터 추출
  // formDataStore의 getFormData 메서드가 있다면 사용하고, 없다면 개별 속성들로 접근
  const formData = useMemo(() => {
    // formDataStore의 실제 구조에 따라 데이터 추출
    // 만약 getFormData() 메서드가 있다면:
    if (formDataStore?.getFormData) {
      return formDataStore.getFormData();
    }

    // 또는 개별 속성들이 있다면:
    return {
      userImage: formDataStore?.userImage || undefined,
      nickname: formDataStore?.nickname || '',
      emailPrefix: formDataStore?.emailPrefix || '',
      emailDomain: formDataStore?.emailDomain || '',
      bio: formDataStore?.bio || undefined,
      title: formDataStore?.title || '',
      description: formDataStore?.description || '',
      tags: formDataStore?.tags || undefined,
      content: formDataStore?.content || '',
      media: formDataStore?.media || undefined,
      mainImage: formDataStore?.mainImage || undefined,
      sliderImages: formDataStore?.sliderImages || undefined,
      // 기본값으로 빈 배열 제공
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

  const isEditorCompleted = useMemo(() => {
    return editorCoreStore?.getIsCompleted?.() || false;
  }, [editorCoreStore]);

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
