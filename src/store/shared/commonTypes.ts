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

// 🔧 기존 FormValues 인터페이스 (Bridge 호환성 개선)
export interface FormValues {
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
  editorContainers?: Container[];
  editorParagraphs?: ParagraphBlock[];
  editorCompletedContent?: string;
  isEditorCompleted?: boolean;
}

// 🆕 multiStepFormStore와 호환되는 FormData 인터페이스
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

// 🆕 Bridge 전용 FormValues (Bridge 시스템과 완전 호환)
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

// 🔧 안전한 타입 변환 유틸리티
export const createSafeTypeConverters = () => {
  console.log('🔧 [TYPE_CONVERTER] 안전한 타입 변환기 생성');

  const convertToSafeString = (value: unknown, fallback: string): string => {
    const isStringType = typeof value === 'string';
    return isStringType ? value : fallback;
  };

  const convertToSafeBoolean = (value: unknown, fallback: boolean): boolean => {
    const isBooleanType = typeof value === 'boolean';
    return isBooleanType ? value : fallback;
  };

  const convertToSafeStringArray = (value: unknown): string[] => {
    const isArrayType = Array.isArray(value);
    if (!isArrayType) {
      return [];
    }

    const filteredArray = value.filter((item: unknown): item is string => {
      const isStringItem = typeof item === 'string';
      return isStringItem;
    });

    return filteredArray;
  };

  const convertToSafeStringOrNull = (value: unknown): string | null => {
    const isNullValue = value === null;
    if (isNullValue) {
      return null;
    }

    const isStringValue = typeof value === 'string';
    return isStringValue ? value : null;
  };

  const convertToSafeNumber = (value: unknown, fallback: number): number => {
    const isNumberType = typeof value === 'number';
    if (isNumberType && !Number.isNaN(value)) {
      return value;
    }

    const isStringType = typeof value === 'string';
    if (isStringType) {
      const parsedValue = parseInt(value, 10);
      const isValidParsed = !Number.isNaN(parsedValue);
      return isValidParsed ? parsedValue : fallback;
    }

    return fallback;
  };

  console.log('✅ [TYPE_CONVERTER] 타입 변환기 생성 완료');

  return {
    convertToSafeString,
    convertToSafeBoolean,
    convertToSafeStringArray,
    convertToSafeStringOrNull,
    convertToSafeNumber,
  };
};

// 🆕 FormValues 타입 가드
export const isValidFormValues = (
  candidate: unknown
): candidate is FormValues => {
  console.log('🔍 [TYPE_GUARD] FormValues 타입 검증 시작');

  const isObjectType = candidate !== null && typeof candidate === 'object';
  if (!isObjectType) {
    console.log('❌ [TYPE_GUARD] FormValues 후보가 객체가 아님');
    return false;
  }

  const candidateObject = candidate;

  // 필수 필드 검증
  const requiredFields = new Map<string, string>([
    ['nickname', 'string'],
    ['emailPrefix', 'string'],
    ['emailDomain', 'string'],
    ['title', 'string'],
    ['description', 'string'],
    ['content', 'string'],
  ]);

  let isValidStructure = true;

  for (const [fieldName, expectedType] of requiredFields) {
    const hasField = fieldName in candidateObject;
    if (!hasField) {
      console.log(`❌ [TYPE_GUARD] 필수 필드 누락: ${fieldName}`);
      isValidStructure = false;
      break;
    }

    const fieldValue = Reflect.get(candidateObject, fieldName);
    const hasCorrectType = typeof fieldValue === expectedType;
    if (!hasCorrectType) {
      console.log(
        `❌ [TYPE_GUARD] 필드 타입 불일치: ${fieldName} (기대: ${expectedType}, 실제: ${typeof fieldValue})`
      );
      isValidStructure = false;
      break;
    }
  }

  console.log(
    `${
      isValidStructure ? '✅' : '❌'
    } [TYPE_GUARD] FormValues 검증 완료: ${isValidStructure}`
  );
  return isValidStructure;
};

// 🆕 CompatibleFormData 타입 가드
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

// 🆕 FormValues → CompatibleFormData 변환
export const convertFormValuesToCompatibleFormData = (
  formValues: FormValues
): CompatibleFormData => {
  console.log('🔄 [CONVERTER] FormValues → CompatibleFormData 변환 시작');

  const typeConverters = createSafeTypeConverters();
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
    timestamp: new Date().toISOString(),
  });

  return convertedData;
};

// 🆕 CompatibleFormData → FormValues 변환
export const convertCompatibleFormDataToFormValues = (
  formData: CompatibleFormData
): FormValues => {
  console.log('🔄 [CONVERTER] CompatibleFormData → FormValues 변환 시작');

  const typeConverters = createSafeTypeConverters();
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
    timestamp: new Date().toISOString(),
  });

  return convertedFormValues;
};

// 🆕 FormValues → BridgeFormValues 변환
export const convertFormValuesToBridgeFormValues = (
  formValues: FormValues
): BridgeFormValues => {
  console.log('🔄 [CONVERTER] FormValues → BridgeFormValues 변환 시작');

  const typeConverters = createSafeTypeConverters();
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
    timestamp: new Date().toISOString(),
  });

  return bridgeFormValues;
};

// 🆕 안전한 폼 데이터 병합 함수
export const safeMergeFormData = (
  baseFormData: CompatibleFormData,
  updateFormData: Partial<CompatibleFormData>
): CompatibleFormData => {
  console.log('🔄 [MERGER] 폼 데이터 안전 병합 시작');

  const typeConverters = createSafeTypeConverters();
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
    timestamp: new Date().toISOString(),
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
  selectedImageIds: string[]; // 🆕 ID 기반 관리
  selectedImages: string[]; // 🔄 런타임에서만 사용
  imageMetadata: ImageGalleryMetadata[];
  layout: {
    columns: number;
    gridType: 'grid' | 'masonry';
  };
  filter: 'all' | 'available';

  // 🚨 핵심 수정: 슬라이더 관련 필드들 추가
  mainImage?: string | null; // 메인 이미지 URL
  sliderImages: string[]; // 슬라이더 이미지 URL 목록
}

// 🆕 통합된 하이브리드 커스텀뷰 (중복 제거)
export interface HybridCustomGalleryView {
  id: string;
  name: string;
  selectedImageIds: string[]; // 🆕 ID 기반 관리
  selectedImages: string[]; // 🔄 런타임에서만 사용
  clickOrder: number[];
  layout: {
    columns: number;
    gridType: 'grid' | 'masonry';
  };
  createdAt: Date;

  // 🚨 슬라이더 관련 필드들도 커스텀뷰에 추가
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
    selectedImages: [], // 런타임에서 복원됨
    imageMetadata: [],
    layout: {
      columns: 3,
      gridType: 'grid',
    },
    filter: 'all',

    // 🚨 슬라이더 관련 기본값 추가
    mainImage: null,
    sliderImages: [],
  };
};
