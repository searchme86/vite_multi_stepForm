// 📁 store/shared/commonTypes.ts

// ✅ 기존 타입들 유지 (의존성 있음)
export interface Container {
  id: string;
  name: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ParagraphBlock {
  id: string;
  content: string;
  containerId: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  originalId?: string;
}

export interface EditorState {
  containers: Container[];
  paragraphs: ParagraphBlock[];
  completedContent: string;
  isCompleted: boolean;
}

// 🔄 기존 ImageViewConfig 유지 (하위 호환성)
export interface ImageViewConfig {
  clickOrder: number[];
  selectedImages: string[];
  layout: {
    columns: number;
    gridType: 'grid' | 'masonry';
  };
  filter: 'all' | 'available';
}

export interface CustomGalleryView {
  id: string;
  name: string;
  selectedImages: string[];
  clickOrder: number[];
  layout: {
    columns: number;
    gridType: 'grid' | 'masonry';
  };
  createdAt: Date;
}

export interface ToastOptions {
  title: string;
  description: string;
  color: 'success' | 'danger' | 'warning' | 'primary';
  hideCloseButton?: boolean;
}

export interface ToastItem extends ToastOptions {
  id: string;
  createdAt: Date;
}

export interface FormValues {
  userImage?: string;
  nickname: string;
  emailPrefix: string;
  emailDomain: string;
  bio?: string;
  title: string;
  description: string;
  tags?: string;
  content: string;
  media?: string[];
  mainImage?: string | null;
  sliderImages?: string[];
  editorContainers?: Container[];
  editorParagraphs?: ParagraphBlock[];
  editorCompletedContent?: string;
  isEditorCompleted?: boolean;
}

// 🔄 기존 컨테이너 관련 타입들 유지 (의존성 있음)
export interface ContainerMoveRecord {
  id: string;
  paragraphId: string;
  fromContainerId: string | null;
  toContainerId: string;
  timestamp: Date;
  reason?: string;
}

export type ContainerMoveHistory = ContainerMoveRecord[];

export interface ContainerMoveStats {
  totalMoves: number;
  mostMovedParagraph: string | null;
  mostTargetContainer: string | null;
  averageMovesPerParagraph: number;
}

export interface ContainerSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  description?: string;
}

// 🔧 수정: ImageGalleryMetadata 타입을 직접 정의 (import 경로 문제 해결)
export interface ImageGalleryMetadata {
  readonly id: string;
  readonly originalFileName: string;
  readonly indexedDBKey: string;
  readonly originalDataUrl: string;
  readonly fileSize: number;
  readonly createdAt: Date;

  // 🆕 추가 필드들 (선택적)
  readonly thumbnailDataUrl?: string;
  readonly compressedSize?: number;
  readonly dimensions?: {
    readonly width: number;
    readonly height: number;
  };
  readonly mimeType?: string;
  readonly quality?: number;
  readonly isCompressed?: boolean;
}

// 🚨 수정: 슬라이더 이미지 필드 추가로 데이터 동기화 문제 해결
export interface HybridImageViewConfig {
  clickOrder: number[];
  selectedImageIds: string[]; // 🆕 ID 기반 관리
  selectedImages: string[]; // 🔄 런타임에서만 사용
  imageMetadata: ImageGalleryMetadata[];
  layout: {
    columns: number;
    gridType: 'grid' | 'masonry';
  };
  filter: 'all' | 'available';

  // 🚨 핵심 수정: 슬라이더 관련 필드들 추가
  mainImage?: string | null; // 메인 이미지 URL
  sliderImages: string[]; // 슬라이더 이미지 URL 목록
}

// 🆕 통합된 하이브리드 커스텀뷰 (중복 제거)
export interface HybridCustomGalleryView {
  id: string;
  name: string;
  selectedImageIds: string[]; // 🆕 ID 기반 관리
  selectedImages: string[]; // 🔄 런타임에서만 사용
  clickOrder: number[];
  layout: {
    columns: number;
    gridType: 'grid' | 'masonry';
  };
  createdAt: Date;

  // 🚨 슬라이더 관련 필드들도 커스텀뷰에 추가
  mainImage?: string | null;
  sliderImages: string[];
}

// 🆕 간소화된 이미지 처리 결과
export interface HybridImageProcessResult {
  readonly successful: Array<{
    metadata: ImageGalleryMetadata;
    binaryKey: string;
    imageUrl: string;
  }>;
  readonly failed: Array<{
    file: File;
    error: string;
  }>;
  readonly totalProcessed: number;
}

// 🚨 수정: 슬라이더 필드를 포함한 기본값 생성
export const createDefaultHybridImageViewConfig = (): HybridImageViewConfig => {
  console.log(
    '🔧 [TYPES] 슬라이더 필드 포함 기본 하이브리드 이미지뷰 설정 생성'
  );

  return {
    clickOrder: [],
    selectedImageIds: [],
    selectedImages: [], // 런타임에서 복원됨
    imageMetadata: [],
    layout: {
      columns: 3,
      gridType: 'grid',
    },
    filter: 'all',

    // 🚨 슬라이더 관련 기본값 추가
    mainImage: null,
    sliderImages: [],
  };
};
