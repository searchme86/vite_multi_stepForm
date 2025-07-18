// src/hooks/useImageUpload.ts

import { useState, useCallback, useRef } from 'react';
import type { ImageUploadState } from '../types/userInfoTypes';
import {
  isValidImageFile,
  debugTypeCheck,
  isStringValue,
} from '../types/userInfoTypes';
import { convertImageToBase64 } from '../utils/userInfoHelpers';
import { validateImageSize as validateSize } from '../utils/userInfoValidation';

interface UseImageUploadProps {
  readonly onImageUpdate: (imageData: string) => void;
  readonly onError: (message: string) => void;
  readonly maxFileSize?: number;
}

interface UseImageUploadReturn {
  readonly imageState: ImageUploadState;
  readonly fileInputRef: React.RefObject<HTMLInputElement>;
  readonly handleImageUpload: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => Promise<void>;
  readonly clearImage: () => void;
  readonly triggerFileSelect: () => void;
  readonly isUploading: boolean;
}

const isHTMLInputElement = (
  target: EventTarget | null
): target is HTMLInputElement => {
  return (
    target !== null && target instanceof HTMLInputElement && 'files' in target
  );
};

const isValidFileList = (files: unknown): files is FileList => {
  if (files === null || files === undefined) {
    return false;
  }

  if (typeof files !== 'object') {
    return false;
  }

  return files instanceof FileList;
};

const isValidFile = (file: File | null): file is File => {
  if (file === null) {
    return false;
  }

  if (!(file instanceof File)) {
    return false;
  }

  const { name: fileName, type: fileType, size: fileSize } = file;

  return (
    typeof fileName === 'string' &&
    typeof fileType === 'string' &&
    typeof fileSize === 'number'
  );
};

const getFileFromInputEvent = (
  event: React.ChangeEvent<HTMLInputElement>
): File | null => {
  console.log(
    '🔧 getFileFromInputEvent: 파일 입력 이벤트에서 파일 추출',
    event
  );

  if (!event || typeof event !== 'object') {
    console.error('❌ getFileFromInputEvent: 유효하지 않은 이벤트 객체', {
      event,
      type: typeof event,
    });
    return null;
  }

  const { target: eventTarget } = event;

  if (!isHTMLInputElement(eventTarget)) {
    console.error(
      '❌ getFileFromInputEvent: target이 HTMLInputElement가 아님',
      {
        target: eventTarget,
        targetType: typeof eventTarget,
      }
    );
    return null;
  }

  const { files: inputFiles } = eventTarget;

  if (!isValidFileList(inputFiles)) {
    console.error('❌ getFileFromInputEvent: files가 FileList가 아님', {
      files: inputFiles,
      type: typeof inputFiles,
    });
    return null;
  }

  const selectedFile = inputFiles[0] || null;

  if (!isValidFile(selectedFile)) {
    if (selectedFile !== null) {
      console.error('❌ getFileFromInputEvent: 유효하지 않은 File 객체', {
        file: selectedFile,
        fileType: typeof selectedFile,
      });
    }
    return null;
  }

  if (!isValidImageFile(selectedFile)) {
    console.error('❌ getFileFromInputEvent: 유효하지 않은 이미지 파일');
    return null;
  }

  console.log('✅ getFileFromInputEvent: 파일 추출 성공');

  return selectedFile;
};

export const useImageUpload = ({
  onImageUpdate,
  onError,
  maxFileSize = 5 * 1024 * 1024,
}: UseImageUploadProps): UseImageUploadReturn => {
  console.log('🖼️ useImageUpload: 이미지 업로드 훅 초기화', { maxFileSize });

  debugTypeCheck(onImageUpdate, 'function');
  debugTypeCheck(onError, 'function');
  debugTypeCheck(maxFileSize, 'number');

  const validatedMaxFileSize = (() => {
    const isValidSize =
      typeof maxFileSize === 'number' &&
      maxFileSize > 0 &&
      Number.isFinite(maxFileSize);

    if (isValidSize) {
      return maxFileSize;
    }

    const fallbackSize = 5 * 1024 * 1024;
    console.warn('⚠️ useImageUpload: 유효하지 않은 maxFileSize, 기본값 사용', {
      providedSize: maxFileSize,
      sizeType: typeof maxFileSize,
      isFinite: Number.isFinite(maxFileSize),
      fallbackSize,
    });

    return fallbackSize;
  })();

  const [imageState, setImageState] = useState<ImageUploadState>({
    imageSrc: '',
    showCropper: false,
    cropData: null,
  });

  const [isUploading, setIsUploading] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  console.log('🖼️ useImageUpload: 현재 이미지 상태', imageState);

  const validateImageFile = useCallback(
    (file: File): { isValid: boolean; errorMessage?: string } => {
      console.log('🔍 validateImageFile: 이미지 파일 검증 시작');

      debugTypeCheck(file, 'File');

      if (!isValidImageFile(file)) {
        const errorMessage = '이미지 파일만 업로드 가능합니다.';
        console.log('❌ validateImageFile: 파일 타입 오류');
        return { isValid: false, errorMessage };
      }

      if (!validateSize(file)) {
        const maxSizeInMB = (validatedMaxFileSize / 1024 / 1024).toFixed(0);
        const errorMessage = `파일 크기는 ${maxSizeInMB}MB 이하여야 합니다.`;
        console.log('❌ validateImageFile: 파일 크기 오류');
        return { isValid: false, errorMessage };
      }

      console.log('✅ validateImageFile: 검증 통과');
      return { isValid: true };
    },
    [validatedMaxFileSize]
  );

  const handleImageUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
      console.log('📤 handleImageUpload: 이미지 업로드 시작');
      debugTypeCheck(event, 'object');

      if (!event || typeof event !== 'object') {
        console.error('❌ handleImageUpload: 유효하지 않은 이벤트 객체', {
          event,
          type: typeof event,
        });
        onError('파일 업로드 중 오류가 발생했습니다.');
        return;
      }

      const selectedFile = getFileFromInputEvent(event);

      if (!selectedFile) {
        console.log(
          '⚠️ handleImageUpload: 선택된 파일 없음 또는 유효하지 않은 파일'
        );
        return;
      }

      setIsUploading(true);

      try {
        const validationResult = validateImageFile(selectedFile);
        const { isValid: isFileValid, errorMessage: validationError } =
          validationResult;

        if (!isFileValid) {
          const finalErrorMessage =
            validationError || '파일 업로드에 실패했습니다.';
          console.log('❌ handleImageUpload: 파일 검증 실패');
          onError(finalErrorMessage);
          return;
        }

        console.log('🔄 handleImageUpload: Base64 변환 시작');
        const base64ConversionResult = await convertImageToBase64(selectedFile);

        const isValidBase64Result =
          isStringValue(base64ConversionResult) &&
          base64ConversionResult.trim().length > 0;

        if (!isValidBase64Result) {
          const conversionErrorMessage =
            '이미지 변환 결과가 유효하지 않습니다.';
          console.error('❌ handleImageUpload: Base64 변환 결과 검증 실패', {
            result: base64ConversionResult,
            resultType: typeof base64ConversionResult,
            resultLength: isStringValue(base64ConversionResult)
              ? base64ConversionResult.length
              : 0,
            errorMessage: conversionErrorMessage,
          });
          onError(conversionErrorMessage);
          return;
        }

        setImageState((previousState) => ({
          ...previousState,
          imageSrc: base64ConversionResult,
          showCropper: false,
          cropData: null,
        }));

        onImageUpdate(base64ConversionResult);

        console.log('✅ handleImageUpload: 이미지 업로드 성공');
      } catch (uploadError) {
        const finalErrorMessage =
          uploadError instanceof Error
            ? uploadError.message
            : '이미지 업로드에 실패했습니다.';

        console.error('❌ handleImageUpload: 업로드 실패', { uploadError });

        onError(finalErrorMessage);
      } finally {
        setIsUploading(false);

        const { current: fileInputElement } = fileInputRef;
        if (fileInputElement) {
          fileInputElement.value = '';
          console.log('🔄 handleImageUpload: 파일 입력 초기화 완료');
        }
      }
    },
    [validateImageFile, onImageUpdate, onError]
  );

  const clearImage = useCallback((): void => {
    console.log('🗑️ clearImage: 이미지 제거');

    setImageState({
      imageSrc: '',
      showCropper: false,
      cropData: null,
    });

    onImageUpdate('');

    const { current: fileInputElement } = fileInputRef;
    if (fileInputElement) {
      fileInputElement.value = '';
      console.log('🗑️ clearImage: 파일 입력 초기화 완료');
    }

    console.log('✅ clearImage: 이미지 제거 완료');
  }, [onImageUpdate]);

  const triggerFileSelect = useCallback((): void => {
    console.log('📁 triggerFileSelect: 파일 선택 창 열기');

    const { current: fileInputElement } = fileInputRef;
    const hasFileInputElement = fileInputElement !== null;
    const hasClickMethod =
      fileInputElement && typeof fileInputElement.click === 'function';

    if (hasFileInputElement && hasClickMethod) {
      try {
        fileInputElement.click();
        console.log('✅ triggerFileSelect: 파일 선택 창 열기 성공');
      } catch (clickError) {
        const clickErrorMessage =
          clickError instanceof Error ? clickError.message : '알 수 없는 오류';
        console.error('❌ triggerFileSelect: 파일 선택 창 열기 실패', {
          error: clickError,
          errorMessage: clickErrorMessage,
        });
        onError('파일 선택 창을 열 수 없습니다.');
      }
    } else {
      console.error(
        '❌ triggerFileSelect: 파일 입력 참조 없음 또는 click 메서드 없음',
        {
          hasRef: hasFileInputElement,
          hasClick: hasClickMethod,
        }
      );
      onError('파일 선택 창을 열 수 없습니다.');
    }
  }, [onError]);

  console.log('✅ useImageUpload: 이미지 업로드 훅 초기화 완료');

  return {
    imageState,
    fileInputRef,
    handleImageUpload,
    clearImage,
    triggerFileSelect,
    isUploading,
  };
};
