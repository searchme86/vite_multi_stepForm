import React from 'react';
import { Button, Card, CardBody } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import StepNavigation from './step-navigation';
import UserInfoStep from './user-info-step';
import BlogBasicStep from './blog-basic-step';
import BlogContentStep from './blog-content-step';
import BlogMediaStep from './blog-media-step';
import PreviewPanel from './preview-panel';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MultiStepFormContext,
  FormValues,
  ImageViewConfig,
  CustomGalleryView,
  createDefaultImageViewConfig,
} from './useMultiStepForm';

// Form validation schema
const formSchema = z.object({
  // Step 1 - User Info
  userImage: z.string().optional(),
  nickname: z.string().min(4, '닉네임은 최소 4자 이상이어야 합니다.'),
  emailPrefix: z.string().min(1, '이메일을 입력해주세요.'),
  emailDomain: z.string().min(1, '이메일 도메인을 입력해주세요.'),
  bio: z.string().optional(),

  // Step 2 - Blog Basic
  title: z
    .string()
    .min(5, '제목은 5자 이상 100자 이하로 작성해주세요.')
    .max(100, '제목은 5자 이상 100자 이하로 작성해주세요.'),
  description: z.string().min(10, '요약은 10자 이상 작성해주세요.'),

  // Step 3 - Blog Content
  tags: z.string().optional(),
  content: z.string().min(5, '블로그 내용이 최소 5자 이상이어야 합니다.'),

  // Step 4 - Blog Media
  media: z.array(z.string()).optional(),
  mainImage: z.string().nullable().optional(),
  sliderImages: z.array(z.string()).optional(),
});

type FormSchemaValues = z.infer<typeof formSchema>;

interface ToastOptions {
  title: string;
  description: string;
  color: 'success' | 'danger' | 'warning' | 'primary';
  hideCloseButton?: boolean;
}

function MultiStepForm(): React.ReactNode {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [showPreview, setShowPreview] = React.useState(false);
  const [progressWidth, setProgressWidth] = React.useState(0);

  // PreviewPanel 상태 관리
  const [isPreviewPanelOpen, setIsPreviewPanelOpen] = React.useState(false);

  // ImageViewConfig 상태 관리
  const [imageViewConfig, setImageViewConfig] = React.useState<ImageViewConfig>(
    createDefaultImageViewConfig()
  );

  // CustomGalleryView 상태 관리
  const [customGalleryViews, setCustomGalleryViews] = React.useState<
    CustomGalleryView[]
  >([]);

  // 모바일 사이즈 감지
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // PreviewPanel 토글 함수
  const togglePreviewPanel = React.useCallback(() => {
    setIsPreviewPanelOpen((prev) => !prev);
  }, []);

  // CustomGalleryView 관련 함수들
  const addCustomGalleryView = React.useCallback((view: CustomGalleryView) => {
    setCustomGalleryViews((prev) => {
      const existingIndex = prev.findIndex(
        (existing) => existing.id === view.id
      );
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = view;
        return updated;
      }
      return [view, ...prev];
    });
  }, []);

  const removeCustomGalleryView = React.useCallback((id: string) => {
    setCustomGalleryViews((prev) => prev.filter((view) => view.id !== id));
  }, []);

  const clearCustomGalleryViews = React.useCallback(() => {
    setCustomGalleryViews([]);
  }, []);

  const updateCustomGalleryView = React.useCallback(
    (id: string, updates: Partial<CustomGalleryView>) => {
      setCustomGalleryViews((prev) =>
        prev.map((view) => (view.id === id ? { ...view, ...updates } : view))
      );
    },
    []
  );

  const methods = useForm<FormSchemaValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userImage: '',
      nickname: '',
      emailPrefix: '',
      emailDomain: '',
      bio: '',
      title: '',
      description: '',
      tags: '',
      content: '',
      media: [],
      mainImage: null,
      sliderImages: [],
    },
    mode: 'onChange',
  });

  const {
    handleSubmit,
    formState: { errors },
    trigger,
    watch,
  } = methods;

  //====핵심 수정====
  // ✅ 수정: 실시간 watch를 통한 formValues 생성
  // 이유: 모든 form 값 변경을 실시간으로 감지하여 Context에 전달
  const allWatchedValues = watch(); // 모든 값을 한번에 watch

  const formValues = React.useMemo(() => {
    console.log('🔄 MultiStepForm formValues 업데이트:', {
      sliderImagesLength: allWatchedValues.sliderImages?.length || 0,
      sliderImagesFirst:
        allWatchedValues.sliderImages?.[0]?.slice(0, 30) + '...' || 'none',
      timestamp: new Date().toLocaleTimeString(),
    }); // 디버깅용

    return {
      userImage: allWatchedValues.userImage || '',
      nickname: allWatchedValues.nickname || '',
      emailPrefix: allWatchedValues.emailPrefix || '',
      emailDomain: allWatchedValues.emailDomain || '',
      bio: allWatchedValues.bio || '',
      title: allWatchedValues.title || '',
      description: allWatchedValues.description || '',
      tags: allWatchedValues.tags || '',
      content: allWatchedValues.content || '',
      media: Array.isArray(allWatchedValues.media)
        ? allWatchedValues.media
        : [],
      mainImage: allWatchedValues.mainImage || null,
      sliderImages: Array.isArray(allWatchedValues.sliderImages)
        ? allWatchedValues.sliderImages
        : [],
    } as FormValues;
  }, [allWatchedValues]); // 실제 값들을 dependency로 사용
  //====핵심 수정 끝====

  const addToast = React.useCallback((options: ToastOptions) => {
    console.log('Toast:', options);

    if (typeof window !== 'undefined') {
      const toastElement = document.createElement('div');
      toastElement.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
        options.color === 'success'
          ? 'bg-green-500 text-white'
          : options.color === 'danger'
          ? 'bg-red-500 text-white'
          : options.color === 'warning'
          ? 'bg-yellow-500 text-black'
          : 'bg-blue-500 text-white'
      }`;

      toastElement.innerHTML = `
        <div class="font-semibold">${options.title}</div>
        <div class="text-sm">${options.description}</div>
      `;

      document.body.appendChild(toastElement);

      setTimeout(() => {
        if (document.body.contains(toastElement)) {
          document.body.removeChild(toastElement);
        }
      }, 3000);
    }
  }, []);

  // Context value에 모든 정의된 함수와 상태 추가
  const contextValue = React.useMemo(
    () => ({
      addToast,
      formValues,
      isPreviewPanelOpen,
      setIsPreviewPanelOpen,
      togglePreviewPanel,
      imageViewConfig,
      setImageViewConfig,
      customGalleryViews,
      addCustomGalleryView,
      removeCustomGalleryView,
      clearCustomGalleryViews,
      updateCustomGalleryView,
    }),
    [
      addToast,
      formValues, // 이제 실시간으로 업데이트됨
      isPreviewPanelOpen,
      setIsPreviewPanelOpen,
      togglePreviewPanel,
      imageViewConfig,
      setImageViewConfig,
      customGalleryViews,
      addCustomGalleryView,
      removeCustomGalleryView,
      clearCustomGalleryViews,
      updateCustomGalleryView,
    ]
  );

  React.useEffect(() => {
    // Calculate progress based on current step
    const progress = ((currentStep - 1) / 3) * 100;

    // Animate progress width
    const timer = setTimeout(() => {
      setProgressWidth(progress);
    }, 100);

    return () => clearTimeout(timer);
  }, [currentStep]);

  const togglePreview = React.useCallback(() => {
    setShowPreview((prev) => !prev);
  }, []);

  const validateCurrentStep = React.useCallback(async () => {
    let fieldsToValidate: (keyof FormSchemaValues)[] = [];

    switch (currentStep) {
      case 1:
        fieldsToValidate = ['nickname', 'emailPrefix', 'emailDomain'];
        break;
      case 2:
        fieldsToValidate = ['title', 'description'];
        break;
      case 3:
        fieldsToValidate = ['content'];
        break;
      case 4:
        // No required fields in media step
        return true;
    }

    const isValid = await trigger(fieldsToValidate);

    if (!isValid) {
      const errorMessages = Object.entries(errors)
        .filter(([key]) =>
          fieldsToValidate.includes(key as keyof FormSchemaValues)
        )
        .map(([_, value]) => value.message);

      if (errorMessages.length > 0) {
        addToast({
          title: '유효성 검사 실패',
          description: errorMessages[0] as string,
          color: 'danger',
        });
      }
    }

    return isValid;
  }, [currentStep, trigger, errors, addToast]);

  const goToNextStep = React.useCallback(async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [validateCurrentStep, currentStep]);

  const goToPrevStep = React.useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const goToStep = React.useCallback(
    async (step: number) => {
      // Validate current step before allowing navigation
      if (step > currentStep) {
        const isValid = await validateCurrentStep();
        if (!isValid) return;
      }

      setCurrentStep(step);
    },
    [currentStep, validateCurrentStep]
  );

  const onSubmit = React.useCallback(
    (data: FormSchemaValues) => {
      console.log('Form submitted:', data);
      addToast({
        title: '폼 제출 성공',
        description: '블로그 포스트가 성공적으로 생성되었습니다.',
        color: 'success',
      });
    },
    [addToast]
  );

  const renderCurrentStep = React.useCallback(() => {
    switch (currentStep) {
      case 1:
        return <UserInfoStep />;
      case 2:
        return <BlogBasicStep />;
      case 3:
        return <BlogContentStep />;
      case 4:
        return <BlogMediaStep />;
      default:
        return null;
    }
  }, [currentStep]);

  return (
    <MultiStepFormContext.Provider value={contextValue}>
      <div className="p-2 mx-auto max-w-7xl sm:p-4 md:p-8">
        <div className="flex flex-col items-start justify-between gap-3 mb-6 sm:flex-row sm:items-center sm:gap-0">
          <h1 className="text-xl font-bold sm:text-2xl">
            새 블로그 포스트 작성
          </h1>
          <div className="flex items-center w-full gap-2 sm:w-auto">
            <span className="hidden text-xs sm:text-sm text-default-500 sm:inline">
              작성 날짜: {new Date().toISOString().split('T')[0]}
            </span>
            {/* 데스크탑에서만 미리보기 토글 버튼 표시 */}
            <div className="hidden md:block">
              <Button
                color="primary"
                variant="flat"
                size="sm"
                fullWidth
                startContent={
                  <Icon icon={showPreview ? 'lucide:eye-off' : 'lucide:eye'} />
                }
                onPress={togglePreview}
                className="whitespace-nowrap"
                type="button"
              >
                {showPreview ? '미리보기 숨기기' : '미리보기 보기'}
              </Button>
            </div>
          </div>
        </div>

        <div
          className={`flex flex-col ${
            showPreview ? 'lg:flex-row' : ''
          } transition-all duration-500 ease ${showPreview ? 'gap-4' : ''}`}
        >
          <div
            className={`transition-all duration-500 ease ${
              showPreview ? 'lg:w-1/2' : 'w-full'
            } overflow-y-auto mb-4 lg:mb-0`}
          >
            <FormProvider {...methods}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Step Navigation - Mobile responsive */}
                <div className="mb-8">
                  <div className="relative justify-between hidden mb-2 sm:flex">
                    {/* Add a background line connecting all buttons - Desktop */}
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-default-200 -translate-y-1/2 z-0"></div>

                    <Button
                      variant={currentStep === 1 ? 'solid' : 'flat'}
                      color={currentStep === 1 ? 'primary' : 'default'}
                      onPress={() => goToStep(1)}
                      className="z-10"
                      type="button"
                    >
                      1. 유저 정보 입력
                    </Button>

                    <Button
                      variant={currentStep === 2 ? 'solid' : 'flat'}
                      color={currentStep === 2 ? 'primary' : 'default'}
                      onPress={() => goToStep(2)}
                      className="z-10"
                      type="button"
                    >
                      2. 블로그 기본 정보
                    </Button>

                    <Button
                      variant={currentStep === 3 ? 'solid' : 'flat'}
                      color={currentStep === 3 ? 'primary' : 'default'}
                      onPress={() => goToStep(3)}
                      className="z-10"
                      type="button"
                    >
                      3. 블로그 컨텐츠
                    </Button>

                    <Button
                      variant={currentStep === 4 ? 'solid' : 'flat'}
                      color={currentStep === 4 ? 'primary' : 'default'}
                      onPress={() => goToStep(4)}
                      className="z-10"
                      type="button"
                    >
                      4. 블로그 미디어
                    </Button>
                  </div>

                  {/* Mobile Navigation - Simplified */}
                  <div className="flex justify-between pb-2 mb-3 overflow-x-auto sm:hidden hide-scrollbar">
                    {[1, 2, 3, 4].map((step) => (
                      <Button
                        key={step}
                        variant={currentStep === step ? 'solid' : 'light'}
                        color={currentStep === step ? 'primary' : 'default'}
                        onPress={() => goToStep(step)}
                        className="flex-shrink-0 mr-2"
                        size="sm"
                        type="button"
                      >
                        {step}
                      </Button>
                    ))}
                  </div>

                  {/* Current step indicator - Mobile friendly */}
                  <div className="flex px-1 mb-2 sm:hidden">
                    <p className="text-sm font-medium">
                      {currentStep === 1 && '유저 정보 입력'}
                      {currentStep === 2 && '블로그 기본 정보'}
                      {currentStep === 3 && '블로그 컨텐츠'}
                      {currentStep === 4 && '블로그 미디어'}
                    </p>
                  </div>

                  {/* Progress bar */}
                  <div className="relative h-1 sm:h-0.5 bg-default-200 rounded-full">
                    <div
                      className="absolute h-1 sm:h-0.5 bg-primary rounded-full transition-all duration-700 ease-in-out"
                      style={{ width: `${progressWidth}%` }}
                    />
                  </div>
                </div>

                {/* Step Content with Animation */}
                <Card className="overflow-hidden shadow-sm">
                  <CardBody className="p-3 sm:p-6">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentStep}
                        initial={{ x: 100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -100, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {renderCurrentStep()}
                      </motion.div>
                    </AnimatePresence>
                  </CardBody>
                </Card>

                <div className="flex justify-between">
                  <Button
                    variant="flat"
                    color="default"
                    onPress={goToPrevStep}
                    isDisabled={currentStep === 1}
                    startContent={
                      <Icon
                        icon="lucide:arrow-left"
                        className="hidden sm:inline"
                      />
                    }
                    className="px-3 sm:px-4"
                    type="button"
                  >
                    <span className="hidden sm:inline">이전</span>
                    <span className="inline sm:hidden">이전</span>
                  </Button>

                  {currentStep < 4 ? (
                    <Button
                      color="primary"
                      onPress={goToNextStep}
                      endContent={
                        <Icon
                          icon="lucide:arrow-right"
                          className="hidden sm:inline"
                        />
                      }
                      className="px-3 sm:px-4"
                      type="button"
                    >
                      <span className="hidden sm:inline">다음</span>
                      <span className="inline sm:hidden">다음</span>
                    </Button>
                  ) : (
                    <Button
                      color="primary"
                      type="submit"
                      endContent={
                        <Icon
                          icon="lucide:check"
                          className="hidden sm:inline"
                        />
                      }
                      className="px-3 sm:px-4"
                    >
                      <span className="hidden sm:inline">제출하기</span>
                      <span className="inline sm:hidden">제출</span>
                    </Button>
                  )}
                </div>
              </form>
            </FormProvider>
          </div>

          {/* 데스크탑에서만 미리보기 패널 표시 */}
          {showPreview && (
            <div className="hidden md:block w-full lg:w-1/2 h-[500px] lg:h-screen lg:sticky lg:top-0 overflow-y-auto">
              <Card className="h-full shadow-sm">
                <CardBody className="p-3 sm:p-6">
                  <PreviewPanel />
                </CardBody>
              </Card>
            </div>
          )}
        </div>

        {/* 모바일에서는 항상 PreviewPanel을 bottom-sheet 형태로 렌더링 */}
        <div className="md:hidden">
          <PreviewPanel />
        </div>
      </div>
    </MultiStepFormContext.Provider>
  );
}

export default MultiStepForm;
