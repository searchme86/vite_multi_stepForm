// src/components/previewPanel/parts/DesktopContentComponent.tsx

import React, { useMemo } from 'react';
import { Chip, Badge, Avatar } from '@heroui/react';
import { DEFAULT_DESKTOP_HERO_IMAGE } from '../utils/constants';
import { renderMarkdown } from '../utils/markdownRenderer';
import SwiperGalleryComponent from './SwiperGalleryComponent';
import CustomImageGalleryComponent from './CustomImageGalleryComponent';
import ImageGallerySliderWithZoom from '../../ImageGalleryWithContent/ImageGallerySliderWithZoom';
import { CustomGalleryView } from '../types/previewPanel.types';

// ImageData 타입 정의 (ImageGallerySliderWithZoom 컴포넌트에서 요구)
interface ImageData {
  id: string;
  url: string;
  alt: string;
  title?: string;
  description?: string;
}

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
interface DesktopContentComponentProps {
  currentFormValues: CurrentFormValues;
  displayContent: DisplayContent;
  heroImage: string | null;
  tagArray: string[];
  avatarProps: AvatarProps;
  swiperKey: string;
  customGalleryViews: CustomGalleryView[];
}

/**
 * 데스크톱 콘텐츠 컴포넌트 - ImageData 타입 변환 수정 버전
 *
 * 수정사항:
 * - string[]을 ImageData[]로 변환하는 로직 추가
 * - ImageData 타입 정의 추가
 * - 타입 안전성 향상
 *
 * @param props - 컴포넌트 props
 * @returns 데스크톱 콘텐츠 JSX
 */
function DesktopContentComponent({
  currentFormValues,
  displayContent,
  heroImage,
  tagArray,
  avatarProps,
  swiperKey,
  customGalleryViews,
}: DesktopContentComponentProps): React.ReactNode {
  console.log(
    '🖥️ [DESKTOP_CONTENT] 데스크톱 콘텐츠 렌더링 시작 (ImageData 타입 변환 수정 버전)'
  );

  // 🎯 Props 데이터 유효성 검증
  const hasCurrentFormValues =
    currentFormValues !== null && currentFormValues !== undefined;
  const hasDisplayContent =
    displayContent !== null && displayContent !== undefined;
  const hasHeroImage = heroImage !== null && heroImage !== undefined;
  const hasTagArray = Array.isArray(tagArray);
  const hasAvatarProps = avatarProps !== null && avatarProps !== undefined;
  const hasCustomGalleryViews = Array.isArray(customGalleryViews);

  console.log('🖥️ [DESKTOP_CONTENT] Props 데이터 유효성 검증:', {
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
    swiperKey,
    timestamp: new Date().toISOString(),
  });

  // 🎯 안전한 폼 값 처리
  const safeFormValues = useMemo(() => {
    if (!hasCurrentFormValues) {
      return {
        title: '블로그 제목이 여기에 표시됩니다',
        description: '블로그의 요약 내용이 보여질 공간입니다.',
        nickname: 'Ariel van Houten',
        media: [],
        sliderImages: [],
      };
    }

    return {
      title: currentFormValues.title || '블로그 제목이 여기에 표시됩니다',
      description:
        currentFormValues.description ||
        '블로그의 요약 내용이 보여질 공간입니다.',
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
      return {
        text: '',
        hasText: false,
      };
    }

    const text = displayContent.text || '';
    const hasText = text.trim().length > 0;

    return {
      text,
      hasText,
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
      return {
        src: '',
        name: '',
        fallback: '',
        className: '',
        showFallback: true,
        isBordered: false,
      };
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

  // 🎯 히어로 이미지 처리
  const safeHeroImage = useMemo(() => {
    return heroImage || DEFAULT_DESKTOP_HERO_IMAGE;
  }, [heroImage]);

  // 🎯 ImageGallerySliderWithZoom용 ImageData 배열 처리
  const galleryImages = useMemo((): ImageData[] => {
    const mediaUrls =
      safeFormValues.media.length > 0 ? safeFormValues.media : [];

    // string[] 를 ImageData[] 로 변환
    const imageDataArray = mediaUrls.map(
      (url: string, index: number): ImageData => {
        const imageId = `gallery-image-${index}`;
        const imageAlt = `갤러리 이미지 ${index + 1}`;
        const imageTitle = `블로그 이미지 ${index + 1}`;

        return {
          id: imageId,
          url,
          alt: imageAlt,
          title: imageTitle,
          description: `${safeFormValues.title} 관련 이미지`,
        };
      }
    );

    console.log('🖼️ [DESKTOP_CONTENT] 갤러리 이미지 데이터 변환:', {
      mediaCount: safeFormValues.media.length,
      imageDataCount: imageDataArray.length,
      sampleImageData: imageDataArray[0] || null,
      timestamp: new Date().toISOString(),
    });

    return imageDataArray;
  }, [safeFormValues.media, safeFormValues.title]);

  console.log('🖥️ [DESKTOP_CONTENT] 안전한 데이터 처리 완료:', {
    safeFormValues,
    safeDisplayContent,
    safeTagArrayLength: safeTagArray.length,
    safeAvatarProps,
    safeCustomGalleryViewsLength: safeCustomGalleryViews.length,
    safeHeroImage: safeHeroImage.slice(0, 50) + '...',
    galleryImagesLength: galleryImages.length,
    timestamp: new Date().toISOString(),
  });

  // 🎯 콘텐츠 렌더링 함수들
  const renderHeroSection = () => {
    console.log('🖥️ [DESKTOP_CONTENT] 히어로 섹션 렌더링');

    return (
      <div className="relative h-[300px] mb-10">
        <img
          src={safeHeroImage}
          alt={safeFormValues.title}
          className="object-cover w-full h-full"
        />

        <div className="absolute inset-0 flex flex-col justify-end p-6 bg-gradient-to-t from-black/80 to-black/30">
          <div className="flex items-center gap-2">
            <Badge color="primary" variant="flat" className="px-2">
              Newest Blog
            </Badge>
            <span className="text-sm text-white/80">• 4 Min</span>
          </div>

          <h1 className="mb-3 text-4xl font-bold text-white">
            {safeFormValues.title}
          </h1>

          {safeTagArray.length > 0 && (
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
          )}

          <div className="flex gap-3 ml-auto">
            <p className="mb-0 text-sm text-right text-white/80">
              Written by
              <br />
              <span className="font-medium text-white">
                {safeFormValues.nickname}
              </span>
            </p>
            <Avatar {...safeAvatarProps} />
          </div>
        </div>
      </div>
    );
  };

  const renderMainContent = () => {
    console.log('🖥️ [DESKTOP_CONTENT] 메인 콘텐츠 렌더링');

    return (
      <div className="w-full">
        <p className="pl-5 text-lg border-l-4 border-red-500 mb-7">
          {safeFormValues.description}
        </p>

        <ImageGallerySliderWithZoom images={galleryImages} />

        {safeDisplayContent.hasText ? (
          renderMarkdown(safeDisplayContent.text)
        ) : (
          <p>
            Software as a Service (SaaS) has transformed the way businesses
            operate, providing access to a wide range of applications and tools
            through the internet.
          </p>
        )}

        <CustomImageGalleryComponent
          customGalleryViews={safeCustomGalleryViews}
        />

        <SwiperGalleryComponent
          sliderImages={safeFormValues.sliderImages}
          swiperKey={swiperKey}
        />
      </div>
    );
  };

  console.log('🖥️ [DESKTOP_CONTENT] 데스크톱 콘텐츠 렌더링 완료');

  return (
    <div>
      {renderHeroSection()}
      {renderMainContent()}
    </div>
  );
}

export default DesktopContentComponent;
