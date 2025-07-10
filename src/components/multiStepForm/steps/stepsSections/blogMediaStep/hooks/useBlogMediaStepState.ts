// blogMediaStep/hooks/useBlogMediaStepState.ts - BlogMediaStep 컴포넌트

/**
 * BlogMediaStep 컴포넌트 - 전체 상태 관리 통합 훅
 * 모든 로컬 상태와 글로벌 상태를 중앙에서 관리
 * 각 기능별 컨테이너에서 필요한 상태와 함수들을 제공
 * ✅ Zustand ImageGallery 스토어와 자동 동기화 기능 추가
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useBlogMediaStepIntegration } from './useBlogMediaStepIntegration';
import { useBlogMediaStepOrchestrator } from './useBlogMediaStepOrchestrator';
import { useImageGalleryStore } from '../../../../../../store/imageGallery/imageGalleryStore';
import type { ImageViewConfig } from '../../../../../../store/shared/commonTypes';

// ✅ 업로드 상태 타입
interface UploadState {
  uploading: Record<string, number>;
  uploadStatus: Record<string, 'uploading' | 'success' | 'error'>;
}

// ✅ UI 상태 타입
interface UIState {
  isMobile: boolean;
  dragActive: boolean;
  visibleFilesCount: number;
  isExpanded: boolean;
  sortBy: 'index' | 'name' | 'size';
}

// ✅ 선택 상태 타입
interface SelectionState {
  selectedFiles: number[];
  selectedSliderImages: number[];
  selectedFileNames: string[];
}

// ✅ 모달 상태 타입
interface ModalState {
  selectedModalImage: string;
  selectedModalImageName: string;
}

// ✅ 전체 상태 관리 훅 반환 타입
interface BlogMediaStepStateResult {
  // 폼 관련 상태
  formValues: ReturnType<
    typeof useBlogMediaStepIntegration
  >['currentFormValues'];
  setMediaValue: ReturnType<
    typeof useBlogMediaStepIntegration
  >['setMediaValue'];
  setMainImageValue: ReturnType<
    typeof useBlogMediaStepIntegration
  >['setMainImageValue'];
  setSliderImagesValue: ReturnType<
    typeof useBlogMediaStepIntegration
  >['setSliderImagesValue'];

  // 업로드 상태
  uploadState: UploadState;
  setUploading: (uploading: Record<string, number>) => void;
  setUploadStatus: (
    status: Record<string, 'uploading' | 'success' | 'error'>
  ) => void;

  // UI 상태
  uiState: UIState;
  setDragActive: (active: boolean) => void;
  setVisibleFilesCount: (count: number) => void;
  setIsExpanded: (expanded: boolean) => void;
  setSortBy: (sortBy: 'index' | 'name' | 'size') => void;
  setIsMobile: (isMobile: boolean) => void;

  // 선택 상태
  selectionState: SelectionState;
  setSelectedFiles: (files: number[]) => void;
  setSelectedSliderImages: (images: number[]) => void;
  setSelectedFileNames: (names: string[]) => void;

  // 모달 상태
  modalState: ModalState;
  setSelectedModalImage: (image: string) => void;
  setSelectedModalImageName: (name: string) => void;

  // 로컬 상태 (실시간 동기화용)
  localSliderImages: string[];
  setLocalSliderImages: (images: string[]) => void;
  localMediaFiles: string[];
  setLocalMediaFiles: (files: string[]) => void;

  // 통합 기능들
  addToast: ReturnType<typeof useBlogMediaStepIntegration>['addToast'];
  orchestrator: ReturnType<typeof useBlogMediaStepOrchestrator>;

  // 외부 스토어
  imageGalleryStore: ReturnType<typeof useImageGalleryStore>;
}

/**
 * BlogMediaStep 전체 상태 관리 훅
 * 모든 상태를 중앙에서 관리하고 각 컨테이너에 필요한 상태를 제공
 * ✅ Zustand ImageGallery 스토어와 자동 동기화 기능 포함
 */
export const useBlogMediaStepState = (): BlogMediaStepStateResult => {
  console.log('🔧 useBlogMediaStepState 훅 초기화 - Zustand연동'); // 디버깅용

  // ✅ 통합 훅들
  const integration = useBlogMediaStepIntegration();
  const orchestrator = useBlogMediaStepOrchestrator();
  const imageGalleryStore = useImageGalleryStore();

  // ✅ 업로드 상태
  const [uploading, setUploading] = useState<Record<string, number>>({});
  const [uploadStatus, setUploadStatus] = useState<
    Record<string, 'uploading' | 'success' | 'error'>
  >({});

  // ✅ UI 상태
  const [isMobile, setIsMobile] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [visibleFilesCount, setVisibleFilesCount] = useState(5); // INITIAL_VISIBLE_FILES
  const [isExpanded, setIsExpanded] = useState(false);
  const [sortBy, setSortBy] = useState<'index' | 'name' | 'size'>('index');

  // ✅ 선택 상태
  const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
  const [selectedSliderImages, setSelectedSliderImages] = useState<number[]>(
    []
  );
  const [selectedFileNames, setSelectedFileNames] = useState<string[]>([]);

  // ✅ 모달 상태
  const [selectedModalImage, setSelectedModalImage] = useState<string>('');
  const [selectedModalImageName, setSelectedModalImageName] =
    useState<string>('');

  // ✅ 로컬 상태 (실시간 동기화용)
  const [localSliderImages, setLocalSliderImages] = useState<string[]>([]);
  const [localMediaFiles, setLocalMediaFiles] = useState<string[]>([]);

  // ✅ 초기화 ref
  const initializationRef = useRef(false);
  const previousSyncDataRef = useRef({
    media: [] as string[],
    mainImage: null as string | null,
  });

  // ✅ 새로 추가: 양방향 Zustand 동기화 함수
  const syncFormToImageGalleryStore = useCallback(
    (mediaFiles: string[], mainImageUrl: string | null) => {
      if (!imageGalleryStore) {
        console.log('⚠️ [ZUSTAND_SYNC] imageGalleryStore가 없음');
        return;
      }

      try {
        const { updateImageViewConfig } = imageGalleryStore;

        if (typeof updateImageViewConfig !== 'function') {
          console.error(
            '❌ [ZUSTAND_SYNC] updateImageViewConfig가 함수가 아님'
          );
          return;
        }

        // 메인 이미지가 있는 경우 해당 인덱스를 첫 번째로 설정
        let clickOrderArray = mediaFiles.map((_, imageIndex) => imageIndex);

        if (mainImageUrl) {
          const mainImageIndex = mediaFiles.indexOf(mainImageUrl);
          if (mainImageIndex >= 0) {
            clickOrderArray = [
              mainImageIndex,
              ...clickOrderArray.filter((index) => index !== mainImageIndex),
            ];
          }
        }

        const galleryConfig: Partial<ImageViewConfig> = {
          selectedImages: mediaFiles,
          clickOrder: clickOrderArray,
          layout: {
            columns: 3,
            gridType: 'grid',
          },
          filter: 'all',
        };

        updateImageViewConfig(galleryConfig);

        console.log('✅ [ZUSTAND_SYNC] 폼 → 갤러리 스토어 동기화 완료:', {
          selectedImagesCount: mediaFiles.length,
          mainImageIndex: mainImageUrl ? mediaFiles.indexOf(mainImageUrl) : -1,
          clickOrderLength: clickOrderArray.length,
          firstImagePreview: mediaFiles[0]
            ? mediaFiles[0].slice(0, 30) + '...'
            : 'none',
          timestamp: new Date().toLocaleTimeString(),
        });
      } catch (syncError) {
        console.error('❌ [ZUSTAND_SYNC] 폼 → 갤러리 스토어 동기화 실패:', {
          error: syncError,
          mediaFilesCount: mediaFiles.length,
          hasMainImage: mainImageUrl ? true : false,
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    },
    [imageGalleryStore]
  );

  // ✅ 폼 값과 로컬 상태 동기화 + Zustand 동기화 추가
  useEffect(() => {
    const { sliderImages, media, mainImage } = integration.currentFormValues;

    // 슬라이더 이미지 동기화
    if (JSON.stringify(localSliderImages) !== JSON.stringify(sliderImages)) {
      console.log('🔄 로컬 슬라이더 이미지 동기화:', {
        before: localSliderImages.length,
        after: sliderImages.length,
        timestamp: new Date().toLocaleTimeString(),
      }); // 디버깅용

      setLocalSliderImages(sliderImages);
    }

    // 미디어 파일 동기화
    if (JSON.stringify(localMediaFiles) !== JSON.stringify(media)) {
      console.log('🔄 로컬 미디어 파일 동기화:', {
        before: localMediaFiles.length,
        after: media.length,
        timestamp: new Date().toLocaleTimeString(),
      }); // 디버깅용

      setLocalMediaFiles(media);
    }

    // ✅ 새로 추가: Zustand 갤러리 스토어 동기화
    const previousData = previousSyncDataRef.current;
    const hasMediaChanged =
      JSON.stringify(previousData.media) !== JSON.stringify(media);
    const hasMainImageChanged = previousData.mainImage !== mainImage;
    const shouldSyncToStore = hasMediaChanged || hasMainImageChanged;

    if (shouldSyncToStore) {
      console.log(
        '🔄 [ZUSTAND_SYNC] 폼 변경 감지로 갤러리 스토어 동기화 시작:',
        {
          hasMediaChanged,
          hasMainImageChanged,
          mediaCount: media.length,
          hasMainImage: mainImage ? true : false,
          mainImagePreview: mainImage ? mainImage.slice(0, 30) + '...' : 'none',
          timestamp: new Date().toLocaleTimeString(),
        }
      );

      syncFormToImageGalleryStore(media, mainImage);

      // 이전 데이터 업데이트
      previousSyncDataRef.current = {
        media: [...media],
        mainImage,
      };
    }
  }, [
    integration.currentFormValues,
    localSliderImages,
    localMediaFiles,
    syncFormToImageGalleryStore,
  ]);

  // ✅ 새로 추가: 초기 로드 시 Zustand 동기화
  useEffect(() => {
    const { media, mainImage } = integration.currentFormValues;
    const hasInitialData = media.length > 0;

    if (hasInitialData && !initializationRef.current) {
      console.log('🚀 [ZUSTAND_SYNC] 초기 로드 시 갤러리 스토어 동기화:', {
        initialMediaCount: media.length,
        hasInitialMainImage: mainImage ? true : false,
        timestamp: new Date().toLocaleTimeString(),
      });

      syncFormToImageGalleryStore(media, mainImage);

      previousSyncDataRef.current = {
        media: [...media],
        mainImage,
      };
    }
  }, [integration.currentFormValues, syncFormToImageGalleryStore]);

  // ✅ 모바일 감지
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      if (mobile !== isMobile) {
        console.log('📱 모바일 상태 변경:', { isMobile: mobile }); // 디버깅용
        setIsMobile(mobile);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, [isMobile]);

  // ✅ 업로드 상태 관리 함수들 (useCallback으로 안정화)
  const handleSetUploading = useCallback(
    (newUploading: Record<string, number>) => {
      console.log('🔄 업로드 진행률 업데이트:', {
        activeUploads: Object.keys(newUploading).length,
      }); // 디버깅용
      setUploading(newUploading);
    },
    []
  );

  const handleSetUploadStatus = useCallback(
    (newStatus: Record<string, 'uploading' | 'success' | 'error'>) => {
      console.log('🔄 업로드 상태 업데이트:', {
        statusCount: Object.keys(newStatus).length,
      }); // 디버깅용
      setUploadStatus(newStatus);
    },
    []
  );

  // ✅ 선택 상태 관리 함수들
  const handleSetSelectedFiles = useCallback((files: number[]) => {
    console.log('🔄 선택된 파일 업데이트:', { count: files.length }); // 디버깅용
    setSelectedFiles(files);
  }, []);

  const handleSetSelectedSliderImages = useCallback((images: number[]) => {
    console.log('🔄 선택된 슬라이더 이미지 업데이트:', {
      count: images.length,
    }); // 디버깅용
    setSelectedSliderImages(images);
  }, []);

  const handleSetSelectedFileNames = useCallback((names: string[]) => {
    console.log('🔄 선택된 파일명 업데이트:', { count: names.length }); // 디버깅용
    setSelectedFileNames(names);
  }, []);

  // ✅ 로컬 상태 관리 함수들
  const handleSetLocalSliderImages = useCallback((images: string[]) => {
    console.log('🔄 로컬 슬라이더 이미지 직접 업데이트:', {
      count: images.length,
      timestamp: new Date().toLocaleTimeString(),
    }); // 디버깅용
    setLocalSliderImages(images);
  }, []);

  const handleSetLocalMediaFiles = useCallback((files: string[]) => {
    console.log('🔄 로컬 미디어 파일 직접 업데이트:', {
      count: files.length,
      timestamp: new Date().toLocaleTimeString(),
    }); // 디버깅용
    setLocalMediaFiles(files);
  }, []);

  // ✅ 초기화 로그 (한 번만)
  useEffect(() => {
    if (!initializationRef.current) {
      console.log('✅ useBlogMediaStepState 초기화 완료 - Zustand연동:', {
        hasIntegration: !!integration,
        hasOrchestrator: !!orchestrator,
        hasImageGalleryStore: !!imageGalleryStore,
        initialFormValues: integration.currentFormValues,
        zustandSyncEnabled: true,
        timestamp: new Date().toLocaleTimeString(),
      }); // 디버깅용

      initializationRef.current = true;
    }
  }, [integration, orchestrator, imageGalleryStore]);

  // ✅ 상태 객체들 생성 (메모이제이션)
  const uploadState: UploadState = {
    uploading,
    uploadStatus,
  };

  const uiState: UIState = {
    isMobile,
    dragActive,
    visibleFilesCount,
    isExpanded,
    sortBy,
  };

  const selectionState: SelectionState = {
    selectedFiles,
    selectedSliderImages,
    selectedFileNames,
  };

  const modalState: ModalState = {
    selectedModalImage,
    selectedModalImageName,
  };

  return {
    // 폼 관련 상태
    formValues: integration.currentFormValues,
    setMediaValue: integration.setMediaValue,
    setMainImageValue: integration.setMainImageValue,
    setSliderImagesValue: integration.setSliderImagesValue,

    // 업로드 상태
    uploadState,
    setUploading: handleSetUploading,
    setUploadStatus: handleSetUploadStatus,

    // UI 상태
    uiState,
    setDragActive,
    setVisibleFilesCount,
    setIsExpanded,
    setSortBy,
    setIsMobile,

    // 선택 상태
    selectionState,
    setSelectedFiles: handleSetSelectedFiles,
    setSelectedSliderImages: handleSetSelectedSliderImages,
    setSelectedFileNames: handleSetSelectedFileNames,

    // 모달 상태
    modalState,
    setSelectedModalImage,
    setSelectedModalImageName,

    // 로컬 상태
    localSliderImages,
    setLocalSliderImages: handleSetLocalSliderImages,
    localMediaFiles,
    setLocalMediaFiles: handleSetLocalMediaFiles,

    // 통합 기능들
    addToast: integration.addToast,
    orchestrator,

    // 외부 스토어
    imageGalleryStore,
  };
};
