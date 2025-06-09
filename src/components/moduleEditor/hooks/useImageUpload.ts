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
      console.log('🖼️ [USE_IMAGE_UPLOAD] 이미지 업로드 시작:', {
        fileCount: files.length,
        fileNames: files.map((f) => f.name),
        fileSizes: files.map((f) => f.size),
        fileTypes: files.map((f) => f.type),
        timestamp: Date.now(),
      });
      const imageFiles = files.filter(isImageFile);

      console.log('🔍 [USE_IMAGE_UPLOAD] 파일 필터링 결과:', {
        originalCount: files.length,
        imageFileCount: imageFiles.length,
        filteredOut: files.length - imageFiles.length,
      });

      if (imageFiles.length === 0) {
        console.warn('⚠️ [USE_IMAGE_UPLOAD] 이미지 파일 없음');
        setUploadError('이미지 파일만 업로드할 수 있습니다.');
        return [];
      }

      const oversizedFiles = imageFiles.filter(
        (file) => file.size > 10 * 1024 * 1024
      );

      console.log('📏 [USE_IMAGE_UPLOAD] 파일 크기 검증:', {
        imageFileCount: imageFiles.length,
        oversizedCount: oversizedFiles.length,
        oversizedFiles: oversizedFiles.map((f) => ({
          name: f.name,
          size: f.size,
        })),
      });

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
        const base64Promises = imageFiles.map(async (file, index) => {
          try {
            console.log(
              `🔄 [USE_IMAGE_UPLOAD] 파일 ${index + 1}/${
                imageFiles.length
              } 변환 시작:`,
              file.name
            );
            const base64Data = await fileToBase64(file);
            console.log(
              `✅ [USE_IMAGE_UPLOAD] 파일 ${index + 1}/${
                imageFiles.length
              } 변환 완료:`,
              {
                fileName: file.name,
                resultLength: base64Data.length,
                resultPreview: base64Data.slice(0, 50) + '...',
              }
            );
            return base64Data;
          } catch (error) {
            console.error(
              `❌ [USE_IMAGE_UPLOAD] 파일 변환 실패:`,
              file.name,
              error
            );
            throw new Error(`${file.name} 변환에 실패했습니다.`);
          }
        });

        const base64Results = await Promise.all(base64Promises);

        console.log('✅ [USE_IMAGE_UPLOAD] 모든 이미지 업로드 완료:', {
          originalFileCount: imageFiles.length,
          resultCount: base64Results.length,
          resultSizes: base64Results.map((r) => r.length),
          timestamp: Date.now(),
        });

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
        console.log('🏁 [USE_IMAGE_UPLOAD] 업로드 프로세스 완료');
      }
    },
    [setIsUploadingImage, setUploadError]
  );

  return {
    handleImageUpload,
  };
}
