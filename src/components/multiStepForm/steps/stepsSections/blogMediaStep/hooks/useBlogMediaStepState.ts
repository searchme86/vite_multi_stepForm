// blogMediaStep/hooks/useBlogMediaStepState.ts - BlogMediaStep 컴포넌트

/**
 * BlogMediaStep 컴포넌트 - 전체 상태 관리 통합 훅
 * 모든 로컬 상태와 글로벌 상태를 중앙에서 관리
 * 각 기능별 컨테이너에서 필요한 상태와 함수들을 제공
 * ✅ Zustand ImageGallery 스토어와 자동 동기화 기능 추가
 * ✅ 타입 단언 제거 및 구체 타입 사용
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useBlogMediaStepIntegration } from './useBlogMediaStepIntegration';
import { useBlogMediaStepOrchestrator } from './useBlogMediaStepOrchestrator';
import { useImageGalleryStore } from '../../../../../../store/imageGallery/imageGalleryStore';
import type { ImageViewConfig } from '../../../../../../store/shared/commonTypes';

// ✅ 구체적인 동기화 데이터 타입 정의
interface PreviousSyncData {
  media: string[];
  mainImage: string | null;
}

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

// ✅ 초기 동기화 데이터 팩토리 함수
const createInitialSyncData = (): PreviousSyncData => {
  const emptyMediaArray: string[] = [];
  const nullMainImage: string | null = null;

  return {
    media: emptyMediaArray,
    mainImage: nullMainImage,
  };
};

// ✅ 미디어 배열 안전 복사 함수
const createSafeMediaArray = (mediaSource: string[]): string[] => {
  const safeMediaArray = Array.isArray(mediaSource) ? mediaSource : [];
  return [...safeMediaArray];
};

// ✅ 메인 이미지 안전 추출 함수
const extractSafeMainImage = (mainImageSource: unknown): string | null => {
  if (typeof mainImageSource === 'string' && mainImageSource.length > 0) {
    return mainImageSource;
  }
  return null;
};

/**
 * BlogMediaStep 전체 상태 관리 훅
 * 모든 상태를 중앙에서 관리하고 각 컨테이너에 필요한 상태를 제공
 * ✅ Zustand ImageGallery 스토어와 자동 동기화 기능 포함
 * ✅ 타입 단언 완전 제거
 */
export const useBlogMediaStepState = (): BlogMediaStepStateResult => {
  console.log('🔧 useBlogMediaStepState 훅 초기화 - 타입단언제거'); // 디버깅용

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
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [visibleFilesCount, setVisibleFilesCount] = useState<number>(5); // INITIAL_VISIBLE_FILES
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
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

  // ✅ 초기화 ref - 타입 단언 제거
  const initializationRef = useRef<boolean>(false);

  // ✅ 타입 단언 완전 제거 - 구체적인 팩토리 함수 사용
  const previousSyncDataRef = useRef<PreviousSyncData>(createInitialSyncData());

  // ✅ 새로 추가: 양방향 Zustand 동기화 함수 - 구조분해할당 + fallback 적용
  const syncFormToImageGalleryStore = useCallback(
    (mediaFiles: string[], mainImageUrl: string | null) => {
      if (!imageGalleryStore) {
        console.log('⚠️ [ZUSTAND_SYNC] imageGalleryStore가 없음');
        return;
      }

      try {
        // ✅ 구조분해할당 + fallback으로 안전한 메서드 추출
        const updateImageViewConfig = Reflect.get(
          imageGalleryStore,
          'updateImageViewConfig'
        );

        const isValidUpdateFunction =
          typeof updateImageViewConfig === 'function';
        if (!isValidUpdateFunction) {
          console.error(
            '❌ [ZUSTAND_SYNC] updateImageViewConfig가 함수가 아님'
          );
          return;
        }

        // ✅ 안전한 미디어 배열 처리
        const safeMediaFiles = createSafeMediaArray(mediaFiles);
        const safeMainImageUrl = extractSafeMainImage(mainImageUrl);

        // 메인 이미지가 있는 경우 해당 인덱스를 첫 번째로 설정
        let clickOrderArray = safeMediaFiles.map((_, imageIndex) => imageIndex);

        if (safeMainImageUrl) {
          const mainImageIndex = safeMediaFiles.indexOf(safeMainImageUrl);
          const isValidMainImageIndex = mainImageIndex >= 0;

          if (isValidMainImageIndex) {
            const remainingIndices = clickOrderArray.filter(
              (index) => index !== mainImageIndex
            );
            clickOrderArray = [mainImageIndex, ...remainingIndices];
          }
        }

        const galleryConfig: Partial<ImageViewConfig> = {
          selectedImages: safeMediaFiles,
          clickOrder: clickOrderArray,
          layout: {
            columns: 3,
            gridType: 'grid',
          },
          filter: 'all',
        };

        updateImageViewConfig(galleryConfig);

        const { length: mediaFilesCount } = safeMediaFiles;
        const mainImageIndex = safeMainImageUrl
          ? safeMediaFiles.indexOf(safeMainImageUrl)
          : -1;
        const { length: clickOrderLength } = clickOrderArray;
        const firstImagePreview = safeMediaFiles[0]
          ? safeMediaFiles[0].slice(0, 30) + '...'
          : 'none';

        console.log('✅ [ZUSTAND_SYNC] 폼 → 갤러리 스토어 동기화 완료:', {
          selectedImagesCount: mediaFilesCount,
          mainImageIndex,
          clickOrderLength,
          firstImagePreview,
          timestamp: new Date().toLocaleTimeString(),
        });
      } catch (syncError) {
        const { length: mediaFilesCount } = mediaFiles || [];
        const hasMainImage =
          mainImageUrl !== null && mainImageUrl !== undefined;

        console.error('❌ [ZUSTAND_SYNC] 폼 → 갤러리 스토어 동기화 실패:', {
          error: syncError,
          mediaFilesCount,
          hasMainImage,
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    },
    [imageGalleryStore]
  );

  // ✅ 폼 값과 로컬 상태 동기화 + Zustand 동기화 추가 - 구조분해할당 + fallback
  useEffect(() => {
    const { currentFormValues: formValues } = integration;
    const {
      sliderImages = [],
      media = [],
      mainImage = null,
    } = formValues || {};

    // 슬라이더 이미지 동기화
    const localSliderImagesJson = JSON.stringify(localSliderImages);
    const sliderImagesJson = JSON.stringify(sliderImages);
    const hasSliderImagesChanged = localSliderImagesJson !== sliderImagesJson;

    if (hasSliderImagesChanged) {
      const { length: beforeCount } = localSliderImages;
      const { length: afterCount } = sliderImages;

      console.log('🔄 로컬 슬라이더 이미지 동기화:', {
        before: beforeCount,
        after: afterCount,
        timestamp: new Date().toLocaleTimeString(),
      }); // 디버깅용

      setLocalSliderImages(sliderImages);
    }

    // 미디어 파일 동기화
    const localMediaFilesJson = JSON.stringify(localMediaFiles);
    const mediaJson = JSON.stringify(media);
    const hasMediaFilesChanged = localMediaFilesJson !== mediaJson;

    if (hasMediaFilesChanged) {
      const { length: beforeCount } = localMediaFiles;
      const { length: afterCount } = media;

      console.log('🔄 로컬 미디어 파일 동기화:', {
        before: beforeCount,
        after: afterCount,
        timestamp: new Date().toLocaleTimeString(),
      }); // 디버깅용

      setLocalMediaFiles(media);
    }

    // ✅ 새로 추가: Zustand 갤러리 스토어 동기화 - 구조분해할당 + fallback
    const { current: previousData } = previousSyncDataRef;
    const { media: previousMedia = [], mainImage: previousMainImage = null } =
      previousData || {};

    const previousMediaJson = JSON.stringify(previousMedia);
    const currentMediaJson = JSON.stringify(media);
    const hasMediaChanged = previousMediaJson !== currentMediaJson;
    const hasMainImageChanged = previousMainImage !== mainImage;
    const shouldSyncToStore = hasMediaChanged || hasMainImageChanged;

    if (shouldSyncToStore) {
      const { length: mediaCount } = media;
      const hasMainImage = mainImage !== null && mainImage !== undefined;
      const mainImagePreview = mainImage
        ? mainImage.slice(0, 30) + '...'
        : 'none';

      console.log(
        '🔄 [ZUSTAND_SYNC] 폼 변경 감지로 갤러리 스토어 동기화 시작:',
        {
          hasMediaChanged,
          hasMainImageChanged,
          mediaCount,
          hasMainImage,
          mainImagePreview,
          timestamp: new Date().toLocaleTimeString(),
        }
      );

      syncFormToImageGalleryStore(media, mainImage);

      // 이전 데이터 업데이트 - 타입 단언 없이 안전한 복사
      const updatedSyncData: PreviousSyncData = {
        media: createSafeMediaArray(media),
        mainImage: extractSafeMainImage(mainImage),
      };
      previousSyncDataRef.current = updatedSyncData;
    }
  }, [
    integration.currentFormValues,
    localSliderImages,
    localMediaFiles,
    syncFormToImageGalleryStore,
  ]);

  // ✅ 새로 추가: 초기 로드 시 Zustand 동기화 - 구조분해할당 + fallback
  useEffect(() => {
    const { currentFormValues: formValues } = integration;
    const { media = [], mainImage = null } = formValues || {};
    const { length: mediaCount } = media;
    const hasInitialData = mediaCount > 0;
    const { current: isInitialized } = initializationRef;

    const shouldPerformInitialSync = hasInitialData && !isInitialized;

    if (shouldPerformInitialSync) {
      const hasInitialMainImage = mainImage !== null && mainImage !== undefined;

      console.log('🚀 [ZUSTAND_SYNC] 초기 로드 시 갤러리 스토어 동기화:', {
        initialMediaCount: mediaCount,
        hasInitialMainImage,
        timestamp: new Date().toLocaleTimeString(),
      });

      syncFormToImageGalleryStore(media, mainImage);

      const initialSyncData: PreviousSyncData = {
        media: createSafeMediaArray(media),
        mainImage: extractSafeMainImage(mainImage),
      };
      previousSyncDataRef.current = initialSyncData;
    }
  }, [integration.currentFormValues, syncFormToImageGalleryStore]);

  // ✅ 모바일 감지 - 실무형 방법 사용
  useEffect(() => {
    const checkMobile = () => {
      const currentWindowWidth = window.innerWidth;
      const mobileBreakpoint = 768;
      const mobile = currentWindowWidth < mobileBreakpoint;

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
      const { length: activeUploadsCount } = Object.keys(newUploading);
      console.log('🔄 업로드 진행률 업데이트:', {
        activeUploads: activeUploadsCount,
      }); // 디버깅용
      setUploading(newUploading);
    },
    []
  );

  const handleSetUploadStatus = useCallback(
    (newStatus: Record<string, 'uploading' | 'success' | 'error'>) => {
      const { length: statusCount } = Object.keys(newStatus);
      console.log('🔄 업로드 상태 업데이트:', {
        statusCount,
      }); // 디버깅용
      setUploadStatus(newStatus);
    },
    []
  );

  // ✅ 선택 상태 관리 함수들
  const handleSetSelectedFiles = useCallback((files: number[]) => {
    const { length: fileCount } = files;
    console.log('🔄 선택된 파일 업데이트:', { count: fileCount }); // 디버깅용
    setSelectedFiles(files);
  }, []);

  const handleSetSelectedSliderImages = useCallback((images: number[]) => {
    const { length: imageCount } = images;
    console.log('🔄 선택된 슬라이더 이미지 업데이트:', {
      count: imageCount,
    }); // 디버깅용
    setSelectedSliderImages(images);
  }, []);

  const handleSetSelectedFileNames = useCallback((names: string[]) => {
    const { length: nameCount } = names;
    console.log('🔄 선택된 파일명 업데이트:', { count: nameCount }); // 디버깅용
    setSelectedFileNames(names);
  }, []);

  // ✅ 로컬 상태 관리 함수들
  const handleSetLocalSliderImages = useCallback((images: string[]) => {
    const { length: imageCount } = images;
    console.log('🔄 로컬 슬라이더 이미지 직접 업데이트:', {
      count: imageCount,
      timestamp: new Date().toLocaleTimeString(),
    }); // 디버깅용
    setLocalSliderImages(images);
  }, []);

  const handleSetLocalMediaFiles = useCallback((files: string[]) => {
    const { length: fileCount } = files;
    console.log('🔄 로컬 미디어 파일 직접 업데이트:', {
      count: fileCount,
      timestamp: new Date().toLocaleTimeString(),
    }); // 디버깅용
    setLocalMediaFiles(files);
  }, []);

  // ✅ 초기화 로그 (한 번만)
  useEffect(() => {
    const { current: isInitialized } = initializationRef;

    if (!isInitialized) {
      const hasIntegration = integration !== null && integration !== undefined;
      const hasOrchestrator =
        orchestrator !== null && orchestrator !== undefined;
      const hasImageGalleryStore =
        imageGalleryStore !== null && imageGalleryStore !== undefined;

      console.log('✅ useBlogMediaStepState 초기화 완료 - 타입단언제거:', {
        hasIntegration,
        hasOrchestrator,
        hasImageGalleryStore,
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
