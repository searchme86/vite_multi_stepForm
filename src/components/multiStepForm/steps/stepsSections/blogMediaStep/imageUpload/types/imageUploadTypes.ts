// 📁 imageUpload/types/imageUploadTypes.ts

// 🚨 FIXED: 실제 훅 구현에 맞게 수정된 타입들 - 타입 정의와 실제 구현 일치화
export interface DeleteConfirmState {
  readonly isVisible?: boolean; // ✅ 옵셔널로 변경 - 실제 사용되는 속성명
  readonly isOpen?: boolean; // ✅ 옵셔널로 변경 - 호환성 유지
  readonly imageIndex: number;
  readonly imageName?: string; // ✅ 옵셔널로 변경 - 실제 사용되는 속성명
  readonly imageUrl?: string; // ✅ 옵셔널로 변경 - 호환성 유지
}

export interface DuplicateMessageState {
  readonly isVisible: boolean;
  readonly message?: string; // ✅ 옵셔널로 변경 - 실제 사용되는 속성명
  readonly fileName?: string; // ✅ 옵셔널로 변경 - 호환성 유지
  readonly fileNames?: readonly string[]; // ✅ 실제 사용되는 속성 추가
  readonly animationKey?: number; // ✅ 실제 사용되는 속성 추가
}

// 🔧 간소화된 업로드 상태 타입들
export type UploadProgressRecord = Record<string, number>;
export type UploadStatusRecord = Record<
  string,
  'uploading' | 'success' | 'error'
>;

// 🔧 파일 선택 버튼 참조
export interface FileSelectButtonRef {
  readonly click: () => void;
}

// 🔧 토스트 메시지 타입
export interface ToastMessage {
  readonly title: string;
  readonly description: string;
  readonly color: 'success' | 'warning' | 'danger' | 'primary';
}

// 🔧 중복 파일 결과 타입
export interface DuplicateFileResult {
  readonly uniqueFiles: File[];
  readonly duplicateFiles: File[];
}

// 🚨 FIXED: FileStateActions 타입 추가
export interface FileStateActions {
  readonly addFile: (fileName: string, url: string) => void;
  readonly updateFile: (
    fileId: string,
    updates: { fileName?: string; url?: string }
  ) => void;
  readonly removeFile: (fileId: string) => void;
  readonly getFileUrls: () => readonly string[];
  readonly getFileNames: () => readonly string[];
  readonly clearAllFiles: () => void;
  readonly convertToLegacyArrays: () => {
    urls: readonly string[];
    names: readonly string[];
  };
}

// 🚨 FIXED: 훅 매개변수 타입에 mapFileActions 추가
export interface UseImageUploadHandlersParams {
  readonly formValues: unknown;
  readonly uiState: unknown;
  readonly selectionState: unknown;
  readonly updateMediaValue: (
    filesOrUpdater:
      | readonly string[]
      | ((prev: readonly string[]) => readonly string[])
  ) => void;
  readonly setMainImageValue: (value: string) => void;
  readonly updateSelectedFileNames: (
    namesOrUpdater:
      | readonly string[]
      | ((prev: readonly string[]) => readonly string[])
  ) => void;
  readonly showToastMessage: (toast: unknown) => void;
  readonly imageGalleryStore: unknown;
  readonly mapFileActions?: FileStateActions; // 🚨 FIXED: 추가됨
}

// 🔧 훅 반환 타입 (간소화)
export interface UseImageUploadHandlersResult {
  // 상태 데이터
  readonly uploading: UploadProgressRecord;
  readonly uploadStatus: UploadStatusRecord;
  readonly deleteConfirmState: DeleteConfirmState;
  readonly duplicateMessageState: DuplicateMessageState;
  readonly touchActiveImages: Set<number>;
  readonly hasActiveUploads: boolean;
  readonly isMobileDevice: boolean;

  // 슬라이더 상태
  readonly selectedSliderIndices: readonly number[];
  readonly isImageSelectedForSlider: (imageIndex: number) => boolean;

  // 파일 처리 핸들러
  readonly handleFilesDropped: (files: File[]) => void;
  readonly handleFileSelectClick: () => void;
  readonly handleFileChange: (files: FileList) => void;

  // 이미지 관리 핸들러
  readonly handleDeleteButtonClick: (index: number, name: string) => void;
  readonly handleDeleteConfirm: () => void;
  readonly handleDeleteCancel: () => void;
  readonly handleImageTouch: (index: number) => void;

  // 메인 이미지 핸들러
  readonly handleMainImageSet: (imageIndex: number, imageUrl: string) => void;
  readonly handleMainImageCancel: () => void;
  readonly checkIsMainImage: (imageUrl: string) => boolean;
  readonly checkCanSetAsMainImage: (imageUrl: string) => boolean;

  // 슬라이더 전용 핸들러
  readonly updateSliderSelection: (newSelectedIndices: number[]) => void;
}

// 🔧 내부 상태 추출 함수들용 타입
export interface ExtractedFormData {
  readonly media: readonly string[];
  readonly mainImage: string;
}

export interface ExtractedSelectionData {
  readonly selectedFileNames: readonly string[];
  readonly selectedSliderIndices: readonly number[];
}

export interface ExtractedStoreData {
  readonly selectedSliderIndices: readonly number[];
  readonly setSliderSelectedIndices?: (indices: number[]) => void;
  readonly updateSliderSelection?: (indices: number[]) => void;
  readonly setSelectedSliderIndices?: (indices: number[]) => void;
}

// 🚨 FIXED: Context 관련 타입들 추가
export interface MainImageHandlers {
  readonly onMainImageSet: (imageIndex: number, imageUrl: string) => void;
  readonly onMainImageCancel: () => void;
  readonly checkIsMainImage: (imageUrl: string) => boolean;
  readonly checkCanSetAsMainImage: (imageUrl: string) => boolean;
}

// 🚨 FIXED: 실제 구현과 일치하도록 타입 정의 수정
export interface ImageUploadContextValue {
  readonly uploadedImages: readonly string[];
  readonly selectedFileNames: readonly string[];
  readonly uploading: UploadProgressRecord;
  readonly uploadStatus: UploadStatusRecord;
  readonly deleteConfirmState: {
    readonly isOpen?: boolean; // ✅ 옵셔널로 변경
    readonly isVisible?: boolean; // ✅ 실제 사용되는 속성 추가
    readonly imageIndex: number;
    readonly imageUrl?: string; // ✅ 옵셔널로 변경
    readonly imageName?: string; // ✅ 실제 사용되는 속성 추가
  };
  readonly duplicateMessageState: {
    readonly isVisible: boolean;
    readonly message?: string; // ✅ 옵셔널로 변경
    readonly fileName?: string; // ✅ 옵셔널로 변경
    readonly fileNames?: readonly string[]; // ✅ 실제 사용되는 속성 추가
  };
  readonly touchActiveImages: Record<number, boolean>;
  readonly hasActiveUploads: boolean;
  readonly isMobileDevice: boolean;
  readonly selectedSliderIndices: readonly number[];
  readonly isImageSelectedForSlider: (imageIndex: number) => boolean;
  readonly updateSliderSelection: (newSelectedIndices: number[]) => void;
  readonly handleFilesDropped: (files: File[]) => void;
  readonly handleFileSelectClick: () => void;
  readonly handleFileChange: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => void;
  readonly handleDeleteButtonClick: (index: number, name: string) => void;
  readonly handleDeleteConfirm: () => void;
  readonly handleDeleteCancel: () => void;
  readonly handleImageTouch: (index: number) => void;
  readonly mainImageHandlers: MainImageHandlers;
  readonly fileSelectButtonRef: React.RefObject<FileSelectButtonRef>;
}

// 🔧 추가 유틸리티 타입들
export interface FileUploadProgress {
  readonly fileId: string;
  readonly fileName: string;
  readonly progress: number;
  readonly status: 'pending' | 'uploading' | 'completed' | 'error';
  readonly error?: string;
}

export interface FileUploadBatch {
  readonly batchId: string;
  readonly files: readonly File[];
  readonly totalSize: number;
  readonly startTime: number;
  readonly endTime?: number;
  readonly status: 'preparing' | 'uploading' | 'completed' | 'error';
}

export interface ImageGalleryItem {
  readonly id: string;
  readonly url: string;
  readonly fileName: string;
  readonly thumbnail?: string;
  readonly isMainImage: boolean;
  readonly isSelected: boolean;
  readonly uploadProgress?: number;
  readonly error?: string;
}

export interface SliderConfiguration {
  readonly selectedIndices: readonly number[];
  readonly maxSelection: number;
  readonly enableMultiSelect: boolean;
  readonly autoSlide: boolean;
  readonly slideInterval?: number;
}

// 🔧 파일 처리 관련 타입들
export interface FileProcessingOptions {
  readonly maxFileSize: number;
  readonly allowedTypes: readonly string[];
  readonly enableDuplicateCheck: boolean;
  readonly enableContentHashCheck: boolean;
  readonly compressionQuality?: number;
  readonly thumbnailSize?: {
    readonly width: number;
    readonly height: number;
  };
}

export interface FileValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly processedFile?: File;
}

// 🔧 에러 처리 관련 타입들
export interface ImageUploadError {
  readonly code: string;
  readonly message: string;
  readonly details?: unknown;
  readonly timestamp: number;
  readonly recoverable: boolean;
}

export interface ErrorBoundaryState {
  readonly hasError: boolean;
  readonly error?: ImageUploadError;
  readonly errorInfo?: string;
  readonly retryCount: number;
}

// 🔧 성능 모니터링 관련 타입들
export interface PerformanceMetrics {
  readonly uploadStartTime: number;
  readonly uploadEndTime?: number;
  readonly filesProcessed: number;
  readonly totalSize: number;
  readonly averageSpeed?: number; // bytes per second
  readonly errors: readonly ImageUploadError[];
}

// 🔧 접근성 관련 타입들
export interface AccessibilityOptions {
  readonly enableScreenReader: boolean;
  readonly keyboardNavigation: boolean;
  readonly highContrast: boolean;
  readonly announceUploads: boolean;
  readonly customAriaLabels?: Record<string, string>;
}

// 🔧 국제화 관련 타입들
export interface LocalizationConfig {
  readonly locale: string;
  readonly messages: Record<string, string>;
  readonly dateFormat: string;
  readonly numberFormat: string;
}

// 🔧 테마 관련 타입들
export interface ThemeConfiguration {
  readonly variant: 'light' | 'dark' | 'auto';
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly borderRadius: number;
  readonly spacing: number;
  readonly customCss?: string;
}
