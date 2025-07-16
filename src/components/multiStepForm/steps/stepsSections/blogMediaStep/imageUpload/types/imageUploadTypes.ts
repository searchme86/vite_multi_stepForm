// 📁 imageUpload/types/imageUploadTypes.ts

import type { RefObject } from 'react';

// 📋 기존 타입들 (레거시 호환성) - 실제 사용되는 타입으로 수정
export interface DeleteConfirmState {
  readonly isOpen: boolean;
  readonly imageIndex: number;
  readonly imageUrl: string;
}

export interface DuplicateMessageState {
  readonly isVisible: boolean;
  readonly fileName: string;
}

export interface TouchActiveImages {
  readonly [key: number]: boolean;
}

// 📋 실제 useImageUploadHandlers에서 사용되는 타입들로 수정
export interface UploadingState {
  readonly [key: string]: number; // progress 값을 number로 저장
}

export interface UploadStatusState {
  readonly [key: string]: 'error' | 'uploading' | 'success';
}

// 📋 Map 기반 새로운 타입들
export interface FileItem {
  readonly id: string;
  readonly fileName: string;
  readonly url: string;
  readonly status: 'pending' | 'processing' | 'completed' | 'error';
  readonly uploadProgress?: number;
  readonly error?: string;
  readonly timestamp: number;
}

export interface FileProcessingMap extends Map<string, FileItem> {}

export interface FileOrderArray extends Array<string> {}

export interface MapBasedFileState {
  readonly fileMap: FileProcessingMap;
  readonly fileOrder: FileOrderArray;
  readonly totalFiles: number;
  readonly completedFiles: number;
  readonly hasActiveUploads: boolean;
}

export interface FileStateActions {
  readonly addFile: (fileName: string, url: string, id?: string) => string;
  readonly updateFile: (
    id: string,
    updates: Partial<Omit<FileItem, 'id'>>
  ) => boolean;
  readonly removeFile: (id: string) => boolean;
  readonly clearAllFiles: () => void;
  readonly reorderFiles: (newOrder: string[]) => boolean;
  readonly getFileById: (id: string) => FileItem | undefined;
  readonly getFilesByStatus: (status: FileItem['status']) => FileItem[];
  readonly getFileUrls: () => string[];
  readonly getFileNames: () => string[];
  readonly convertToLegacyArrays: () => { urls: string[]; names: string[] };
}

export interface UseMapBasedFileStateResult {
  readonly state: MapBasedFileState;
  readonly actions: FileStateActions;
}

// 📋 메인 이미지 핸들러
export interface MainImageHandlers {
  readonly onMainImageSet: (imageIndex: number, imageUrl: string) => void;
  readonly onMainImageCancel: () => void;
  readonly checkIsMainImage: (imageUrl: string) => boolean;
  readonly checkCanSetAsMainImage: (imageUrl: string) => boolean;
}

// 📋 파일 선택 버튼 레퍼런스
export interface FileSelectButtonRef {
  readonly click: () => void;
}

// 📋 이미지 업로드 핸들러들
export interface ImageUploadHandlers {
  readonly uploading: UploadingState;
  readonly uploadStatus: UploadStatusState;
  readonly deleteConfirmState?: DeleteConfirmState;
  readonly duplicateMessageState?: DuplicateMessageState;
  readonly touchActiveImages?: TouchActiveImages;
  readonly hasActiveUploads: boolean;
  readonly isMobileDevice?: boolean;
  readonly handleFilesDropped?: (files: File[]) => void;
  readonly handleFileSelectClick?: () => void;
  readonly handleFileChange?: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => void;
  readonly handleDeleteButtonClick?: (
    imageIndex: number,
    imageUrl: string
  ) => void;
  readonly handleDeleteConfirm?: () => void;
  readonly handleDeleteCancel?: () => void;
  readonly handleImageTouch?: (imageIndex: number) => void;
}

// 📋 Context 값 타입 (기존 인터페이스 유지 + Map 기반 확장)
export interface ImageUploadContextValue {
  // 레거시 호환성 - 배열 기반
  readonly uploadedImages: string[];
  readonly selectedFileNames: string[];
  readonly uploading: UploadingState;
  readonly uploadStatus: UploadStatusState;
  readonly deleteConfirmState: DeleteConfirmState;
  readonly duplicateMessageState: DuplicateMessageState;
  readonly touchActiveImages: TouchActiveImages;
  readonly hasActiveUploads: boolean;
  readonly isMobileDevice: boolean;

  // 슬라이더 관련
  readonly selectedSliderIndices: number[];
  readonly isImageSelectedForSlider: (imageIndex: number) => boolean;
  readonly updateSliderSelection: (newSelectedIndices: number[]) => void;

  // 이벤트 핸들러들
  readonly handleFilesDropped: (files: File[]) => void;
  readonly handleFileSelectClick: () => void;
  readonly handleFileChange: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => void;
  readonly handleDeleteButtonClick: (
    imageIndex: number,
    imageUrl: string
  ) => void;
  readonly handleDeleteConfirm: () => void;
  readonly handleDeleteCancel: () => void;
  readonly handleImageTouch: (imageIndex: number) => void;

  // 메인 이미지 및 참조
  readonly mainImageHandlers: MainImageHandlers;
  readonly fileSelectButtonRef: RefObject<FileSelectButtonRef>;

  // Map 기반 확장 (선택적 - 향후 확장용)
  readonly mapFileState?: MapBasedFileState;
  readonly mapFileActions?: FileStateActions;
}

// 📋 토스트 메시지 타입
export interface SafeToastMessage {
  readonly title: string;
  readonly description: string;
  readonly color: 'success' | 'warning' | 'danger' | 'primary';
}

// 📋 영속성 백업 데이터 타입들
export interface SliderPersistenceBackupData {
  readonly selectedSliderIndices: readonly number[];
  readonly sliderImageUrls: readonly string[];
  readonly timestamp: number;
  readonly source: string;
  readonly mediaCount: number;
}

export interface MainImagePersistenceBackupData {
  readonly mainImage: string | null;
  readonly timestamp: number;
  readonly source: string;
  readonly mediaCount: number;
}

// 📋 Image Gallery Store Actions
export interface ImageGalleryStoreActions {
  setSliderSelectedIndices?: (indices: number[]) => void;
  updateSliderSelection?: (indices: number[]) => void;
  setSelectedSliderIndices?: (indices: number[]) => void;
}

// 📋 상태 추적 타입들
export interface RestoreState {
  readonly isRestoreCompleted: boolean;
  readonly mainImageRestored: boolean;
  readonly sliderRestored: boolean;
  readonly lastRestoreTimestamp: number;
}

export interface StrictModeTracker {
  readonly isStrictMode: boolean;
  readonly executionCount: number;
  readonly lastExecutionTime: number;
}

export interface FileStateSynchronizer {
  readonly isLegacyDataLoaded: boolean;
  readonly isSyncCompleted: boolean;
  readonly lastSyncTimestamp: number;
}

// 📋 유틸리티 타입들
export type FileStatus = 'pending' | 'processing' | 'completed' | 'error';
export type ToastColor = 'success' | 'warning' | 'danger' | 'primary';

// 📋 파일 ID 관련 유틸리티 타입
export type FileId = string;
export type FileUrl = string;
export type FileName = string;

// 📋 업로드 핸들러 파라미터 타입
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
}

// 📋 Export all types
export type {
  FileItem as MapFileItem,
  FileProcessingMap as FileMap,
  FileOrderArray as OrderArray,
  MapBasedFileState as FileState,
  FileStateActions as FileActions,
  UseMapBasedFileStateResult as FileStateResult,
};
