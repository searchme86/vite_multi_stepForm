// blogMediaStep/BlogMediaStepContainer.tsx

import React, { useState, useCallback } from 'react';
import { useBlogMediaStepState } from './hooks/useBlogMediaStepState';

import ImageUploadContainer from './imageUpload/ImageUploadContainer';
import ImageSliderContainer from './imageSlider/ImageSliderContainer';
import MainImageContainer from './mainImage/MainImageContainer';
import ImageGalleryContainer from './imageGallery/ImageGalleryContainer';

type ActiveSectionType = 'mainImage' | 'imageGallery' | 'imageSlider';

function BlogMediaStepContainer(): React.ReactNode {
  console.log('🚀 BlogMediaStepContainer 렌더링 시작:', {
    timestamp: new Date().toLocaleTimeString(),
    componentName: 'BlogMediaStepContainer',
  });

  const [activeSectionType, setActiveSectionType] =
    useState<ActiveSectionType>('mainImage');

  const blogMediaStepStateHook = useBlogMediaStepState();
  const { formValues: currentFormValuesData } = blogMediaStepStateHook;

  const {
    media: uploadedMediaFileList,
    mainImage: selectedMainImageUrl,
    sliderImages: configuredSliderImageList,
  } = currentFormValuesData;

  console.log('📊 BlogMediaStepState 데이터 로드 완료:', {
    uploadedMediaFileCount: uploadedMediaFileList.length,
    hasSelectedMainImage: selectedMainImageUrl ? true : false,
    configuredSliderImageCount: configuredSliderImageList.length,
    currentActiveSection: activeSectionType,
    timestamp: new Date().toLocaleTimeString(),
  });

  const getMainImageIndexFromUrl = useCallback((): number => {
    if (!selectedMainImageUrl) {
      console.log('🔍 getMainImageIndexFromUrl: 메인 이미지 URL 없음');
      return -1;
    }

    const foundImageIndex = uploadedMediaFileList.indexOf(selectedMainImageUrl);
    console.log('🔍 getMainImageIndexFromUrl 결과:', {
      selectedMainImageUrl: selectedMainImageUrl.slice(0, 30) + '...',
      foundImageIndex,
    });

    return foundImageIndex;
  }, [selectedMainImageUrl, uploadedMediaFileList]);

  const getMainImageUrlValue = useCallback((): string => {
    const mainImageUrl = selectedMainImageUrl || '';
    console.log('🔍 getMainImageUrlValue:', {
      hasMainImage: mainImageUrl ? true : false,
      urlPreview: mainImageUrl ? mainImageUrl.slice(0, 30) + '...' : 'empty',
    });

    return mainImageUrl;
  }, [selectedMainImageUrl]);

  const checkShouldShowImageManagementSections = useCallback((): boolean => {
    const { length: mediaFileCount } = uploadedMediaFileList;
    const hasMediaFiles = mediaFileCount > 0;

    console.log('🔍 checkShouldShowImageManagementSections:', {
      mediaFileCount,
      hasMediaFiles,
    });

    return hasMediaFiles;
  }, [uploadedMediaFileList]);

  const handleNavigationSectionChange = useCallback(
    (newSectionType: ActiveSectionType) => {
      console.log('🔧 handleNavigationSectionChange 호출:', {
        previousSection: activeSectionType,
        newSectionType,
        timestamp: new Date().toLocaleTimeString(),
      });

      setActiveSectionType(newSectionType);

      console.log('✅ 네비게이션 섹션 변경 완료:', {
        newActiveSection: newSectionType,
      });
    },
    [activeSectionType]
  );

  const renderDragAndDropUploadSection = () => {
    console.log('🔄 renderDragAndDropUploadSection 호출');

    return (
      <section
        role="region"
        aria-labelledby="upload-section-title"
        className="mb-6"
      >
        <div className="sr-only">
          <h2 id="upload-section-title">미디어 파일 업로드</h2>
        </div>
        <ImageUploadContainer />
      </section>
    );
  };

  const renderDesktopSidebarNavigation = () => {
    console.log('🔄 renderDesktopSidebarNavigation 호출:', {
      currentActiveSection: activeSectionType,
    });

    const navigationMenuItemList = [
      {
        sectionType: 'mainImage' as ActiveSectionType,
        displayLabel: '메인 이미지',
        iconEmoji: '🖼️',
        iconBackgroundColor: 'bg-orange-500',
        statusType: selectedMainImageUrl ? 'complete' : 'pending',
      },
      {
        sectionType: 'imageGallery' as ActiveSectionType,
        displayLabel: '이미지 갤러리',
        iconEmoji: '🎨',
        iconBackgroundColor: 'bg-blue-500',
        statusType: 'progress',
      },
      {
        sectionType: 'imageSlider' as ActiveSectionType,
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

              const statusColorMapData = new Map([
                ['complete', 'bg-green-500'],
                ['progress', 'bg-orange-500'],
                ['pending', 'bg-gray-300'],
              ]);

              const statusColor =
                statusColorMapData.get(statusType) ??
                statusColorMapData.get('pending') ??
                'bg-gray-300';

              return (
                <li key={sectionType}>
                  <button
                    type="button"
                    onClick={() => handleNavigationSectionChange(sectionType)}
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
                      className={`w-2 h-2 rounded-full ${statusColor}`}
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
    console.log('🔄 renderMobileTabNavigation 호출:', {
      currentActiveSection: activeSectionType,
    });

    const mobileTabItemList = [
      {
        sectionType: 'mainImage' as ActiveSectionType,
        displayLabel: '🖼️ 메인',
        shortLabel: '메인',
      },
      {
        sectionType: 'imageGallery' as ActiveSectionType,
        displayLabel: '🎨 갤러리',
        shortLabel: '갤러리',
      },
      {
        sectionType: 'imageSlider' as ActiveSectionType,
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

            return (
              <button
                key={sectionType}
                type="button"
                onClick={() => handleNavigationSectionChange(sectionType)}
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
    console.log('🔄 renderActiveMainContent 호출:', {
      activeSectionType,
      hasImages: checkShouldShowImageManagementSections(),
    });

    const hasUploadedImages = checkShouldShowImageManagementSections();

    if (!hasUploadedImages) {
      console.log('📋 업로드된 이미지 없음 - 안내 메시지 표시');

      return (
        <div className="flex items-center justify-center flex-1 p-6">
          <div className="max-w-md text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
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
              있습니다.
            </p>
          </div>
        </div>
      );
    }

    const contentComponentMap = {
      mainImage: (
        <div className="space-y-6">
          <header>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">
              메인 이미지 관리
            </h2>
            <p className="text-gray-600">
              블로그 대표 이미지를 설정하고 관리해주세요.
            </p>
          </header>
          <MainImageContainer
            imageUrl={getMainImageUrlValue()}
            imageIndex={getMainImageIndexFromUrl()}
          />
        </div>
      ),
      imageGallery: (
        <ImageGalleryContainer
          mediaFiles={uploadedMediaFileList}
          mainImage={selectedMainImageUrl}
          sliderImages={configuredSliderImageList}
        />
      ),
      imageSlider: <ImageSliderContainer />,
    };

    const selectedContent = contentComponentMap[activeSectionType];

    console.log('✅ renderActiveMainContent 컴포넌트 선택 완료:', {
      activeSectionType,
      hasSelectedContent: selectedContent ? true : false,
    });

    return <main className="flex-1 p-6">{selectedContent}</main>;
  };

  const shouldShowManagementSections = checkShouldShowImageManagementSections();

  console.log('🎨 BlogMediaStepContainer 최종 렌더링 준비:', {
    shouldShowManagementSections,
    activeSectionType,
    uploadedImageCount: uploadedMediaFileList.length,
    hasMainImage: selectedMainImageUrl ? true : false,
    sliderImageCount: configuredSliderImageList.length,
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
