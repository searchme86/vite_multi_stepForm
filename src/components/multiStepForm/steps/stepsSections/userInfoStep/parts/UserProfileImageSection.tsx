// userInfoStep/parts/UserProfileImageSection.tsx

import { Avatar, Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useImageUpload } from '../hooks/useImageUpload';
import { debugTypeCheck } from '../types/userInfoTypes';

/**
 * UserInfoStep - 프로필 이미지 섹션 컴포넌트
 * 사용자 프로필 이미지 업로드, 미리보기, 변경 기능을 제공합니다.
 */

interface UserProfileImageSectionProps {
  readonly currentImage?: string;
  readonly onImageChange: (imageData: string) => void;
  readonly onError: (message: string) => void;
}

function UserProfileImageSection({
  currentImage = '',
  onImageChange,
  onError,
}: UserProfileImageSectionProps) {
  console.log('🖼️ UserProfileImageSection: 프로필 이미지 섹션 렌더링', {
    hasCurrentImage: !!currentImage,
  });

  debugTypeCheck(currentImage, 'string');
  debugTypeCheck(onImageChange, 'function');
  debugTypeCheck(onError, 'function');

  // 이미지 업로드 훅 사용
  const {
    imageState,
    fileInputRef,
    handleImageUpload,
    triggerFileSelect,
    isUploading,
  } = useImageUpload({
    onImageUpdate: onImageChange,
    onError,
    maxFileSize: 5 * 1024 * 1024, // 5MB
  });

  // 표시할 이미지 결정 (업로드된 이미지 우선, 없으면 기본 이미지)
  const displayImage =
    imageState.imageSrc ||
    currentImage ||
    'https://img.heroui.chat/image/avatar?w=200&h=200&u=15';

  console.log('🖼️ UserProfileImageSection: 표시될 이미지', {
    displayImage: displayImage.substring(0, 50) + '...',
  });

  return (
    <div className="flex flex-col items-center w-full sm:w-auto">
      {/* 프로필 이미지와 업로드 버튼 */}
      <div className="relative">
        {/* 프로필 이미지 */}
        <Avatar
          src={displayImage}
          className="w-28 h-28 text-large"
          alt="사용자 프로필 이미지"
          role="img"
          aria-label="사용자 프로필 이미지"
        />

        {/* 이미지 업로드 버튼 */}
        <Button
          isIconOnly
          color="primary"
          variant="light"
          radius="full"
          size="sm"
          className="absolute bottom-0 right-0 shadow-md"
          onPress={triggerFileSelect}
          isLoading={isUploading}
          disabled={isUploading}
          aria-label="프로필 이미지 변경"
          type="button"
        >
          {/* 업로드 중일 때와 일반 상태 아이콘 구분 */}
          {isUploading ? (
            <Icon
              icon="lucide:loader-2"
              className="animate-spin"
              aria-hidden="true"
            />
          ) : (
            <Icon icon="lucide:camera" aria-hidden="true" />
          )}
        </Button>

        {/* 숨겨진 파일 입력 */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleImageUpload}
          aria-label="이미지 파일 선택"
        />
      </div>

      {/* 업로드 상태 표시 */}
      {isUploading && (
        <p
          className="mt-2 text-xs text-default-500"
          role="status"
          aria-live="polite"
        >
          이미지 업로드 중...
        </p>
      )}

      {/* 이미지 업로드 안내 */}
      <p
        className="mt-2 text-xs text-center text-default-400 max-w-32"
        role="note"
      >
        사진을 클릭하여 프로필 이미지를 변경하세요
      </p>
    </div>
  );
}

export default UserProfileImageSection;
