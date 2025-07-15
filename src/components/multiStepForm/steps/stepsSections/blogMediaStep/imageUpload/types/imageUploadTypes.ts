// 📁 imageUpload/types/imageUploadTypes.ts

// 🎯 Phase 8: Context 패턴 완전 적용을 위한 타입 정리 완성
// ✅ Props 인터페이스 완전 제거 + any 타입 제거 + Context Only 패턴

// 🔧 핵심 상태 타입들 (유지)

export interface DeleteConfirmState {
  readonly isVisible: boolean;
  readonly imageIndex: number;
  readonly imageName: string;
}

export interface DuplicateMessageState {
  readonly isVisible: boolean;
  readonly message: string;
  readonly fileNames: readonly string[];
  readonly animationKey: number;
}

export interface UploadProgressState {
  readonly uploading: Record<string, number>;
  readonly uploadStatus: Record<string, 'uploading' | 'success' | 'error'>;
}

// 🔧 메인 이미지 관련 핸들러 타입 (유지)
export interface MainImageHandlers {
  readonly onMainImageSet: (imageIndex: number, imageUrl: string) => void;
  readonly onMainImageCancel: () => void;
  readonly checkIsMainImage: (imageUrl: string) => boolean;
  readonly checkCanSetAsMainImage: (imageUrl: string) => boolean;
}

// 🔧 확장된 파일 업로드 콜백 (메인 이미지 포함)
export interface FileUploadCallbacks {
  readonly onFilesDropped: (files: File[]) => void;
  readonly onFileSelectClick: () => void;
  readonly onFileChange: (files: FileList) => void;
  readonly onDeleteButtonClick: (imageIndex: number, imageName: string) => void;
  readonly onDeleteConfirm: () => void;
  readonly onDeleteCancel: () => void;
  readonly onImageTouch: (imageIndex: number) => void;

  // 메인 이미지 관련 콜백 추가
  readonly onMainImageSet?: (imageIndex: number, imageUrl: string) => void;
  readonly onMainImageCancel?: () => void;
}

// 🔧 확장된 이미지 업로드 상태 (메인 이미지 포함)
export interface ImageUploadState {
  readonly deleteConfirmState: DeleteConfirmState;
  readonly duplicateMessageState: DuplicateMessageState;
  readonly touchActiveImages: Set<number>;
  readonly hasActiveUploads: boolean;

  // 메인 이미지 상태 추가
  readonly mainImageHandlers?: MainImageHandlers;
}

export interface DuplicateFileResult {
  readonly uniqueFiles: readonly File[];
  readonly duplicateFiles: readonly File[];
}

// 🎯 Context 전용 타입들 (Phase 8 완성)

// ✅ FileSelectButton 참조 타입 (any 타입 제거 완료)
export interface FileSelectButtonRef {
  readonly clickFileInput: () => void;
}

// 🔧 슬라이더 선택 관련 타입들 (추가)
export interface SliderSelectionState {
  readonly selectedSliderIndices: readonly number[];
  readonly isImageSelectedForSlider: (imageIndex: number) => boolean;
}

// ✅ Context 값 인터페이스 (타입 안전성 완성 + 누락 속성들 추가)
export interface ImageUploadContextValue {
  // 🎯 상태 데이터 (읽기 전용)
  readonly uploadedImages: readonly string[];
  readonly selectedFileNames: readonly string[];
  readonly uploading: Record<string, number>;
  readonly uploadStatus: Record<string, 'uploading' | 'success' | 'error'>;
  readonly deleteConfirmState: DeleteConfirmState;
  readonly duplicateMessageState: DuplicateMessageState;
  readonly touchActiveImages: Set<number>;
  readonly hasActiveUploads: boolean;
  readonly isMobileDevice: boolean;

  // 🎯 슬라이더 선택 상태 (추가)
  readonly selectedSliderIndices: readonly number[];
  readonly isImageSelectedForSlider: (imageIndex: number) => boolean;

  // 🎯 파일 처리 핸들러 (메모이제이션됨) - 누락 속성들 추가
  readonly handleFilesDropped: (files: File[]) => void;
  readonly handleFileSelectClick: () => void;
  readonly handleFileChange: (files: FileList) => void;

  // 🎯 이미지 관리 핸들러 (메모이제이션됨)
  readonly handleDeleteButtonClick: (index: number, name: string) => void;
  readonly handleDeleteConfirm: () => void;
  readonly handleDeleteCancel: () => void;
  readonly handleImageTouch: (index: number) => void;

  // 🎯 메인 이미지 핸들러 (안정된 참조)
  readonly mainImageHandlers: MainImageHandlers | null;

  // ✅ 참조 객체 (any 타입 완전 제거)
  readonly fileSelectButtonRef: React.RefObject<FileSelectButtonRef>;
}

// 🎯 Logger 관련 타입들 (Phase 3 완성용)

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LoggerInterface {
  readonly debug: (message: string, data?: Record<string, unknown>) => void;
  readonly info: (message: string, data?: Record<string, unknown>) => void;
  readonly warn: (message: string, data?: Record<string, unknown>) => void;
  readonly error: (message: string, data?: Record<string, unknown>) => void;
}

// 로그 옵션 인터페이스
export interface LogOptions {
  readonly level: LogLevel;
  readonly category: string;
  readonly data?: Record<string, unknown>;
  readonly timestamp?: boolean;
}

// 🎯 파일 처리 관련 타입들 (유지)

export interface FileProcessingContext {
  readonly file: File;
  readonly fileId: string;
  readonly fileName: string;
  readonly fileSize: number;
}

export interface FileReaderEventHandlers {
  readonly onProgress: (progress: number) => void;
  readonly onSuccess: (result: string) => void;
  readonly onError: (error: Error) => void;
}

export interface FileReaderManager {
  readonly reader: FileReader;
  readonly cleanup: () => void;
}

// 🎯 타이머 관리 관련 타입들 (유지)

export interface TimerReference {
  current: ReturnType<typeof setTimeout> | null;
}

export interface ComponentMountState {
  current: boolean;
}

// 🎯 중복 파일 처리 관련 타입들 (유지)

export interface DuplicateFileProcessingState {
  readonly showTimerRef: TimerReference;
  readonly hideTimerRef: TimerReference;
  readonly cleanupTimerRef: TimerReference;
  readonly animationKeyRef: React.MutableRefObject<number>;
  readonly isMountedRef: ComponentMountState;
}

// 🎯 상태 업데이트 함수 타입들 (유지)

export type DuplicateStateUpdater = (
  prev: DuplicateMessageState
) => DuplicateMessageState;
export type SafeStateUpdateFunction = (updater: DuplicateStateUpdater) => void;

// 🎯 메시지 생성 함수 타입들 (유지)

export type MessageCreatorFunction = (
  duplicateFiles: readonly File[]
) => string;
export type FileNameExtractorFunction = (
  duplicateFiles: readonly File[]
) => readonly string[];
export type AnimationKeyGeneratorFunction = () => number;

// 🎯 파일 검증 관련 타입들 (유지)

export interface FileValidationResult {
  readonly isValid: boolean;
  readonly errorMessage?: string;
}

export interface Base64ValidationResult {
  readonly isValidFormat: boolean;
  readonly hasContent: boolean;
  readonly isDataUrl: boolean;
}

// 🎯 진행률 계산 관련 타입들 (유지)

export interface ProgressCalculationInput {
  readonly loadedBytes: number;
  readonly totalBytes: number;
}

export interface ProgressCalculationResult {
  readonly percentage: number;
  readonly isValidCalculation: boolean;
}

// 🎯 Context Provider 관련 타입들 (유지)

export interface ImageUploadProviderProps {
  readonly children: React.ReactNode;
}

export interface ContextHookResult {
  readonly contextValue: ImageUploadContextValue;
  readonly isContextAvailable: boolean;
}

// 🔧 파일 처리 상태 추적 타입들 (추가)

export interface FileProcessingTracker {
  readonly fileId: string;
  readonly fileName: string;
  readonly status: 'pending' | 'processing' | 'completed' | 'failed';
  readonly progress: number;
  readonly startTime: number;
  readonly endTime?: number;
}

export interface ProcessingFilesState {
  readonly processingFiles: Map<string, FileProcessingTracker>;
  readonly completedFiles: Set<string>;
  readonly failedFiles: Set<string>;
}

// 🔧 드래그 앤 드롭 관련 타입들 (추가)

export interface DragState {
  readonly isDragActive: boolean;
  readonly dragEventCount: number;
  readonly lastDragEventTime: number;
}

export interface DropEventData {
  readonly files: readonly File[];
  readonly totalSize: number;
  readonly acceptedFiles: readonly File[];
  readonly rejectedFiles: readonly File[];
  readonly dropTime: number;
}

// 🔧 업로드 통계 관련 타입들 (추가)

export interface UploadStatistics {
  readonly totalFiles: number;
  readonly completedFiles: number;
  readonly failedFiles: number;
  readonly pendingFiles: number;
  readonly totalSize: number;
  readonly uploadedSize: number;
  readonly averageSpeed: number;
  readonly estimatedTimeRemaining: number;
}

// 🔧 에러 처리 관련 타입들 (추가)

export interface UploadError {
  readonly code: string;
  readonly message: string;
  readonly fileName: string;
  readonly fileSize: number;
  readonly timestamp: number;
  readonly retryable: boolean;
}

export interface ErrorState {
  readonly errors: readonly UploadError[];
  readonly hasErrors: boolean;
  readonly retryableErrors: readonly UploadError[];
  readonly fatalErrors: readonly UploadError[];
}

// 🔧 성능 모니터링 관련 타입들 (추가)

export interface PerformanceMetrics {
  readonly renderCount: number;
  readonly lastRenderTime: number;
  readonly averageRenderTime: number;
  readonly memoryUsage: number;
  readonly cpuUsage: number;
}

export interface OptimizationState {
  readonly shouldOptimize: boolean;
  readonly optimizationLevel: 'none' | 'basic' | 'aggressive';
  readonly lastOptimizationTime: number;
  readonly optimizationHistory: readonly number[];
}

// 🔧 접근성 관련 타입들 (추가)

export interface AccessibilityState {
  readonly announcements: readonly string[];
  readonly focusedElementId: string | null;
  readonly keyboardNavigationActive: boolean;
  readonly screenReaderMode: boolean;
}

export interface A11yAttributes {
  readonly 'aria-label': string;
  readonly 'aria-describedby'?: string;
  readonly 'aria-live'?: 'polite' | 'assertive' | 'off';
  readonly 'aria-atomic'?: boolean;
  readonly role?: string;
  readonly tabIndex?: number;
}

// 🔧 국제화 관련 타입들 (추가)

export interface LocalizationState {
  readonly currentLocale: string;
  readonly supportedLocales: readonly string[];
  readonly translations: Record<string, string>;
  readonly rtlMode: boolean;
}

export interface TranslationKey {
  readonly key: string;
  readonly defaultValue: string;
  readonly interpolation?: Record<string, string | number>;
}

// 🔧 테마 관련 타입들 (추가)

export interface ThemeState {
  readonly currentTheme: 'light' | 'dark' | 'auto';
  readonly customColors: Record<string, string>;
  readonly animations: boolean;
  readonly reducedMotion: boolean;
}

export interface StyleConfiguration {
  readonly className: string;
  readonly inlineStyles: React.CSSProperties;
  readonly cssVariables: Record<string, string>;
}

// 🔧 디바이스 관련 타입들 (추가)

export interface DeviceState {
  readonly isMobile: boolean;
  readonly isTablet: boolean;
  readonly isDesktop: boolean;
  readonly touchSupported: boolean;
  readonly screenSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  readonly orientation: 'portrait' | 'landscape';
}

export interface BrowserCapabilities {
  readonly supportsFileAPI: boolean;
  readonly supportsDragDrop: boolean;
  readonly supportsWebP: boolean;
  readonly supportsAVIF: boolean;
  readonly maxFileSize: number;
  readonly maxConcurrentUploads: number;
}

// 🔧 설정 관련 타입들 (추가)

export interface UploadConfiguration {
  readonly maxFileSize: number;
  readonly maxFiles: number;
  readonly acceptedTypes: readonly string[];
  readonly compressionEnabled: boolean;
  readonly compressionQuality: number;
  readonly thumbnailGeneration: boolean;
  readonly thumbnailSize: number;
}

export interface ValidationConfiguration {
  readonly strictModeEnabled: boolean;
  readonly allowDuplicates: boolean;
  readonly validateMimeType: boolean;
  readonly validateFileExtension: boolean;
  readonly customValidators: readonly ((file: File) => boolean)[];
}
