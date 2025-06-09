import { useCallback } from 'react';
import { fileToBase64, isImageFile } from '../utils/imageUpload';

interface UseImageUploadProps {
  setIsUploadingImage: (loading: boolean) => void;
  setUploadError: (error: string | null) => void;
}

export function useImageUpload({
  setIsUploadingImage,
  setUploadError,
}: UseImageUploadProps) {
  console.log('🪝 [USE_IMAGE_UPLOAD] 훅 초기화');

  const handleImageUpload = useCallback(
    async (files: File[]): Promise<string[]> => {
      console.log('🖼️ [USE_IMAGE_UPLOAD] 이미지 업로드 시작:', files.length);

      const imageFiles = files.filter(isImageFile);

      if (imageFiles.length === 0) {
        console.warn('⚠️ [USE_IMAGE_UPLOAD] 이미지 파일 없음');
        setUploadError('이미지 파일만 업로드할 수 있습니다.');
        return [];
      }

      const oversizedFiles = imageFiles.filter(
        (file) => file.size > 10 * 1024 * 1024
      );

      if (oversizedFiles.length > 0) {
        console.warn(
          '⚠️ [USE_IMAGE_UPLOAD] 파일 크기 초과:',
          oversizedFiles.length
        );
        setUploadError('10MB 이하의 이미지만 업로드할 수 있습니다.');
        return [];
      }

      setIsUploadingImage(true);
      setUploadError(null);

      console.log('🔄 [USE_IMAGE_UPLOAD] base64 변환 시작');

      try {
        const base64Promises = imageFiles.map(async (file) => {
          try {
            const base64Data = await fileToBase64(file);
            console.log('✅ [USE_IMAGE_UPLOAD] 파일 변환 완료:', file.name);
            return base64Data;
          } catch (error) {
            console.error(
              '❌ [USE_IMAGE_UPLOAD] 파일 변환 실패:',
              file.name,
              error
            );
            throw new Error(`${file.name} 변환에 실패했습니다.`);
          }
        });

        const base64Results = await Promise.all(base64Promises);

        console.log(
          '✅ [USE_IMAGE_UPLOAD] 모든 이미지 업로드 완료:',
          imageFiles.length
        );
        return base64Results;
      } catch (error) {
        console.error('❌ [USE_IMAGE_UPLOAD] 이미지 업로드 실패:', error);
        setUploadError(
          error instanceof Error
            ? error.message
            : '이미지 업로드 중 오류가 발생했습니다.'
        );
        return [];
      } finally {
        setIsUploadingImage(false);
      }
    },
    [setIsUploadingImage, setUploadError]
  );

  return {
    handleImageUpload,
  };
}
