// blogBasicStep/utils/blogBasicValidationUtils.ts

/**
 * BlogBasicStep 컴포넌트 - 검증 유틸리티
 * 블로그 기본 정보 입력값의 유효성 검사와 포맷팅을 담당하는 순수 함수들
 * 재사용 가능하고 테스트하기 쉬운 유틸리티 함수 모음
 */

/**
 * 글자 수 카운터 정보 타입 정의
 * UI에서 사용할 카운터 표시 정보
 */
interface CounterInfo {
  readonly currentLength: number;
  readonly colorClass: string;
  readonly displayText: string;
  readonly statusMessage: string;
}

/**
 * 제목 길이 검증 상수
 */
const TITLE_VALIDATION = {
  MIN_LENGTH: 5,
  MAX_LENGTH: 100,
} as const;

/**
 * 요약 길이 검증 상수
 */
const DESCRIPTION_VALIDATION = {
  MIN_LENGTH: 10,
} as const;

/**
 * CSS 클래스 상수
 */
const COLOR_CLASSES = {
  DANGER: 'text-danger',
  DEFAULT: 'text-default-500',
} as const;

/**
 * 제목 길이 유효성 검사
 *
 * @param title - 검사할 제목 문자열
 * @returns 유효한 길이인지 boolean 반환
 *
 * 검증 조건:
 * - 최소 5자 이상
 * - 최대 100자 이하
 *
 * 예시:
 * validateTitleLength('안녕') → false (5자 미만)
 * validateTitleLength('안녕하세요') → true (5자 이상)
 */
export function validateTitleLength(title: string): boolean {
  console.log('📏 제목 길이 검증:', {
    input: title,
    length: title.length,
    minRequired: TITLE_VALIDATION.MIN_LENGTH,
    maxAllowed: TITLE_VALIDATION.MAX_LENGTH,
  });

  // null, undefined 안전 처리
  if (typeof title !== 'string') {
    console.warn('⚠️ 제목이 문자열이 아님:', typeof title);
    return false;
  }

  const isValid =
    title.length >= TITLE_VALIDATION.MIN_LENGTH &&
    title.length <= TITLE_VALIDATION.MAX_LENGTH;

  console.log('✅ 제목 검증 결과:', isValid);
  return isValid;
}

/**
 * 요약 길이 유효성 검사
 *
 * @param description - 검사할 요약 문자열
 * @returns 유효한 길이인지 boolean 반환
 *
 * 검증 조건:
 * - 최소 10자 이상
 *
 * 예시:
 * validateDescriptionLength('짧은글') → false (10자 미만)
 * validateDescriptionLength('충분히 긴 요약 내용입니다') → true (10자 이상)
 */
export function validateDescriptionLength(description: string): boolean {
  console.log('📏 요약 길이 검증:', {
    input: description,
    length: description.length,
    minRequired: DESCRIPTION_VALIDATION.MIN_LENGTH,
  });

  // null, undefined 안전 처리
  if (typeof description !== 'string') {
    console.warn('⚠️ 요약이 문자열이 아님:', typeof description);
    return false;
  }

  const isValid = description.length >= DESCRIPTION_VALIDATION.MIN_LENGTH;

  console.log('✅ 요약 검증 결과:', isValid);
  return isValid;
}

/**
 * 제목 글자 수 카운터 정보 생성
 *
 * @param title - 현재 제목 문자열
 * @returns CounterInfo 객체 (길이, 색상 클래스, 표시 텍스트, 상태 메시지)
 *
 * 기능:
 * - 현재 글자 수와 최대 글자 수 표시
 * - 최소 길이 미달 시 경고 메시지
 * - 색상으로 상태 구분 (빨간색: 미달, 회색: 정상)
 */
export function formatTitleCounter(title: string): CounterInfo {
  console.log('🎨 제목 카운터 포맷팅:', { title, length: title.length });

  // 안전한 문자열 처리
  const safeTitle = typeof title === 'string' ? title : '';
  const currentLength = safeTitle.length;

  // 유효성 검사
  const isValid = validateTitleLength(safeTitle);

  // 색상 클래스 결정
  const colorClass = isValid ? COLOR_CLASSES.DEFAULT : COLOR_CLASSES.DANGER;

  // 표시 텍스트 생성
  const displayText = `${currentLength} / ${TITLE_VALIDATION.MAX_LENGTH}자${
    !isValid ? ' (최소 5자 이상)' : ''
  }`;

  // 상태 메시지 생성
  const statusMessage = isValid
    ? '조건을 만족합니다'
    : `최소 ${TITLE_VALIDATION.MIN_LENGTH}자 이상 입력해주세요`;

  const result = {
    currentLength,
    colorClass,
    displayText,
    statusMessage,
  };

  console.log('📊 제목 카운터 결과:', result);
  return result;
}

/**
 * 요약 글자 수 카운터 정보 생성
 *
 * @param description - 현재 요약 문자열
 * @returns CounterInfo 객체 (길이, 색상 클래스, 표시 텍스트, 상태 메시지)
 *
 * 기능:
 * - 현재 글자 수 표시
 * - 최소 길이 미달 시 경고 메시지
 * - 색상으로 상태 구분 (빨간색: 미달, 회색: 정상)
 */
export function formatDescriptionCounter(description: string): CounterInfo {
  console.log('🎨 요약 카운터 포맷팅:', {
    description,
    length: description.length,
  });

  // 안전한 문자열 처리
  const safeDescription = typeof description === 'string' ? description : '';
  const currentLength = safeDescription.length;

  // 유효성 검사
  const isValid = validateDescriptionLength(safeDescription);

  // 색상 클래스 결정
  const colorClass = isValid ? COLOR_CLASSES.DEFAULT : COLOR_CLASSES.DANGER;

  // 표시 텍스트 생성
  const displayText = `${currentLength}자${
    !isValid ? ` (최소 ${DESCRIPTION_VALIDATION.MIN_LENGTH}자 이상)` : ''
  }`;

  // 상태 메시지 생성
  const statusMessage = isValid
    ? '조건을 만족합니다'
    : `최소 ${DESCRIPTION_VALIDATION.MIN_LENGTH}자 이상 입력해주세요`;

  const result = {
    currentLength,
    colorClass,
    displayText,
    statusMessage,
  };

  console.log('📊 요약 카운터 결과:', result);
  return result;
}

/**
 * 검증 상수들 내보내기
 * 다른 모듈에서 검증 기준을 참조할 때 사용
 */
export { TITLE_VALIDATION, DESCRIPTION_VALIDATION };
