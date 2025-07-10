// blogMediaStep/imageUpload/types/imageUploadTypes.ts

export interface DeleteConfirmState {
  isVisible: boolean;
  imageIndex: number;
  imageName: string;
}

export interface DuplicateMessageState {
  isVisible: boolean;
  message: string;
  fileNames: string[];
  animationKey: number;
}

export interface UploadProgressState {
  uploading: Record<string, number>;
  uploadStatus: Record<string, 'uploading' | 'success' | 'error'>;
}

// ✅ Phase4: 메인 이미지 관련 핸들러 타입 추가
export interface MainImageHandlers {
  onMainImageSet: (imageIndex: number, imageUrl: string) => void;
  onMainImageCancel: () => void;
  checkIsMainImage: (imageUrl: string) => boolean;
  checkCanSetAsMainImage: (imageUrl: string) => boolean;
}

// ✅ Phase4: 확장된 파일 업로드 콜백 (메인 이미지 포함)
export interface FileUploadCallbacks {
  onFilesDropped: (files: File[]) => void;
  onFileSelectClick: () => void;
  onFileChange: (files: FileList) => void;
  onDeleteButtonClick: (imageIndex: number, imageName: string) => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  onImageTouch: (imageIndex: number) => void;

  // ✅ Phase4: 메인 이미지 관련 콜백 추가
  onMainImageSet?: (imageIndex: number, imageUrl: string) => void;
  onMainImageCancel?: () => void;
}

// ✅ Phase4: 확장된 이미지 업로드 상태 (메인 이미지 포함)
export interface ImageUploadState {
  deleteConfirmState: DeleteConfirmState;
  duplicateMessageState: DuplicateMessageState;
  touchActiveImages: Set<number>;
  hasActiveUploads: boolean;

  // ✅ Phase4: 메인 이미지 상태 추가
  mainImageHandlers?: MainImageHandlers;
}

// ✅ Phase4: 메인 이미지 포함 ImageCard Props 타입
export interface ExtendedImageCardProps {
  imageUrl: string;
  imageIndex: number;
  imageDisplayName: string;
  isTouchActive: boolean;
  isMobileDevice: boolean;
  onImageTouch: (imageIndex: number) => void;
  onDeleteButtonClick: (imageIndex: number, imageDisplayName: string) => void;

  // ✅ Phase4: 메인 이미지 관련 props
  isMainImage?: boolean;
  canSetAsMainImage?: boolean;
  onMainImageSet?: (imageIndex: number, imageUrl: string) => void;
  onMainImageCancel?: () => void;
}

// ✅ Phase4: 메인 이미지 포함 ImageList Props 타입
export interface ExtendedImageListProps {
  mediaFiles: string[];
  selectedFileNames: string[];
  touchActiveImages: Set<number>;
  isMobileDevice: boolean;
  onImageTouch: (imageIndex: number) => void;
  onDeleteButtonClick: (imageIndex: number, imageDisplayName: string) => void;

  // ✅ Phase4: 메인 이미지 관련 props
  mainImageHandlers?: MainImageHandlers;
}

// ✅ Phase4: 메인 이미지 포함 UploadedImageSection Props 타입
export interface ExtendedUploadedImageSectionProps {
  mediaFiles: string[];
  selectedFileNames: string[];
  deleteConfirmState: DeleteConfirmState;
  duplicateMessageState: DuplicateMessageState;
  touchActiveImages: Set<number>;
  isMobileDevice: boolean;
  onDeleteButtonClick: (imageIndex: number, imageDisplayName: string) => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  onImageTouch: (imageIndex: number) => void;

  // ✅ Phase4: 메인 이미지 관련 props
  mainImageHandlers?: MainImageHandlers;
}

export interface DuplicateFileResult {
  uniqueFiles: File[];
  duplicateFiles: File[];
}
