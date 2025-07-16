// src/components/previewPanel/hooks/useStoreData.ts

import { useMemo } from 'react';
import { useEditorCoreStore } from '../../../store/editorCore/editorCoreStore';
import { useMultiStepFormStore } from '../../multiStepForm/store/multiStepForm/multiStepFormStore';

// 폼 데이터 타입 정의
interface FormData {
  userImage: string | undefined;
  nickname: string;
  emailPrefix: string;
  emailDomain: string;
  bio: string | undefined;
  title: string;
  description: string;
  tags: string | undefined;
  content: string;
  mainImage: string | null | undefined;
  media: string[] | undefined;
  sliderImages: string[] | undefined;
  editorCompletedContent: string;
  isEditorCompleted: boolean;
}

// 커스텀 갤러리 뷰 타입 정의
interface CustomGalleryView {
  id: string;
  name: string;
  images: string[];
}

// 에디터 컨테이너 타입 정의
interface EditorContainer {
  id: string;
  content: string;
  order: number;
}

// 에디터 단락 타입 정의
interface EditorParagraph {
  id: string;
  text: string;
  containerId: string | null;
}

// 훅 반환 타입 정의
interface UseStoreDataReturn {
  formData: FormData | undefined;
  customGalleryViews: CustomGalleryView[];
  editorContainers: EditorContainer[];
  editorParagraphs: EditorParagraph[];
  editorCompletedContent: string;
  isEditorCompleted: boolean;
}

/**
 * 스토어 데이터를 안전하게 가져오는 훅
 *
 * 역할: 오직 콘텐츠 데이터만 제공
 * - UI 상태 관리 없음
 * - 미리보기 패널에 표시될 데이터만 반환
 * - 다양한 스토어에서 데이터를 수집하여 통합 제공
 */
export function useStoreData(): UseStoreDataReturn {
  console.log('🔄 [STORE_DATA] 스토어 데이터 훅 호출');

  // 📊 MultiStepForm 스토어에서 폼 데이터 가져오기
  const multiStepFormStore = useMultiStepFormStore();
  const formDataGetter = multiStepFormStore.getFormValues;

  // 📝 EditorCore 스토어에서 에디터 데이터 가져오기
  const editorCoreStore = useEditorCoreStore();

  console.log('🔍 [STORE_DATA] 스토어 객체 상태:', {
    hasMultiStepFormStore: !!multiStepFormStore,
    hasFormDataGetter: !!formDataGetter,
    hasEditorCoreStore: !!editorCoreStore,
    timestamp: new Date().toISOString(),
  });

  // 📋 폼 데이터 메모이제이션
  const formData = useMemo(() => {
    console.log('📋 [STORE_DATA] 폼 데이터 메모이제이션 시작');

    const hasValidFormDataGetter = typeof formDataGetter === 'function';
    if (!hasValidFormDataGetter) {
      console.warn('⚠️ [STORE_DATA] 폼 데이터 getter 함수 없음');
      return undefined;
    }

    const rawFormData = formDataGetter();
    const hasValidRawFormData =
      rawFormData !== null && rawFormData !== undefined;

    if (!hasValidRawFormData) {
      console.warn('⚠️ [STORE_DATA] 폼 데이터 없음');
      return undefined;
    }

    // 에디터 완료 콘텐츠 안전하게 가져오기
    const editorCompletedContent =
      editorCoreStore?.getCompletedContent?.() || '';
    const isEditorCompleted = editorCoreStore?.getIsCompleted?.() || false;

    const processedFormData: FormData = {
      userImage: rawFormData.userImage || undefined,
      nickname: rawFormData.nickname || '',
      emailPrefix: rawFormData.emailPrefix || '',
      emailDomain: rawFormData.emailDomain || '',
      bio: rawFormData.bio || undefined,
      title: rawFormData.title || '',
      description: rawFormData.description || '',
      tags: rawFormData.tags || undefined,
      content: rawFormData.content || '',
      mainImage: rawFormData.mainImage || undefined,
      media: rawFormData.media || undefined,
      sliderImages: rawFormData.sliderImages || undefined,
      editorCompletedContent,
      isEditorCompleted,
    };

    console.log('✅ [STORE_DATA] 폼 데이터 처리 완료:', {
      hasUserImage: !!processedFormData.userImage,
      hasNickname: !!processedFormData.nickname,
      hasTitle: !!processedFormData.title,
      hasDescription: !!processedFormData.description,
      hasMainImage: !!processedFormData.mainImage,
      mediaCount: Array.isArray(processedFormData.media)
        ? processedFormData.media.length
        : 0,
      sliderImagesCount: Array.isArray(processedFormData.sliderImages)
        ? processedFormData.sliderImages.length
        : 0,
      hasEditorContent: !!processedFormData.editorCompletedContent,
      isEditorCompleted: processedFormData.isEditorCompleted,
    });

    return processedFormData;
  }, [formDataGetter, editorCoreStore]);

  // 📝 에디터 완료 콘텐츠 메모이제이션
  const editorCompletedContent = useMemo(() => {
    console.log('📝 [STORE_DATA] 에디터 완료 콘텐츠 메모이제이션');

    const hasValidEditorStore =
      editorCoreStore !== null && editorCoreStore !== undefined;
    if (!hasValidEditorStore) {
      console.warn('⚠️ [STORE_DATA] 에디터 스토어 없음');
      return '';
    }

    const hasCompletedContentGetter =
      typeof editorCoreStore.getCompletedContent === 'function';
    if (!hasCompletedContentGetter) {
      console.warn('⚠️ [STORE_DATA] 에디터 완료 콘텐츠 getter 없음');
      return '';
    }

    const completedContent = editorCoreStore.getCompletedContent();
    const validCompletedContent =
      typeof completedContent === 'string' ? completedContent : '';

    console.log('✅ [STORE_DATA] 에디터 완료 콘텐츠 처리:', {
      contentLength: validCompletedContent.length,
      hasContent: validCompletedContent.length > 0,
    });

    return validCompletedContent;
  }, [editorCoreStore]);

  // ✅ 에디터 완료 상태 메모이제이션
  const isEditorCompleted = useMemo(() => {
    console.log('✅ [STORE_DATA] 에디터 완료 상태 메모이제이션');

    const hasValidEditorStore =
      editorCoreStore !== null && editorCoreStore !== undefined;
    if (!hasValidEditorStore) {
      console.warn('⚠️ [STORE_DATA] 에디터 스토어 없음');
      return false;
    }

    const hasIsCompletedGetter =
      typeof editorCoreStore.getIsCompleted === 'function';
    if (!hasIsCompletedGetter) {
      console.warn('⚠️ [STORE_DATA] 에디터 완료 상태 getter 없음');
      return false;
    }

    const completedStatus = editorCoreStore.getIsCompleted();
    const validCompletedStatus =
      typeof completedStatus === 'boolean' ? completedStatus : false;

    console.log('✅ [STORE_DATA] 에디터 완료 상태 처리:', {
      isCompleted: validCompletedStatus,
    });

    return validCompletedStatus;
  }, [editorCoreStore]);

  // 🎨 기존 코드와의 호환성을 위한 임시 데이터들
  const customGalleryViews = useMemo(() => {
    console.log('🎨 [STORE_DATA] 커스텀 갤러리 뷰 메모이제이션 (임시 빈 배열)');

    const emptyGalleryViews: CustomGalleryView[] = [];
    return emptyGalleryViews;
  }, []);

  const editorContainers = useMemo(() => {
    console.log('📦 [STORE_DATA] 에디터 컨테이너 메모이제이션 (임시 빈 배열)');

    const emptyContainers: EditorContainer[] = [];
    return emptyContainers;
  }, []);

  const editorParagraphs = useMemo(() => {
    console.log('📄 [STORE_DATA] 에디터 단락 메모이제이션 (임시 빈 배열)');

    const emptyParagraphs: EditorParagraph[] = [];
    return emptyParagraphs;
  }, []);

  // 🎯 최종 데이터 반환 (UI 상태 완전 제거)
  const finalData = useMemo(() => {
    console.log('🎯 [STORE_DATA] 최종 데이터 반환 객체 생성');

    const result: UseStoreDataReturn = {
      formData,
      customGalleryViews,
      editorContainers,
      editorParagraphs,
      editorCompletedContent,
      isEditorCompleted,
    };

    console.log('✅ [STORE_DATA] 최종 데이터 반환 완료:', {
      hasFormData: !!result.formData,
      customGalleryViewsCount: result.customGalleryViews.length,
      editorContainersCount: result.editorContainers.length,
      editorParagraphsCount: result.editorParagraphs.length,
      editorContentLength: result.editorCompletedContent.length,
      isEditorCompleted: result.isEditorCompleted,
      timestamp: new Date().toISOString(),
    });

    return result;
  }, [
    formData,
    customGalleryViews,
    editorContainers,
    editorParagraphs,
    editorCompletedContent,
    isEditorCompleted,
  ]);

  return finalData;
}
