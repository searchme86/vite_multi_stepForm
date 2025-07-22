// 📁 store/shared/commonTypes.ts

// ✅ 기존 타입들 유지 (의존성 있음)
export interface Container {
  id: string;
  name: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ParagraphBlock {
  id: string;
  content: string;
  containerId: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  originalId?: string;
}

export interface EditorState {
  containers: Container[];
  paragraphs: ParagraphBlock[];
  completedContent: string;
  isCompleted: boolean;
}

// 🔄 기존 ImageViewConfig 유지 (하위 호환성)
export interface ImageViewConfig {
  clickOrder: number[];
  selectedImages: string[];
  layout: {
    columns: number;
    gridType: 'grid' | 'masonry';
  };
  filter: 'all' | 'available';
}

export interface CustomGalleryView {
  id: string;
  name: string;
  selectedImages: string[];
  clickOrder: number[];
  layout: {
    columns: number;
    gridType: 'grid' | 'masonry';
  };
  createdAt: Date;
}

export interface ToastOptions {
  title: string;
  description: string;
  color: 'success' | 'danger' | 'warning' | 'primary';
  hideCloseButton?: boolean;
}

export interface ToastItem extends ToastOptions {
  id: string;
  createdAt: Date;
}

// 🔧 **통합된 단일 FormValues 인터페이스** (4개 타입을 1개로 통일)
export interface FormValues {
  // 사용자 정보 필드들
  userImage?: string;
  nickname: string;
  emailPrefix: string;
  emailDomain: string;
  bio?: string;

  // 블로그 기본 정보 필드들
  title: string;
  description: string;
  tags?: string;
  content: string;

  // 미디어 관련 필드들
  media?: string[];
  mainImage?: string | null;
  sliderImages?: string[];

  // 에디터 관련 필드들 (Bridge 호환성을 위해 포함)
  editorContainers?: Container[];
  editorParagraphs?: ParagraphBlock[];
  editorCompletedContent?: string;
  isEditorCompleted?: boolean;

  // 🔧 동적 인덱스 시그니처 (MultiStep Store 호환성)
  [key: string]:
    | string
    | string[]
    | boolean
    | null
    | undefined
    | Container[]
    | ParagraphBlock[];
}

// 🆕 **하위 호환성을 위한 타입들** (기존 코드에서 사용 중)
export interface CompatibleFormData {
  userImage?: string;
  nickname?: string;
  emailPrefix?: string;
  emailDomain?: string;
  bio?: string;
  title?: string;
  description?: string;
  tags?: string;
  content?: string;
  mainImage?: string | null;
  media?: string[];
  sliderImages?: string[];
  editorCompletedContent?: string;
  isEditorCompleted?: boolean;
  // 인덱스 시그니처 추가 - 동적 키 접근 허용
  [key: string]: string | string[] | boolean | null | undefined;
}

// 🆕 **Bridge 전용 FormValues** (기존 Bridge 시스템 호환성)
export interface BridgeFormValues {
  userImage?: string;
  nickname: string;
  emailPrefix: string;
  emailDomain: string;
  bio?: string;
  title: string;
  description: string;
  tags?: string;
  content: string;
  media?: string[];
  mainImage?: string | null;
  sliderImages?: string[];
  editorCompletedContent?: string;
  isEditorCompleted?: boolean;
}

// 🔧 안전한 타입 검증 함수들
export const createFormValuesTypeGuards = () => {
  console.log('🔧 [TYPE_GUARDS] FormValues 타입 가드 생성');

  const isValidStringValue = (value: unknown): value is string => {
    const isStringType = typeof value === 'string';
    return isStringType;
  };

  const isValidBooleanValue = (value: unknown): value is boolean => {
    const isBooleanType = typeof value === 'boolean';
    return isBooleanType;
  };

  const isValidStringArrayValue = (value: unknown): value is string[] => {
    const isArrayType = Array.isArray(value);
    if (!isArrayType) {
      return false;
    }

    const allItemsAreStrings = value.every((item: unknown): item is string => {
      const isStringItem = typeof item === 'string';
      return isStringItem;
    });

    return allItemsAreStrings;
  };

  const isValidStringOrNull = (value: unknown): value is string | null => {
    const isNullValue = value === null;
    const isStringValue = typeof value === 'string';
    return isNullValue || isStringValue;
  };

  const isValidContainerArray = (value: unknown): value is Container[] => {
    const isArrayType = Array.isArray(value);
    if (!isArrayType) {
      return false;
    }

    const allItemsAreContainers = value.every(
      (item: unknown): item is Container => {
        const isObjectType = item !== null && typeof item === 'object';
        if (!isObjectType) {
          return false;
        }

        const containerCandidate = item;
        const hasRequiredProperties =
          'id' in containerCandidate &&
          'name' in containerCandidate &&
          'order' in containerCandidate;

        return hasRequiredProperties;
      }
    );

    return allItemsAreContainers;
  };

  const isValidParagraphArray = (value: unknown): value is ParagraphBlock[] => {
    const isArrayType = Array.isArray(value);
    if (!isArrayType) {
      return false;
    }

    const allItemsAreParagraphs = value.every(
      (item: unknown): item is ParagraphBlock => {
        const isObjectType = item !== null && typeof item === 'object';
        if (!isObjectType) {
          return false;
        }

        const paragraphCandidate = item;
        const hasRequiredProperties =
          'id' in paragraphCandidate &&
          'content' in paragraphCandidate &&
          'order' in paragraphCandidate;

        return hasRequiredProperties;
      }
    );

    return allItemsAreParagraphs;
  };

  console.log('✅ [TYPE_GUARDS] FormValues 타입 가드 생성 완료');

  return {
    isValidStringValue,
    isValidBooleanValue,
    isValidStringArrayValue,
    isValidStringOrNull,
    isValidContainerArray,
    isValidParagraphArray,
  };
};

// 🔧 FormValues 전체 검증 함수
export const isValidFormValues = (
  candidate: unknown
): candidate is FormValues => {
  console.log('🔍 [TYPE_GUARD] FormValues 타입 검증 시작');

  const isObjectType = candidate !== null && typeof candidate === 'object';
  if (!isObjectType) {
    console.log('❌ [TYPE_GUARD] FormValues 후보가 객체가 아님');
    return false;
  }

  const formValuesCandidate = candidate;

  // 필수 필드들 검증
  const requiredFields = new Map<string, string>([
    ['nickname', 'string'],
    ['emailPrefix', 'string'],
    ['emailDomain', 'string'],
    ['title', 'string'],
    ['description', 'string'],
    ['content', 'string'],
  ]);

  let hasAllRequiredFields = true;

  for (const [fieldName, expectedType] of requiredFields) {
    const hasField = fieldName in formValuesCandidate;
    if (!hasField) {
      console.log(`❌ [TYPE_GUARD] 필수 필드 누락: ${fieldName}`);
      hasAllRequiredFields = false;
      break;
    }

    const fieldValue = Reflect.get(formValuesCandidate, fieldName);
    const hasCorrectType = typeof fieldValue === expectedType;
    if (!hasCorrectType) {
      console.log(
        `❌ [TYPE_GUARD] 필드 타입 불일치: ${fieldName} (기대: ${expectedType}, 실제: ${typeof fieldValue})`
      );
      hasAllRequiredFields = false;
      break;
    }
  }

  console.log(
    `${
      hasAllRequiredFields ? '✅' : '❌'
    } [TYPE_GUARD] FormValues 검증 완료: ${hasAllRequiredFields}`
  );
  return hasAllRequiredFields;
};

// 🆕 **CompatibleFormData 타입 가드** (하위 호환성)
export const isValidCompatibleFormData = (
  candidate: unknown
): candidate is CompatibleFormData => {
  console.log('🔍 [TYPE_GUARD] CompatibleFormData 타입 검증 시작');

  const isObjectType = candidate !== null && typeof candidate === 'object';
  if (!isObjectType) {
    console.log('❌ [TYPE_GUARD] CompatibleFormData 후보가 객체가 아님');
    return false;
  }

  // CompatibleFormData는 모든 필드가 선택적이므로 기본 구조만 확인
  const candidateObject = candidate;
  const hasIndexSignature = Object.keys(candidateObject).length >= 0;

  console.log(
    `✅ [TYPE_GUARD] CompatibleFormData 검증 완료: ${hasIndexSignature}`
  );
  return hasIndexSignature;
};

// 🔧 안전한 타입 변환 함수들
export const createFormValuesConverters = () => {
  console.log('🔧 [CONVERTERS] FormValues 변환기 생성');

  const typeGuards = createFormValuesTypeGuards();
  const {
    isValidStringValue,
    isValidBooleanValue,
    isValidStringArrayValue,
    isValidStringOrNull,
    isValidContainerArray,
    isValidParagraphArray,
  } = typeGuards;

  const convertToSafeString = (
    value: unknown,
    fallbackValue: string
  ): string => {
    const isValidString = isValidStringValue(value);
    return isValidString ? value : fallbackValue;
  };

  const convertToSafeBoolean = (
    value: unknown,
    fallbackValue: boolean
  ): boolean => {
    const isValidBoolean = isValidBooleanValue(value);
    return isValidBoolean ? value : fallbackValue;
  };

  const convertToSafeStringArray = (value: unknown): string[] => {
    const isValidArray = isValidStringArrayValue(value);
    return isValidArray ? value : [];
  };

  const convertToSafeStringOrNull = (value: unknown): string | null => {
    const isValidValue = isValidStringOrNull(value);
    return isValidValue ? value : null;
  };

  const convertToSafeContainerArray = (value: unknown): Container[] => {
    const isValidArray = isValidContainerArray(value);
    return isValidArray ? value : [];
  };

  const convertToSafeParagraphArray = (value: unknown): ParagraphBlock[] => {
    const isValidArray = isValidParagraphArray(value);
    return isValidArray ? value : [];
  };

  console.log('✅ [CONVERTERS] FormValues 변환기 생성 완료');

  return {
    convertToSafeString,
    convertToSafeBoolean,
    convertToSafeStringArray,
    convertToSafeStringOrNull,
    convertToSafeContainerArray,
    convertToSafeParagraphArray,
  };
};

// 🔧 FormValues 생성 및 변환 유틸리티들
export const createFormValuesUtilities = () => {
  console.log('🔧 [UTILITIES] FormValues 유틸리티 생성');

  const converters = createFormValuesConverters();
  const {
    convertToSafeString,
    convertToSafeBoolean,
    convertToSafeStringArray,
    convertToSafeStringOrNull,
    convertToSafeContainerArray,
    convertToSafeParagraphArray,
  } = converters;

  const createDefaultFormValues = (): FormValues => {
    console.log('🔧 [UTILITIES] 기본 FormValues 생성');

    const defaultFormValues: FormValues = {
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
      editorContainers: [],
      editorParagraphs: [],
      editorCompletedContent: '',
      isEditorCompleted: false,
    };

    console.log('✅ [UTILITIES] 기본 FormValues 생성 완료');
    return defaultFormValues;
  };

  const normalizeFormValues = (rawFormValues: unknown): FormValues => {
    console.log('🔄 [UTILITIES] FormValues 정규화 시작');

    const isValidObject =
      rawFormValues !== null && typeof rawFormValues === 'object';
    if (!isValidObject) {
      console.log('⚠️ [UTILITIES] 유효하지 않은 입력, 기본값 반환');
      return createDefaultFormValues();
    }

    const rawFormValuesObject = rawFormValues;

    // 구조분해할당으로 각 필드 안전하게 추출
    const userImageValue = Reflect.get(rawFormValuesObject, 'userImage');
    const nicknameValue = Reflect.get(rawFormValuesObject, 'nickname');
    const emailPrefixValue = Reflect.get(rawFormValuesObject, 'emailPrefix');
    const emailDomainValue = Reflect.get(rawFormValuesObject, 'emailDomain');
    const bioValue = Reflect.get(rawFormValuesObject, 'bio');
    const titleValue = Reflect.get(rawFormValuesObject, 'title');
    const descriptionValue = Reflect.get(rawFormValuesObject, 'description');
    const tagsValue = Reflect.get(rawFormValuesObject, 'tags');
    const contentValue = Reflect.get(rawFormValuesObject, 'content');
    const mediaValue = Reflect.get(rawFormValuesObject, 'media');
    const mainImageValue = Reflect.get(rawFormValuesObject, 'mainImage');
    const sliderImagesValue = Reflect.get(rawFormValuesObject, 'sliderImages');
    const editorContainersValue = Reflect.get(
      rawFormValuesObject,
      'editorContainers'
    );
    const editorParagraphsValue = Reflect.get(
      rawFormValuesObject,
      'editorParagraphs'
    );
    const editorCompletedContentValue = Reflect.get(
      rawFormValuesObject,
      'editorCompletedContent'
    );
    const isEditorCompletedValue = Reflect.get(
      rawFormValuesObject,
      'isEditorCompleted'
    );

    const normalizedFormValues: FormValues = {
      userImage: convertToSafeString(userImageValue, ''),
      nickname: convertToSafeString(nicknameValue, ''),
      emailPrefix: convertToSafeString(emailPrefixValue, ''),
      emailDomain: convertToSafeString(emailDomainValue, ''),
      bio: convertToSafeString(bioValue, ''),
      title: convertToSafeString(titleValue, ''),
      description: convertToSafeString(descriptionValue, ''),
      tags: convertToSafeString(tagsValue, ''),
      content: convertToSafeString(contentValue, ''),
      media: convertToSafeStringArray(mediaValue),
      mainImage: convertToSafeStringOrNull(mainImageValue),
      sliderImages: convertToSafeStringArray(sliderImagesValue),
      editorContainers: convertToSafeContainerArray(editorContainersValue),
      editorParagraphs: convertToSafeParagraphArray(editorParagraphsValue),
      editorCompletedContent: convertToSafeString(
        editorCompletedContentValue,
        ''
      ),
      isEditorCompleted: convertToSafeBoolean(isEditorCompletedValue, false),
    };

    console.log('✅ [UTILITIES] FormValues 정규화 완료:', {
      nickname: normalizedFormValues.nickname,
      title: normalizedFormValues.title,
      hasEditorContent:
        (normalizedFormValues.editorCompletedContent || '').length > 0,
      isEditorCompleted: normalizedFormValues.isEditorCompleted,
    });

    return normalizedFormValues;
  };

  const mergeFormValues = (
    baseFormValues: FormValues,
    updateFormValues: Partial<FormValues>
  ): FormValues => {
    console.log('🔄 [UTILITIES] FormValues 병합 시작');

    // 기본 FormValues 구조분해할당
    const {
      userImage: baseUserImage = '',
      nickname: baseNickname = '',
      emailPrefix: baseEmailPrefix = '',
      emailDomain: baseEmailDomain = '',
      bio: baseBio = '',
      title: baseTitle = '',
      description: baseDescription = '',
      tags: baseTags = '',
      content: baseContent = '',
      media: baseMedia = [],
      mainImage: baseMainImage = null,
      sliderImages: baseSliderImages = [],
      editorContainers: baseEditorContainers = [],
      editorParagraphs: baseEditorParagraphs = [],
      editorCompletedContent: baseEditorContent = '',
      isEditorCompleted: baseIsCompleted = false,
    } = baseFormValues;

    // 업데이트 FormValues 구조분해할당
    const {
      userImage: updateUserImage,
      nickname: updateNickname,
      emailPrefix: updateEmailPrefix,
      emailDomain: updateEmailDomain,
      bio: updateBio,
      title: updateTitle,
      description: updateDescription,
      tags: updateTags,
      content: updateContent,
      media: updateMedia,
      mainImage: updateMainImage,
      sliderImages: updateSliderImages,
      editorContainers: updateEditorContainers,
      editorParagraphs: updateEditorParagraphs,
      editorCompletedContent: updateEditorContent,
      isEditorCompleted: updateIsCompleted,
    } = updateFormValues;

    const mergedFormValues: FormValues = {
      userImage:
        updateUserImage !== undefined ? updateUserImage : baseUserImage,
      nickname: updateNickname !== undefined ? updateNickname : baseNickname,
      emailPrefix:
        updateEmailPrefix !== undefined ? updateEmailPrefix : baseEmailPrefix,
      emailDomain:
        updateEmailDomain !== undefined ? updateEmailDomain : baseEmailDomain,
      bio: updateBio !== undefined ? updateBio : baseBio,
      title: updateTitle !== undefined ? updateTitle : baseTitle,
      description:
        updateDescription !== undefined ? updateDescription : baseDescription,
      tags: updateTags !== undefined ? updateTags : baseTags,
      content: updateContent !== undefined ? updateContent : baseContent,
      media: updateMedia !== undefined ? updateMedia : baseMedia,
      mainImage:
        updateMainImage !== undefined ? updateMainImage : baseMainImage,
      sliderImages:
        updateSliderImages !== undefined
          ? updateSliderImages
          : baseSliderImages,
      editorContainers:
        updateEditorContainers !== undefined
          ? updateEditorContainers
          : baseEditorContainers,
      editorParagraphs:
        updateEditorParagraphs !== undefined
          ? updateEditorParagraphs
          : baseEditorParagraphs,
      editorCompletedContent:
        updateEditorContent !== undefined
          ? updateEditorContent
          : baseEditorContent,
      isEditorCompleted:
        updateIsCompleted !== undefined ? updateIsCompleted : baseIsCompleted,
    };

    console.log('✅ [UTILITIES] FormValues 병합 완료:', {
      updatedFields: Object.keys(updateFormValues).length,
    });

    return mergedFormValues;
  };

  console.log('✅ [UTILITIES] FormValues 유틸리티 생성 완료');

  return {
    createDefaultFormValues,
    normalizeFormValues,
    mergeFormValues,
  };
};

// 🆕 **하위 호환성을 위한 변환 함수들** (기존 코드에서 사용 중)
export const convertFormValuesToCompatibleFormData = (
  formValues: FormValues
): CompatibleFormData => {
  console.log('🔄 [CONVERTER] FormValues → CompatibleFormData 변환 시작');

  const typeConverters = createFormValuesConverters();
  const {
    convertToSafeString,
    convertToSafeBoolean,
    convertToSafeStringArray,
    convertToSafeStringOrNull,
  } = typeConverters;

  // 구조분해할당으로 안전한 데이터 추출
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

  const convertedData: CompatibleFormData = {
    userImage: convertToSafeString(userImage, ''),
    nickname: convertToSafeString(nickname, ''),
    emailPrefix: convertToSafeString(emailPrefix, ''),
    emailDomain: convertToSafeString(emailDomain, ''),
    bio: convertToSafeString(bio, ''),
    title: convertToSafeString(title, ''),
    description: convertToSafeString(description, ''),
    tags: convertToSafeString(tags, ''),
    content: convertToSafeString(content, ''),
    media: convertToSafeStringArray(media),
    mainImage: convertToSafeStringOrNull(mainImage),
    sliderImages: convertToSafeStringArray(sliderImages),
    editorCompletedContent: convertToSafeString(editorCompletedContent, ''),
    isEditorCompleted: convertToSafeBoolean(isEditorCompleted, false),
  };

  console.log('✅ [CONVERTER] FormValues → CompatibleFormData 변환 완료:', {
    nicknameLength: convertedData.nickname?.length || 0,
    titleLength: convertedData.title?.length || 0,
    hasEditorContent: !!convertedData.editorCompletedContent,
    isEditorCompleted: convertedData.isEditorCompleted,
  });

  return convertedData;
};

export const convertCompatibleFormDataToFormValues = (
  formData: CompatibleFormData
): FormValues => {
  console.log('🔄 [CONVERTER] CompatibleFormData → FormValues 변환 시작');

  const typeConverters = createFormValuesConverters();
  const {
    convertToSafeString,
    convertToSafeBoolean,
    convertToSafeStringArray,
    convertToSafeStringOrNull,
  } = typeConverters;

  // 구조분해할당으로 안전한 데이터 추출
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
  } = formData;

  const convertedFormValues: FormValues = {
    userImage: convertToSafeString(userImage, ''),
    nickname: convertToSafeString(nickname, ''),
    emailPrefix: convertToSafeString(emailPrefix, ''),
    emailDomain: convertToSafeString(emailDomain, ''),
    bio: convertToSafeString(bio, ''),
    title: convertToSafeString(title, ''),
    description: convertToSafeString(description, ''),
    tags: convertToSafeString(tags, ''),
    content: convertToSafeString(content, ''),
    media: convertToSafeStringArray(media),
    mainImage: convertToSafeStringOrNull(mainImage),
    sliderImages: convertToSafeStringArray(sliderImages),
    editorCompletedContent: convertToSafeString(editorCompletedContent, ''),
    isEditorCompleted: convertToSafeBoolean(isEditorCompleted, false),
  };

  console.log('✅ [CONVERTER] CompatibleFormData → FormValues 변환 완료:', {
    nickname: convertedFormValues.nickname,
    title: convertedFormValues.title,
    hasEditorContent: !!convertedFormValues.editorCompletedContent,
    isEditorCompleted: convertedFormValues.isEditorCompleted,
  });

  return convertedFormValues;
};

export const convertFormValuesToBridgeFormValues = (
  formValues: FormValues
): BridgeFormValues => {
  console.log('🔄 [CONVERTER] FormValues → BridgeFormValues 변환 시작');

  const typeConverters = createFormValuesConverters();
  const {
    convertToSafeString,
    convertToSafeBoolean,
    convertToSafeStringArray,
    convertToSafeStringOrNull,
  } = typeConverters;

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

  const bridgeFormValues: BridgeFormValues = {
    userImage: convertToSafeString(userImage, ''),
    nickname: convertToSafeString(nickname, ''),
    emailPrefix: convertToSafeString(emailPrefix, ''),
    emailDomain: convertToSafeString(emailDomain, ''),
    bio: convertToSafeString(bio, ''),
    title: convertToSafeString(title, ''),
    description: convertToSafeString(description, ''),
    tags: convertToSafeString(tags, ''),
    content: convertToSafeString(content, ''),
    media: convertToSafeStringArray(media),
    mainImage: convertToSafeStringOrNull(mainImage),
    sliderImages: convertToSafeStringArray(sliderImages),
    editorCompletedContent: convertToSafeString(editorCompletedContent, ''),
    isEditorCompleted: convertToSafeBoolean(isEditorCompleted, false),
  };

  console.log('✅ [CONVERTER] FormValues → BridgeFormValues 변환 완료:', {
    nickname: bridgeFormValues.nickname,
    title: bridgeFormValues.title,
    hasEditorContent: !!bridgeFormValues.editorCompletedContent,
    isEditorCompleted: bridgeFormValues.isEditorCompleted,
  });

  return bridgeFormValues;
};

export const safeMergeFormData = (
  baseFormData: CompatibleFormData,
  updateFormData: Partial<CompatibleFormData>
): CompatibleFormData => {
  console.log('🔄 [MERGER] 폼 데이터 안전 병합 시작');

  const typeConverters = createFormValuesConverters();
  const {
    convertToSafeString,
    convertToSafeBoolean,
    convertToSafeStringArray,
    convertToSafeStringOrNull,
  } = typeConverters;

  // 기본 데이터 구조분해할당
  const {
    userImage: baseUserImage = '',
    nickname: baseNickname = '',
    emailPrefix: baseEmailPrefix = '',
    emailDomain: baseEmailDomain = '',
    bio: baseBio = '',
    title: baseTitle = '',
    description: baseDescription = '',
    tags: baseTags = '',
    content: baseContent = '',
    media: baseMedia = [],
    mainImage: baseMainImage = null,
    sliderImages: baseSliderImages = [],
    editorCompletedContent: baseEditorContent = '',
    isEditorCompleted: baseIsCompleted = false,
  } = baseFormData;

  // 업데이트 데이터 구조분해할당
  const {
    userImage: updateUserImage,
    nickname: updateNickname,
    emailPrefix: updateEmailPrefix,
    emailDomain: updateEmailDomain,
    bio: updateBio,
    title: updateTitle,
    description: updateDescription,
    tags: updateTags,
    content: updateContent,
    media: updateMedia,
    mainImage: updateMainImage,
    sliderImages: updateSliderImages,
    editorCompletedContent: updateEditorContent,
    isEditorCompleted: updateIsCompleted,
  } = updateFormData;

  const mergedFormData: CompatibleFormData = {
    userImage:
      updateUserImage !== undefined
        ? convertToSafeString(updateUserImage, '')
        : convertToSafeString(baseUserImage, ''),
    nickname:
      updateNickname !== undefined
        ? convertToSafeString(updateNickname, '')
        : convertToSafeString(baseNickname, ''),
    emailPrefix:
      updateEmailPrefix !== undefined
        ? convertToSafeString(updateEmailPrefix, '')
        : convertToSafeString(baseEmailPrefix, ''),
    emailDomain:
      updateEmailDomain !== undefined
        ? convertToSafeString(updateEmailDomain, '')
        : convertToSafeString(baseEmailDomain, ''),
    bio:
      updateBio !== undefined
        ? convertToSafeString(updateBio, '')
        : convertToSafeString(baseBio, ''),
    title:
      updateTitle !== undefined
        ? convertToSafeString(updateTitle, '')
        : convertToSafeString(baseTitle, ''),
    description:
      updateDescription !== undefined
        ? convertToSafeString(updateDescription, '')
        : convertToSafeString(baseDescription, ''),
    tags:
      updateTags !== undefined
        ? convertToSafeString(updateTags, '')
        : convertToSafeString(baseTags, ''),
    content:
      updateContent !== undefined
        ? convertToSafeString(updateContent, '')
        : convertToSafeString(baseContent, ''),
    media:
      updateMedia !== undefined
        ? convertToSafeStringArray(updateMedia)
        : convertToSafeStringArray(baseMedia),
    mainImage:
      updateMainImage !== undefined
        ? convertToSafeStringOrNull(updateMainImage)
        : convertToSafeStringOrNull(baseMainImage),
    sliderImages:
      updateSliderImages !== undefined
        ? convertToSafeStringArray(updateSliderImages)
        : convertToSafeStringArray(baseSliderImages),
    editorCompletedContent:
      updateEditorContent !== undefined
        ? convertToSafeString(updateEditorContent, '')
        : convertToSafeString(baseEditorContent, ''),
    isEditorCompleted:
      updateIsCompleted !== undefined
        ? convertToSafeBoolean(updateIsCompleted, false)
        : convertToSafeBoolean(baseIsCompleted, false),
  };

  console.log('✅ [MERGER] 폼 데이터 안전 병합 완료:', {
    updatedFields: Object.keys(updateFormData).length,
  });

  return mergedFormData;
};

// 🔄 기존 컨테이너 관련 타입들 유지 (의존성 있음)
export interface ContainerMoveRecord {
  id: string;
  paragraphId: string;
  fromContainerId: string | null;
  toContainerId: string;
  timestamp: Date;
  reason?: string;
}

export type ContainerMoveHistory = ContainerMoveRecord[];

export interface ContainerMoveStats {
  totalMoves: number;
  mostMovedParagraph: string | null;
  mostTargetContainer: string | null;
  averageMovesPerParagraph: number;
}

export interface ContainerSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  description?: string;
}

// 🔧 수정: ImageGalleryMetadata 타입을 직접 정의 (import 경로 문제 해결)
export interface ImageGalleryMetadata {
  readonly id: string;
  readonly originalFileName: string;
  readonly indexedDBKey: string;
  readonly originalDataUrl: string;
  readonly fileSize: number;
  readonly createdAt: Date;

  // 🆕 추가 필드들 (선택적)
  readonly thumbnailDataUrl?: string;
  readonly compressedSize?: number;
  readonly dimensions?: {
    readonly width: number;
    readonly height: number;
  };
  readonly mimeType?: string;
  readonly quality?: number;
  readonly isCompressed?: boolean;
}

// 🚨 수정: 슬라이더 이미지 필드 추가로 데이터 동기화 문제 해결
export interface HybridImageViewConfig {
  clickOrder: number[];
  selectedImageIds: string[];
  selectedImages: string[];
  imageMetadata: ImageGalleryMetadata[];
  layout: {
    columns: number;
    gridType: 'grid' | 'masonry';
  };
  filter: 'all' | 'available';
  mainImage?: string | null;
  sliderImages: string[];
}

// 🆕 통합된 하이브리드 커스텀뷰 (중복 제거)
export interface HybridCustomGalleryView {
  id: string;
  name: string;
  selectedImageIds: string[];
  selectedImages: string[];
  clickOrder: number[];
  layout: {
    columns: number;
    gridType: 'grid' | 'masonry';
  };
  createdAt: Date;
  mainImage?: string | null;
  sliderImages: string[];
}

// 🆕 간소화된 이미지 처리 결과
export interface HybridImageProcessResult {
  readonly successful: Array<{
    metadata: ImageGalleryMetadata;
    binaryKey: string;
    imageUrl: string;
  }>;
  readonly failed: Array<{
    file: File;
    error: string;
  }>;
  readonly totalProcessed: number;
}

// 🚨 수정: 슬라이더 필드를 포함한 기본값 생성
export const createDefaultHybridImageViewConfig = (): HybridImageViewConfig => {
  console.log(
    '🔧 [TYPES] 슬라이더 필드 포함 기본 하이브리드 이미지뷰 설정 생성'
  );

  return {
    clickOrder: [],
    selectedImageIds: [],
    selectedImages: [],
    imageMetadata: [],
    layout: {
      columns: 3,
      gridType: 'grid',
    },
    filter: 'all',
    mainImage: null,
    sliderImages: [],
  };
};

// 🔧 기존 utilityFunctions.ts에서 사용하던 함수들 유지
export {
  createContainer,
  createParagraphBlock,
  sortContainers,
  getParagraphsByContainer,
  getUnassignedParagraphs,
  generateCompletedContent,
  validateEditorState,
  createDefaultEditorState,
  createDefaultImageViewConfig,
  clearAllEditorStorage,
  inspectEditorStorage,
  registerEditorDebugFunctions,
} from './utilityFunctions';
