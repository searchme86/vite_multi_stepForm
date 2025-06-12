// 미리보기 콘텐츠 컴포넌트
import React from 'react';
import { Chip, Badge, Avatar } from '@heroui/react';
import {
  CurrentFormValues,
  DisplayContent,
  AvatarProps,
} from '../types/previewPanel.types';
import { DEFAULT_HERO_IMAGE } from '../utils/constants';
import { renderMarkdown } from '../utils/markdownRenderer';
import SwiperGalleryComponent from './SwiperGalleryComponent';
import CustomImageGalleryComponent from './CustomImageGalleryComponent';
import DesktopContentComponent from './DesktopContentComponent';

interface PreviewContentComponentProps {
  currentFormValues: CurrentFormValues;
  displayContent: DisplayContent;
  heroImage: string | null;
  tagArray: string[];
  avatarProps: AvatarProps;
  swiperKey: string;
  customGalleryViews: any[];
}

function PreviewContentComponent({
  currentFormValues,
  displayContent,
  heroImage,
  tagArray,
  avatarProps,
  swiperKey,
  customGalleryViews,
}: PreviewContentComponentProps) {
  console.log('👀 미리보기 콘텐츠 렌더링');

  return (
    <div>
      <div className="md:hidden">
        <div className="w-[768px] mx-auto">
          <div className="relative">
            <img
              src={heroImage || DEFAULT_HERO_IMAGE}
              alt={currentFormValues.title || '블로그 커버 이미지'}
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
                {currentFormValues.title || '블로그 제목이 여기에 표시됩니다'}
              </h1>

              {tagArray.length > 0 && (
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
              )}

              <div className="flex items-center gap-3 mb-4">
                <Avatar {...avatarProps} />
                <div>
                  <p className="mb-0 text-sm text-white/80">Written by</p>
                  <p className="font-medium text-white">
                    {currentFormValues.nickname || 'Ariel van Houten'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-6">
            <p className="text-lg leading-relaxed">
              {currentFormValues.description ||
                '모바일 뷰이면서 블로그의 요약 컨텐츠가 렌더링될 공간입니다'}
            </p>

            {displayContent.text ? (
              renderMarkdown(displayContent.text)
            ) : (
              <p>모바일 뷰이면서 블로그의 마크다운이 렌더링할 공간입니다.</p>
            )}

            {currentFormValues.media && currentFormValues.media.length > 1 && (
              <div className="my-6">
                <img
                  src={currentFormValues.media[1]}
                  alt="Blog content image"
                  className="w-full h-auto rounded-lg"
                />
              </div>
            )}

            <CustomImageGalleryComponent
              customGalleryViews={customGalleryViews}
            />
            <SwiperGalleryComponent
              sliderImages={currentFormValues.sliderImages}
              swiperKey={swiperKey}
            />
          </div>
        </div>
      </div>

      <div className="hidden md:block">
        <DesktopContentComponent
          currentFormValues={currentFormValues}
          displayContent={displayContent}
          heroImage={heroImage}
          tagArray={tagArray}
          avatarProps={avatarProps}
          swiperKey={swiperKey}
          customGalleryViews={customGalleryViews}
        />
      </div>
    </div>
  );
}

export default PreviewContentComponent;
