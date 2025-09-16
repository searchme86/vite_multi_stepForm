// src/components/previewPanel/parts/MobileContentComponent.tsx

import React, { useMemo } from 'react';
import { Tabs, Tab, Chip, Badge, Avatar } from '@heroui/react';
import type { Key } from '@react-types/shared';
import { getMobileDeviceInfo } from '../types/previewPanel.types';
import { DEFAULT_HERO_IMAGE } from '../utils/constants';
import { renderMarkdown } from '../utils/markdownRenderer';
import SwiperGalleryComponent from './SwiperGalleryComponent';
import CustomImageGalleryComponent from './CustomImageGalleryComponent';
import { CustomGalleryView } from '../types/previewPanel.types';

// 현재 폼 값 타입 정의
interface CurrentFormValues {
  title: string;
  description: string;
  content: string;
  nickname: string;
  emailPrefix: string;
  emailDomain: string;
  bio: string;
  userImage: string | null;
  mainImage: string | null;
  media: string[];
  sliderImages: string[];
  tags: string;
  editorCompletedContent: string;
  isEditorCompleted: boolean;
}

// 디스플레이 콘텐츠 타입 정의
interface DisplayContent {
  text: string;
  source: 'editor' | 'basic';
}

// 아바타 속성 타입 정의
interface AvatarProps {
  src: string;
  name: string;
  fallback: string;
  className: string;
  showFallback: boolean;
  isBordered: boolean;
}

// 컴포넌트 Props 타입 정의
interface MobileContentComponentProps {
  currentFormValues: CurrentFormValues;
  displayContent: DisplayContent;
  heroImage: string | null;
  tagArray: string[];
  avatarProps: AvatarProps;
  swiperKey: string;
  customGalleryViews: CustomGalleryView[];
  selectedMobileSize: string;
  setSelectedMobileSize: (size: string) => void;
  hasTabChanged: boolean;
  setHasTabChanged: (changed: boolean) => void;
}

/**
 * 모바일 콘텐츠 컴포넌트 - 에러 수정 버전
 *
 * 수정사항:
 * - MobileDeviceSize 타입 import 제거 (사용하지 않음)
 * - CustomGalleryView 타입 import 추가
 * - 미사용 구조분해 변수 제거
 * - 타입 안전성 향상
 *
 * @param props - 컴포넌트 props
 * @returns 모바일 콘텐츠 JSX
 */
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
}: MobileContentComponentProps): React.ReactNode {
  console.log('📱 [MOBILE_CONTENT] 모바일 콘텐츠 렌더링 시작 (에러 수정 버전)');

  // 🎯 Props 데이터 유효성 검증
  const hasCurrentFormValues =
    currentFormValues !== null && currentFormValues !== undefined;
  const hasDisplayContent =
    displayContent !== null && displayContent !== undefined;
  const hasHeroImage = heroImage !== null && heroImage !== undefined;
  const hasTagArray = Array.isArray(tagArray);
  const hasAvatarProps = avatarProps !== null && avatarProps !== undefined;
  const hasCustomGalleryViews = Array.isArray(customGalleryViews);

  console.log('📱 [MOBILE_CONTENT] Props 데이터 유효성 검증:', {
    selectedSize: selectedMobileSize,
    hasTabChanged,
    hasCurrentFormValues,
    hasDisplayContent,
    hasHeroImage,
    hasTagArray,
    tagArrayLength: hasTagArray ? tagArray.length : 0,
    hasAvatarProps,
    hasCustomGalleryViews,
    customGalleryViewsLength: hasCustomGalleryViews
      ? customGalleryViews.length
      : 0,
    timestamp: new Date().toISOString(),
  });

  // 🎯 디바이스 정보 가져오기
  const currentDeviceInfo = useMemo(() => {
    const validMobileSize =
      selectedMobileSize === '360' || selectedMobileSize === '768'
        ? selectedMobileSize
        : '360';

    const deviceInfo = getMobileDeviceInfo(validMobileSize);

    console.log('📱 [MOBILE_CONTENT] 현재 디바이스 정보:', {
      selectedSize: selectedMobileSize,
      validMobileSize,
      deviceWidth: deviceInfo.width,
      deviceLabel: deviceInfo.label,
      deviceDescription: deviceInfo.description,
      timestamp: new Date().toISOString(),
    });

    return deviceInfo;
  }, [selectedMobileSize]);

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
  const containerWidthClass = useMemo(() => {
    const widthClass =
      selectedMobileSize === '360' ? 'w-[360px] mx-auto' : 'w-[768px] mx-auto';

    console.log('📱 [MOBILE_CONTENT] 컨테이너 너비 클래스:', {
      selectedSize: selectedMobileSize,
      widthClass,
      timestamp: new Date().toISOString(),
    });

    return widthClass;
  }, [selectedMobileSize]);

  // 🎯 안전한 폼 값 처리
  const safeFormValues = useMemo(() => {
    if (!hasCurrentFormValues) {
      return {
        title: '블로그 제목이 여기에 표시됩니다',
        description:
          'In the fast-evolving world of home decor, embracing the art of transformation is the key to keeping your living spaces fresh, vibrant, and in tune with the latest trends.',
        nickname: 'Ariel van Houten',
        media: [],
        sliderImages: [],
      };
    }

    return {
      title: currentFormValues.title || '블로그 제목이 여기에 표시됩니다',
      description:
        currentFormValues.description ||
        'In the fast-evolving world of home decor, embracing the art of transformation is the key to keeping your living spaces fresh, vibrant, and in tune with the latest trends.',
      nickname: currentFormValues.nickname || 'Ariel van Houten',
      media: Array.isArray(currentFormValues.media)
        ? currentFormValues.media
        : [],
      sliderImages: Array.isArray(currentFormValues.sliderImages)
        ? currentFormValues.sliderImages
        : [],
    };
  }, [hasCurrentFormValues, currentFormValues]);

  // 🎯 안전한 디스플레이 콘텐츠 처리
  const safeDisplayContent = useMemo(() => {
    if (!hasDisplayContent) {
      return { text: '' };
    }

    return {
      text: displayContent.text || '',
    };
  }, [hasDisplayContent, displayContent]);

  // 🎯 안전한 태그 배열 처리
  const safeTagArray = useMemo(() => {
    if (!hasTagArray) {
      return [];
    }

    return tagArray.filter(
      (tag): tag is string => typeof tag === 'string' && tag.trim().length > 0
    );
  }, [hasTagArray, tagArray]);

  // 🎯 안전한 아바타 속성 처리
  const safeAvatarProps = useMemo(() => {
    if (!hasAvatarProps) {
      return {};
    }

    return {
      src: avatarProps.src || '',
      name: avatarProps.name || '',
      fallback: avatarProps.fallback || '',
      className: avatarProps.className || '',
      showFallback: avatarProps.showFallback ?? true,
      isBordered: avatarProps.isBordered ?? false,
    };
  }, [hasAvatarProps, avatarProps]);

  // 🎯 안전한 커스텀 갤러리 뷰 처리
  const safeCustomGalleryViews = useMemo(() => {
    if (!hasCustomGalleryViews) {
      return [];
    }

    return customGalleryViews.filter(
      (view): view is CustomGalleryView =>
        view !== null && view !== undefined && typeof view.id === 'string'
    );
  }, [hasCustomGalleryViews, customGalleryViews]);

  console.log('📱 [MOBILE_CONTENT] 안전한 데이터 처리 완료:', {
    safeFormValues,
    safeDisplayContent,
    safeTagArrayLength: safeTagArray.length,
    safeAvatarProps,
    safeCustomGalleryViewsLength: safeCustomGalleryViews.length,
    currentDeviceInfo,
    timestamp: new Date().toISOString(),
  });

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
              alt={safeFormValues.title}
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
                {safeFormValues.title}
              </h1>

              {safeTagArray.length > 0 ? (
                <div className="flex flex-wrap gap-2 mb-4">
                  {safeTagArray.map((tag: string, index: number) => (
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
                <Avatar {...safeAvatarProps} />
                <div>
                  <p className="mb-0 text-sm text-white/80">Written by</p>
                  <p className="font-medium text-white">
                    {safeFormValues.nickname}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-6">
            <p className="text-lg leading-relaxed">
              {safeFormValues.description}
            </p>

            <h2 className="text-2xl font-bold">Introduction</h2>

            {safeDisplayContent.text ? (
              renderMarkdown(safeDisplayContent.text)
            ) : (
              <p>
                Software as a Service (SaaS) has transformed the way businesses
                operate, providing access to a wide range of applications and
                tools through the internet.
              </p>
            )}

            {safeFormValues.media.length > 1 ? (
              <div className="my-6">
                <img
                  src={safeFormValues.media[1]}
                  alt="Blog content image"
                  className="w-full h-auto rounded-lg"
                />
              </div>
            ) : null}

            <CustomImageGalleryComponent
              customGalleryViews={safeCustomGalleryViews}
            />
            <SwiperGalleryComponent
              sliderImages={safeFormValues.sliderImages}
              swiperKey={swiperKey}
            />

            {safeDisplayContent.text &&
            safeDisplayContent.text.split('\n\n')[1] ? (
              renderMarkdown(safeDisplayContent.text.split('\n\n')[1])
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
