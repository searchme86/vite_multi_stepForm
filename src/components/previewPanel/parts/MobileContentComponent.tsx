// src/components/previewPanel/parts/MobileContentComponent.tsx

import { Tabs, Tab, Chip, Badge, Avatar } from '@heroui/react';
import type { Key } from '@react-types/shared';
import {
  CurrentFormValues,
  DisplayContent,
  AvatarProps,
  getMobileDeviceInfo,
  type MobileDeviceSize,
} from '../types/previewPanel.types';
import { DEFAULT_HERO_IMAGE } from '../utils/constants';
import { renderMarkdown } from '../utils/markdownRenderer.tsx';
import SwiperGalleryComponent from './SwiperGalleryComponent';
import CustomImageGalleryComponent from './CustomImageGalleryComponent';

interface MobileContentComponentProps {
  currentFormValues: CurrentFormValues;
  displayContent: DisplayContent;
  heroImage: string | null;
  tagArray: string[];
  avatarProps: AvatarProps;
  swiperKey: string;
  customGalleryViews: any[];
  selectedMobileSize: string;
  setSelectedMobileSize: (size: string) => void;
  hasTabChanged: boolean;
  setHasTabChanged: (changed: boolean) => void;
}

function MobileContentComponent({
  currentFormValues,
  displayContent,
  heroImage,
  tagArray,
  avatarProps,
  swiperKey,
  customGalleryViews,
  selectedMobileSize,
  setSelectedMobileSize,
  hasTabChanged,
  setHasTabChanged,
}: MobileContentComponentProps) {
  console.log('📱 [MOBILE_CONTENT] 모바일 콘텐츠 렌더링 시작:', {
    selectedSize: selectedMobileSize,
    hasTabChanged,
    propsReceived: {
      hasCurrentFormValues: !!currentFormValues,
      hasDisplayContent: !!displayContent,
      hasHeroImage: !!heroImage,
      tagArrayLength: tagArray.length,
      hasAvatarProps: !!avatarProps,
      customGalleryViewsLength: customGalleryViews.length,
    },
    timestamp: new Date().toISOString(),
  });

  // 🎯 디바이스 정보 가져오기
  const currentDeviceInfo = getMobileDeviceInfo(
    selectedMobileSize as MobileDeviceSize
  );
  const {
    width: deviceWidth,
    label: deviceLabel,
    description: deviceDescription,
  } = currentDeviceInfo;

  console.log('📱 [MOBILE_CONTENT] 현재 디바이스 정보:', {
    selectedSize: selectedMobileSize,
    deviceWidth,
    deviceLabel,
    deviceDescription,
    timestamp: new Date().toISOString(),
  });

  // 🎯 탭 변경 핸들러 - 구체적인 디버깅 로그 추가
  const handleTabChange = (tabKey: Key) => {
    const newSizeValue = String(tabKey);

    console.log('📱 [MOBILE_CONTENT] 탭 변경 이벤트 발생:', {
      previousSize: selectedMobileSize,
      newSize: newSizeValue,
      tabKey,
      keyType: typeof tabKey,
      timestamp: new Date().toISOString(),
    });

    // 🎯 Early return - 같은 사이즈 선택 시 처리하지 않음
    if (selectedMobileSize === newSizeValue) {
      console.log('📱 [MOBILE_CONTENT] 동일한 사이즈 선택 - 변경 없음:', {
        currentSize: selectedMobileSize,
        requestedSize: newSizeValue,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 🎯 변경 상태 업데이트
    setHasTabChanged(true);

    // 🎯 사이즈 변경 함수 호출
    setSelectedMobileSize(newSizeValue);

    console.log('📱 [MOBILE_CONTENT] 탭 변경 완료:', {
      previousSize: selectedMobileSize,
      newSize: newSizeValue,
      hasTabChanged: true,
      timestamp: new Date().toISOString(),
    });
  };

  // 🎯 너비 클래스 계산 - 구조분해 할당과 fallback 사용
  const containerWidthClass =
    selectedMobileSize === '360' ? 'w-[360px] mx-auto' : 'w-[768px] mx-auto';

  console.log('📱 [MOBILE_CONTENT] 컨테이너 너비 클래스:', {
    selectedSize: selectedMobileSize,
    widthClass: containerWidthClass,
    timestamp: new Date().toISOString(),
  });

  // 🎯 폼 값 구조분해 할당과 fallback 처리
  const {
    title: formTitle = '블로그 제목이 여기에 표시됩니다',
    description:
      formDescription = 'In the fast-evolving world of home decor, embracing the art of transformation is the key to keeping your living spaces fresh, vibrant, and in tune with the latest trends.',
    nickname: formNickname = 'Ariel van Houten',
    media: formMedia = [],
    sliderImages: formSliderImages = [],
  } = currentFormValues;

  // 🎯 디스플레이 콘텐츠 구조분해 할당과 fallback 처리
  const { text: displayText = '' } = displayContent;

  console.log('📱 [MOBILE_CONTENT] 렌더링 완료, JSX 반환');

  return (
    <div>
      <div className="p-6 border-b bg-gray-50">
        <Tabs
          selectedKey={selectedMobileSize}
          onSelectionChange={handleTabChange}
        >
          <Tab key="360" title="360px" />
          <Tab key="768" title="768px" />
        </Tabs>
      </div>

      <div className={containerWidthClass}>
        <div>
          <div className="relative">
            <img
              src={heroImage || DEFAULT_HERO_IMAGE}
              alt={formTitle || '블로그 커버 이미지'}
              className="w-full h-[500px] object-cover"
            />

            <div className="absolute inset-0 flex flex-col justify-end p-5 bg-gradient-to-t from-black/80 to-black/30">
              <div className="mb-2">
                <div className="flex items-center gap-2">
                  <Badge color="primary" variant="flat" className="px-2">
                    Newest Blog
                  </Badge>
                  <span className="text-sm text-white/80">• 4 Min</span>
                </div>
              </div>

              <h1 className="mb-3 text-3xl font-bold text-white">
                {formTitle}
              </h1>

              {tagArray.length > 0 ? (
                <div className="flex flex-wrap gap-2 mb-4">
                  {tagArray.map((tag: string, index: number) => (
                    <Chip
                      key={index}
                      size="sm"
                      variant="flat"
                      className="text-white border-none bg-white/20"
                    >
                      {tag}
                    </Chip>
                  ))}
                </div>
              ) : null}

              <div className="flex items-center gap-3 mb-4">
                <Avatar {...avatarProps} />
                <div>
                  <p className="mb-0 text-sm text-white/80">Written by</p>
                  <p className="font-medium text-white">{formNickname}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-6">
            <p className="text-lg leading-relaxed">{formDescription}</p>

            <h2 className="text-2xl font-bold">Introduction</h2>

            {displayText ? (
              renderMarkdown(displayText)
            ) : (
              <p>
                Software as a Service (SaaS) has transformed the way businesses
                operate, providing access to a wide range of applications and
                tools through the internet.
              </p>
            )}

            {formMedia && formMedia.length > 1 ? (
              <div className="my-6">
                <img
                  src={formMedia[1]}
                  alt="Blog content image"
                  className="w-full h-auto rounded-lg"
                />
              </div>
            ) : null}

            <CustomImageGalleryComponent
              customGalleryViews={customGalleryViews}
            />
            <SwiperGalleryComponent
              sliderImages={formSliderImages}
              swiperKey={swiperKey}
            />

            {displayText && displayText.split('\n\n')[1] ? (
              renderMarkdown(displayText.split('\n\n')[1])
            ) : (
              <p>
                Macrivate offers a range of features that can help your team
                work more efficiently and productively.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MobileContentComponent;
