//====최신 PreviewPanel 컴포넌트====
// ✅ 간소화된 ImageViewBuilder 기능이 완전히 통합된 최신 버전

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import {
  Card,
  CardBody,
  Divider,
  Chip,
  Avatar,
  Button,
  Modal,
  ModalContent,
  ModalBody,
  useDisclosure,
  Tabs,
  Tab,
} from '@heroui/react';
import { Icon } from '@iconify/react';
import { Badge } from '@heroui/react';

// Swiper React 전용 import
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';

// Swiper CSS imports
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/autoplay';
import 'swiper/css/effect-fade';

// ✅ 수정: 간소화된 DynamicImageLayout import
import DynamicImageLayout from './DynamicImageLayout';

// MultiStepForm Context 사용
import { useMultiStepForm } from './useMultiStepForm';

function PreviewPanel(): ReactNode {
  const {
    formValues,
    isPreviewPanelOpen,
    setIsPreviewPanelOpen,
    imageViewConfig, // ✅ 사용자 정의 이미지 뷰 설정
  } = useMultiStepForm();

  // ✅ 추가: 모바일 사이즈 감지
  const [isMobile, setIsMobile] = useState(false);

  // ✅ 수정: 세로 스와이프 제스처를 위한 ref
  const touchStartY = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ✅ 추가: 로컬 스토리지에 상태 저장
  React.useEffect(() => {
    if (isMobile) {
      localStorage.setItem('previewPanelOpen', String(isPreviewPanelOpen));
    }
  }, [isPreviewPanelOpen, isMobile]);

  // ✅ 추가: 로컬 스토리지에서 상태 복원
  React.useEffect(() => {
    if (isMobile) {
      const savedState = localStorage.getItem('previewPanelOpen');
      if (savedState !== null) {
        setIsPreviewPanelOpen(savedState === 'true');
      }
    }
  }, [isMobile, setIsPreviewPanelOpen]);

  // ✅ 추가: 모바일에서 ESC 키로 패널 닫기
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobile && isPreviewPanelOpen) {
        setIsPreviewPanelOpen(false);
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isMobile, isPreviewPanelOpen, setIsPreviewPanelOpen]);

  // ✅ 추가: body 스크롤 제어
  React.useEffect(() => {
    if (isMobile && isPreviewPanelOpen) {
      document.body.classList.add('preview-panel-open');
    } else {
      document.body.classList.remove('preview-panel-open');
    }

    return () => {
      document.body.classList.remove('preview-panel-open');
    };
  }, [isMobile, isPreviewPanelOpen]);

  // ✅ 수정: 세로 스와이프 제스처 핸들러 (아래로 스와이프하면 패널 닫기)
  const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = false;
  }, []);

  const handleTouchMove = React.useCallback((e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const diffY = Math.abs(currentY - touchStartY.current);

    // 5px 이상 움직이면 드래그로 판단
    if (diffY > 5) {
      isDragging.current = true;
    }
  }, []);

  const handleTouchEnd = React.useCallback(
    (e: React.TouchEvent) => {
      const touchEndY = e.changedTouches[0].clientY;
      const diffY = touchEndY - touchStartY.current;

      // 아래로 100px 이상 스와이프하면 패널 닫기
      if (diffY > 100 && isDragging.current) {
        setIsPreviewPanelOpen(false);
      }

      // 터치 종료 후 드래그 상태 리셋
      setTimeout(() => {
        isDragging.current = false;
      }, 100);
    },
    [setIsPreviewPanelOpen]
  );

  // ✅ 추가: 헤더 클릭으로 패널 닫기
  const handleHeaderClick = React.useCallback(() => {
    // 드래그 중이 아닐 때만 클릭으로 처리
    if (!isDragging.current) {
      setIsPreviewPanelOpen(false);
    }
  }, [setIsPreviewPanelOpen]);

  // 모바일 모달 상태 관리
  const {
    isOpen: isMobileModalOpen,
    onOpen: onMobileModalOpen,
    onClose: onMobileModalClose,
  } = useDisclosure();

  const {
    isOpen: isDesktopModalOpen,
    onOpen: onDesktopModalOpen,
    onClose: onDesktopModalClose,
  } = useDisclosure();

  // 탭 변경 상태 추적
  const [hasTabChanged, setHasTabChanged] = useState(false);

  // 모바일 모달 열기 함수
  const handleMobileModalOpen = useCallback(() => {
    if (isMobileModalOpen) {
      return;
    }

    setHasTabChanged(false);

    try {
      onMobileModalOpen();
    } catch (error) {
      console.error('모바일 모달 열기 실패:', error);
    }
  }, [isMobileModalOpen, onMobileModalOpen]);

  // 모바일 모달 닫기 함수
  const handleMobileModalClose = useCallback(() => {
    try {
      onMobileModalClose();
      setHasTabChanged(false);
    } catch (error) {
      console.error('모바일 모달 닫기 실패:', error);
    }
  }, [onMobileModalClose]);

  // 데스크탑 모달 함수들
  const handleDesktopModalOpen = useCallback(() => {
    onDesktopModalOpen();
  }, [onDesktopModalOpen]);

  const handleDesktopModalClose = useCallback(() => {
    onDesktopModalClose();
  }, [onDesktopModalClose]);

  // 컴포넌트 마운트 상태 추적
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // formValues 안정화
  const stableFormValues = useMemo(() => {
    if (!formValues) {
      return {
        mainImage: null,
        media: [],
        sliderImages: [],
        title: '',
        description: '',
        content: '',
        tags: '',
        nickname: '',
        userImage: '',
        emailPrefix: '',
        emailDomain: '',
      };
    }

    return {
      mainImage: formValues.mainImage || null,
      media: Array.isArray(formValues.media) ? formValues.media : [],
      sliderImages: Array.isArray(formValues.sliderImages)
        ? formValues.sliderImages
        : [],
      title: formValues.title || '',
      description: formValues.description || '',
      content: formValues.content || '',
      tags: formValues.tags || '',
      nickname: formValues.nickname || '',
      userImage: formValues.userImage || '',
      emailPrefix: formValues.emailPrefix || '',
      emailDomain: formValues.emailDomain || '',
    };
  }, [
    formValues?.mainImage,
    formValues?.media,
    formValues?.sliderImages,
    formValues?.title,
    formValues?.description,
    formValues?.content,
    formValues?.tags,
    formValues?.nickname,
    formValues?.userImage,
    formValues?.emailPrefix,
    formValues?.emailDomain,
  ]);

  const {
    mainImage,
    media,
    sliderImages,
    title,
    description,
    content,
    tags,
    nickname,
    userImage,
    emailPrefix,
    emailDomain,
  } = stableFormValues;

  // Swiper 상태 관리
  const [swiperRef, setSwiperRef] = useState<any>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const swiperKey = useMemo(() => {
    return sliderImages.length > 0
      ? `swiper-${sliderImages.length}-${Date.now()}`
      : 'swiper-empty';
  }, [sliderImages.length]);

  // 기본 데이터 처리
  const heroImage = mainImage || (media && media.length > 0 ? media[0] : null);
  const isUsingFallbackImage = !mainImage && media && media.length > 0;

  const tagArray = useMemo(() => {
    return tags
      ? tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [];
  }, [tags]);

  const email = useMemo(() => {
    return emailPrefix && emailDomain ? `${emailPrefix}@${emailDomain}` : '';
  }, [emailPrefix, emailDomain]);

  // Swiper 네비게이션 함수들
  const goToSlide = useCallback(
    (index: number) => {
      if (swiperRef && isMountedRef.current) {
        try {
          swiperRef.slideTo(index);
          setCurrentSlide(index);
        } catch (error) {
          console.warn('Swiper slideTo error:', error);
        }
      }
    },
    [swiperRef]
  );

  const nextSlide = useCallback(() => {
    if (swiperRef && isMountedRef.current) {
      try {
        swiperRef.slideNext();
      } catch (error) {
        console.warn('Swiper slideNext error:', error);
      }
    }
  }, [swiperRef]);

  const prevSlide = useCallback(() => {
    if (swiperRef && isMountedRef.current) {
      try {
        swiperRef.slidePrev();
      } catch (error) {
        console.warn('Swiper slidePrev error:', error);
      }
    }
  }, [swiperRef]);

  const handleSwiperInit = useCallback((swiper: any) => {
    if (isMountedRef.current) {
      setSwiperRef(swiper);
    }
  }, []);

  const handleSlideChange = useCallback((swiper: any) => {
    if (isMountedRef.current && swiper?.activeIndex !== undefined) {
      try {
        setCurrentSlide(swiper.activeIndex);
      } catch (error) {
        console.warn('Swiper slide change error:', error);
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      if (swiperRef) {
        try {
          swiperRef.destroy?.(true, true);
        } catch (error) {
          console.warn('Swiper destroy error:', error);
        }
      }
    };
  }, [swiperRef]);

  // 유틸리티 함수들
  const renderMarkdown = useCallback((text: string) => {
    if (!text) return null;

    let formatted = text
      .replace(
        /^# (.*?)$/gm,
        '<h1 class="text-3xl font-bold mt-6 mb-4">$1</h1>'
      )
      .replace(
        /^## (.*?)$/gm,
        '<h2 class="text-2xl font-bold mt-5 mb-3">$1</h2>'
      )
      .replace(
        /^### (.*?)$/gm,
        '<h3 class="text-xl font-bold mt-4 mb-2">$1</h3>'
      )
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(
        /\[(.*?)\]\((.*?)\)/g,
        '<a href="$2" class="text-primary hover:underline">$1</a>'
      )
      .replace(/^- (.*?)$/gm, '<li>$1</li>')
      .replace(
        /`(.*?)`/g,
        '<code class="bg-default-100 px-1 rounded">$1</code>'
      )
      .replace(/\n/g, '<br />');

    if (formatted.includes('<li>')) {
      formatted = formatted.replace(
        /<li>.*?<\/li>/gs,
        (match) => `<ul class="list-disc pl-5 my-2">${match}</ul>`
      );
      formatted = formatted.replace(
        /<ul class="list-disc pl-5 my-2">(<ul class="list-disc pl-5 my-2">.*?<\/ul>)<\/ul>/g,
        '$1'
      );
    }

    return (
      <div
        className="prose markdown-content max-w-none"
        dangerouslySetInnerHTML={{ __html: formatted }}
      />
    );
  }, []);

  const formatDate = useCallback((dateString: string) => {
    if (!dateString)
      return new Date().toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, []);

  const currentDate = useMemo(
    () => formatDate(new Date().toISOString()),
    [formatDate]
  );

  // Avatar 설정
  const defaultAvatarSrc =
    'https://img.heroui.chat/image/avatar?w=200&h=200&u=1';
  const defaultNickname = 'User';

  const avatarProps = useMemo(() => {
    const src = userImage || defaultAvatarSrc;
    const name = nickname || defaultNickname;

    return {
      src,
      name,
      className: 'w-10 h-10 border-2 border-white',
      showFallback: true,
      isBordered: true,
    };
  }, [userImage, nickname]);

  const largeAvatarProps = useMemo(() => {
    const src = userImage || defaultAvatarSrc;
    const name = nickname || defaultNickname;

    return {
      src,
      name,
      className: 'w-10 h-10 border-2 border-white',
      showFallback: true,
      isBordered: true,
    };
  }, [userImage, nickname]);

  // Swiper 컴포넌트를 재사용 가능한 형태로 분리
  const SwiperGallery = useCallback(
    () =>
      sliderImages && sliderImages.length > 0 ? (
        <div className="my-8 not-prose">
          <h3 className="mb-4 text-xl font-bold">슬라이더 갤러리</h3>
          <div className="relative">
            <div className="w-full h-[400px] rounded-lg overflow-hidden bg-default-100">
              <Swiper
                key={swiperKey}
                modules={[Navigation, Pagination, Autoplay, EffectFade]}
                spaceBetween={0}
                slidesPerView={1}
                navigation={false}
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
                fadeEffect={{
                  crossFade: true,
                }}
                onSwiper={handleSwiperInit}
                onSlideChange={handleSlideChange}
                className="w-full h-full"
                watchSlidesProgress={true}
                allowTouchMove={true}
              >
                {sliderImages.map((img: string, index: number) => (
                  <SwiperSlide key={`slide-${index}`}>
                    <div className="flex items-center justify-center w-full h-full">
                      <img
                        src={img}
                        alt={`갤러리 이미지 ${index + 1}`}
                        className="object-cover w-full h-full"
                        loading="lazy"
                      />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>

              {sliderImages.length > 1 && (
                <>
                  <button
                    className="absolute z-10 flex items-center justify-center w-10 h-10 text-white transition-all -translate-y-1/2 rounded-full top-1/2 left-4 bg-black/30 hover:bg-black/50 group"
                    onClick={prevSlide}
                    type="button"
                    aria-label="이전 이미지"
                  >
                    <Icon
                      icon="lucide:chevron-left"
                      className="transition-transform group-hover:scale-110"
                    />
                  </button>

                  <button
                    className="absolute z-10 flex items-center justify-center w-10 h-10 text-white transition-all -translate-y-1/2 rounded-full top-1/2 right-4 bg-black/30 hover:bg-black/50 group"
                    onClick={nextSlide}
                    type="button"
                    aria-label="다음 이미지"
                  >
                    <Icon
                      icon="lucide:chevron-right"
                      className="transition-transform group-hover:scale-110"
                    />
                  </button>
                </>
              )}
            </div>

            {sliderImages.length > 1 && (
              <div className="flex gap-3 pb-2 mt-4 overflow-x-auto hide-scrollbar">
                {sliderImages.map((img: string, index: number) => (
                  <button
                    key={`thumb-${index}`}
                    onClick={() => goToSlide(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all hover:scale-105 ${
                      currentSlide === index
                        ? 'border-primary shadow-lg'
                        : 'border-transparent hover:border-primary/50'
                    }`}
                    type="button"
                    aria-label={`${index + 1}번째 이미지로 이동`}
                  >
                    <img
                      src={img}
                      alt={`썸네일 ${index + 1}`}
                      className="object-cover w-full h-full"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}

            {sliderImages.length > 1 && (
              <div className="absolute z-10 px-2 py-1 text-sm text-white rounded-md top-4 left-4 bg-black/50">
                {currentSlide + 1} / {sliderImages.length}
              </div>
            )}
          </div>
        </div>
      ) : null,
    [
      sliderImages,
      swiperKey,
      handleSwiperInit,
      handleSlideChange,
      prevSlide,
      nextSlide,
      goToSlide,
      currentSlide,
    ]
  );

  // ✅ 핵심 기능: 간소화된 사용자 정의 이미지 갤러리 컴포넌트
  const CustomImageGallery = useCallback(() => {
    // imageViewConfig가 없거나 선택된 이미지가 없으면 렌더링하지 않음
    if (
      !imageViewConfig ||
      !imageViewConfig.selectedImages ||
      imageViewConfig.selectedImages.length === 0
    ) {
      return null;
    }

    return (
      <div className="my-8 not-prose">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Icon icon="lucide:layout-grid" className="text-primary" />
            사용자 정의 갤러리
          </h3>
          <div className="flex items-center gap-2">
            <Chip size="sm" color="primary" variant="flat">
              {imageViewConfig.selectedImages.length}개 이미지
            </Chip>
            <Chip size="sm" color="secondary" variant="flat">
              {imageViewConfig.layout.columns}열 그리드
            </Chip>
          </div>
        </div>

        {/* ✅ 간소화된 DynamicImageLayout 컴포넌트 사용 */}
        <DynamicImageLayout
          config={imageViewConfig}
          showNumbers={false}
          className="bg-default-50 p-4 rounded-lg border border-default-200"
        />

        <div className="mt-3 text-sm text-default-500 text-center">
          이미지 뷰 빌더에서 선택한 이미지들이 여기에 표시됩니다
        </div>
      </div>
    );
  }, [imageViewConfig]);

  // 모바일 전용 컨텐츠 컴포넌트
  const MobileContent = useCallback(() => {
    const [selectedMobileSize, setSelectedMobileSize] = useState('360');

    // 탭 변경 핸들러
    const handleTabChange = useCallback(
      (key: string) => {
        setSelectedMobileSize(key);
        setHasTabChanged(true);
      },
      [selectedMobileSize]
    );

    return (
      <div>
        {/* 탭 헤더 영역 */}
        <div className="p-6 border-b bg-gray-50">
          <Tabs
            selectedKey={selectedMobileSize}
            onSelectionChange={handleTabChange}
          >
            <Tab key="360" title="360px" />
            <Tab key="768" title="768px" />
          </Tabs>
        </div>

        {/* 탭 패널 - 동적 className */}
        <div
          className={
            selectedMobileSize === '360'
              ? 'w-[360px] mx-auto'
              : 'w-[768px] mx-auto'
          }
        >
          {/* 모바일 컨텐츠 */}
          <div>
            {/* 모바일 커버 이미지 */}
            <div className="relative">
              <img
                src={
                  heroImage ||
                  'https://img.heroui.chat/image/places?w=800&h=600&u=1'
                }
                alt={title || '블로그 커버 이미지'}
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
                  {title || '블로그 제목이 여기에 표시됩니다'}
                </h1>

                {/* 모바일 태그 표시 */}
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
                      {nickname || 'Ariel van Houten'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 모바일 컨텐츠 */}
            <div className="p-5 space-y-6">
              <p className="text-lg leading-relaxed">
                {description ||
                  'In the fast-evolving world of home decor, embracing the art of transformation is the key to keeping your living spaces fresh, vibrant, and in tune with the latest trends. At StuffUs, we believe that your home is a canvas waiting to be adorned with innovation and style.'}
              </p>

              <h2 className="text-2xl font-bold">Introduction</h2>

              {content ? (
                renderMarkdown(content)
              ) : (
                <p>
                  Software as a Service (SaaS) has transformed the way
                  businesses operate, providing access to a wide range of
                  applications and tools through the internet. Rather than
                  installing software on individual computers or servers, SaaS
                  solutions are hosted in the cloud and accessible through a web
                  browser or mobile app.
                </p>
              )}

              {/* 추가 이미지 */}
              {media && media.length > 1 && (
                <div className="my-6">
                  <img
                    src={media[1]}
                    alt="Blog content image"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              )}

              {/* ✅ 핵심: 간소화된 사용자 정의 이미지 갤러리 */}
              <CustomImageGallery />

              {/* 기존 슬라이더 갤러리 */}
              <SwiperGallery />

              {/* 추가 컨텐츠 */}
              {content ? (
                renderMarkdown(content.split('\n\n')[1] || '')
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
  }, [
    heroImage,
    title,
    tagArray,
    avatarProps,
    nickname,
    description,
    content,
    renderMarkdown,
    media,
    CustomImageGallery, // ✅ 핵심 기능 포함
    SwiperGallery,
    setHasTabChanged,
  ]);

  // 데스크탑 전용 컨텐츠 컴포넌트
  const DesktopContent = useCallback(
    () => (
      <div>
        {/* 데스크탑 히어로 섹션 */}
        <div className="relative h-[300px] mb-10">
          <img
            src={
              heroImage ||
              'https://img.heroui.chat/image/places?w=1200&h=600&u=1'
            }
            alt={title || 'Blog cover image'}
            className="object-cover w-full h-full"
          />
          <div className="absolute inset-0 flex flex-col justify-end p-6 bg-gradient-to-t from-black/80 to-black/30">
            <div className="flex items-center gap-2">
              <Badge color="primary" variant="flat" className="px-2">
                Newest Blog
              </Badge>
              <span className="text-sm text-white/80">• 4 Min</span>
            </div>
            <strong className="mb-3 text-4xl font-bold text-white">
              {title || '블로그 제목이 여기에 표시됩니다'}
            </strong>

            {/* 데스크탑 태그 표시 */}
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
                  {nickname || 'Ariel van Houten'}
                </span>
              </p>
              <Avatar {...largeAvatarProps} />
            </div>
          </div>
        </div>

        {/* 데스크탑 메인 컨텐츠 */}
        <div className="flex gap-8">
          <div className="flex-1">
            <div className="prose max-w-none">
              <p className="pl-5 text-lg border-l-4 border-red-500 mb-7">
                {description || '블로그의 요약 내용이 보여질 공간입니다.'}
              </p>

              {content ? (
                renderMarkdown(content)
              ) : (
                <p>
                  Software as a Service (SaaS) has transformed the way
                  businesses operate, providing access to a wide range of
                  applications and tools through the internet.
                </p>
              )}

              {/* ✅ 핵심: 간소화된 사용자 정의 이미지 갤러리 */}
              <CustomImageGallery />

              {/* 기존 슬라이더 갤러리 */}
              <SwiperGallery />
            </div>
          </div>
        </div>
      </div>
    ),
    [
      heroImage,
      title,
      tagArray,
      largeAvatarProps,
      nickname,
      description,
      content,
      renderMarkdown,
      CustomImageGallery, // ✅ 핵심 기능 포함
      SwiperGallery,
    ]
  );

  // 일반 미리보기 컨텐츠 (페이지 내 표시용)
  const PreviewContent = useCallback(
    () => (
      <div>
        {/* 모바일 영역 (md 이하에서만 표시) */}
        <div className="md:hidden">
          {/* 기존 HTML 구조를 위한 단순 768px 뷰 (탭 기능 없음) */}
          <div className="w-[768px] mx-auto">
            {/* 모바일 커버 이미지 */}
            <div className="relative">
              <img
                src={
                  heroImage ||
                  'https://img.heroui.chat/image/places?w=800&h=600&u=1'
                }
                alt={title || '블로그 커버 이미지'}
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
                  {title || '블로그 제목이 여기에 표시됩니다'}
                </h1>

                {/* 모바일 태그 표시 */}
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
                      {nickname || 'Ariel van Houten'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 모바일 컨텐츠 */}
            <div className="p-5 space-y-6">
              <p className="text-lg leading-relaxed">
                {description ||
                  '모바일 뷰이면서 블로그의 요약 컨텐츠가 렌더링될 공간입니다'}
              </p>

              {content ? (
                renderMarkdown(content)
              ) : (
                <p>모바일 뷰이면서 블로그의 마크다운이 렌더링할 공간입니다.</p>
              )}

              {/* 추가 이미지 */}
              {media && media.length > 1 && (
                <div className="my-6">
                  <img
                    src={media[1]}
                    alt="Blog content image"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              )}

              {/* ✅ 핵심: 간소화된 사용자 정의 이미지 갤러리 */}
              <CustomImageGallery />

              {/* 기존 슬라이더 갤러리 */}
              <SwiperGallery />
            </div>
          </div>
        </div>

        {/* 데스크탑 영역 (md 이상에서만 표시) */}
        <div className="hidden md:block">
          <DesktopContent />
        </div>
      </div>
    ),
    [
      heroImage,
      title,
      tagArray,
      avatarProps,
      nickname,
      description,
      content,
      renderMarkdown,
      media,
      CustomImageGallery, // ✅ 핵심 기능 포함
      SwiperGallery,
      DesktopContent,
    ]
  );

  return (
    <>
      {/* ✅ 수정: 모바일 오버레이 - bottom-sheet용 */}
      {isMobile && isPreviewPanelOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsPreviewPanelOpen(false)}
        />
      )}

      {/* ✅ 수정: 모바일에서 bottom-sheet 스타일로 변경 */}
      <div
        className={`
          ${
            isMobile
              ? 'fixed bottom-0 left-0 right-0 bg-white shadow-2xl z-50 overflow-y-auto transition-transform duration-300 ease-in-out preview-panel-bottom-sheet rounded-t-3xl'
              : 'relative preview-panel-desktop'
          }
          ${
            isMobile && !isPreviewPanelOpen
              ? 'translate-y-full'
              : 'translate-y-0'
          }
          ${isMobile ? 'h-[85vh] max-h-[85vh]' : ''}
        `}
        onTouchStart={isMobile ? handleTouchStart : undefined}
        onTouchMove={isMobile ? handleTouchMove : undefined}
        onTouchEnd={isMobile ? handleTouchEnd : undefined}
      >
        {/* ✅ 수정: 모바일 헤더 - bottom-sheet 스타일 */}
        {isMobile && (
          <div className="sticky top-0 z-10 bg-white rounded-t-3xl">
            {/* 드래그 핸들 - 클릭 가능 */}
            <div
              className="flex justify-center pt-3 pb-2 cursor-pointer header-clickable"
              onClick={handleHeaderClick}
            >
              <div className="w-12 h-1 bg-gray-300 rounded-full transition-all hover:bg-gray-400 active:bg-gray-500 active:scale-95 drag-handle"></div>
            </div>

            {/* 헤더 컨텐츠 - 클릭 가능 */}
            <div
              className="flex items-center justify-between p-4 border-b cursor-pointer header-clickable transition-colors"
              onClick={handleHeaderClick}
            >
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">미리보기</h2>
                <span className="text-xs text-gray-400 opacity-75">
                  탭하여 닫기
                </span>
              </div>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={(e) => {
                  e.stopPropagation(); // 부모 클릭 이벤트 방지
                  setIsPreviewPanelOpen(false);
                }}
                aria-label="패널 닫기"
              >
                <Icon icon="lucide:x" />
              </Button>
            </div>
          </div>
        )}

        {/* 기존 컨텐츠를 패딩 추가하여 감싸기 */}
        <div className={isMobile ? 'p-4' : ''}>
          {/* 메인 이미지 피드백 */}
          {isUsingFallbackImage && media && media.length > 0 && (
            <div className="flex items-center gap-2 p-2 mb-4 border rounded-md bg-warning-50 border-warning-200">
              <Icon
                icon="lucide:alert-triangle"
                className="flex-shrink-0 text-warning"
              />
              <p className="text-xs text-warning-700">
                메인 이미지가 선택되지 않아 첫 번째 이미지가 자동으로
                사용됩니다.
              </p>
            </div>
          )}

          {/* ✅ 핵심: 이미지 뷰 빌더 상태 표시 */}
          {imageViewConfig && imageViewConfig.selectedImages.length > 0 && (
            <div className="flex items-center gap-2 p-2 mb-4 border rounded-md bg-success-50 border-success-200">
              <Icon
                icon="lucide:check-circle"
                className="flex-shrink-0 text-success"
              />
              <p className="text-xs text-success-700">
                사용자 정의 갤러리에 {imageViewConfig.selectedImages.length}개
                이미지가 {imageViewConfig.layout.columns}열 그리드로 표시됩니다.
              </p>
            </div>
          )}

          {/* 버튼 영역 - 모바일에서는 숨김 */}
          {!isMobile && (
            <div className="flex justify-end gap-2 mb-4">
              <Button
                color="secondary"
                variant="flat"
                size="sm"
                onPress={handleMobileModalOpen}
                startContent={<Icon icon="lucide:smartphone" />}
                className="text-xs shadow-sm sm:text-sm"
                type="button"
                isDisabled={isMobileModalOpen}
              >
                모바일뷰 보기
              </Button>

              <Button
                color="primary"
                variant="flat"
                size="sm"
                onPress={handleDesktopModalOpen}
                startContent={<Icon icon="lucide:monitor" />}
                className="text-xs shadow-sm sm:text-sm"
                type="button"
                isDisabled={isDesktopModalOpen}
              >
                데스크탑뷰 보기
              </Button>
            </div>
          )}

          {/* 일반 미리보기 컨텐츠 */}
          <PreviewContent />

          {/* 모바일뷰 전용 모달 */}
          {isMobileModalOpen && (
            <Modal
              isOpen={isMobileModalOpen}
              onClose={handleMobileModalClose}
              size="full"
              scrollBehavior="inside"
              hideCloseButton={false}
              backdrop="blur"
              motionProps={{
                variants: {
                  enter: {
                    opacity: 1,
                    transition: {
                      duration: 0.3,
                      ease: 'easeOut',
                    },
                  },
                  exit: {
                    opacity: 0,
                    transition: {
                      duration: 0.2,
                      ease: 'easeIn',
                    },
                  },
                },
              }}
            >
              <ModalContent>
                {(onClose) => (
                  <>
                    <ModalBody className="p-0">
                      <div className="relative h-full">
                        <Button
                          isIconOnly
                          color="default"
                          variant="flat"
                          size="sm"
                          className="absolute z-50 top-4 right-4 bg-white/80 backdrop-blur-sm"
                          onPress={handleMobileModalClose}
                          type="button"
                        >
                          <Icon icon="lucide:x" />
                        </Button>

                        {/* MobileContent 컴포넌트 자체가 탭 기능을 포함 */}
                        <MobileContent />
                      </div>
                    </ModalBody>
                  </>
                )}
              </ModalContent>
            </Modal>
          )}

          {/* 데스크탑뷰 전용 모달 */}
          {isDesktopModalOpen && (
            <Modal
              isOpen={isDesktopModalOpen}
              onClose={handleDesktopModalClose}
              size="full"
              scrollBehavior="inside"
              hideCloseButton={false}
              backdrop="blur"
            >
              <ModalContent>
                {(onClose) => (
                  <>
                    <ModalBody className="p-0">
                      <div className="relative">
                        <Button
                          isIconOnly
                          color="default"
                          variant="flat"
                          size="sm"
                          className="absolute z-50 top-4 right-4 bg-white/80 backdrop-blur-sm"
                          onPress={onClose}
                          type="button"
                        >
                          <Icon icon="lucide:x" />
                        </Button>

                        {/* 전체폭 데스크탑 컨텐츠 */}
                        <div className="max-w-4xl mx-auto">
                          <DesktopContent />
                        </div>
                      </div>
                    </ModalBody>
                  </>
                )}
              </ModalContent>
            </Modal>
          )}
        </div>
      </div>
    </>
  );
}

export default PreviewPanel;
