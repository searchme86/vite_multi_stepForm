// blogMediaStep/utils/fileValidationUtils.ts - BlogMediaStep 컴포넌트

/**
 * BlogMediaStep 컴포넌트 - 파일 검증 관련 유틸리티 함수들
 * 파일 크기, 형식, 아이콘 관련 순수 함수들을 제공
 */

// ✅ 지원되는 파일 형식 타입 정의
export type SupportedFileExtension = 'jpg' | 'jpeg' | 'png' | 'svg' | 'gif';
export type FileIconType =
  | 'lucide:image'
  | 'lucide:file-image'
  | 'lucide:film'
  | 'lucide:file';

// ✅ 파일 크기 검증 결과 타입
export interface FileValidationResult {
  isValid: boolean;
  errorMessage?: string;
  fileSize: number;
}

/**
 * 파일 크기를 읽기 쉬운 형태로 포맷팅
 * 기존 formatFileSize 함수와 동일한 로직 유지
 * @param sizeInBytes - 바이트 단위 파일 크기
 * @returns 포맷된 파일 크기 문자열 (예: "1.5 MB")
 */
export const formatFileSize = (sizeInBytes: number): string => {
  console.log('🔧 formatFileSize 호출:', { sizeInBytes }); // 디버깅용

  if (sizeInBytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(sizeInBytes) / Math.log(k));

  const formattedSize =
    parseFloat((sizeInBytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];

  console.log('✅ formatFileSize 결과:', {
    input: sizeInBytes,
    output: formattedSize,
  }); // 디버깅용
  return formattedSize;
};

/**
 * 파일 확장자에 따른 아이콘 반환
 * 기존 getFileIcon 함수와 동일한 로직 유지
 * @param fileName - 파일명
 * @returns 아이콘 이름 문자열
 */
export const getFileIcon = (fileName: string): FileIconType => {
  console.log('🔧 getFileIcon 호출:', { fileName }); // 디버깅용

  const extension = fileName.split('.').pop()?.toLowerCase() as
    | SupportedFileExtension
    | undefined;

  let iconType: FileIconType;

  switch (extension) {
    case 'jpg':
    case 'jpeg':
    case 'png':
      iconType = 'lucide:image';
      break;
    case 'svg':
      iconType = 'lucide:file-image';
      break;
    case 'gif':
      iconType = 'lucide:film';
      break;
    default:
      iconType = 'lucide:file';
  }

  console.log('✅ getFileIcon 결과:', { fileName, extension, iconType }); // 디버깅용
  return iconType;
};

/**
 * 파일 크기 검증 (10MB 제한)
 * @param file - 검증할 파일 객체
 * @returns 검증 결과 객체
 */
export const validateFileSize = (file: File): FileValidationResult => {
  console.log('🔧 validateFileSize 호출:', {
    fileName: file.name,
    size: file.size,
  }); // 디버깅용

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const isValid = file.size <= MAX_FILE_SIZE;

  const result: FileValidationResult = {
    isValid,
    fileSize: file.size,
    errorMessage: isValid
      ? undefined
      : `${file.name} 파일이 10MB 제한을 초과합니다.`,
  };

  console.log('✅ validateFileSize 결과:', result); // 디버깅용
  return result;
};

/**
 * 파일 형식 검증 (jpg, jpeg, png, svg만 허용)
 * @param file - 검증할 파일 객체
 * @returns 검증 결과
 */
export const validateFileFormat = (file: File): boolean => {
  console.log('🔧 validateFileFormat 호출:', {
    fileName: file.name,
    type: file.type,
  }); // 디버깅용

  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/svg+xml',
  ];

  const isValid = allowedTypes.includes(file.type);

  console.log('✅ validateFileFormat 결과:', { fileName: file.name, isValid }); // 디버깅용
  return isValid;
};

/**
 * 종합 파일 검증 함수
 * @param file - 검증할 파일 객체
 * @returns 종합 검증 결과
 */
export const validateFile = (file: File): FileValidationResult => {
  console.log('🔧 validateFile 종합 검증 시작:', { fileName: file.name }); // 디버깅용

  // 형식 검증
  if (!validateFileFormat(file)) {
    const result: FileValidationResult = {
      isValid: false,
      fileSize: file.size,
      errorMessage: `${file.name}은(는) 지원되지 않는 파일 형식입니다. (지원: JPG, PNG, SVG)`,
    };
    console.log('❌ 파일 형식 검증 실패:', result); // 디버깅용
    return result;
  }

  // 크기 검증
  const sizeValidation = validateFileSize(file);
  if (!sizeValidation.isValid) {
    console.log('❌ 파일 크기 검증 실패:', sizeValidation); // 디버깅용
    return sizeValidation;
  }

  const result: FileValidationResult = {
    isValid: true,
    fileSize: file.size,
  };

  console.log('✅ validateFile 종합 검증 성공:', result); // 디버깅용
  return result;
};
