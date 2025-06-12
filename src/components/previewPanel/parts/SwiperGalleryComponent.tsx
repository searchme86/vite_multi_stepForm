// 스와이퍼 갤러리 컴포넌트
import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/autoplay';
import 'swiper/css/effect-fade';

interface SwiperGalleryComponentProps {
  sliderImages: string[];
  swiperKey: string;
}

function SwiperGalleryComponent({
  sliderImages,
  swiperKey,
}: SwiperGalleryComponentProps) {
  console.log('🎠 스와이퍼 갤러리 렌더링:', {
    imageCount: sliderImages?.length || 0,
    key: swiperKey,
  });

  if (!Array.isArray(sliderImages) || sliderImages.length === 0) {
    console.log('⚠️ 슬라이더 이미지 없음 - 컴포넌트 숨김');
    return null;
  }

  return (
    <div className="my-8 not-prose">
      <h3 className="mb-4 text-xl font-bold">슬라이더 갤러리</h3>
      <div className="relative">
        <div className="w-full h-[400px] rounded-lg overflow-hidden bg-default-100">
          <Swiper
            key={swiperKey}
            modules={[Navigation, Pagination, EffectFade, Autoplay]}
            spaceBetween={0}
            slidesPerView={1}
            navigation={sliderImages.length > 1}
            pagination={{
              clickable: true,
              dynamicBullets: true,
            }}
            autoplay={
              sliderImages.length > 1
                ? {
                    delay: 4000,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: true,
                  }
                : false
            }
            loop={sliderImages.length > 1}
            effect="fade"
            fadeEffect={{ crossFade: true }}
            className="w-full h-full"
            watchSlidesProgress={true}
            allowTouchMove={true}
          >
            {sliderImages.map((imageUrl: string, imageIndex: number) => (
              <SwiperSlide key={`slide-${imageIndex}-${imageUrl.slice(-10)}`}>
                <div className="flex items-center justify-center w-full h-full">
                  <img
                    src={imageUrl}
                    alt={`갤러리 이미지 ${imageIndex + 1}`}
                    className="object-cover w-full h-full"
                    loading="lazy"
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </div>
  );
}

export default SwiperGalleryComponent;
