// 📁 components/moduleEditor/utils/containerMoveConfig.ts

// 🔄 컨테이너 이동 관련 설정값들
export const CONTAINER_MOVE_CONFIG = {
  // 이동 이력 관련
  MAX_MOVE_HISTORY: 1000, // 최대 이동 이력 저장 개수
  MOVE_DEBOUNCE_TIME: 300, // 이동 요청 디바운스 시간 (ms)

  // UI 관련
  SELECTOR_PLACEHOLDER: '이동할 컨테이너 선택', // 셀렉트 박스 플레이스홀더
  CURRENT_CONTAINER_LABEL: '현재 위치', // 현재 컨테이너 표시 텍스트
  UNASSIGNED_LABEL: '미할당', // 미할당 상태 표시 텍스트

  // 애니메이션 관련
  MOVE_ANIMATION_DURATION: 200, // 이동 애니메이션 시간 (ms)
  SUCCESS_TOAST_DURATION: 2000, // 성공 토스트 표시 시간 (ms)

  // 검증 관련
  PREVENT_DUPLICATE_MOVES: true, // 중복 이동 방지 여부
  VALIDATE_CONTAINER_EXISTS: true, // 컨테이너 존재 검증 여부

  // 로깅 관련
  ENABLE_MOVE_LOGGING: true, // 이동 로깅 활성화 여부
  LOG_LEVEL: 'info' as const, // 로그 레벨
} as const;

// 🔄 컨테이너 이동 에러 메시지
export const CONTAINER_MOVE_MESSAGES = {
  SUCCESS: '단락이 성공적으로 이동되었습니다',
  ERROR_CONTAINER_NOT_FOUND: '선택한 컨테이너를 찾을 수 없습니다',
  ERROR_PARAGRAPH_NOT_FOUND: '이동할 단락을 찾을 수 없습니다',
  ERROR_SAME_CONTAINER: '동일한 컨테이너로는 이동할 수 없습니다',
  ERROR_INVALID_TARGET: '올바르지 않은 이동 대상입니다',
  WARNING_DUPLICATE_MOVE: '이미 해당 컨테이너에 있습니다',
} as const;

// 🔄 컨테이너 셀렉터 스타일 설정
export const CONTAINER_SELECTOR_STYLES = {
  width: 'w-32', // 셀렉트 박스 너비
  size: 'sm' as const, // 버튼 크기
  variant: 'flat' as const, // 버튼 스타일
  color: 'primary' as const, // 버튼 색상
  placement: 'bottom-start' as const, // 드롭다운 위치
} as const;

// 🔄 타입 정의
export type ContainerMoveConfigType = typeof CONTAINER_MOVE_CONFIG;
export type ContainerMoveMessagesType = typeof CONTAINER_MOVE_MESSAGES;
export type ContainerSelectorStylesType = typeof CONTAINER_SELECTOR_STYLES;

/**
 * 🔧 containerMoveConfig.ts 파일 설명:
 *
 * 1. 🎯 설정 중앙화
 *    - 컨테이너 이동 관련 모든 설정값을 한 곳에 집중
 *    - 유지보수성 및 일관성 향상
 *    - 설정 변경 시 영향 범위 최소화
 *
 * 2. 🎨 UI 설정
 *    - 셀렉트 박스 스타일 및 크기 설정
 *    - 사용자 메시지 및 라벨 정의
 *    - 일관된 사용자 경험 제공
 *
 * 3. 🔄 동작 설정
 *    - 이동 이력 관리 설정
 *    - 검증 로직 활성화/비활성화
 *    - 성능 관련 파라미터 조정
 *
 * 4. 📝 타입 안전성
 *    - as const로 리터럴 타입 보장
 *    - 타입 추론을 통한 자동완성 지원
 *    - 설정값 오타 방지
 *
 * 5. 🛡️ 확장성
 *    - 새로운 설정 추가 용이
 *    - 기존 설정 수정 시 타입 체크
 *    - 설정 그룹별 분리로 관리 효율성
 */
