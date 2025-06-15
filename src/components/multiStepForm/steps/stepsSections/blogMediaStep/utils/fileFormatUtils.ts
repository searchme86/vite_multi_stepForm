// src/components/multiStepForm/steps/stepsSections/blogMediaStep/utils/fileFormatUtils.ts

export const SUPPORTED_IMAGE_FORMATS = {
  JPEG: {
    extensions: ['jpg', 'jpeg'] as string[],
    mimeTypes: ['image/jpeg', 'image/jpg'] as string[],
    description: 'JPEG 이미지',
  },
  PNG: {
    extensions: ['png'] as string[],
    mimeTypes: ['image/png'] as string[],
    description: 'PNG 이미지',
  },
  SVG: {
    extensions: ['svg'] as string[],
    mimeTypes: ['image/svg+xml'] as string[],
    description: 'SVG 벡터 이미지',
  },
  GIF: {
    extensions: ['gif'] as string[],
    mimeTypes: ['image/gif'] as string[],
    description: 'GIF 애니메이션',
  },
};

export interface FileFormatInfo {
  extension: string;
  mimeType: string;
  formatType: keyof typeof SUPPORTED_IMAGE_FORMATS;
  description: string;
  isSupported: boolean;
}

export const extractFileExtension = (
  originalFileName: string
): string | null => {
  console.log('🔧 extractFileExtension 호출:', { fileName: originalFileName });

  const fileNameParts = originalFileName.split('.');
  const extractedExtension = fileNameParts.pop()?.toLowerCase() || null;

  console.log('✅ extractFileExtension 결과:', {
    fileName: originalFileName,
    extension: extractedExtension,
  });

  return extractedExtension;
};

export const getFormatInfoByExtension = (
  fileExtensionInput: string
): FileFormatInfo | null => {
  console.log('🔧 getFormatInfoByExtension 호출:', {
    extension: fileExtensionInput,
  });

  const normalizedExtension = fileExtensionInput.toLowerCase();

  const formatEntries = Object.entries(SUPPORTED_IMAGE_FORMATS);

  for (const [formatTypeName, formatConfiguration] of formatEntries) {
    const { extensions, mimeTypes, description } = formatConfiguration;

    if (extensions.includes(normalizedExtension)) {
      const [primaryMimeType] = mimeTypes;

      const detectedFormatInfo: FileFormatInfo = {
        extension: normalizedExtension,
        mimeType: primaryMimeType,
        formatType: formatTypeName as keyof typeof SUPPORTED_IMAGE_FORMATS,
        description,
        isSupported: true,
      };

      console.log('✅ getFormatInfoByExtension 찾음:', detectedFormatInfo);
      return detectedFormatInfo;
    }
  }

  const unsupportedFormatInfo: FileFormatInfo = {
    extension: normalizedExtension,
    mimeType: 'unknown',
    formatType: 'JPEG',
    description: '지원되지 않는 형식',
    isSupported: false,
  };

  console.log(
    '⚠️ getFormatInfoByExtension 지원되지 않는 형식:',
    unsupportedFormatInfo
  );
  return unsupportedFormatInfo;
};

export const getFormatInfoByMimeType = (
  inputMimeType: string
): FileFormatInfo | null => {
  console.log('🔧 getFormatInfoByMimeType 호출:', { mimeType: inputMimeType });

  const formatEntries = Object.entries(SUPPORTED_IMAGE_FORMATS);

  for (const [formatTypeName, formatConfiguration] of formatEntries) {
    const { extensions, mimeTypes, description } = formatConfiguration;

    if (mimeTypes.includes(inputMimeType)) {
      const [primaryExtension] = extensions;

      const detectedFormatInfo: FileFormatInfo = {
        extension: primaryExtension,
        mimeType: inputMimeType,
        formatType: formatTypeName as keyof typeof SUPPORTED_IMAGE_FORMATS,
        description,
        isSupported: true,
      };

      console.log('✅ getFormatInfoByMimeType 찾음:', detectedFormatInfo);
      return detectedFormatInfo;
    }
  }

  console.log('⚠️ getFormatInfoByMimeType 지원되지 않는 MIME:', {
    mimeType: inputMimeType,
  });
  return null;
};

export const getFileFormatInfo = (uploadedFile: File): FileFormatInfo => {
  const { name: fileName, type: fileMimeType } = uploadedFile;

  console.log('🔧 getFileFormatInfo 호출:', {
    fileName,
    mimeType: fileMimeType,
  });

  let detectedFormatInfo = getFormatInfoByMimeType(fileMimeType);

  if (!detectedFormatInfo) {
    const extractedExtension = extractFileExtension(fileName);
    if (extractedExtension) {
      detectedFormatInfo = getFormatInfoByExtension(extractedExtension);
    }
  }

  if (!detectedFormatInfo) {
    detectedFormatInfo = {
      extension: 'unknown',
      mimeType: fileMimeType || 'unknown',
      formatType: 'JPEG',
      description: '알 수 없는 형식',
      isSupported: false,
    };
  }

  console.log('✅ getFileFormatInfo 결과:', detectedFormatInfo);
  return detectedFormatInfo;
};

export const isImageFormatSupported = (inputFile: File): boolean => {
  const { name: fileName, type: fileMimeType } = inputFile;

  console.log('🔧 isImageFormatSupported 호출:', {
    fileName,
    mimeType: fileMimeType,
  });

  const formatInfo = getFileFormatInfo(inputFile);
  const { isSupported: formatIsSupported } = formatInfo;

  console.log('✅ isImageFormatSupported 결과:', {
    fileName,
    isSupported: formatIsSupported,
  });

  return formatIsSupported;
};

export const getAllSupportedExtensions = (): string[] => {
  console.log('🔧 getAllSupportedExtensions 호출');

  const collectedExtensions: string[] = [];
  const formatValues = Object.values(SUPPORTED_IMAGE_FORMATS);

  for (const formatConfiguration of formatValues) {
    const { extensions } = formatConfiguration;
    collectedExtensions.push(...extensions);
  }

  console.log('✅ getAllSupportedExtensions 결과:', collectedExtensions);
  return collectedExtensions;
};

export const getAllSupportedMimeTypes = (): string[] => {
  console.log('🔧 getAllSupportedMimeTypes 호출');

  const collectedMimeTypes: string[] = [];
  const formatValues = Object.values(SUPPORTED_IMAGE_FORMATS);

  for (const formatConfiguration of formatValues) {
    const { mimeTypes } = formatConfiguration;
    collectedMimeTypes.push(...mimeTypes);
  }

  console.log('✅ getAllSupportedMimeTypes 결과:', collectedMimeTypes);
  return collectedMimeTypes;
};

export const generateAcceptString = (): string => {
  console.log('🔧 generateAcceptString 호출');

  const supportedExtensions = getAllSupportedExtensions();
  const formattedAcceptString = supportedExtensions
    .map((extensionName) => `.${extensionName}`)
    .join(',');

  console.log('✅ generateAcceptString 결과:', formattedAcceptString);
  return formattedAcceptString;
};
