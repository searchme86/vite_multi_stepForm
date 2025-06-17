import { FormValues } from '../../components/multiStepForm/types/formTypes';
import { StepNumber } from '../../components/multiStepForm/types/stepTypes';

export const validateFormValues = (formValues: FormValues): boolean => {
  console.log('🔍 [FORM_UTILS] 폼 값 검증 시작');

  if (!formValues || typeof formValues !== 'object') {
    console.error('❌ [FORM_UTILS] 폼 값이 유효하지 않은 객체');
    return false;
  }

  const {
    userImage,
    nickname,
    emailPrefix,
    emailDomain,
    bio,
    title,
    description,
    tags,
    content,
    media,
    mainImage,
    sliderImages,
    editorCompletedContent,
    isEditorCompleted,
  } = formValues;

  const requiredStringFields = [
    { field: 'nickname', value: nickname },
    { field: 'emailPrefix', value: emailPrefix },
    { field: 'emailDomain', value: emailDomain },
    { field: 'title', value: title },
    { field: 'description', value: description },
    { field: 'content', value: content },
  ];

  const missingRequiredFields = requiredStringFields.filter(
    ({ field, value }) => {
      const isValid = typeof value === 'string' && value.trim().length > 0;
      if (!isValid) {
        console.error(`❌ [FORM_UTILS] 필수 필드 '${field}'가 유효하지 않음`);
      }
      return !isValid;
    }
  );

  const optionalStringFields = [
    { field: 'userImage', value: userImage },
    { field: 'bio', value: bio },
    { field: 'tags', value: tags },
    { field: 'editorCompletedContent', value: editorCompletedContent },
  ];

  const invalidOptionalFields = optionalStringFields.filter(
    ({ field, value }) => {
      if (value !== undefined && value !== null && value !== '') {
        const isValidString = typeof value === 'string';
        if (!isValidString) {
          console.error(`❌ [FORM_UTILS] 선택 필드 '${field}'가 유효하지 않음`);
        }
        return !isValidString;
      }
      return false;
    }
  );

  const arrayFields = [
    { field: 'media', value: media },
    { field: 'sliderImages', value: sliderImages },
  ];

  const invalidArrayFields = arrayFields.filter(({ field, value }) => {
    if (value !== undefined && value !== null) {
      const isValidArray =
        Array.isArray(value) && value.every((item) => typeof item === 'string');
      if (!isValidArray) {
        console.error(`❌ [FORM_UTILS] 배열 필드 '${field}'가 유효하지 않음`);
      }
      return !isValidArray;
    }
    return false;
  });

  if (
    mainImage !== undefined &&
    mainImage !== null &&
    typeof mainImage !== 'string'
  ) {
    console.error('❌ [FORM_UTILS] mainImage 필드가 유효하지 않음');
    invalidOptionalFields.push({ field: 'mainImage', value: mainImage });
  }

  if (typeof isEditorCompleted !== 'boolean') {
    console.error('❌ [FORM_UTILS] isEditorCompleted 필드가 유효하지 않음');
    invalidOptionalFields.push({
      field: 'isEditorCompleted',
      value: isEditorCompleted,
    });
  }

  const isValidForm =
    missingRequiredFields.length === 0 &&
    invalidOptionalFields.length === 0 &&
    invalidArrayFields.length === 0;

  console.log('📊 [FORM_UTILS] 폼 검증 결과:', {
    isValidForm,
    missingRequiredFields: missingRequiredFields.length,
    invalidOptionalFields: invalidOptionalFields.length,
    invalidArrayFields: invalidArrayFields.length,
  });

  return isValidForm;
};

export const sanitizeFormValues = (formValues: FormValues): FormValues => {
  console.log('🧹 [FORM_UTILS] 폼 값 정제 시작');

  if (!formValues || typeof formValues !== 'object') {
    console.warn('⚠️ [FORM_UTILS] 유효하지 않은 폼 값, 기본값 반환');
    return createEmptyFormValues();
  }

  const {
    userImage = '',
    nickname = '',
    emailPrefix = '',
    emailDomain = '',
    bio = '',
    title = '',
    description = '',
    tags = '',
    content = '',
    media = [],
    mainImage = null,
    sliderImages = [],
    editorCompletedContent = '',
    isEditorCompleted = false,
  } = formValues;

  const sanitizedFormValues: FormValues = {
    userImage: typeof userImage === 'string' ? userImage.trim() : '',
    nickname: typeof nickname === 'string' ? nickname.trim() : '',
    emailPrefix: typeof emailPrefix === 'string' ? emailPrefix.trim() : '',
    emailDomain: typeof emailDomain === 'string' ? emailDomain.trim() : '',
    bio: typeof bio === 'string' ? bio.trim() : '',
    title: typeof title === 'string' ? title.trim() : '',
    description: typeof description === 'string' ? description.trim() : '',
    tags: typeof tags === 'string' ? tags.trim() : '',
    content: typeof content === 'string' ? content.trim() : '',
    media: Array.isArray(media)
      ? media.filter(
          (item) => typeof item === 'string' && item.trim().length > 0
        )
      : [],
    mainImage:
      typeof mainImage === 'string' && mainImage.trim().length > 0
        ? mainImage.trim()
        : null,
    sliderImages: Array.isArray(sliderImages)
      ? sliderImages.filter(
          (item) => typeof item === 'string' && item.trim().length > 0
        )
      : [],
    editorCompletedContent:
      typeof editorCompletedContent === 'string'
        ? editorCompletedContent.trim()
        : '',
    isEditorCompleted: Boolean(isEditorCompleted),
  };

  console.log('✅ [FORM_UTILS] 폼 값 정제 완료');
  return sanitizedFormValues;
};

export const createEmptyFormValues = (): FormValues => {
  console.log('🔄 [FORM_UTILS] 빈 폼 값 생성');

  const emptyFormValues: FormValues = {
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
  };

  console.log('✅ [FORM_UTILS] 빈 폼 값 생성 완료');
  return emptyFormValues;
};

export const calculateFormCompletionPercentage = (
  formValues: FormValues
): number => {
  console.log('📊 [FORM_UTILS] 폼 완성률 계산 시작');

  if (!formValues || typeof formValues !== 'object') {
    console.error('❌ [FORM_UTILS] 유효하지 않은 폼 값으로 완성률 0% 반환');
    return 0;
  }

  const {
    userImage,
    nickname,
    emailPrefix,
    emailDomain,
    bio,
    title,
    description,
    tags,
    content,
    media,
    mainImage,
    sliderImages,
    editorCompletedContent,
    isEditorCompleted,
  } = formValues;

  const requiredFields = [
    { field: 'nickname', value: nickname, weight: 15 },
    { field: 'emailPrefix', value: emailPrefix, weight: 15 },
    { field: 'emailDomain', value: emailDomain, weight: 15 },
    { field: 'title', value: title, weight: 15 },
    { field: 'description', value: description, weight: 15 },
    { field: 'content', value: content, weight: 15 },
  ];

  const optionalFields = [
    { field: 'userImage', value: userImage, weight: 5 },
    { field: 'bio', value: bio, weight: 5 },
    { field: 'tags', value: tags, weight: 5 },
    {
      field: 'editorCompletedContent',
      value: editorCompletedContent,
      weight: 5,
    },
  ];

  const booleanFields = [
    { field: 'isEditorCompleted', value: isEditorCompleted, weight: 5 },
  ];

  const arrayFields = [
    { field: 'media', value: media, weight: 2.5 },
    { field: 'sliderImages', value: sliderImages, weight: 2.5 },
  ];

  let completedWeight = 0;
  let totalWeight = 0;

  requiredFields.forEach(({ field, value, weight }) => {
    totalWeight += weight;
    if (typeof value === 'string' && value.trim().length > 0) {
      completedWeight += weight;
      console.log(`✅ [FORM_UTILS] 필수 필드 '${field}' 완료 (${weight}%)`);
    } else {
      console.log(`❌ [FORM_UTILS] 필수 필드 '${field}' 미완료`);
    }
  });

  optionalFields.forEach(({ field, value, weight }) => {
    totalWeight += weight;
    if (typeof value === 'string' && value.trim().length > 0) {
      completedWeight += weight;
      console.log(`✅ [FORM_UTILS] 선택 필드 '${field}' 완료 (${weight}%)`);
    }
  });

  booleanFields.forEach(({ field, value, weight }) => {
    totalWeight += weight;
    if (Boolean(value)) {
      completedWeight += weight;
      console.log(`✅ [FORM_UTILS] 불린 필드 '${field}' 완료 (${weight}%)`);
    }
  });

  arrayFields.forEach(({ field, value, weight }) => {
    totalWeight += weight;
    if (Array.isArray(value) && value.length > 0) {
      completedWeight += weight;
      console.log(`✅ [FORM_UTILS] 배열 필드 '${field}' 완료 (${weight}%)`);
    }
  });

  if (
    mainImage &&
    typeof mainImage === 'string' &&
    mainImage.trim().length > 0
  ) {
    completedWeight += 5;
    console.log('✅ [FORM_UTILS] mainImage 필드 완료 (5%)');
  }
  totalWeight += 5;

  const completionPercentage =
    totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;

  console.log('📊 [FORM_UTILS] 폼 완성률 계산 완료:', {
    completedWeight,
    totalWeight,
    completionPercentage: `${completionPercentage}%`,
  });

  return completionPercentage;
};

export const validateStepNumber = (
  stepNumber: unknown
): stepNumber is StepNumber => {
  console.log('🔍 [FORM_UTILS] 스텝 번호 검증 시작:', stepNumber);

  if (typeof stepNumber !== 'number') {
    console.error('❌ [FORM_UTILS] 스텝 번호가 숫자가 아님');
    return false;
  }

  if (!Number.isInteger(stepNumber)) {
    console.error('❌ [FORM_UTILS] 스텝 번호가 정수가 아님');
    return false;
  }

  if (stepNumber < 1 || stepNumber > 5) {
    console.error('❌ [FORM_UTILS] 스텝 번호가 유효 범위(1-5)를 벗어남');
    return false;
  }

  console.log('✅ [FORM_UTILS] 스텝 번호 검증 통과');
  return true;
};

export const calculateStepProgress = (
  currentStep: StepNumber,
  totalSteps: number = 5
): number => {
  console.log('📊 [FORM_UTILS] 스텝 진행률 계산 시작');

  if (!validateStepNumber(currentStep)) {
    console.error('❌ [FORM_UTILS] 유효하지 않은 현재 스텝, 0% 반환');
    return 0;
  }

  if (typeof totalSteps !== 'number' || totalSteps <= 0) {
    console.error('❌ [FORM_UTILS] 유효하지 않은 총 스텝 수, 0% 반환');
    return 0;
  }

  const progressPercentage = Math.round(
    ((currentStep - 1) / (totalSteps - 1)) * 100
  );
  const clampedProgress = Math.max(0, Math.min(100, progressPercentage));

  console.log('📊 [FORM_UTILS] 스텝 진행률 계산 완료:', {
    currentStep,
    totalSteps,
    progressPercentage: `${clampedProgress}%`,
  });

  return clampedProgress;
};

export const extractEditorDataFromForm = (formValues: FormValues) => {
  console.log('🔍 [FORM_UTILS] 폼에서 에디터 데이터 추출 시작');

  if (!formValues || typeof formValues !== 'object') {
    console.error('❌ [FORM_UTILS] 유효하지 않은 폼 값');
    return {
      editorCompletedContent: '',
      isEditorCompleted: false,
    };
  }

  const { editorCompletedContent = '', isEditorCompleted = false } = formValues;

  const extractedEditorData = {
    editorCompletedContent:
      typeof editorCompletedContent === 'string' ? editorCompletedContent : '',
    isEditorCompleted: Boolean(isEditorCompleted),
  };

  console.log('✅ [FORM_UTILS] 에디터 데이터 추출 완료:', {
    contentLength: extractedEditorData.editorCompletedContent.length,
    isCompleted: extractedEditorData.isEditorCompleted,
  });

  return extractedEditorData;
};
