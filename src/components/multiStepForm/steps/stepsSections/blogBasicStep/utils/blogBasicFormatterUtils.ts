// blogBasicStep/utils/blogBasicFormatterUtils.ts

/**
 * BlogBasicStep 컴포넌트 - 포맷팅 유틸리티
 * 블로그 기본 정보의 텍스트 포맷팅과 변환을 담당하는 순수 함수들
 * 사용자 입력값을 표준화하고 표시용으로 변환하는 기능 제공
 */

/**
 * 포맷팅된 텍스트 정보 타입
 */
interface FormattedTextInfo {
  readonly original: string;
  readonly formatted: string;
  readonly wordCount: number;
  readonly hasWhitespace: boolean;
}

/**
 * 제목 텍스트 정리 및 포맷팅
 *
 * @param title - 원본 제목 문자열
 * @returns FormattedTextInfo 포맷팅된 제목 정보
 *
 * 기능:
 * 1. 앞뒤 공백 제거
 * 2. 연속된 공백을 하나로 통합
 * 3. 단어 수 계산
 * 4. 공백 포함 여부 확인
 *
 * 예시:
 * formatTitleText('  안녕하세요    세상  ')
 * → { original: '  안녕하세요    세상  ', formatted: '안녕하세요 세상', wordCount: 2, hasWhitespace: true }
 */
export function formatTitleText(title: string): FormattedTextInfo {
  console.group('🔤 제목 텍스트 포맷팅');
  console.log('📝 원본 제목:', `"${title}"`);

  // 안전한 문자열 처리
  const safeTitle = typeof title === 'string' ? title : '';

  // 앞뒤 공백 제거 및 연속 공백 정리
  const trimmed = safeTitle.trim();
  const formatted = trimmed.replace(/\s+/g, ' ');

  // 단어 수 계산 (공백으로 구분)
  const wordCount =
    formatted.length > 0
      ? formatted.split(' ').filter((word) => word.length > 0).length
      : 0;

  // 공백 포함 여부 확인
  const hasWhitespace = formatted.includes(' ');

  const result = {
    original: safeTitle,
    formatted,
    wordCount,
    hasWhitespace,
  };

  console.log('✨ 포맷팅 결과:', result);
  console.groupEnd();

  return result;
}

/**
 * 요약 텍스트 정리 및 포맷팅
 *
 * @param description - 원본 요약 문자열
 * @returns FormattedTextInfo 포맷팅된 요약 정보
 *
 * 기능:
 * 1. 앞뒤 공백 제거
 * 2. 줄바꿈 정리 (연속된 줄바꿈을 최대 2개로 제한)
 * 3. 연속된 공백을 하나로 통합
 * 4. 단어 수 계산
 * 5. 공백 포함 여부 확인
 *
 * 예시:
 * formatDescriptionText('안녕하세요.\n\n\n세상입니다.')
 * → { original: '안녕하세요.\n\n\n세상입니다.', formatted: '안녕하세요.\n\n세상입니다.', wordCount: 2, hasWhitespace: true }
 */
export function formatDescriptionText(description: string): FormattedTextInfo {
  console.group('🔤 요약 텍스트 포맷팅');
  console.log('📝 원본 요약:', `"${description}"`);

  // 안전한 문자열 처리
  const safeDescription = typeof description === 'string' ? description : '';

  // 앞뒤 공백 제거
  const trimmed = safeDescription.trim();

  // 연속된 줄바꿈을 최대 2개로 제한
  const normalizedLineBreaks = trimmed.replace(/\n{3,}/g, '\n\n');

  // 연속된 공백을 하나로 통합 (줄바꿈은 유지)
  const formatted = normalizedLineBreaks.replace(/[ \t]+/g, ' ');

  // 단어 수 계산 (공백과 줄바꿈으로 구분)
  const words = formatted.split(/[\s\n]+/).filter((word) => word.length > 0);
  const wordCount = words.length;

  // 공백 포함 여부 확인 (공백 또는 줄바꿈)
  const hasWhitespace = /\s/.test(formatted);

  const result = {
    original: safeDescription,
    formatted,
    wordCount,
    hasWhitespace,
  };

  console.log('✨ 포맷팅 결과:', result);
  console.groupEnd();

  return result;
}

/**
 * 제목을 URL 슬러그로 변환
 *
 * @param title - 변환할 제목 문자열
 * @returns URL에 사용 가능한 슬러그 문자열
 *
 * 기능:
 * 1. 소문자로 변환
 * 2. 공백을 하이픈으로 변경
 * 3. 특수문자 제거
 * 4. 연속된 하이픈 정리
 *
 * 예시:
 * convertTitleToSlug('안녕하세요! React 블로그입니다.')
 * → 'react'
 */
export function convertTitleToSlug(title: string): string {
  console.group('🔗 제목 → 슬러그 변환');
  console.log('📝 원본 제목:', title);

  // 안전한 문자열 처리
  const safeTitle = typeof title === 'string' ? title : '';

  // 영문, 숫자만 추출하고 소문자로 변환
  const alphanumericOnly = safeTitle
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // 영문, 숫자, 공백만 남김
    .trim();

  // 공백을 하이픈으로 변경하고 연속된 하이픈 정리
  const slug = alphanumericOnly
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, ''); // 앞뒤 하이픈 제거

  console.log('🔗 변환된 슬러그:', slug);
  console.groupEnd();

  return slug;
}

/**
 * 텍스트의 읽기 시간 추정
 *
 * @param text - 분석할 텍스트
 * @returns 예상 읽기 시간 (분)
 *
 * 기준:
 * - 한국어: 분당 약 200-250자
 * - 영어: 분당 약 200-250 단어
 *
 * 예시:
 * estimateReadingTime('안녕하세요. 긴 텍스트입니다...')
 * → 2 (분)
 */
export function estimateReadingTime(text: string): number {
  console.group('⏱️ 읽기 시간 추정');
  console.log('📝 분석할 텍스트 길이:', text.length);

  // 안전한 문자열 처리
  const safeText = typeof text === 'string' ? text : '';

  // 한국어 평균 읽기 속도 (분당 225자)
  const KOREAN_READING_SPEED = 225;

  // 최소 읽기 시간 (1분)
  const MIN_READING_TIME = 1;

  // 읽기 시간 계산 (올림 처리)
  const estimatedMinutes = Math.max(
    MIN_READING_TIME,
    Math.ceil(safeText.length / KOREAN_READING_SPEED)
  );

  console.log('⏱️ 예상 읽기 시간:', `${estimatedMinutes}분`);
  console.groupEnd();

  return estimatedMinutes;
}

/**
 * 텍스트 요약 생성 (첫 N개 문장)
 *
 * @param text - 요약할 텍스트
 * @param sentenceCount - 포함할 문장 수 (기본값: 2)
 * @returns 요약된 텍스트
 *
 * 기능:
 * 1. 문장 단위로 분리 (마침표, 느낌표, 물음표 기준)
 * 2. 지정된 개수만큼 문장 추출
 * 3. 자연스러운 요약문 생성
 *
 * 예시:
 * generateTextSummary('첫 번째 문장입니다. 두 번째 문장입니다. 세 번째 문장입니다.', 2)
 * → '첫 번째 문장입니다. 두 번째 문장입니다.'
 */
export function generateTextSummary(
  text: string,
  sentenceCount: number = 2
): string {
  console.group('📖 텍스트 요약 생성');
  console.log('📝 원본 텍스트:', text);
  console.log('📊 요청 문장 수:', sentenceCount);

  // 안전한 문자열 처리
  const safeText = typeof text === 'string' ? text : '';
  const safeSentenceCount = Math.max(1, Math.floor(sentenceCount));

  // 문장 분리 (마침표, 느낌표, 물음표 기준)
  const sentences = safeText
    .split(/[.!?]+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);

  // 요청된 개수만큼 문장 추출
  const selectedSentences = sentences.slice(0, safeSentenceCount);

  // 요약문 생성
  const summary =
    selectedSentences.join('. ') + (selectedSentences.length > 0 ? '.' : '');

  console.log('📖 생성된 요약:', summary);
  console.log('📊 추출된 문장 수:', selectedSentences.length);
  console.groupEnd();

  return summary;
}
