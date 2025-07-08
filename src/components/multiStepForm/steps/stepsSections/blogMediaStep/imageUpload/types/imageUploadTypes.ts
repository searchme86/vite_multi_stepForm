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

export interface FileUploadCallbacks {
  onFilesDropped: (files: File[]) => void;
  onFileSelectClick: () => void;
  onFileChange: (files: FileList) => void;
  onDeleteButtonClick: (imageIndex: number, imageName: string) => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  onImageTouch: (imageIndex: number) => void;
}

export interface ImageUploadState {
  deleteConfirmState: DeleteConfirmState;
  duplicateMessageState: DuplicateMessageState;
  touchActiveImages: Set<number>;
  hasActiveUploads: boolean;
}

export interface DuplicateFileResult {
  uniqueFiles: File[];
  duplicateFiles: File[];
}
