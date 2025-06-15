// blogMediaStep/imageGallery/parts/gallery/ImagePreviewModal.tsx - ImageGallery 컴포넌트

import React from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from '@heroui/react';

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  imageName: string;
  isMobile?: boolean;
}

function ImagePreviewModal({
  isOpen,
  onClose,
  imageUrl,
  imageName,
  isMobile = false,
}: ImagePreviewModalProps): React.ReactNode {
  console.log('🔧 ImagePreviewModal 렌더링:', {
    isOpen,
    hasImageUrl: !!imageUrl,
    imageName,
    isMobile,
  });

  if (!imageUrl) {
    console.log('⚠️ ImagePreviewModal imageUrl이 없음');
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={isMobile ? 'full' : '2xl'}
      scrollBehavior="inside"
      backdrop="blur"
      classNames={{
        base: isMobile ? 'm-0 rounded-none' : '',
        body: 'p-6',
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">이미지 미리보기</h2>
          <p className="text-sm truncate text-default-600" title={imageName}>
            {imageName}
          </p>
        </ModalHeader>

        <ModalBody>
          <div className="flex justify-center">
            <img
              src={imageUrl}
              alt={imageName}
              className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
              onError={(e) => {
                console.log('❌ ImagePreviewModal 이미지 로드 실패:', {
                  imageName,
                });
                const target = e.target as HTMLImageElement;
                target.src =
                  'https://via.placeholder.com/300x200?text=이미지+로드+실패';
              }}
            />
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            color="default"
            variant="light"
            onPress={onClose}
            type="button"
          >
            닫기
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default ImagePreviewModal;
