// 📁 blogMediaStep/BlogMediaStepContainer.tsx

import React, { useState } from 'react';
import { useBlogMediaStepState } from './hooks/useBlogMediaStepState';

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

const isValidActiveSectionType = (
  value: string
): value is ActiveSectionType => {
  return (
    value === 'mainImage' || value === 'imageGallery' || value === 'imageSlider'
  );
};

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

function BlogMediaStepContainer(): React.ReactNode {
  console.log('🚀 [CONTAINER] 타입 안전성 강화된 컨테이너 렌더링 시작:', {
    timestamp: new Date().toLocaleTimeString(),
    componentName: 'BlogMediaStepContainer',
    typeSafeVersion: true,
  });

  const [activeSectionType, setActiveSectionType] =
    useState<ActiveSectionType>('mainImage');

  const blogMediaStepStateHook = useBlogMediaStepState();
  const { formValues: currentFormValuesData } = blogMediaStepStateHook;

  const createSafeFormValues = (formData: unknown): SafeFormValues => {
    const hasFormData = formData !== null && formData !== undefined;
    const isFormDataObject = hasFormData && typeof formData === 'object';

    if (!isFormDataObject) {
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

    return {
      media: safeMedia,
      mainImage: safeMainImage,
      sliderImages: safeSliderImages,
    };
  };

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

  console.log('📊 [CONTAINER] 타입 안전성 강화된 상태 데이터 로드:', {
    uploadedMediaFileCount: uploadedMediaFileList.length,
    hasSelectedMainImage: selectedMainImageUrl !== null,
    configuredSliderImageCount: configuredSliderImageList.length,
    currentActiveSection: activeSectionType,
    selectedMainImagePreview: selectedMainImageUrl
      ? selectedMainImageUrl.slice(0, 30) + '...'
      : 'none',
    typeSafeStateAccess: true,
    timestamp: new Date().toLocaleTimeString(),
  });

  const hasUploadedImages = uploadedMediaFileList.length > 0;

  console.log('🔍 [CONTAINER] 이미지 존재 여부 확인:', {
    mediaFileCount: uploadedMediaFileList.length,
    hasUploadedImages,
    typeSafeCheck: true,
  });

  const handleNavigationSectionChange = (newSectionType: ActiveSectionType) => {
    console.log('🔧 [CONTAINER] 네비게이션 섹션 변경:', {
      previousSection: activeSectionType,
      newSectionType,
      directStateUpdate: true,
      timestamp: new Date().toLocaleTimeString(),
    });

    setActiveSectionType(newSectionType);

    console.log('✅ [CONTAINER] 네비게이션 섹션 변경 완료:', {
      newActiveSection: newSectionType,
    });
  };

  const renderDragAndDropUploadSection = () => {
    console.log('🔄 [RENDER] 업로드 섹션 렌더링 - 타입 안전성 강화');

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
  };

  const renderDesktopSidebarNavigation = () => {
    console.log('🔄 [RENDER] 데스크톱 사이드바 네비게이션 렌더링:', {
      currentActiveSection: activeSectionType,
      typeSafeRendering: true,
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
  };

  const renderMobileTabNavigation = () => {
    console.log('🔄 [RENDER] 모바일 탭 네비게이션 렌더링:', {
      currentActiveSection: activeSectionType,
      typeSafeRendering: true,
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
  };

  const renderActiveMainContent = () => {
    console.log('🔄 [RENDER] 메인 콘텐츠 렌더링 - 타입 안전성 강화:', {
      activeSectionType,
      hasImages: hasUploadedImages,
      typeSafeRendering: true,
    });

    if (!hasUploadedImages) {
      console.log('📋 [RENDER] 업로드된 이미지 없음 - 안내 메시지 표시');

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

    console.log(
      '✅ [RENDER] 메인 콘텐츠 컴포넌트 선택 완료 - 타입 안전성 강화:',
      {
        activeSectionType,
        hasSelectedContent: selectedContent !== null,
        renderingMainImageAsPreview: activeSectionType === 'mainImage',
        typeSafeContentSelection: true,
      }
    );

    return (
      <main className="p-6 w-full lg:w-[calc(100%-16rem)]">
        {selectedContent}
      </main>
    );
  };

  console.log('🎨 [CONTAINER] 타입 안전성 강화된 컨테이너 최종 렌더링 준비:', {
    shouldShowManagementSections: hasUploadedImages,
    activeSectionType,
    uploadedImageCount: uploadedMediaFileList.length,
    hasMainImage: selectedMainImageUrl !== null,
    sliderImageCount: configuredSliderImageList.length,
    selectedMainImagePreview: selectedMainImageUrl
      ? selectedMainImageUrl.slice(0, 30) + '...'
      : 'none',
    typeSafeContainerCompleted: true,
    timestamp: new Date().toLocaleTimeString(),
  });

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
    </main>
  );
}

export default BlogMediaStepContainer;
