// blogMediaStep/hooks/useBlogMediaStepIntegration.ts - BlogMediaStep 컴포넌트

/**
 * BlogMediaStep 컴포넌트 - Zustand 스토어와 React Hook Form 통합 훅
 * 폼 데이터와 스토어 상태 간의 양방향 동기화를 담당
 * 무한 렌더링 방지와 안정적인 상태 관리를 제공
 */

import { useCallback, useRef, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
// import { useToastStore } from '../../store/toast/toastStore';
// import { useFormDataStore } from '../../store/formData/formDataStore';
import { useToastStore } from '../../../../../../store/toast/toastStore';
import { useFormDataStore } from '../../../../../../store/formData/formDataStore';

// ✅ 폼 필드 타입 정의 (기존 구조 유지)
interface BlogMediaFormFields {
  media: string[];
  mainImage: string | null;
  sliderImages: string[];
}

// ✅ 통합 훅 반환 타입
interface BlogMediaStepIntegrationResult {
  // Zustand 스토어 인스턴스들
  toastStore: ReturnType<typeof useToastStore>;
  formDataStore: ReturnType<typeof useFormDataStore>;

  // 안정화된 setValue 함수들
  setMediaValue: (value: string[]) => void;
  setMainImageValue: (value: string) => void;
  setSliderImagesValue: (value: string[]) => void;

  // 현재 폼 값들
  currentFormValues: BlogMediaFormFields;

  // 토스트 메시지 추가 함수
  addToast: (
    toast: Parameters<ReturnType<typeof useToastStore>['addToast']>[0]
  ) => void;
}

/**
 * BlogMediaStep 통합 관리 훅
 * Zustand 스토어들과 React Hook Form 간의 연결을 담당
 */
export const useBlogMediaStepIntegration =
  (): BlogMediaStepIntegrationResult => {
    console.log('🔧 useBlogMediaStepIntegration 훅 초기화'); // 디버깅용

    // ✅ React Hook Form 컨텍스트
    const { setValue, watch } = useFormContext();

    // ✅ Zustand 스토어들
    const toastStore = useToastStore();
    const formDataStore = useFormDataStore();

    // ✅ 이전 값 추적을 위한 ref (무한 렌더링 방지)
    const prevFormValuesRef = useRef<BlogMediaFormFields>({
      media: [],
      mainImage: null,
      sliderImages: [],
    });

    // ✅ 현재 폼 값들 실시간 감지
    const currentMedia = watch('media') || [];
    const currentMainImage = watch('mainImage') || null;
    const currentSliderImages = watch('sliderImages') || [];

    const currentFormValues: BlogMediaFormFields = {
      media: currentMedia,
      mainImage: currentMainImage,
      sliderImages: currentSliderImages,
    };

    // ✅ 안정화된 setValue 함수들 (useCallback으로 메모이제이션)
    const setMediaValue = useCallback(
      (value: string[]) => {
        console.log('🔄 setMediaValue 호출:', {
          count: value.length,
          timestamp: new Date().toLocaleTimeString(),
        }); // 디버깅용

        setValue('media', value);

        // 스토어에도 즉시 동기화
        formDataStore?.updateFormData?.({ media: value });
      },
      [setValue, formDataStore]
    );

    const setMainImageValue = useCallback(
      (value: string) => {
        console.log('🔄 setMainImageValue 호출:', {
          hasValue: !!value,
          valueLength: value?.length || 0,
          timestamp: new Date().toLocaleTimeString(),
        }); // 디버깅용

        setValue('mainImage', value);

        // 스토어에도 즉시 동기화
        formDataStore?.updateFormData?.({ mainImage: value });
      },
      [setValue, formDataStore]
    );

    const setSliderImagesValue = useCallback(
      (value: string[]) => {
        console.log('🔄 setSliderImagesValue 호출:', {
          count: value.length,
          firstImage: value[0]?.slice(0, 30) + '...' || 'none',
          timestamp: new Date().toLocaleTimeString(),
        }); // 디버깅용

        setValue('sliderImages', value);

        // 스토어에도 즉시 동기화
        formDataStore?.updateFormData?.({ sliderImages: value });
      },
      [setValue, formDataStore]
    );

    // ✅ 토스트 메시지 추가 함수
    const addToast = useCallback(
      (toast: Parameters<ReturnType<typeof useToastStore>['addToast']>[0]) => {
        console.log('🔔 addToast 호출:', {
          title: toast.title,
          color: toast.color,
          timestamp: new Date().toLocaleTimeString(),
        }); // 디버깅용

        toastStore?.addToast?.(toast);
      },
      [toastStore]
    );

    // ✅ 폼 값 변경 감지 및 스토어 동기화 (조건부 업데이트로 무한 루프 방지)
    useEffect(() => {
      const prev = prevFormValuesRef.current;
      const current = currentFormValues;

      // 실제 변경 검사 (얕은 비교)
      const hasMediaChanged =
        JSON.stringify(prev.media) !== JSON.stringify(current.media);
      const hasMainImageChanged = prev.mainImage !== current.mainImage;
      const hasSliderImagesChanged =
        JSON.stringify(prev.sliderImages) !==
        JSON.stringify(current.sliderImages);

      const hasAnyChanged =
        hasMediaChanged || hasMainImageChanged || hasSliderImagesChanged;

      if (hasAnyChanged) {
        console.log('📊 폼 값 변경 감지:', {
          hasMediaChanged,
          hasMainImageChanged,
          hasSliderImagesChanged,
          mediaCount: current.media.length,
          hasMainImage: !!current.mainImage,
          sliderCount: current.sliderImages.length,
          timestamp: new Date().toLocaleTimeString(),
        }); // 디버깅용

        // 스토어 업데이트 (변경된 부분만)
        const updateData: Partial<BlogMediaFormFields> = {};

        if (hasMediaChanged) updateData.media = current.media;
        if (hasMainImageChanged) updateData.mainImage = current.mainImage;
        if (hasSliderImagesChanged)
          updateData.sliderImages = current.sliderImages;

        formDataStore?.updateFormData?.(updateData);

        // 이전 값 업데이트
        prevFormValuesRef.current = { ...current };

        console.log('✅ 스토어 동기화 완료:', updateData); // 디버깅용
      }
    }, [currentFormValues, formDataStore]); // formDataStore는 안정적이므로 의존성에 포함

    // ✅ 훅 초기화 완료 로그
    useEffect(() => {
      console.log('✅ useBlogMediaStepIntegration 초기화 완료:', {
        hasToastStore: !!toastStore,
        hasFormDataStore: !!formDataStore,
        initialFormValues: currentFormValues,
        timestamp: new Date().toLocaleTimeString(),
      }); // 디버깅용
    }, []); // 한 번만 실행

    return {
      // 스토어 인스턴스들
      toastStore,
      formDataStore,

      // 안정화된 setValue 함수들
      setMediaValue,
      setMainImageValue,
      setSliderImagesValue,

      // 현재 폼 값들
      currentFormValues,

      // 유틸리티 함수들
      addToast,
    };
  };
