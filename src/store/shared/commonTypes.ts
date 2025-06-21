// 📁 store/shared/commonTypes.ts

// ✅ Container 인터페이스에 updatedAt 속성 추가 (에러 해결)
export interface Container {
  id: string;
  name: string;
  order: number;
  createdAt: Date;
  updatedAt: Date; // ✅ 새로 추가된 속성 - 컨테이너 수정 시간 추적
}

// ✅ ParagraphBlock에 originalId 속성 추가 (에러 해결)
export interface ParagraphBlock {
  id: string;
  content: string;
  containerId: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  originalId?: string; // ✅ 원본 단락 ID 추적용 (선택적 속성)
}

export interface EditorState {
  containers: Container[];
  paragraphs: ParagraphBlock[];
  completedContent: string;
  isCompleted: boolean;
}

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

// 🔄 컨테이너 이동 기록 인터페이스
export interface ContainerMoveRecord {
  id: string; // 이동 기록 고유 ID
  paragraphId: string; // 이동된 단락 ID
  fromContainerId: string | null; // 이전 컨테이너 ID (null이면 미할당에서 이동)
  toContainerId: string; // 이동된 대상 컨테이너 ID
  timestamp: Date; // 이동 시간
  reason?: string; // 이동 사유 (선택사항)
}

// 🔄 컨테이너 이동 이력 타입
export type ContainerMoveHistory = ContainerMoveRecord[];

// 🔄 컨테이너 이동 통계 인터페이스
export interface ContainerMoveStats {
  totalMoves: number; // 총 이동 횟수
  mostMovedParagraph: string | null; // 가장 많이 이동된 단락 ID
  mostTargetContainer: string | null; // 가장 많이 선택된 대상 컨테이너 ID
  averageMovesPerParagraph: number; // 단락별 평균 이동 횟수
}

// 🔄 컨테이너 선택 옵션 인터페이스
export interface ContainerSelectOption {
  value: string; // 컨테이너 ID
  label: string; // 컨테이너 이름
  disabled?: boolean; // 선택 불가 여부 (현재 컨테이너 등)
  description?: string; // 추가 설명
}

/**
 * 🔧 Container 인터페이스 수정 사항:
 *
 * 1. ✅ updatedAt 속성 추가
 *    - 컨테이너의 마지막 수정 시간을 추적
 *    - Date 타입으로 정의하여 타입 안전성 확보
 *    - ContainerManager에서 사용하는 ensureContainerSafety 함수와 호환
 *
 * 2. 🔄 기존 속성 유지
 *    - id, name, order, createdAt 속성 모두 유지
 *    - 하위 호환성 보장
 *    - 기존 코드에 영향 없음
 *
 * 3. 📊 일관된 타입 구조
 *    - ParagraphBlock과 동일한 패턴 적용
 *    - createdAt/updatedAt 타임스탬프 쌍 유지
 *    - 데이터 추적 및 관리 용이성 증대
 */
