// 📁 blogMediaStep/BlogMediaStepContainer.tsx - 양방향 동기화 + process.env 타입 안전성 버전

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { useBlogMediaStepState } from './hooks/useBlogMediaStepState';
import { useMultiStepFormStore } from '../../../store/multiStepForm/multiStepFormStore';
import type { FormValues } from '../../../../../store/shared/commonTypes';

import ImageUploadContainer from './imageUpload/ImageUploadContainer';
import ImageSliderContainer from './imageSlider/ImageSliderContainer';
import MainImageContainer from './mainImage/MainImageContainer';
import ImageGalleryContainer from './imageGallery/ImageGalleryContainer';

type ActiveSectionType = 'mainImage' | 'imageGallery' | 'imageSlider';

interface SafeFormValues {
  media?: string[];
  mainImage?: string | null;
  sliderImages?: string[];
}

interface NavigationMenuItem {
  sectionType: ActiveSectionType;
  displayLabel: string;
  iconEmoji: string;
  iconBackgroundColor: string;
  statusType: string;
}

interface MobileTabItem {
  sectionType: ActiveSectionType;
  displayLabel: string;
  shortLabel: string;
}

const isValidActiveSectionType = (
  value: string
): value is ActiveSectionType => {
  return (
    value === 'mainImage' || value === 'imageGallery' || value === 'imageSlider'
  );
};

// 🚨 핵심 수정: 안전한 환경변수 접근 함수
const checkIsDevelopmentMode = (): boolean => {
  try {
    const globalProcess = globalThis.process;
    const hasGlobalProcess =
      globalProcess !== null && globalProcess !== undefined;

    if (!hasGlobalProcess) {
      return false;
    }

    const { env: environmentVariables } = globalProcess;
    const hasEnvironmentVariables =
      environmentVariables !== null && environmentVariables !== undefined;

    if (!hasEnvironmentVariables) {
      return false;
    }

    const { NODE_ENV: nodeEnvironment } = environmentVariables;
    const isDevelopmentEnvironment = nodeEnvironment === 'development';

    return isDevelopmentEnvironment;
  } catch (environmentCheckError) {
    console.warn(
      '⚠️ [ENV_CHECK] 환경변수 확인 중 오류:',
      environmentCheckError
    );
    return false;
  }
};

function BlogMediaStepContainer(): React.ReactNode {
  console.group(
    '🚀 [BLOG_MEDIA_SYNC] BlogMediaStepContainer 양방향 동기화 버전'
  );
  console.log(
    '📅 [BLOG_MEDIA_SYNC] 렌더링 시작 시간:',
    new Date().toISOString()
  );

  const [activeSectionType, setActiveSectionType] =
    useState<ActiveSectionType>('mainImage');

  // 🚨 핵심 수정: setValue 추가로 양방향 동기화 지원
  const formContext = useFormContext<FormValues>();
  const { watch, getValues, setValue } = formContext;

  // 🚨 핵심 수정: multiStepFormStore 직접 연결
  const multiStepFormStore = useMultiStepFormStore();

  // 🎣 커스텀 훅: 미디어 상태 관리
  const blogMediaStepStateHook = useBlogMediaStepState();
  const {
    formValues: currentFormValuesData,
    forceSync,
    syncInitialized,
  } = blogMediaStepStateHook;

  // 🚨 동기화 상태 추적을 위한 ref들
  const initialSyncCompletedRef = useRef(false);
  const lastKnownStoreDataRef = useRef<string>('');
  const syncInProgressRef = useRef(false);

  // 🚨 핵심 수정: 환경변수 안전하게 확인
  const isDevelopmentMode = checkIsDevelopmentMode();

  // 🔍 디버깅: 훅 상태 로깅
  console.log('🔍 [BLOG_MEDIA_SYNC] 양방향 동기화 훅 상태:', {
    hasStateHook: !!blogMediaStepStateHook,
    hasFormValues: !!currentFormValuesData,
    formValuesType: typeof currentFormValuesData,
    formValuesKeys: currentFormValuesData
      ? Object.keys(currentFormValuesData)
      : [],
    activeSectionType,
    hasMultiStepFormStore: !!multiStepFormStore,
    syncInitialized,
    initialSyncCompleted: initialSyncCompletedRef.current,
    isDevelopmentMode,
    bidirectionalSync: true,
    processEnvSafe: true,
    timestamp: new Date().toISOString(),
  });

  // 안전한 폼 값 처리
  const createSafeFormValues = useCallback(
    (formData: unknown): SafeFormValues => {
      const hasFormData = formData !== null && formData !== undefined;
      const isFormDataObject = hasFormData && typeof formData === 'object';

      if (!isFormDataObject) {
        console.warn('⚠️ [BLOG_MEDIA_SYNC] 폼 데이터가 객체가 아님:', {
          formData,
          hasFormData,
          dataType: typeof formData,
        });
        return {
          media: [],
          mainImage: null,
          sliderImages: [],
        };
      }

      const mediaProperty = Reflect.get(formData, 'media');
      const mainImageProperty = Reflect.get(formData, 'mainImage');
      const sliderImagesProperty = Reflect.get(formData, 'sliderImages');

      const safeMedia = Array.isArray(mediaProperty) ? mediaProperty : [];
      const safeMainImage =
        typeof mainImageProperty === 'string' && mainImageProperty.length > 0
          ? mainImageProperty
          : null;
      const safeSliderImages = Array.isArray(sliderImagesProperty)
        ? sliderImagesProperty
        : [];

      console.log('🔍 [BLOG_MEDIA_SYNC] 안전한 폼 값 처리:', {
        mediaCount: safeMedia.length,
        hasMainImage: !!safeMainImage,
        sliderImagesCount: safeSliderImages.length,
        bidirectionalProcessing: true,
        timestamp: new Date().toISOString(),
      });

      return {
        media: safeMedia,
        mainImage: safeMainImage,
        sliderImages: safeSliderImages,
      };
    },
    []
  );

  const safeFormValues = createSafeFormValues(currentFormValuesData);

  const {
    media: rawUploadedMediaFileList = [],
    mainImage: rawSelectedMainImageUrl = null,
    sliderImages: rawConfiguredSliderImageList = [],
  } = safeFormValues;

  const uploadedMediaFileList = Array.isArray(rawUploadedMediaFileList)
    ? rawUploadedMediaFileList
    : [];
  const selectedMainImageUrl =
    rawSelectedMainImageUrl !== null &&
    rawSelectedMainImageUrl !== undefined &&
    rawSelectedMainImageUrl !== ''
      ? rawSelectedMainImageUrl
      : null;
  const configuredSliderImageList = Array.isArray(rawConfiguredSliderImageList)
    ? rawConfiguredSliderImageList
    : [];

  // 🚨 핵심 추가: 초기 데이터 복원 로직
  useEffect(() => {
    const shouldRestoreInitialData =
      syncInitialized &&
      !initialSyncCompletedRef.current &&
      !syncInProgressRef.current;

    if (!shouldRestoreInitialData) {
      return;
    }

    console.log('🔄 [INITIAL_RESTORE] 초기 데이터 복원 시작');

    syncInProgressRef.current = true;

    try {
      const currentStoreData = multiStepFormStore.getFormValues();
      const currentFormData = getValues();

      console.log('📊 [INITIAL_RESTORE] 초기 데이터 비교:', {
        storeData: {
          hasMainImage: !!currentStoreData.mainImage,
          mediaCount: Array.isArray(currentStoreData.media)
            ? currentStoreData.media.length
            : 0,
          hasSliderImages: Array.isArray(currentStoreData.sliderImages)
            ? currentStoreData.sliderImages.length
            : 0,
        },
        formData: {
          hasMainImage: !!currentFormData.mainImage,
          mediaCount: Array.isArray(currentFormData.media)
            ? currentFormData.media.length
            : 0,
          hasSliderImages: Array.isArray(currentFormData.sliderImages)
            ? currentFormData.sliderImages.length
            : 0,
        },
      });

      // 스토어에 데이터가 있고 폼이 비어있으면 복원
      const shouldRestoreMainImage =
        currentStoreData.mainImage && !currentFormData.mainImage;

      const shouldRestoreMedia =
        Array.isArray(currentStoreData.media) &&
        currentStoreData.media.length > 0 &&
        (!Array.isArray(currentFormData.media) ||
          currentFormData.media.length === 0);

      const shouldRestoreSliderImages =
        Array.isArray(currentStoreData.sliderImages) &&
        currentStoreData.sliderImages.length > 0 &&
        (!Array.isArray(currentFormData.sliderImages) ||
          currentFormData.sliderImages.length === 0);

      if (shouldRestoreMainImage) {
        setValue('mainImage', currentStoreData.mainImage, {
          shouldDirty: true,
        });
        console.log('✅ [INITIAL_RESTORE] 메인 이미지 복원 완료');
      }

      if (shouldRestoreMedia) {
        setValue('media', currentStoreData.media, { shouldDirty: true });
        console.log('✅ [INITIAL_RESTORE] 미디어 배열 복원 완료');
      }

      if (shouldRestoreSliderImages) {
        setValue('sliderImages', currentStoreData.sliderImages, {
          shouldDirty: true,
        });
        console.log('✅ [INITIAL_RESTORE] 슬라이더 이미지 복원 완료');
      }

      initialSyncCompletedRef.current = true;

      console.log('✅ [INITIAL_RESTORE] 초기 데이터 복원 완료:', {
        restoredMainImage: shouldRestoreMainImage,
        restoredMedia: shouldRestoreMedia,
        restoredSliderImages: shouldRestoreSliderImages,
        initialSyncCompleted: true,
      });
    } catch (restoreError) {
      console.error('❌ [INITIAL_RESTORE] 초기 데이터 복원 실패:', {
        error: restoreError,
      });
    } finally {
      syncInProgressRef.current = false;
    }
  }, [syncInitialized, multiStepFormStore, getValues, setValue]);

  // 🚨 핵심 추가: multiStepFormStore → React Hook Form 실시간 동기화
  useEffect(() => {
    const shouldSetupStoreToFormSync =
      syncInitialized && initialSyncCompletedRef.current;

    if (!shouldSetupStoreToFormSync) {
      return;
    }

    console.log(
      '🔄 [STORE_TO_FORM_SYNC] multiStepFormStore → React Hook Form 동기화 설정'
    );

    const syncStoreToForm = () => {
      if (syncInProgressRef.current) {
        return;
      }

      try {
        const currentStoreData = multiStepFormStore.getFormValues();
        const currentStoreDataString = JSON.stringify(currentStoreData);

        const hasStoreChanged =
          currentStoreDataString !== lastKnownStoreDataRef.current;

        if (hasStoreChanged) {
          console.log('📊 [STORE_TO_FORM_SYNC] 스토어 변경 감지:', {
            previousDataLength: lastKnownStoreDataRef.current.length,
            currentDataLength: currentStoreDataString.length,
            timestamp: new Date().toISOString(),
          });

          syncInProgressRef.current = true;

          const currentFormData = getValues();

          // 메인 이미지 동기화
          const storeMainImage = currentStoreData.mainImage ?? '';
          const formMainImage = currentFormData.mainImage ?? '';

          if (storeMainImage !== formMainImage) {
            setValue('mainImage', storeMainImage, { shouldDirty: true });
            console.log('🔄 [STORE_TO_FORM_SYNC] 메인 이미지 동기화 완료');
          }

          // 미디어 배열 동기화
          const storeMedia = Array.isArray(currentStoreData.media)
            ? currentStoreData.media
            : [];
          const formMedia = Array.isArray(currentFormData.media)
            ? currentFormData.media
            : [];

          const isMediaDifferent =
            JSON.stringify(storeMedia) !== JSON.stringify(formMedia);

          if (isMediaDifferent) {
            setValue('media', storeMedia, { shouldDirty: true });
            console.log('🔄 [STORE_TO_FORM_SYNC] 미디어 배열 동기화 완료');
          }

          // 슬라이더 이미지 동기화
          const storeSliderImages = Array.isArray(currentStoreData.sliderImages)
            ? currentStoreData.sliderImages
            : [];
          const formSliderImages = Array.isArray(currentFormData.sliderImages)
            ? currentFormData.sliderImages
            : [];

          const isSliderImagesDifferent =
            JSON.stringify(storeSliderImages) !==
            JSON.stringify(formSliderImages);

          if (isSliderImagesDifferent) {
            setValue('sliderImages', storeSliderImages, { shouldDirty: true });
            console.log('🔄 [STORE_TO_FORM_SYNC] 슬라이더 이미지 동기화 완료');
          }

          lastKnownStoreDataRef.current = currentStoreDataString;
          syncInProgressRef.current = false;

          console.log('✅ [STORE_TO_FORM_SYNC] 스토어 → 폼 동기화 완료');
        }
      } catch (syncError) {
        console.error('❌ [STORE_TO_FORM_SYNC] 동기화 실패:', {
          error: syncError,
        });
        syncInProgressRef.current = false;
      }
    };

    // 200ms마다 스토어 변경 감지
    const storeToFormSyncInterval = setInterval(syncStoreToForm, 200);

    console.log('✅ [STORE_TO_FORM_SYNC] 실시간 동기화 활성화 (200ms 간격)');

    return () => {
      clearInterval(storeToFormSyncInterval);
      console.log('🔄 [STORE_TO_FORM_SYNC] 실시간 동기화 해제');
    };
  }, [syncInitialized, multiStepFormStore, getValues, setValue]);

  // 🔍 디버깅: React Hook Form 값들과 비교
  const reactHookFormValues = getValues();
  console.log(
    '🔍 [BLOG_MEDIA_SYNC] React Hook Form vs 커스텀 훅 비교 (양방향):',
    {
      reactHookForm: {
        media: reactHookFormValues.media || [],
        mainImage: reactHookFormValues.mainImage || null,
        sliderImages: reactHookFormValues.sliderImages || [],
      },
      customHook: {
        media: uploadedMediaFileList,
        mainImage: selectedMainImageUrl,
        sliderImages: configuredSliderImageList,
      },
      동일한가: {
        media:
          JSON.stringify(reactHookFormValues.media) ===
          JSON.stringify(uploadedMediaFileList),
        mainImage: reactHookFormValues.mainImage === selectedMainImageUrl,
        sliderImages:
          JSON.stringify(reactHookFormValues.sliderImages) ===
          JSON.stringify(configuredSliderImageList),
      },
      bidirectionalSyncActive: true,
      timestamp: new Date().toISOString(),
    }
  );

  console.log('📊 [BLOG_MEDIA_SYNC] 최종 상태 데이터 (양방향):', {
    uploadedMediaFileCount: uploadedMediaFileList.length,
    hasSelectedMainImage: selectedMainImageUrl !== null,
    configuredSliderImageCount: configuredSliderImageList.length,
    currentActiveSection: activeSectionType,
    selectedMainImagePreview: selectedMainImageUrl
      ? selectedMainImageUrl.slice(0, 50) + '...'
      : 'none',
    syncStatus: {
      syncInitialized,
      initialSyncCompleted: initialSyncCompletedRef.current,
      syncInProgress: syncInProgressRef.current,
    },
    timestamp: new Date().toISOString(),
  });

  const hasUploadedImages = uploadedMediaFileList.length > 0;

  // 🔍 디버깅: 실시간 폼 변경 감지 (기존 유지하되 로그 개선)
  useEffect(() => {
    console.log('🔍 [BLOG_MEDIA_SYNC] 실시간 폼 변경 감지 설정 (양방향)');

    const subscription = watch((value, { name, type }) => {
      const isMediaRelatedField =
        name === 'media' || name === 'mainImage' || name === 'sliderImages';

      if (isMediaRelatedField) {
        console.log('🔄 [BLOG_MEDIA_SYNC] 폼 필드 변경 감지 (양방향):', {
          fieldName: name,
          newValue: value[name],
          changeType: type,
          bidirectionalSync: true,
          timestamp: new Date().toISOString(),
        });

        // 🚨 추가: 상태 불일치 감지 시 강제 동기화
        if (forceSync && typeof forceSync === 'function') {
          setTimeout(() => {
            console.log('🔄 [FORCE_SYNC] 폼 변경 후 강제 동기화 실행');
            forceSync();
          }, 100);
        }
      }
    });

    return () => {
      console.log('🔄 [BLOG_MEDIA_SYNC] 실시간 폼 변경 감지 해제');
      subscription.unsubscribe();
    };
  }, [watch, forceSync]);

  // 🔍 디버깅: 상태 변경 시 로깅 (기존 유지)
  useEffect(() => {
    console.log('📊 [BLOG_MEDIA_SYNC] 상태 변경 감지 (양방향):', {
      uploadedMediaFileCount: uploadedMediaFileList.length,
      selectedMainImageUrl,
      configuredSliderImageCount: configuredSliderImageList.length,
      activeSectionType,
      bidirectionalSync: true,
      timestamp: new Date().toISOString(),
    });
  }, [
    uploadedMediaFileList,
    selectedMainImageUrl,
    configuredSliderImageList,
    activeSectionType,
  ]);

  const handleNavigationSectionChange = useCallback(
    (newSectionType: ActiveSectionType) => {
      console.log('🔧 [BLOG_MEDIA_SYNC] 네비게이션 섹션 변경:', {
        previousSection: activeSectionType,
        newSectionType,
        timestamp: new Date().toISOString(),
      });

      setActiveSectionType(newSectionType);

      console.log('✅ [BLOG_MEDIA_SYNC] 네비게이션 섹션 변경 완료:', {
        newActiveSection: newSectionType,
      });
    },
    [activeSectionType]
  );

  const renderDragAndDropUploadSection = useCallback(() => {
    console.log('🔄 [BLOG_MEDIA_SYNC] 업로드 섹션 렌더링');

    return (
      <section
        role="region"
        aria-labelledby="upload-section-title"
        className="mb-6"
      >
        <header className="sr-only">
          <h2 id="upload-section-title">미디어 파일 업로드</h2>
          <p>
            이미지를 업로드하고 메인 이미지로 설정할 수 있습니다. 업로드된
            이미지에 마우스를 올리면 메인 이미지 설정 버튼이 나타납니다.
          </p>
        </header>
        <ImageUploadContainer />
      </section>
    );
  }, []);

  const renderDesktopSidebarNavigation = useCallback(() => {
    console.log('🔄 [BLOG_MEDIA_SYNC] 데스크톱 사이드바 네비게이션 렌더링:', {
      currentActiveSection: activeSectionType,
    });

    const navigationMenuItemList: NavigationMenuItem[] = [
      {
        sectionType: 'mainImage',
        displayLabel: '메인 이미지',
        iconEmoji: '🖼️',
        iconBackgroundColor: 'bg-orange-500',
        statusType: selectedMainImageUrl !== null ? 'complete' : 'pending',
      },
      {
        sectionType: 'imageGallery',
        displayLabel: '이미지 갤러리',
        iconEmoji: '🎨',
        iconBackgroundColor: 'bg-blue-500',
        statusType: 'progress',
      },
      {
        sectionType: 'imageSlider',
        displayLabel: '이미지 슬라이더',
        iconEmoji: '🎬',
        iconBackgroundColor: 'bg-purple-500',
        statusType:
          configuredSliderImageList.length > 0 ? 'complete' : 'pending',
      },
    ];

    return (
      <aside className="hidden w-64 p-6 bg-white border-r border-gray-200 lg:block">
        <nav role="navigation" aria-label="이미지 관리 섹션 네비게이션">
          <ul className="space-y-2">
            {navigationMenuItemList.map((menuItem) => {
              const {
                sectionType,
                displayLabel,
                iconEmoji,
                iconBackgroundColor,
                statusType,
              } = menuItem;
              const isActiveSection = activeSectionType === sectionType;

              const statusColorMapData = new Map<string, string>([
                ['complete', 'bg-green-500'],
                ['progress', 'bg-orange-500'],
                ['pending', 'bg-gray-300'],
              ]);

              const statusColor = statusColorMapData.get(statusType);
              const finalStatusColor =
                statusColor !== undefined ? statusColor : 'bg-gray-300';

              const handleSectionClick = () => {
                if (isValidActiveSectionType(sectionType)) {
                  handleNavigationSectionChange(sectionType);
                } else {
                  console.error('Invalid section type:', sectionType);
                }
              };

              return (
                <li key={sectionType}>
                  <button
                    type="button"
                    onClick={handleSectionClick}
                    className={`w-full text-left p-3 rounded-lg transition-all duration-200 flex items-center gap-3 ${
                      isActiveSection
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                    aria-current={isActiveSection ? 'page' : undefined}
                  >
                    <div
                      className={`w-8 h-8 ${iconBackgroundColor} rounded flex items-center justify-center text-white text-sm`}
                    >
                      {iconEmoji}
                    </div>
                    <span className="flex-1">{displayLabel}</span>
                    <div
                      className={`w-2 h-2 rounded-full ${finalStatusColor}`}
                    ></div>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    );
  }, [
    activeSectionType,
    selectedMainImageUrl,
    configuredSliderImageList,
    handleNavigationSectionChange,
  ]);

  const renderMobileTabNavigation = useCallback(() => {
    console.log('🔄 [BLOG_MEDIA_SYNC] 모바일 탭 네비게이션 렌더링:', {
      currentActiveSection: activeSectionType,
    });

    const mobileTabItemList: MobileTabItem[] = [
      {
        sectionType: 'mainImage',
        displayLabel: '🖼️ 메인',
        shortLabel: '메인',
      },
      {
        sectionType: 'imageGallery',
        displayLabel: '🎨 갤러리',
        shortLabel: '갤러리',
      },
      {
        sectionType: 'imageSlider',
        displayLabel: '🎬 슬라이더',
        shortLabel: '슬라이더',
      },
    ];

    return (
      <nav
        className="bg-white border-b border-gray-200 lg:hidden"
        role="navigation"
        aria-label="모바일 이미지 관리 탭"
      >
        <div className="flex overflow-x-auto">
          {mobileTabItemList.map((tabItem) => {
            const { sectionType, displayLabel, shortLabel } = tabItem;
            const isActiveTab = activeSectionType === sectionType;

            const handleTabClick = () => {
              if (isValidActiveSectionType(sectionType)) {
                handleNavigationSectionChange(sectionType);
              } else {
                console.error('Invalid section type:', sectionType);
              }
            };

            return (
              <button
                key={sectionType}
                type="button"
                onClick={handleTabClick}
                className={`flex-shrink-0 px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 ${
                  isActiveTab
                    ? 'border-blue-500 text-blue-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                aria-current={isActiveTab ? 'page' : undefined}
              >
                <span className="hidden sm:inline">{displayLabel}</span>
                <span className="sm:hidden">{shortLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>
    );
  }, [activeSectionType, handleNavigationSectionChange]);

  const renderActiveMainContent = useCallback(() => {
    console.log('🔄 [BLOG_MEDIA_SYNC] 메인 콘텐츠 렌더링:', {
      activeSectionType,
      hasImages: hasUploadedImages,
    });

    if (!hasUploadedImages) {
      console.log(
        '📋 [BLOG_MEDIA_SYNC] 업로드된 이미지 없음 - 안내 메시지 표시'
      );

      return (
        <div className="flex items-center justify-center p-6 w-full lg:w-[calc(100%-16rem)]">
          <div className="max-w-md text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              이미지를 업로드해주세요
            </h3>
            <p className="text-gray-600">
              먼저 이미지를 업로드하면 메인 이미지, 갤러리, 슬라이더를 설정할 수
              있습니다. 업로드된 이미지에 마우스를 올리면 🏠 버튼으로 메인
              이미지를 설정할 수 있습니다.
            </p>
          </div>
        </div>
      );
    }

    let selectedContent: React.ReactNode = null;

    if (activeSectionType === 'mainImage') {
      selectedContent = (
        <div className="space-y-6">
          <header>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">
              메인 이미지 관리
            </h2>
            <p className="text-gray-600">
              현재 설정된 메인 이미지를 확인하고 관리할 수 있습니다. 상단 업로드
              영역에서 이미지에 마우스를 올리고 🏠 버튼을 클릭하여 메인 이미지를
              변경할 수 있습니다.
            </p>
          </header>
          <MainImageContainer />
        </div>
      );
    } else if (activeSectionType === 'imageGallery') {
      selectedContent = (
        <ImageGalleryContainer
          mediaFiles={uploadedMediaFileList}
          mainImage={selectedMainImageUrl}
          sliderImages={configuredSliderImageList}
        />
      );
    } else if (activeSectionType === 'imageSlider') {
      selectedContent = <ImageSliderContainer />;
    }

    console.log('✅ [BLOG_MEDIA_SYNC] 메인 콘텐츠 컴포넌트 선택 완료:', {
      activeSectionType,
      hasSelectedContent: selectedContent !== null,
    });

    return (
      <main className="p-6 w-full lg:w-[calc(100%-16rem)]">
        {selectedContent}
      </main>
    );
  }, [
    activeSectionType,
    hasUploadedImages,
    uploadedMediaFileList,
    selectedMainImageUrl,
    configuredSliderImageList,
  ]);

  console.log('🎨 [BLOG_MEDIA_SYNC] 컨테이너 최종 렌더링 준비 (양방향):', {
    shouldShowManagementSections: hasUploadedImages,
    activeSectionType,
    uploadedImageCount: uploadedMediaFileList.length,
    hasMainImage: selectedMainImageUrl !== null,
    sliderImageCount: configuredSliderImageList.length,
    bidirectionalSyncActive: true,
    syncStatus: {
      syncInitialized,
      initialSyncCompleted: initialSyncCompletedRef.current,
      syncInProgress: syncInProgressRef.current,
    },
    timestamp: new Date().toISOString(),
  });

  console.groupEnd();

  return (
    <main role="main" aria-label="블로그 미디어 관리" className="min-h-screen">
      <div className="p-6 bg-white border-b border-gray-200">
        {renderDragAndDropUploadSection()}
      </div>

      <div className="flex flex-col min-h-0 lg:flex-row">
        {renderDesktopSidebarNavigation()}
        {renderMobileTabNavigation()}
        {renderActiveMainContent()}
      </div>

      {/* 🚨 핵심 수정: 안전한 환경변수 체크로 디버깅 정보 표시 */}
      {isDevelopmentMode && (
        <div className="p-4 mx-6 mt-4 text-xs bg-gray-100 rounded-lg">
          <h4 className="font-bold text-blue-600">
            🔍 디버깅 정보 (BlogMedia - 양방향 동기화)
          </h4>
          <div className="mt-2 space-y-1">
            <div>업로드된 이미지: {uploadedMediaFileList.length}개</div>
            <div>메인 이미지: {selectedMainImageUrl ? '설정됨' : '미설정'}</div>
            <div>슬라이더 이미지: {configuredSliderImageList.length}개</div>
            <div>현재 섹션: {activeSectionType}</div>
            <div className="pt-2 mt-2 border-t border-gray-300">
              <div className="font-semibold text-green-600">
                🔄 동기화 상태:
              </div>
              <div>초기화 완료: {syncInitialized ? '✅' : '❌'}</div>
              <div>
                초기 동기화: {initialSyncCompletedRef.current ? '✅' : '❌'}
              </div>
              <div>
                동기화 진행중: {syncInProgressRef.current ? '🔄' : '⏸️'}
              </div>
              <div>양방향 동기화: ✅ 활성화됨</div>
              <div>환경변수 안전성: ✅ 타입 안전</div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default BlogMediaStepContainer;
