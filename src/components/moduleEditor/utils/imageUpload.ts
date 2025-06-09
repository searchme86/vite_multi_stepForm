export const fileToBase64 = (file: File): Promise<string> => {
  console.log('🔄 [IMAGE_UTILS] Base64 변환 시작:', {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
  });

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        console.log('✅ [IMAGE_UTILS] Base64 변환 완료:', file.name);
        resolve(reader.result);
      } else {
        console.error('❌ [IMAGE_UTILS] 파일 읽기 실패 - 결과가 문자열이 아님');
        reject(new Error('파일을 읽을 수 없습니다.'));
      }
    };

    reader.onerror = () => {
      console.error('❌ [IMAGE_UTILS] FileReader 오류:', reader.error);
      reject(new Error('파일 읽기 중 오류가 발생했습니다.'));
    };

    reader.readAsDataURL(file);
  });
};

export const isImageFile = (file: File): boolean => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ];

  const isValid = allowedTypes.includes(file.type);

  console.log('🔍 [IMAGE_UTILS] 이미지 파일 검증:', {
    fileName: file.name,
    fileType: file.type,
    isValid,
  });

  return isValid;
};
