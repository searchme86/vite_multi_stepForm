// blogMediaStep/utils/fileFormatUtils.ts - BlogMediaStep 컴포넌트

/**
 * BlogMediaStep 컴포넌트 - 파일 형식 관련 유틸리티 함수들
 * 파일 확장자, MIME 타입, 형식 변환 관련 로직을 제공
 */

// ✅ 지원되는 이미지 형식 정의
export const SUPPORTED_IMAGE_FORMATS = {
  JPEG: {
    extensions: ['jpg', 'jpeg'],
    mimeTypes: ['image/jpeg', 'image/jpg'],
    description: 'JPEG 이미지',
  },
  PNG: {
    extensions: ['png'],
    mimeTypes: ['image/png'],
    description: 'PNG 이미지',
  },
  SVG: {
    extensions: ['svg'],
    mimeTypes: ['image/svg+xml'],
    description: 'SVG 벡터 이미지',
  },
  GIF: {
    extensions: ['gif'],
    mimeTypes: ['image/gif'],
    description: 'GIF 애니메이션',
  },
} as const;

// ✅ 파일 형식 정보 타입
export interface FileFormatInfo {
  extension: string;
  mimeType: string;
  formatType: keyof typeof SUPPORTED_IMAGE_FORMATS;
  description: string;
  isSupported: boolean;
}

/**
 * 파일명에서 확장자 추출
 * @param fileName - 파일명
 * @returns 소문자 확장자 또는 null
 */
export const extractFileExtension = (fileName: string): string | null => {
  console.log('🔧 extractFileExtension 호출:', { fileName }); // 디버깅용

  const extension = fileName.split('.').pop()?.toLowerCase() || null;

  console.log('✅ extractFileExtension 결과:', { fileName, extension }); // 디버깅용
  return extension;
};

/**
 * 확장자로 형식 정보 조회
 * @param extension - 파일 확장자
 * @returns 형식 정보 또는 null
 */
export const getFormatInfoByExtension = (
  extension: string
): FileFormatInfo | null => {
  console.log('🔧 getFormatInfoByExtension 호출:', { extension }); // 디버깅용

  const lowerExtension = extension.toLowerCase();

  for (const [formatType, formatData] of Object.entries(
    SUPPORTED_IMAGE_FORMATS
  )) {
    if (formatData.extensions.includes(lowerExtension)) {
      const formatInfo: FileFormatInfo = {
        extension: lowerExtension,
        mimeType: formatData.mimeTypes[0], // 첫 번째 MIME 타입 사용
        formatType: formatType as keyof typeof SUPPORTED_IMAGE_FORMATS,
        description: formatData.description,
        isSupported: true,
      };

      console.log('✅ getFormatInfoByExtension 찾음:', formatInfo); // 디버깅용
      return formatInfo;
    }
  }

  // 지원되지 않는 형식
  const unsupportedInfo: FileFormatInfo = {
    extension: lowerExtension,
    mimeType: 'unknown',
    formatType: 'JPEG', // 기본값
    description: '지원되지 않는 형식',
    isSupported: false,
  };

  console.log(
    '⚠️ getFormatInfoByExtension 지원되지 않는 형식:',
    unsupportedInfo
  ); // 디버깅용
  return unsupportedInfo;
};

/**
 * MIME 타입으로 형식 정보 조회
 * @param mimeType - MIME 타입
 * @returns 형식 정보 또는 null
 */
export const getFormatInfoByMimeType = (
  mimeType: string
): FileFormatInfo | null => {
  console.log('🔧 getFormatInfoByMimeType 호출:', { mimeType }); // 디버깅용

  for (const [formatType, formatData] of Object.entries(
    SUPPORTED_IMAGE_FORMATS
  )) {
    if (formatData.mimeTypes.includes(mimeType)) {
      const formatInfo: FileFormatInfo = {
        extension: formatData.extensions[0], // 첫 번째 확장자 사용
        mimeType,
        formatType: formatType as keyof typeof SUPPORTED_IMAGE_FORMATS,
        description: formatData.description,
        isSupported: true,
      };

      console.log('✅ getFormatInfoByMimeType 찾음:', formatInfo); // 디버깅용
      return formatInfo;
    }
  }

  console.log('⚠️ getFormatInfoByMimeType 지원되지 않는 MIME:', { mimeType }); // 디버깅용
  return null;
};

/**
 * 파일 객체에서 형식 정보 추출
 * @param file - File 객체
 * @returns 파일 형식 정보
 */
export const getFileFormatInfo = (file: File): FileFormatInfo => {
  console.log('🔧 getFileFormatInfo 호출:', {
    fileName: file.name,
    mimeType: file.type,
  }); // 디버깅용

  // 우선 MIME 타입으로 조회
  let formatInfo = getFormatInfoByMimeType(file.type);

  // MIME 타입으로 찾지 못하면 확장자로 조회
  if (!formatInfo) {
    const extension = extractFileExtension(file.name);
    if (extension) {
      formatInfo = getFormatInfoByExtension(extension);
    }
  }

  // 그래도 찾지 못하면 기본값
  if (!formatInfo) {
    formatInfo = {
      extension: 'unknown',
      mimeType: file.type || 'unknown',
      formatType: 'JPEG',
      description: '알 수 없는 형식',
      isSupported: false,
    };
  }

  console.log('✅ getFileFormatInfo 결과:', formatInfo); // 디버깅용
  return formatInfo;
};

/**
 * 지원되는 형식인지 확인
 * @param file - File 객체
 * @returns 지원 여부
 */
export const isImageFormatSupported = (file: File): boolean => {
  console.log('🔧 isImageFormatSupported 호출:', {
    fileName: file.name,
    mimeType: file.type,
  }); // 디버깅용

  const formatInfo = getFileFormatInfo(file);
  const isSupported = formatInfo.isSupported;

  console.log('✅ isImageFormatSupported 결과:', {
    fileName: file.name,
    isSupported,
  }); // 디버깅용

  return isSupported;
};

/**
 * 지원되는 모든 확장자 목록 반환
 * @returns 확장자 배열
 */
export const getAllSupportedExtensions = (): string[] => {
  console.log('🔧 getAllSupportedExtensions 호출'); // 디버깅용

  const extensions: string[] = [];

  for (const formatData of Object.values(SUPPORTED_IMAGE_FORMATS)) {
    extensions.push(...formatData.extensions);
  }

  console.log('✅ getAllSupportedExtensions 결과:', extensions); // 디버깅용
  return extensions;
};

/**
 * 지원되는 모든 MIME 타입 목록 반환
 * @returns MIME 타입 배열
 */
export const getAllSupportedMimeTypes = (): string[] => {
  console.log('🔧 getAllSupportedMimeTypes 호출'); // 디버깅용

  const mimeTypes: string[] = [];

  for (const formatData of Object.values(SUPPORTED_IMAGE_FORMATS)) {
    mimeTypes.push(...formatData.mimeTypes);
  }

  console.log('✅ getAllSupportedMimeTypes 결과:', mimeTypes); // 디버깅용
  return mimeTypes;
};

/**
 * HTML input accept 속성용 문자열 생성
 * @returns accept 속성 값
 */
export const generateAcceptString = (): string => {
  console.log('🔧 generateAcceptString 호출'); // 디버깅용

  const extensions = getAllSupportedExtensions();
  const acceptString = extensions.map((ext) => `.${ext}`).join(',');

  console.log('✅ generateAcceptString 결과:', acceptString); // 디버깅용
  return acceptString;
};
