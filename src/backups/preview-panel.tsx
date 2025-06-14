//====PreviewPanel 컴포넌트 - useFormContext null 에러 수정====
// ✅ 안전한 useFormContext 처리 및 fallback 로직 추가

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

// 간소화된 DynamicImageLayout import
import DynamicImageLayout from '../components/multiStepForm/steps/DynamicImageLayout';

// MultiStepForm Context 사용
import { useMultiStepForm } from './useMultiStepForm';

function PreviewPanel(): ReactNode {
  // Context의 formValues를 우선적으로 사용
  const {
    formValues,
    isPreviewPanelOpen,
    setIsPreviewPanelOpen,
    imageViewConfig,
    customGalleryViews,
    //====여기부터 수정됨====
    // ✅ 수정: 에디터 상태도 가져오기
    // 이유: 에디터 완성 여부와 상태를 체크하기 위해
    editorState,
    //====여기까지 수정됨====
  } = useMultiStepForm() || {};

  // 안전한 기본값 제공 및 실시간 값 사용
  const currentFormValues = useMemo(() => {
    if (formValues && typeof formValues === 'object') {
      console.log('✅ Context formValues 사용:', {
        sliderImagesLength: formValues.sliderImages?.length || 0,
        sliderImages: formValues.sliderImages?.slice(0, 2) || [],
        //====여기부터 수정됨====
        // ✅ 수정: 에디터 관련 로그 추가
        // 이유: 에디터 결과 추적을 위해
        editorCompletedContent:
          formValues.editorCompletedContent?.slice(0, 50) + '...' || 'none',
        isEditorCompleted: formValues.isEditorCompleted || false,
        //====여기까지 수정됨====
        source: 'Context-FormValues',
        timestamp: new Date().toLocaleTimeString(),
      });

      return {
        media: Array.isArray(formValues.media) ? formValues.media : [],
        mainImage: formValues.mainImage || null,
        sliderImages: Array.isArray(formValues.sliderImages)
          ? formValues.sliderImages
          : [],
        title: typeof formValues.title === 'string' ? formValues.title : '',
        description:
          typeof formValues.description === 'string'
            ? formValues.description
            : '',
        content:
          typeof formValues.content === 'string' ? formValues.content : '',
        tags: typeof formValues.tags === 'string' ? formValues.tags : '',
        nickname:
          typeof formValues.nickname === 'string' ? formValues.nickname : '',
        userImage:
          typeof formValues.userImage === 'string' ? formValues.userImage : '',
        emailPrefix:
          typeof formValues.emailPrefix === 'string'
            ? formValues.emailPrefix
            : '',
        emailDomain:
          typeof formValues.emailDomain === 'string'
            ? formValues.emailDomain
            : '',
        //====여기부터 수정됨====
        // ✅ 수정: 에디터 관련 값들 추가
        // 이유: 에디터 결과를 미리보기에서 사용하기 위해
        editorCompletedContent:
          typeof formValues.editorCompletedContent === 'string'
            ? formValues.editorCompletedContent
            : '',
        isEditorCompleted:
          typeof formValues.isEditorCompleted === 'boolean'
            ? formValues.isEditorCompleted
            : false,
        //====여기까지 수정됨====
      };
    }

    // 최종 기본값
    const defaultValues = {
      media: [],
      mainImage: null,
      sliderImages: [],
      title: '',
      description: '',
      content: '',
      tags: '',
      nickname: '',
      userImage: '',
      emailPrefix: '',
      emailDomain: '',
      //====여기부터 수정됨====
      // ✅ 수정: 에디터 관련 기본값 추가
      // 이유: 안전한 기본값 제공
      editorCompletedContent: '',
      isEditorCompleted: false,
      //====여기까지 수정됨====
    };

    console.log('📋 기본값 사용:', {
      sliderImagesLength: 0,
      sliderImages: [],
      //====여기부터 수정됨====
      // ✅ 수정: 에디터 관련 기본값 로그
      editorCompletedContent: 'none',
      isEditorCompleted: false,
      //====여기까지 수정됨====
      source: 'DefaultValues',
      timestamp: new Date().toLocaleTimeString(),
    });

    return defaultValues;
  }, [formValues]);

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
    //====여기부터 수정됨====
    // ✅ 수정: 에디터 관련 값들 destructuring
    // 이유: 컴포넌트에서 사용하기 위해
    editorCompletedContent,
    isEditorCompleted,
    //====여기까지 수정됨====
  } = currentFormValues;

  //====여기부터 수정됨====
  // ✅ 수정: 우선 사용할 컨텐츠 결정 로직
  // 이유: 에디터 결과가 있으면 우선 사용, 없으면 기본 content 사용
  const displayContent = useMemo(() => {
    // 에디터가 완성되고 에디터 컨텐츠가 있으면 에디터 결과 우선 사용
    if (isEditorCompleted && editorCompletedContent?.trim()) {
      return {
        text: editorCompletedContent,
        source: 'editor',
      };
    }

    // 그렇지 않으면 기본 content 사용
    return {
      text: content,
      source: 'basic',
    };
  }, [isEditorCompleted, editorCompletedContent, content]);

  // ✅ 수정: 에디터 상태 표시용 정보
  const editorStatusInfo = useMemo(() => {
    if (!editorState) {
      return {
        hasEditor: false,
        containerCount: 0,
        paragraphCount: 0,
        isCompleted: false,
      };
    }

    return {
      hasEditor: true,
      containerCount: editorState.containers?.length || 0,
      paragraphCount:
        editorState.paragraphs?.filter((p) => p.containerId !== null)?.length ||
        0,
      isCompleted: editorState.isCompleted || false,
    };
  }, [editorState]);
  //====여기까지 수정됨====

  // sliderImages 변경 감지 및 디버깅 강화
  useEffect(() => {
    console.log('🎬 PreviewPanel sliderImages 변경 감지:', {
      length: sliderImages?.length || 0,
      images: sliderImages?.slice(0, 2) || [],
      //====여기부터 수정됨====
      // ✅ 수정: 에디터 상태 변경 감지 로그 추가
      // 이유: 에디터 결과 반영 여부 확인
      editorStatus: editorStatusInfo,
      displayContentSource: displayContent.source,
      //====여기까지 수정됨====
      timestamp: new Date().toLocaleTimeString(),
    });
  }, [sliderImages, editorStatusInfo, displayContent.source]);

  // 모바일 사이즈 감지
  const [isMobile, setIsMobile] = useState(false);

  // 세로 스와이프 제스처를 위한 ref
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

  // 로컬 스토리지에 상태 저장
  React.useEffect(() => {
    if (isMobile && typeof isPreviewPanelOpen === 'boolean') {
      try {
        localStorage.setItem('previewPanelOpen', String(isPreviewPanelOpen));
      } catch (error) {
        console.warn('Failed to save to localStorage:', error);
      }
    }
  }, [isPreviewPanelOpen, isMobile]);

  // 로컬 스토리지에서 상태 복원
  React.useEffect(() => {
    if (isMobile && setIsPreviewPanelOpen) {
      try {
        const savedState = localStorage.getItem('previewPanelOpen');
        if (savedState !== null) {
          setIsPreviewPanelOpen(savedState === 'true');
        }
      } catch (error) {
        console.warn('Failed to load from localStorage:', error);
      }
    }
  }, [isMobile, setIsPreviewPanelOpen]);

  // 모바일에서 ESC 키로 패널 닫기
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (
        e.key === 'Escape' &&
        isMobile &&
        isPreviewPanelOpen &&
        setIsPreviewPanelOpen
      ) {
        setIsPreviewPanelOpen(false);
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isMobile, isPreviewPanelOpen, setIsPreviewPanelOpen]);

  // body 스크롤 제어
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

  // 세로 스와이프 제스처 핸들러
  const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = false;
  }, []);

  const handleTouchMove = React.useCallback((e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const diffY = Math.abs(currentY - touchStartY.current);

    if (diffY > 5) {
      isDragging.current = true;
    }
  }, []);

  const handleTouchEnd = React.useCallback(
    (e: React.TouchEvent) => {
      const touchEndY = e.changedTouches[0].clientY;
      const diffY = touchEndY - touchStartY.current;

      if (diffY > 100 && isDragging.current && setIsPreviewPanelOpen) {
        setIsPreviewPanelOpen(false);
      }

      setTimeout(() => {
        isDragging.current = false;
      }, 100);
    },
    [setIsPreviewPanelOpen]
  );

  // 헤더 클릭으로 패널 닫기
  const handleHeaderClick = React.useCallback(() => {
    if (!isDragging.current && setIsPreviewPanelOpen) {
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

  // 단순한 swiperKey 생성
  const swiperKey = useMemo(() => {
    const imageCount = Array.isArray(sliderImages) ? sliderImages.length : 0;
    return `swiper-${imageCount}`;
  }, [sliderImages]);

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

  // SwiperGallery 컴포넌트 - swiper 자체 기능만 사용하도록 완전히 단순화
  const SwiperGallery = useCallback(() => {
    const hasSliderImages =
      Array.isArray(sliderImages) && sliderImages.length > 0;
    const actualCount = sliderImages?.length || 0;

    console.log('🎬 SwiperGallery 렌더링 체크:', {
      hasSliderImages,
      sliderImages: sliderImages?.slice(0, 2) || [],
      actualCount,
      timestamp: new Date().toLocaleTimeString(),
      swiperKey,
    });

    if (!hasSliderImages || actualCount === 0) {
      console.log(
        '❌ SwiperGallery 렌더링 안됨: sliderImages 없음 또는 길이 0'
      );
      return null;
    }

    console.log('✅ SwiperGallery 렌더링 시작:', {
      imageCount: actualCount,
      firstImage: sliderImages[0]?.slice(0, 50) + '...',
    });

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
              fadeEffect={{
                crossFade: true,
              }}
              className="w-full h-full"
              watchSlidesProgress={true}
              allowTouchMove={true}
            >
              {sliderImages.map((img: string, index: number) => (
                <SwiperSlide key={`slide-${index}-${img.slice(-10)}`}>
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
          </div>
        </div>
      </div>
    );
  }, [sliderImages, swiperKey]);

  // 사용자 정의 이미지 갤러리 컴포넌트
  const CustomImageGallery = useCallback(() => {
    const safeCustomGalleryViews = Array.isArray(customGalleryViews)
      ? customGalleryViews
      : [];

    if (safeCustomGalleryViews.length === 0) {
      return null;
    }

    return (
      <div className="my-8 space-y-8 not-prose">
        {safeCustomGalleryViews.map((galleryView, galleryIndex) => {
          if (!galleryView || typeof galleryView !== 'object') {
            return null;
          }

          return (
            <div key={galleryView.id || `gallery-${galleryIndex}`}>
              <DynamicImageLayout
                config={{
                  selectedImages: Array.isArray(galleryView.selectedImages)
                    ? galleryView.selectedImages
                    : [],
                  clickOrder: Array.isArray(galleryView.clickOrder)
                    ? galleryView.clickOrder
                    : [],
                  layout:
                    galleryView.layout && typeof galleryView.layout === 'object'
                      ? {
                          columns: galleryView.layout.columns || 3,
                          gridType: galleryView.layout.gridType || 'grid',
                        }
                      : { columns: 3, gridType: 'grid' },
                  filter: 'available',
                }}
                showNumbers={false}
                className="rounded-lg"
              />
            </div>
          );
        })}
      </div>
    );
  }, [customGalleryViews]);

  // 모바일 전용 컨텐츠 컴포넌트
  const MobileContent = useCallback(() => {
    const [selectedMobileSize, setSelectedMobileSize] = useState('360');

    const handleTabChange = useCallback(
      (key: string) => {
        setSelectedMobileSize(key);
        setHasTabChanged(true);
      },
      [selectedMobileSize]
    );

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

            <div className="p-5 space-y-6">
              <p className="text-lg leading-relaxed">
                {description ||
                  'In the fast-evolving world of home decor, embracing the art of transformation is the key to keeping your living spaces fresh, vibrant, and in tune with the latest trends. At StuffUs, we believe that your home is a canvas waiting to be adorned with innovation and style.'}
              </p>

              <h2 className="text-2xl font-bold">Introduction</h2>

              {/*====여기부터 수정됨====*/}
              {/* ✅ 수정: 에디터 결과 또는 기본 content 렌더링 */}
              {/* 이유: 에디터에서 완성된 글이 있으면 우선 표시 */}
              {displayContent.text ? (
                renderMarkdown(displayContent.text)
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
              {/*====여기까지 수정됨====*/}

              {media && media.length > 1 && (
                <div className="my-6">
                  <img
                    src={media[1]}
                    alt="Blog content image"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              )}

              <CustomImageGallery />

              <SwiperGallery />

              {/*====여기부터 수정됨====*/}
              {/* ✅ 수정: 추가 컨텐츠도 에디터 결과 사용 */}
              {/* 이유: 일관성 유지 */}
              {displayContent.text && displayContent.text.split('\n\n')[1] ? (
                renderMarkdown(displayContent.text.split('\n\n')[1])
              ) : (
                <p>
                  Macrivate offers a range of features that can help your team
                  work more efficiently and productively.
                </p>
              )}
              {/*====여기까지 수정됨====*/}
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
    //====여기부터 수정됨====
    // ✅ 수정: displayContent 사용하도록 dependency 변경
    // 이유: 에디터 결과 반영
    displayContent,
    //====여기까지 수정됨====
    renderMarkdown,
    media,
    CustomImageGallery,
    SwiperGallery,
    setHasTabChanged,
  ]);

  // 데스크탑 전용 컨텐츠 컴포넌트
  const DesktopContent = useCallback(
    () => (
      <div>
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

            <h1 className="mb-3 text-4xl font-bold text-white">
              {title || '블로그 제목이 여기에 표시됩니다'}
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
                  {nickname || 'Ariel van Houten'}
                </span>
              </p>
              <Avatar {...largeAvatarProps} />
            </div>
          </div>
        </div>

        <div className="w-full">
          <p className="pl-5 text-lg border-l-4 border-red-500 mb-7">
            {description || '블로그의 요약 내용이 보여질 공간입니다.'}
          </p>

          {/*====여기부터 수정됨====*/}
          {/* ✅ 수정: 에디터 결과 또는 기본 content 렌더링 */}
          {/* 이유: 에디터에서 완성된 글이 있으면 우선 표시 */}
          {displayContent.text ? (
            renderMarkdown(displayContent.text)
          ) : (
            <p>
              Software as a Service (SaaS) has transformed the way businesses
              operate, providing access to a wide range of applications and
              tools through the internet.
            </p>
          )}
          {/*====여기까지 수정됨====*/}

          <CustomImageGallery />

          <SwiperGallery />
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
      //====여기부터 수정됨====
      // ✅ 수정: displayContent 사용하도록 dependency 변경
      // 이유: 에디터 결과 반영
      displayContent,
      //====여기까지 수정됨====
      renderMarkdown,
      CustomImageGallery,
      SwiperGallery,
    ]
  );

  // 일반 미리보기 컨텐츠
  const PreviewContent = useCallback(
    () => (
      <div>
        <div className="md:hidden">
          <div className="w-[768px] mx-auto">
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

            <div className="p-5 space-y-6">
              <p className="text-lg leading-relaxed">
                {description ||
                  '모바일 뷰이면서 블로그의 요약 컨텐츠가 렌더링될 공간입니다'}
              </p>

              {/*====여기부터 수정됨====*/}
              {/* ✅ 수정: 에디터 결과 또는 기본 content 렌더링 */}
              {/* 이유: 에디터에서 완성된 글이 있으면 우선 표시 */}
              {displayContent.text ? (
                renderMarkdown(displayContent.text)
              ) : (
                <p>모바일 뷰이면서 블로그의 마크다운이 렌더링할 공간입니다.</p>
              )}
              {/*====여기까지 수정됨====*/}

              {media && media.length > 1 && (
                <div className="my-6">
                  <img
                    src={media[1]}
                    alt="Blog content image"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              )}

              <CustomImageGallery />

              <SwiperGallery />
            </div>
          </div>
        </div>

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
      //====여기부터 수정됨====
      // ✅ 수정: displayContent 사용하도록 dependency 변경
      // 이유: 에디터 결과 반영
      displayContent,
      //====여기까지 수정됨====
      renderMarkdown,
      media,
      CustomImageGallery,
      SwiperGallery,
      DesktopContent,
    ]
  );

  // 슬라이더 이미지 상태 표시 및 디버깅 개선
  useEffect(() => {
    console.log('🖼️ PreviewPanel 전체 상태 변경 감지:', {
      mainImage: !!mainImage,
      heroImage: !!heroImage,
      isUsingFallbackImage,
      mediaLength: media?.length || 0,
      sliderImagesLength: sliderImages?.length || 0,
      sliderImagesFirst: sliderImages?.[0]?.slice(0, 30) + '...' || 'none',
      //====여기부터 수정됨====
      // ✅ 수정: 에디터 상태 로그 추가
      // 이유: 에디터 결과 반영 확인
      editorStatus: editorStatusInfo,
      displayContentSource: displayContent.source,
      displayContentLength: displayContent.text?.length || 0,
      //====여기까지 수정됨====
      formValuesSource: 'Context',
    });
  }, [
    mainImage,
    heroImage,
    isUsingFallbackImage,
    media,
    sliderImages,
    editorStatusInfo,
    displayContent,
  ]);

  return (
    <>
      {isMobile && isPreviewPanelOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsPreviewPanelOpen && setIsPreviewPanelOpen(false)}
        />
      )}

      <div
        className={`
  ${
    isMobile
      ? 'fixed bottom-0 left-0 right-0 bg-white shadow-2xl z-50 overflow-y-auto transition-transform duration-300 ease-in-out preview-panel-bottom-sheet rounded-t-3xl'
      : 'relative preview-panel-desktop'
  }
  ${isMobile && !isPreviewPanelOpen ? 'translate-y-full' : 'translate-y-0'}
  ${isMobile ? 'h-[85vh] max-h-[85vh]' : ''}
  `}
        onTouchStart={isMobile ? handleTouchStart : undefined}
        onTouchMove={isMobile ? handleTouchMove : undefined}
        onTouchEnd={isMobile ? handleTouchEnd : undefined}
      >
        {isMobile && (
          <div className="sticky top-0 z-10 bg-white rounded-t-3xl">
            <div
              className="flex justify-center pt-3 pb-2 cursor-pointer header-clickable"
              onClick={handleHeaderClick}
            >
              <div className="w-12 h-1 transition-all bg-gray-300 rounded-full hover:bg-gray-400 active:bg-gray-500 active:scale-95 drag-handle"></div>
            </div>

            <div
              className="flex items-center justify-between p-4 transition-colors border-b cursor-pointer header-clickable"
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
                  e.stopPropagation();
                  if (setIsPreviewPanelOpen) {
                    setIsPreviewPanelOpen(false);
                  }
                }}
                aria-label="패널 닫기"
              >
                <Icon icon="lucide:x" />
              </Button>
            </div>
          </div>
        )}

        <div className={isMobile ? 'p-4' : ''}>
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

          {mainImage && (
            <div className="flex items-center gap-2 p-2 mb-4 border rounded-md bg-success-50 border-success-200">
              <Icon
                icon="lucide:check-circle"
                className="flex-shrink-0 text-success"
              />
              <p className="text-xs text-success-700">
                메인 이미지가 설정되어 미리보기에 표시됩니다. (실시간 연동)
              </p>
            </div>
          )}

          {sliderImages && sliderImages.length > 0 && (
            <div className="flex items-center gap-2 p-2 mb-4 border rounded-md bg-info-50 border-info-200">
              <Icon
                icon="lucide:play-circle"
                className="flex-shrink-0 text-info"
              />
              <p className="text-xs text-info-700">
                슬라이더 이미지 {sliderImages.length}개가 설정되어 갤러리로
                표시됩니다. (실시간 연동)
              </p>
            </div>
          )}

          {customGalleryViews && customGalleryViews.length > 0 && (
            <div className="flex items-center gap-2 p-2 mb-4 border rounded-md bg-success-50 border-success-200">
              <Icon
                icon="lucide:check-circle"
                className="flex-shrink-0 text-success"
              />
              <p className="text-xs text-success-700">
                사용자 정의 갤러리 {customGalleryViews.length}개가 표시됩니다.
              </p>
            </div>
          )}

          {/*====여기부터 수정됨====*/}
          {/* ✅ 수정: 에디터 상태 표시 추가 */}
          {/* 이유: 사용자에게 에디터 사용 여부와 상태 정보 제공 */}
          {editorStatusInfo.hasEditor && (
            <div
              className={`flex items-center gap-2 p-2 mb-4 border rounded-md ${
                editorStatusInfo.isCompleted
                  ? 'bg-success-50 border-success-200'
                  : 'bg-info-50 border-info-200'
              }`}
            >
              <Icon
                icon={
                  editorStatusInfo.isCompleted
                    ? 'lucide:check-circle'
                    : 'lucide:edit'
                }
                className={`flex-shrink-0 ${
                  editorStatusInfo.isCompleted ? 'text-success' : 'text-info'
                }`}
              />
              <p
                className={`text-xs ${
                  editorStatusInfo.isCompleted
                    ? 'text-success-700'
                    : 'text-info-700'
                }`}
              >
                {editorStatusInfo.isCompleted
                  ? `모듈화된 에디터로 작성 완료! (컨테이너 ${editorStatusInfo.containerCount}개, 단락 ${editorStatusInfo.paragraphCount}개 조합)`
                  : `모듈화된 에디터 사용 중 (컨테이너 ${editorStatusInfo.containerCount}개, 할당된 단락 ${editorStatusInfo.paragraphCount}개)`}
              </p>
            </div>
          )}

          {displayContent.source === 'editor' && (
            <div className="flex items-center gap-2 p-2 mb-4 border border-purple-200 rounded-md bg-purple-50">
              <Icon
                icon="lucide:sparkles"
                className="flex-shrink-0 text-purple-600"
              />
              <p className="text-xs text-purple-700">
                ✨ 현재 모듈화된 에디터 결과가 표시되고 있습니다. (레고 블록식
                조합)
              </p>
            </div>
          )}
          {/*====여기까지 수정됨====*/}

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

          <PreviewContent />

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

                        <MobileContent />
                      </div>
                    </ModalBody>
                  </>
                )}
              </ModalContent>
            </Modal>
          )}

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
