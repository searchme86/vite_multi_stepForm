// 📁 imageUpload/types/imageUploadTypes.ts

export interface DeleteConfirmState {
  readonly isVisible?: boolean;
  readonly isOpen?: boolean;
  readonly imageIndex: number;
  readonly imageName?: string;
  readonly imageUrl?: string;
}

export interface DuplicateMessageState {
  readonly isVisible: boolean;
  readonly message?: string;
  readonly fileName?: string;
  readonly fileNames?: readonly string[];
  readonly animationKey?: number;
}

export type UploadProgressRecord = Record<string, number>;
export type UploadStatusRecord = Record<
  string,
  'uploading' | 'success' | 'error'
>;

export interface FileSelectButtonRef {
  readonly click: () => void;
}

export interface ToastMessage {
  readonly title: string;
  readonly description: string;
  readonly color: 'success' | 'warning' | 'danger' | 'primary';
}

export interface DuplicateFileResult {
  readonly uniqueFiles: File[];
  readonly duplicateFiles: File[];
}

// 🚨 FIXED: 누락된 Map 관련 타입들 추가
export type FileStatus = 'pending' | 'processing' | 'completed' | 'error';

export interface FileItem {
  readonly id: string;
  readonly fileName: string;
  readonly url: string;
  readonly status: FileStatus;
  readonly timestamp: number;
  readonly uploadProgress?: number;
}

export type FileProcessingMap = Map<string, FileItem>;
export type FileOrderArray = readonly string[];

export interface MapBasedFileState {
  readonly fileMap: FileProcessingMap;
  readonly fileOrder: FileOrderArray;
  readonly totalFiles: number;
  readonly completedFiles: number;
  readonly hasActiveUploads: boolean;
}

// 🚨 FIXED: FileStateActions 타입 완전 정의
export interface FileStateActions {
  readonly addFile: (fileName: string, url: string) => string;
  readonly updateFile: (
    fileId: string,
    updates: { fileName?: string; url?: string; status?: FileStatus }
  ) => boolean;
  readonly removeFile: (fileId: string) => boolean;
  readonly getFileById: (fileId: string) => FileItem | undefined;
  readonly getFileUrls: () => string[];
  readonly getFileNames: () => string[];
  readonly clearAllFiles: () => void;
  readonly convertToLegacyArrays: () => {
    urls: string[];
    names: string[];
  };
  readonly reorderFiles: (newOrder: readonly string[]) => boolean;
  readonly getFilesByStatus: (status: FileStatus) => readonly FileItem[];
}

export interface UseMapBasedFileStateResult {
  readonly state: MapBasedFileState;
  readonly actions: FileStateActions;
}

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
  readonly mapFileActions?: FileStateActions;
}

export interface UseImageUploadHandlersResult {
  readonly uploading: UploadProgressRecord;
  readonly uploadStatus: UploadStatusRecord;
  readonly deleteConfirmState: DeleteConfirmState;
  readonly duplicateMessageState: DuplicateMessageState;
  readonly touchActiveImages: Set<number>;
  readonly hasActiveUploads: boolean;
  readonly isMobileDevice: boolean;
  readonly selectedSliderIndices: readonly number[];
  readonly isImageSelectedForSlider: (imageIndex: number) => boolean;
  readonly handleFilesDropped: (files: File[]) => void;
  readonly handleFileSelectClick: () => void;
  readonly handleFileChange: (files: FileList) => void;
  readonly handleDeleteButtonClick: (index: number, name: string) => void;
  readonly handleDeleteConfirm: () => void;
  readonly handleDeleteCancel: () => void;
  readonly handleImageTouch: (index: number) => void;
  readonly handleMainImageSet: (imageIndex: number, imageUrl: string) => void;
  readonly handleMainImageCancel: () => void;
  readonly checkIsMainImage: (imageUrl: string) => boolean;
  readonly checkCanSetAsMainImage: (imageUrl: string) => boolean;
  readonly updateSliderSelection: (newSelectedIndices: number[]) => void;
}

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

export interface MainImageHandlers {
  readonly onMainImageSet: (imageIndex: number, imageUrl: string) => void;
  readonly onMainImageCancel: () => void;
  readonly checkIsMainImage: (imageUrl: string) => boolean;
  readonly checkCanSetAsMainImage: (imageUrl: string) => boolean;
}

export interface ImageUploadContextValue {
  readonly uploadedImages: readonly string[];
  readonly selectedFileNames: readonly string[];
  readonly uploading: UploadProgressRecord;
  readonly uploadStatus: UploadStatusRecord;
  readonly deleteConfirmState: {
    readonly isOpen?: boolean;
    readonly isVisible?: boolean;
    readonly imageIndex: number;
    readonly imageUrl?: string;
    readonly imageName?: string;
  };
  readonly duplicateMessageState: {
    readonly isVisible: boolean;
    readonly message?: string;
    readonly fileName?: string;
    readonly fileNames?: readonly string[];
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

export interface PerformanceMetrics {
  readonly uploadStartTime: number;
  readonly uploadEndTime?: number;
  readonly filesProcessed: number;
  readonly totalSize: number;
  readonly averageSpeed?: number;
  readonly errors: readonly ImageUploadError[];
}

export interface AccessibilityOptions {
  readonly enableScreenReader: boolean;
  readonly keyboardNavigation: boolean;
  readonly highContrast: boolean;
  readonly announceUploads: boolean;
  readonly customAriaLabels?: Record<string, string>;
}

export interface LocalizationConfig {
  readonly locale: string;
  readonly messages: Record<string, string>;
  readonly dateFormat: string;
  readonly numberFormat: string;
}

export interface ThemeConfiguration {
  readonly variant: 'light' | 'dark' | 'auto';
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly borderRadius: number;
  readonly spacing: number;
  readonly customCss?: string;
}
