// 데스크탑 콘텐츠 컴포넌트
import React from 'react';
import { Chip, Badge, Avatar } from '@heroui/react';
import {
  CurrentFormValues,
  DisplayContent,
  AvatarProps,
} from '../types/previewPanel.types';
import { DEFAULT_DESKTOP_HERO_IMAGE } from '../utils/constants';
import { renderMarkdown } from '../utils/markdownRenderer.tsx';
import SwiperGalleryComponent from './SwiperGalleryComponent';
import CustomImageGalleryComponent from './CustomImageGalleryComponent';

interface DesktopContentComponentProps {
  currentFormValues: CurrentFormValues;
  displayContent: DisplayContent;
  heroImage: string | null;
  tagArray: string[];
  avatarProps: AvatarProps;
  swiperKey: string;
  customGalleryViews: any[];
}

function DesktopContentComponent({
  currentFormValues,
  displayContent,
  heroImage,
  tagArray,
  avatarProps,
  swiperKey,
  customGalleryViews,
}: DesktopContentComponentProps) {
  console.log('🖥️ 데스크탑 콘텐츠 렌더링');

  return (
    <div>
      <div className="relative h-[300px] mb-10">
        <img
          src={heroImage || DEFAULT_DESKTOP_HERO_IMAGE}
          alt={currentFormValues.title || 'Blog cover image'}
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

          <div className="flex gap-3 ml-auto">
            <p className="mb-0 text-sm text-right text-white/80">
              Written by
              <br />
              <span className="font-medium text-white">
                {currentFormValues.nickname || 'Ariel van Houten'}
              </span>
            </p>
            <Avatar {...avatarProps} />
          </div>
        </div>
      </div>

      <div className="w-full">
        <p className="pl-5 text-lg border-l-4 border-red-500 mb-7">
          {currentFormValues.description ||
            '블로그의 요약 내용이 보여질 공간입니다.'}
        </p>

        {displayContent.text ? (
          renderMarkdown(displayContent.text)
        ) : (
          <p>
            Software as a Service (SaaS) has transformed the way businesses
            operate, providing access to a wide range of applications and tools
            through the internet.
          </p>
        )}

        <CustomImageGalleryComponent customGalleryViews={customGalleryViews} />
        <SwiperGalleryComponent
          sliderImages={currentFormValues.sliderImages}
          swiperKey={swiperKey}
        />
      </div>
    </div>
  );
}

export default DesktopContentComponent;
