// 모바일 콘텐츠 컴포넌트
import { Tabs, Tab, Chip, Badge, Avatar } from '@heroui/react';
import type { Key } from '@react-types/shared';
import {
  CurrentFormValues,
  DisplayContent,
  AvatarProps,
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
}: MobileContentComponentProps) {
  console.log('📱 모바일 콘텐츠 렌더링:', { selectedSize: selectedMobileSize });

  const handleTabChange = (key: Key) => {
    console.log('📱 모바일 크기 변경:', key);
    setSelectedMobileSize(String(key));
  };

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

      <div
        className={
          selectedMobileSize === '360'
            ? 'w-[360px] mx-auto'
            : 'w-[768px] mx-auto'
        }
      >
        <div>
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
                'In the fast-evolving world of home decor, embracing the art of transformation is the key to keeping your living spaces fresh, vibrant, and in tune with the latest trends.'}
            </p>

            <h2 className="text-2xl font-bold">Introduction</h2>

            {displayContent.text ? (
              renderMarkdown(displayContent.text)
            ) : (
              <p>
                Software as a Service (SaaS) has transformed the way businesses
                operate, providing access to a wide range of applications and
                tools through the internet.
              </p>
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

            {displayContent.text && displayContent.text.split('\n\n')[1] ? (
              renderMarkdown(displayContent.text.split('\n\n')[1])
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
