// blogMediaStep/hooks/useBlogMediaStepIntegration.ts

import { useCallback, useRef, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { useToastStore } from '../../../../../../store/toast/toastStore';
import { useFormDataStore } from '../../../../../../store/formData/formDataStore';

interface BlogMediaFormFields {
  media: string[];
  mainImage: string | null;
  sliderImages: string[];
}

interface ToastData {
  title: string;
  description: string;
  color: 'success' | 'warning' | 'danger' | 'primary';
  hideCloseButton?: boolean;
}

interface ToastStoreType {
  addToast: (toast: ToastData) => void;
}

interface FormDataStoreType {
  updateFormData?: (data: Partial<BlogMediaFormFields>) => void;
}

interface BlogMediaStepIntegrationResult {
  toastStore: ToastStoreType;
  formDataStore: FormDataStoreType;
  setMediaValue: (value: string[]) => void;
  setMainImageValue: (value: string) => void;
  setSliderImagesValue: (value: string[]) => void;
  currentFormValues: BlogMediaFormFields;
  addToast: (toast: ToastData) => void;
}

export const useBlogMediaStepIntegration =
  (): BlogMediaStepIntegrationResult => {
    console.log('🔧 useBlogMediaStepIntegration 훅 초기화');

    const { setValue, watch } = useFormContext();

    const rawToastStore = useToastStore();
    const rawFormDataStore = useFormDataStore();

    const toastStore: ToastStoreType = {
      addToast: rawToastStore?.addToast || (() => {}),
    };

    const formDataStore: FormDataStoreType = {
      updateFormData: rawFormDataStore?.updateFormData,
    };

    const prevFormValuesRef = useRef<BlogMediaFormFields>({
      media: [],
      mainImage: null,
      sliderImages: [],
    });

    const currentMedia = watch('media') || [];
    const currentMainImage = watch('mainImage') || null;
    const currentSliderImages = watch('sliderImages') || [];

    const currentFormValues: BlogMediaFormFields = {
      media: currentMedia,
      mainImage: currentMainImage,
      sliderImages: currentSliderImages,
    };

    const setMediaValue = useCallback(
      (value: string[]) => {
        console.log('🔄 setMediaValue 호출:', {
          count: value.length,
          timestamp: new Date().toLocaleTimeString(),
        });

        setValue('media', value);

        if (formDataStore?.updateFormData) {
          formDataStore.updateFormData({ media: value });
        }
      },
      [setValue, formDataStore]
    );

    const setMainImageValue = useCallback(
      (value: string) => {
        console.log('🔄 setMainImageValue 호출:', {
          hasValue: !!value,
          valueLength: value?.length || 0,
          timestamp: new Date().toLocaleTimeString(),
        });

        setValue('mainImage', value);

        if (formDataStore?.updateFormData) {
          formDataStore.updateFormData({ mainImage: value });
        }
      },
      [setValue, formDataStore]
    );

    const setSliderImagesValue = useCallback(
      (value: string[]) => {
        console.log('🔄 setSliderImagesValue 호출:', {
          count: value.length,
          firstImage: value[0]?.slice(0, 30) + '...' || 'none',
          timestamp: new Date().toLocaleTimeString(),
        });

        setValue('sliderImages', value);

        if (formDataStore?.updateFormData) {
          formDataStore.updateFormData({ sliderImages: value });
        }
      },
      [setValue, formDataStore]
    );

    const addToast = useCallback(
      (toast: ToastData) => {
        console.log('🔔 addToast 호출:', {
          title: toast.title,
          color: toast.color,
          timestamp: new Date().toLocaleTimeString(),
        });

        toastStore.addToast(toast);
      },
      [toastStore]
    );

    useEffect(() => {
      const prev = prevFormValuesRef.current;
      const current = currentFormValues;

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
        });

        const updateData: Partial<BlogMediaFormFields> = {};

        if (hasMediaChanged) updateData.media = current.media;
        if (hasMainImageChanged) updateData.mainImage = current.mainImage;
        if (hasSliderImagesChanged)
          updateData.sliderImages = current.sliderImages;

        if (formDataStore?.updateFormData) {
          formDataStore.updateFormData(updateData);
        }

        prevFormValuesRef.current = { ...current };

        console.log('✅ 스토어 동기화 완료:', updateData);
      }
    }, [currentFormValues, formDataStore]);

    useEffect(() => {
      console.log('✅ useBlogMediaStepIntegration 초기화 완료:', {
        hasToastStore: !!toastStore,
        hasFormDataStore: !!formDataStore,
        initialFormValues: currentFormValues,
        timestamp: new Date().toLocaleTimeString(),
      });
    }, []);

    return {
      toastStore,
      formDataStore,
      setMediaValue,
      setMainImageValue,
      setSliderImagesValue,
      currentFormValues,
      addToast,
    };
  };
