// blogMediaStep/imageGallery/hooks/gallery/useImageModal.ts - ImageGallery 컴포넌트

import { useCallback } from 'react';
import { useDisclosure } from '@heroui/react';
import { useBlogMediaStepState } from '../../../hooks/useBlogMediaStepState';

export interface ImageModalState {
  isOpen: boolean;
  selectedImage: string;
  selectedImageName: string;
}

export interface ImageModalActions {
  openImageModal: (imageUrl: string, imageName: string) => void;
  closeImageModal: () => void;
  getModalState: () => ImageModalState;
}

export const useImageModal = (): ImageModalActions => {
  console.log('🔧 useImageModal 훅 초기화');

  const { modalState, setSelectedModalImage, setSelectedModalImageName } =
    useBlogMediaStepState();

  const { selectedModalImage, selectedModalImageName } = modalState;

  const {
    isOpen: isImageModalOpen,
    onOpen: onImageModalOpen,
    onClose: onImageModalClose,
  } = useDisclosure();

  const openImageModal = useCallback(
    (imageUrl: string, imageName: string) => {
      console.log('🔧 openImageModal 호출:', {
        imageUrl: imageUrl.slice(0, 30) + '...',
        imageName,
      });

      setSelectedModalImage(imageUrl);
      setSelectedModalImageName(imageName);
      onImageModalOpen();

      console.log('✅ openImageModal 완료:', {
        imageName,
        timestamp: new Date().toLocaleTimeString(),
      });
    },
    [setSelectedModalImage, setSelectedModalImageName, onImageModalOpen]
  );

  const closeImageModal = useCallback(() => {
    console.log('🔧 closeImageModal 호출');

    onImageModalClose();

    setTimeout(() => {
      setSelectedModalImage('');
      setSelectedModalImageName('');
    }, 200);

    console.log('✅ closeImageModal 완료');
  }, [onImageModalClose, setSelectedModalImage, setSelectedModalImageName]);

  const getModalState = useCallback((): ImageModalState => {
    console.log('🔧 getModalState 호출');

    const state: ImageModalState = {
      isOpen: isImageModalOpen,
      selectedImage: selectedModalImage,
      selectedImageName: selectedModalImageName,
    };

    console.log('✅ getModalState 결과:', {
      isOpen: state.isOpen,
      hasImage: !!state.selectedImage,
      imageName: state.selectedImageName,
    });

    return state;
  }, [isImageModalOpen, selectedModalImage, selectedModalImageName]);

  console.log('✅ useImageModal 초기화 완료:', {
    isOpen: isImageModalOpen,
    hasSelectedImage: !!selectedModalImage,
    timestamp: new Date().toLocaleTimeString(),
  });

  return {
    openImageModal,
    closeImageModal,
    getModalState,
  };
};
