import React from 'react';
import { Button, Card, CardBody } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import UserInfoStep from './multiStepForm/steps/user-info-step';
import BlogBasicStep from './multiStepForm/steps/stepsSections/blog-basic-step';
import BlogContentStep from './multiStepForm/steps/stepsSections/blog-content-step';
import BlogMediaStep from './multiStepForm/steps/blog-media-step';
import ModularBlogEditorContainer from './moduleEditor/ModularBlogEditorContainer';
// import PreviewPanel from './preview-panel';
import PreviewPanel from './previewPanel/PreviewPanelContainer';

import { motion, AnimatePresence } from 'framer-motion';

//====여기부터 수정됨====
// ✅ 수정: 모든 Zustand 스토어들 import
// 이유: Context 완전 제거하고 Zustand로 전환
import { useFormDataStore } from '../store/formData/formDataStore';
import { useToastStore } from '../store/toast/toastStore';
import { useEditorCoreStore } from '../store/editorCore/editorCoreStore';

// ✅ 수정: 공통 타입들 import
// 이유: Context에서 분리된 타입들을 공통 모듈에서 사용
import type { FormValues } from '../store/shared/commonTypes';
//====여기까지 수정됨====

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

  // Step 4 - Modular Editor
  editorCompletedContent: z.string().optional(),
  isEditorCompleted: z.boolean().optional(),

  // Step 5 - Blog Media
  media: z.array(z.string()).optional(),
  mainImage: z.string().nullable().optional(),
  sliderImages: z.array(z.string()).optional(),
});

type FormSchemaValues = z.infer<typeof formSchema>;

function MultiStepForm(): React.ReactNode {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [showPreview, setShowPreview] = React.useState(false);
  const [progressWidth, setProgressWidth] = React.useState(0);

  //====여기부터 수정됨====
  // ✅ 수정: 스토어들 초기화
  // 이유: 필요한 스토어들만 사용
  const formDataStore = useFormDataStore();
  const toastStore = useToastStore();
  const editorCoreStore = useEditorCoreStore();

  // ✅ 해결: formValues를 정적 초기값으로 변경
  // 이유: 무한 루프 방지 - 스토어 호출 제거하고 기본값만 제공
  const initialFormValues = React.useMemo((): FormValues => {
    return {
      userImage: undefined,
      nickname: '',
      emailPrefix: '',
      emailDomain: '',
      bio: undefined,
      title: '',
      description: '',
      tags: undefined,
      content: '',
      media: undefined,
      mainImage: undefined,
      sliderImages: undefined,
      editorContainers: [],
      editorParagraphs: [],
      editorCompletedContent: '',
      isEditorCompleted: false,
    };
  }, []); // 📍 의존성 제거로 무한 루프 방지
  //====여기까지 수정됨====

  const methods = useForm<FormSchemaValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      //====여기부터 수정됨====
      // ✅ 해결: 정적 기본값으로 변경
      // 이유: 동적 formValues 대신 정적값 사용하여 무한 루프 방지
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
      editorCompletedContent: '',
      isEditorCompleted: false,
      //====여기까지 수정됨====
    },
    mode: 'onChange',
  });

  const {
    handleSubmit,
    formState: { errors },
    trigger,
    watch,
    setValue,
  } = methods;

  // 실시간 watch를 통한 form 상태 동기화
  const allWatchedValues = watch();

  //====여기부터 수정됨====
  // ✅ 해결: 조건부 업데이트로 무한 루프 방지
  // 이유: 값이 실제로 변경되었을 때만 스토어 업데이트
  const prevWatchedValuesRef = React.useRef(allWatchedValues);

  React.useEffect(() => {
    const prev = prevWatchedValuesRef.current;
    const current = allWatchedValues;

    // 값이 실제로 변경되었는지 검사
    const hasChanged =
      prev.userImage !== current.userImage ||
      prev.nickname !== current.nickname ||
      prev.emailPrefix !== current.emailPrefix ||
      prev.emailDomain !== current.emailDomain ||
      prev.bio !== current.bio ||
      prev.title !== current.title ||
      prev.description !== current.description ||
      prev.tags !== current.tags ||
      prev.content !== current.content ||
      JSON.stringify(prev.media) !== JSON.stringify(current.media) ||
      prev.mainImage !== current.mainImage ||
      JSON.stringify(prev.sliderImages) !==
        JSON.stringify(current.sliderImages);

    if (hasChanged) {
      formDataStore?.updateFormData?.({
        userImage: current.userImage,
        nickname: current.nickname || '',
        emailPrefix: current.emailPrefix || '',
        emailDomain: current.emailDomain || '',
        bio: current.bio,
        title: current.title || '',
        description: current.description || '',
        tags: current.tags,
        content: current.content || '',
        media: current.media,
        mainImage: current.mainImage,
        sliderImages: current.sliderImages,
      });

      prevWatchedValuesRef.current = current;
    }
  }, [allWatchedValues]); // 📍 formDataStore 의존성 제거

  // ✅ 해결: 에디터 상태 동기화도 조건부로 변경
  // 이유: 무한 루프 방지
  React.useEffect(() => {
    const editorCompletedContent =
      editorCoreStore?.getCompletedContent?.() || '';
    const isEditorCompleted = editorCoreStore?.getIsCompleted?.() || false;

    // 값이 실제로 다를 때만 업데이트
    if (editorCompletedContent !== allWatchedValues.editorCompletedContent) {
      setValue('editorCompletedContent', editorCompletedContent);
    }
    if (isEditorCompleted !== allWatchedValues.isEditorCompleted) {
      setValue('isEditorCompleted', isEditorCompleted);
    }
  }, [
    editorCoreStore?.getCompletedContent?.(),
    editorCoreStore?.getIsCompleted?.(),
    setValue,
  ]); // 📍 allWatchedValues 의존성 제거
  //====여기까지 수정됨====

  React.useEffect(() => {
    const progress = ((currentStep - 1) / 4) * 100;

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
        const isEditorCompleted = editorCoreStore?.getIsCompleted?.() || false;
        const editorContent = editorCoreStore?.getCompletedContent?.() || '';

        if (!isEditorCompleted || !editorContent.trim()) {
          toastStore?.addToast?.({
            title: '에디터 작성 미완료',
            description: '모듈화된 에디터에서 글 작성을 완료해주세요.',
            color: 'warning',
          });
          return false;
        }
        return true;
      case 5:
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
        toastStore?.addToast?.({
          title: '유효성 검사 실패',
          description: errorMessages[0] as string,
          color: 'danger',
        });
      }
    }

    return isValid;
  }, [currentStep, trigger, errors, toastStore, editorCoreStore]);

  const goToNextStep = React.useCallback(async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < 5) {
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
      toastStore?.addToast?.({
        title: '폼 제출 성공',
        description: '블로그 포스트가 성공적으로 생성되었습니다.',
        color: 'success',
      });
    },
    [toastStore]
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
        return <ModularBlogEditorContainer />;
      case 5:
        return <BlogMediaStep />;
      default:
        return null;
    }
  }, [currentStep]);

  return (
    <div className="p-2 mx-auto max-w-[1200px] sm:p-4 md:p-8">
      <div className="flex flex-col items-start justify-between gap-3 mb-6 sm:flex-row sm:items-center sm:gap-0">
        <h1 className="text-xl font-bold sm:text-2xl">새 블로그 포스트 작성</h1>
        <div className="flex items-center w-full gap-2 sm:w-auto">
          <span className="hidden text-xs sm:text-sm text-default-500 sm:inline">
            작성 날짜: {new Date().toISOString().split('T')[0]}
          </span>
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
              {/* Step Navigation */}
              <div className="mb-8">
                <div className="relative justify-between hidden mb-2 sm:flex">
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
                    4. 모듈화 에디터
                  </Button>

                  <Button
                    variant={currentStep === 5 ? 'solid' : 'flat'}
                    color={currentStep === 5 ? 'primary' : 'default'}
                    onPress={() => goToStep(5)}
                    className="z-10"
                    type="button"
                  >
                    5. 블로그 미디어
                  </Button>
                </div>

                {/* Mobile Navigation */}
                <div className="flex justify-between pb-2 mb-3 overflow-x-auto sm:hidden hide-scrollbar">
                  {[1, 2, 3, 4, 5].map((step) => (
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

                {/* Current step indicator */}
                <div className="flex px-1 mb-2 sm:hidden">
                  <p className="text-sm font-medium">
                    {currentStep === 1 && '유저 정보 입력'}
                    {currentStep === 2 && '블로그 기본 정보'}
                    {currentStep === 3 && '블로그 컨텐츠'}
                    {currentStep === 4 && '모듈화 에디터'}
                    {currentStep === 5 && '블로그 미디어'}
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

                {currentStep < 5 ? (
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
                      <Icon icon="lucide:check" className="hidden sm:inline" />
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
  );
}

export default MultiStepForm;
