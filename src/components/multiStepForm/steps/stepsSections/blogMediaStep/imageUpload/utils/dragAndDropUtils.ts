// blogMediaStep/utils/dragAndDropUtils.ts - BlogMediaStep 컴포넌트

/**
 * BlogMediaStep 컴포넌트 - 드래그 앤 드롭 관련 유틸리티 함수들
 * 드래그 이벤트 처리와 파일 추출 로직을 제공
 */

// ✅ 드래그 이벤트 타입 정의
export type DragEventType = 'dragenter' | 'dragover' | 'dragleave' | 'drop';

// ✅ 드래그 상태 인터페이스
export interface DragState {
  isDragActive: boolean;
  dragEventType: DragEventType | null;
}

/**
 * 드래그 이벤트가 파일 드래그인지 확인
 * @param e - 드래그 이벤트
 * @returns 파일 드래그 여부
 */
export const isFileDragEvent = (e: React.DragEvent): boolean => {
  console.log('🔧 isFileDragEvent 호출:', {
    eventType: e.type,
    hasFiles: e.dataTransfer?.types?.includes('Files'),
  }); // 디버깅용

  const hasFiles = e.dataTransfer?.types?.includes('Files') || false;

  console.log('✅ isFileDragEvent 결과:', { hasFiles }); // 디버깅용
  return hasFiles;
};

/**
 * 드래그 이벤트 기본 동작 방지
 * 기존 handleDrag 함수의 공통 로직 추출
 * @param e - 드래그 이벤트
 */
export const preventDragDefaults = (e: React.DragEvent): void => {
  console.log('🔧 preventDragDefaults 호출:', { eventType: e.type }); // 디버깅용

  e.preventDefault();
  e.stopPropagation();

  console.log('✅ 드래그 기본 동작 방지 완료'); // 디버깅용
};

/**
 * 드래그 상태 결정 로직
 * @param eventType - 드래그 이벤트 타입
 * @returns 드래그 활성 상태
 */
export const getDragActiveState = (eventType: string): boolean => {
  console.log('🔧 getDragActiveState 호출:', { eventType }); // 디버깅용

  const isActive = eventType === 'dragenter' || eventType === 'dragover';

  console.log('✅ getDragActiveState 결과:', { eventType, isActive }); // 디버깅용
  return isActive;
};

/**
 * 드래그 이벤트에서 파일 목록 추출
 * @param e - 드롭 이벤트
 * @returns 파일 목록 또는 null
 */
export const extractFilesFromDragEvent = (
  e: React.DragEvent
): FileList | null => {
  console.log('🔧 extractFilesFromDragEvent 호출'); // 디버깅용

  const files = e.dataTransfer?.files || null;

  console.log('✅ extractFilesFromDragEvent 결과:', {
    hasFiles: !!files,
    fileCount: files?.length || 0,
  }); // 디버깅용

  return files;
};

/**
 * 파일 목록을 배열로 변환
 * @param fileList - FileList 객체
 * @returns File 배열
 */
export const convertFileListToArray = (fileList: FileList): File[] => {
  console.log('🔧 convertFileListToArray 호출:', { length: fileList.length }); // 디버깅용

  const filesArray = Array.from(fileList);

  console.log('✅ convertFileListToArray 결과:', {
    inputLength: fileList.length,
    outputLength: filesArray.length,
  }); // 디버깅용

  return filesArray;
};

/**
 * 드래그 이벤트 전체 처리 로직
 * 기존 handleDrag 함수를 대체하는 통합 처리기
 * @param e - 드래그 이벤트
 * @param setDragActive - 드래그 상태 설정 함수
 */
export const handleDragEvent = (
  e: React.DragEvent,
  setDragActive: (active: boolean) => void
): void => {
  console.log('🔧 handleDragEvent 호출:', {
    eventType: e.type,
    timestamp: new Date().toLocaleTimeString(),
  }); // 디버깅용

  // 기본 동작 방지
  preventDragDefaults(e);

  // 파일 드래그가 아니면 무시
  if (!isFileDragEvent(e)) {
    console.log('⚠️ 파일 드래그가 아님, 무시'); // 디버깅용
    return;
  }

  // 드래그 상태 업데이트
  const isActive = getDragActiveState(e.type);
  setDragActive(isActive);

  console.log('✅ handleDragEvent 완료:', {
    eventType: e.type,
    dragActive: isActive,
  }); // 디버깅용
};

/**
 * 드롭 이벤트 처리 로직
 * 기존 handleDrop 함수를 대체하는 처리기
 * @param e - 드롭 이벤트
 * @param setDragActive - 드래그 상태 설정 함수
 * @param onFilesDropped - 파일 드롭 콜백
 */
export const handleDropEvent = (
  e: React.DragEvent,
  setDragActive: (active: boolean) => void,
  onFilesDropped: (files: File[]) => void
): void => {
  console.log('🔧 handleDropEvent 호출:', {
    timestamp: new Date().toLocaleTimeString(),
  }); // 디버깅용

  // 기본 동작 방지
  preventDragDefaults(e);

  // 드래그 상태 해제
  setDragActive(false);

  // 파일 추출
  const fileList = extractFilesFromDragEvent(e);
  if (!fileList || fileList.length === 0) {
    console.log('⚠️ 드롭된 파일이 없음'); // 디버깅용
    return;
  }

  // 파일 배열로 변환 후 콜백 호출
  const filesArray = convertFileListToArray(fileList);

  console.log('✅ handleDropEvent 완료:', {
    fileCount: filesArray.length,
    fileNames: filesArray.map((f) => f.name),
  }); // 디버깅용

  onFilesDropped(filesArray);
};
