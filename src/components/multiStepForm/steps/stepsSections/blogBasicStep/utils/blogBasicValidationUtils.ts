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

// 🧹 안전한 문자열 변환
function convertToSafeString(input: unknown): string {
  if (typeof input === 'string') {
    return input;
  }

  if (typeof input === 'number') {
    return String(input);
  }

  if (input === null || input === undefined) {
    return '';
  }

  // 객체나 배열인 경우 빈 문자열 반환
  return '';
}

// 🔢 안전한 숫자 추출
function extractSafeLength(text: string): number {
  const length = text.length;
  return Number.isInteger(length) && length >= 0 ? length : 0;
}

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
export function validateTitleLength(title: unknown): boolean {
  console.log('📏 제목 길이 검증:', {
    input: title,
    inputType: typeof title,
  });

  // 안전한 문자열 변환
  const safeTitle = convertToSafeString(title);
  const titleLength = extractSafeLength(safeTitle);

  console.log('📏 제목 길이 검증 상세:', {
    safeTitle,
    titleLength,
    minRequired: TITLE_VALIDATION.MIN_LENGTH,
    maxAllowed: TITLE_VALIDATION.MAX_LENGTH,
  });

  const isValid =
    titleLength >= TITLE_VALIDATION.MIN_LENGTH &&
    titleLength <= TITLE_VALIDATION.MAX_LENGTH;

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
export function validateDescriptionLength(description: unknown): boolean {
  console.log('📏 요약 길이 검증:', {
    input: description,
    inputType: typeof description,
  });

  // 안전한 문자열 변환
  const safeDescription = convertToSafeString(description);
  const descriptionLength = extractSafeLength(safeDescription);

  console.log('📏 요약 길이 검증 상세:', {
    safeDescription,
    descriptionLength,
    minRequired: DESCRIPTION_VALIDATION.MIN_LENGTH,
  });

  const isValid = descriptionLength >= DESCRIPTION_VALIDATION.MIN_LENGTH;

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
export function formatTitleCounter(title: unknown): CounterInfo {
  console.log('🎨 제목 카운터 포맷팅:', {
    title,
    titleType: typeof title,
  });

  // 안전한 문자열 변환
  const safeTitle = convertToSafeString(title);
  const currentLength = extractSafeLength(safeTitle);

  // 유효성 검사
  const isValid = validateTitleLength(safeTitle);

  // 색상 클래스 결정
  const colorClass = isValid ? COLOR_CLASSES.DEFAULT : COLOR_CLASSES.DANGER;

  // 표시 텍스트 생성
  const maxLength = TITLE_VALIDATION.MAX_LENGTH;
  const minLength = TITLE_VALIDATION.MIN_LENGTH;

  const displayText = isValid
    ? `${currentLength} / ${maxLength}자`
    : `${currentLength} / ${maxLength}자 (최소 ${minLength}자 이상)`;

  // 상태 메시지 생성
  const statusMessage = isValid
    ? '조건을 만족합니다'
    : `최소 ${minLength}자 이상 입력해주세요`;

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
export function formatDescriptionCounter(description: unknown): CounterInfo {
  console.log('🎨 요약 카운터 포맷팅:', {
    description,
    descriptionType: typeof description,
  });

  // 안전한 문자열 변환
  const safeDescription = convertToSafeString(description);
  const currentLength = extractSafeLength(safeDescription);

  // 유효성 검사
  const isValid = validateDescriptionLength(safeDescription);

  // 색상 클래스 결정
  const colorClass = isValid ? COLOR_CLASSES.DEFAULT : COLOR_CLASSES.DANGER;

  // 표시 텍스트 생성
  const minLength = DESCRIPTION_VALIDATION.MIN_LENGTH;

  const displayText = isValid
    ? `${currentLength}자`
    : `${currentLength}자 (최소 ${minLength}자 이상)`;

  // 상태 메시지 생성
  const statusMessage = isValid
    ? '조건을 만족합니다'
    : `최소 ${minLength}자 이상 입력해주세요`;

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
