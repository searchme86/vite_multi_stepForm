// src/components/previewPanel/hooks/useStoreData.ts - 디버깅 버전

import { useMemo, useEffect, useState } from 'react';
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
 * 스토어 데이터를 안전하게 가져오는 훅 - 디버깅 강화 버전
 */
export function useStoreData(): UseStoreDataReturn {
  console.log('🔄 [STORE_DATA_DEBUG] 스토어 데이터 훅 호출');

  // 강제 업데이트를 위한 상태
  const [updateTrigger, setUpdateTrigger] = useState(0);

  // 📊 MultiStepForm 스토어에서 폼 데이터 가져오기
  const multiStepFormStore = useMultiStepFormStore();
  const formDataGetter = multiStepFormStore.getFormValues;

  // 📝 EditorCore 스토어에서 에디터 데이터 가져오기
  const editorCoreStore = useEditorCoreStore();

  console.log('🔍 [STORE_DATA_DEBUG] 스토어 연결 상태:', {
    hasMultiStepFormStore: !!multiStepFormStore,
    hasFormDataGetter: !!formDataGetter,
    hasEditorCoreStore: !!editorCoreStore,
    updateTrigger,
    timestamp: new Date().toISOString(),
  });

  // 📋 폼 데이터 메모이제이션
  const formData = useMemo(() => {
    console.log('📋 [STORE_DATA_DEBUG] 폼 데이터 메모이제이션 시작');

    const hasValidFormDataGetter = typeof formDataGetter === 'function';
    if (!hasValidFormDataGetter) {
      console.warn('⚠️ [STORE_DATA_DEBUG] 폼 데이터 getter 함수 없음');
      return undefined;
    }

    const rawFormData = formDataGetter();
    const hasValidRawFormData =
      rawFormData !== null && rawFormData !== undefined;

    console.log('📊 [STORE_DATA_DEBUG] Raw 폼 데이터 상태:', {
      hasValidRawFormData,
      rawFormDataType: typeof rawFormData,
      rawFormDataKeys: rawFormData ? Object.keys(rawFormData) : [],
      updateTrigger,
      timestamp: new Date().toISOString(),
    });

    if (!hasValidRawFormData) {
      console.warn('⚠️ [STORE_DATA_DEBUG] 폼 데이터 없음');
      return undefined;
    }

    // 🔍 각 필드별 상세 로깅
    console.log('🔍 [STORE_DATA_DEBUG] 각 필드별 상세 데이터:', {
      // 사용자 정보
      userImage: rawFormData.userImage
        ? `있음(${rawFormData.userImage.length}자)`
        : '없음',
      nickname: rawFormData.nickname || '없음',
      emailPrefix: rawFormData.emailPrefix || '없음',
      emailDomain: rawFormData.emailDomain || '없음',
      bio: rawFormData.bio ? `있음(${rawFormData.bio.length}자)` : '없음',

      // 블로그 기본 정보
      title: rawFormData.title || '없음',
      description: rawFormData.description || '없음',
      tags: rawFormData.tags || '없음',
      content: rawFormData.content || '없음',

      // 미디어 정보
      mainImage: rawFormData.mainImage ? '있음' : '없음',
      mediaCount: Array.isArray(rawFormData.media)
        ? rawFormData.media.length
        : 0,
      sliderImagesCount: Array.isArray(rawFormData.sliderImages)
        ? rawFormData.sliderImages.length
        : 0,

      timestamp: new Date().toISOString(),
    });

    // 에디터 완료 콘텐츠 안전하게 가져오기
    const editorCompletedContent =
      editorCoreStore?.getCompletedContent?.() || '';
    const isEditorCompleted = editorCoreStore?.getIsCompleted?.() || false;

    console.log('📝 [STORE_DATA_DEBUG] 에디터 데이터:', {
      editorContentLength: editorCompletedContent.length,
      isEditorCompleted,
      timestamp: new Date().toISOString(),
    });

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

    console.log('✅ [STORE_DATA_DEBUG] 최종 처리된 폼 데이터:', {
      hasUserImage: !!processedFormData.userImage,
      hasNickname: !!processedFormData.nickname,
      hasEmailPrefix: !!processedFormData.emailPrefix,
      hasEmailDomain: !!processedFormData.emailDomain,
      hasBio: !!processedFormData.bio,
      hasTitle: !!processedFormData.title,
      hasDescription: !!processedFormData.description,
      hasTags: !!processedFormData.tags,
      hasContent: !!processedFormData.content,
      hasMainImage: !!processedFormData.mainImage,
      mediaCount: Array.isArray(processedFormData.media)
        ? processedFormData.media.length
        : 0,
      sliderImagesCount: Array.isArray(processedFormData.sliderImages)
        ? processedFormData.sliderImages.length
        : 0,
      editorContentLength: processedFormData.editorCompletedContent.length,
      isEditorCompleted: processedFormData.isEditorCompleted,
      timestamp: new Date().toISOString(),
    });

    return processedFormData;
  }, [formDataGetter, editorCoreStore, updateTrigger]);

  // 📝 에디터 완료 콘텐츠 메모이제이션
  const editorCompletedContent = useMemo(() => {
    console.log('📝 [STORE_DATA_DEBUG] 에디터 완료 콘텐츠 메모이제이션');

    const hasValidEditorStore =
      editorCoreStore !== null && editorCoreStore !== undefined;
    if (!hasValidEditorStore) {
      console.warn('⚠️ [STORE_DATA_DEBUG] 에디터 스토어 없음');
      return '';
    }

    const hasCompletedContentGetter =
      typeof editorCoreStore.getCompletedContent === 'function';
    if (!hasCompletedContentGetter) {
      console.warn('⚠️ [STORE_DATA_DEBUG] 에디터 완료 콘텐츠 getter 없음');
      return '';
    }

    const completedContent = editorCoreStore.getCompletedContent();
    const validCompletedContent =
      typeof completedContent === 'string' ? completedContent : '';

    console.log('✅ [STORE_DATA_DEBUG] 에디터 완료 콘텐츠 처리:', {
      contentLength: validCompletedContent.length,
      hasContent: validCompletedContent.length > 0,
      timestamp: new Date().toISOString(),
    });

    return validCompletedContent;
  }, [editorCoreStore, updateTrigger]);

  // ✅ 에디터 완료 상태 메모이제이션
  const isEditorCompleted = useMemo(() => {
    console.log('✅ [STORE_DATA_DEBUG] 에디터 완료 상태 메모이제이션');

    const hasValidEditorStore =
      editorCoreStore !== null && editorCoreStore !== undefined;
    if (!hasValidEditorStore) {
      console.warn('⚠️ [STORE_DATA_DEBUG] 에디터 스토어 없음');
      return false;
    }

    const hasIsCompletedGetter =
      typeof editorCoreStore.getIsCompleted === 'function';
    if (!hasIsCompletedGetter) {
      console.warn('⚠️ [STORE_DATA_DEBUG] 에디터 완료 상태 getter 없음');
      return false;
    }

    const completedStatus = editorCoreStore.getIsCompleted();
    const validCompletedStatus =
      typeof completedStatus === 'boolean' ? completedStatus : false;

    console.log('✅ [STORE_DATA_DEBUG] 에디터 완료 상태 처리:', {
      isCompleted: validCompletedStatus,
      timestamp: new Date().toISOString(),
    });

    return validCompletedStatus;
  }, [editorCoreStore, updateTrigger]);

  // 🎨 기존 코드와의 호환성을 위한 임시 데이터들
  const customGalleryViews = useMemo(() => {
    console.log(
      '🎨 [STORE_DATA_DEBUG] 커스텀 갤러리 뷰 메모이제이션 (임시 빈 배열)'
    );
    const emptyGalleryViews: CustomGalleryView[] = [];
    return emptyGalleryViews;
  }, []);

  const editorContainers = useMemo(() => {
    console.log(
      '📦 [STORE_DATA_DEBUG] 에디터 컨테이너 메모이제이션 (임시 빈 배열)'
    );
    const emptyContainers: EditorContainer[] = [];
    return emptyContainers;
  }, []);

  const editorParagraphs = useMemo(() => {
    console.log(
      '📄 [STORE_DATA_DEBUG] 에디터 단락 메모이제이션 (임시 빈 배열)'
    );
    const emptyParagraphs: EditorParagraph[] = [];
    return emptyParagraphs;
  }, []);

  // 🔄 스토어 변경 감지 및 강제 업데이트
  useEffect(() => {
    console.log('🔄 [STORE_DATA_DEBUG] 스토어 변경 감지 설정');

    // 5초마다 강제 업데이트 (디버깅용)
    const interval = setInterval(() => {
      console.log('⏰ [STORE_DATA_DEBUG] 5초마다 강제 업데이트');
      setUpdateTrigger((prev) => prev + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // 🎯 최종 데이터 반환
  const finalData = useMemo(() => {
    console.log('🎯 [STORE_DATA_DEBUG] 최종 데이터 반환 객체 생성');

    const result: UseStoreDataReturn = {
      formData,
      customGalleryViews,
      editorContainers,
      editorParagraphs,
      editorCompletedContent,
      isEditorCompleted,
    };

    console.log('✅ [STORE_DATA_DEBUG] 최종 데이터 반환 완료:', {
      hasFormData: !!result.formData,
      customGalleryViewsCount: result.customGalleryViews.length,
      editorContainersCount: result.editorContainers.length,
      editorParagraphsCount: result.editorParagraphs.length,
      editorContentLength: result.editorCompletedContent.length,
      isEditorCompleted: result.isEditorCompleted,
      timestamp: new Date().toISOString(),
    });

    // 🚨 문제 감지 및 경고
    if (!result.formData) {
      console.error(
        '🚨 [STORE_DATA_DEBUG] 심각한 문제: 폼 데이터를 가져올 수 없습니다!'
      );
      console.error('🔍 [STORE_DATA_DEBUG] 디버깅 정보:', {
        hasMultiStepFormStore: !!multiStepFormStore,
        hasFormDataGetter: !!formDataGetter,
        updateTrigger,
      });
    }

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
    updateTrigger,
  ]);

  return finalData;
}
