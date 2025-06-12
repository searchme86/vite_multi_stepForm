// localStorage 정리 유틸리티 함수들
// 잘못된 값들을 정리하여 localStorage 에러를 방지합니다

/**
 * 미리보기 패널 관련 localStorage 키들을 정리하는 함수
 * 잘못된 값이나 "undefined" 문자열 등을 제거합니다
 */
export function cleanupPreviewPanelStorage(): void {
  const keysToCheck = ['preview-panel-mobile', 'preview-panel-desktop'];

  keysToCheck.forEach((key) => {
    try {
      const stored = localStorage.getItem(key);

      if (stored) {
        // "undefined", "null", 빈 문자열 등 잘못된 값들 확인
        if (stored === 'undefined' || stored === 'null' || stored === '') {
          console.log(`🧹 잘못된 localStorage 값 정리: ${key} = ${stored}`);
          localStorage.removeItem(key);
          return;
        }

        // JSON 파싱 시도
        try {
          const parsed = JSON.parse(stored);

          // boolean이 아닌 값들 제거
          if (typeof parsed !== 'boolean') {
            console.log(
              `🧹 잘못된 타입의 localStorage 값 정리: ${key} = ${stored}`
            );
            localStorage.removeItem(key);
          }
        } catch (parseError) {
          console.log(
            `🧹 파싱 불가능한 localStorage 값 정리: ${key} = ${stored}`
          );
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.warn(`localStorage 정리 중 에러 발생: ${key}`, error);
    }
  });
}

/**
 * 전체 localStorage를 검사하여 문제가 있는 키들을 정리하는 함수
 * 개발 중에만 사용하는 것을 권장합니다
 */
export function cleanupAllInvalidStorage(): void {
  try {
    const keys = Object.keys(localStorage);

    keys.forEach((key) => {
      try {
        const value = localStorage.getItem(key);

        if (value === 'undefined' || value === 'null') {
          console.log(`🧹 전체 정리: ${key} = ${value}`);
          localStorage.removeItem(key);
        }
      } catch (error) {
        console.warn(`키 ${key} 정리 중 에러:`, error);
      }
    });
  } catch (error) {
    console.warn('전체 localStorage 정리 중 에러:', error);
  }
}

/**
 * 안전한 localStorage 저장 함수
 * undefined나 null 값은 저장하지 않습니다
 */
export function safeSetLocalStorage(key: string, value: unknown): boolean {
  try {
    // undefined나 null은 저장하지 않음
    if (value === undefined || value === null) {
      console.warn(`localStorage에 ${key} 저장 건너뜀: 값이 ${value}`);
      return false;
    }

    // JSON.stringify 시도
    const stringified = JSON.stringify(value);

    // "undefined" 문자열이 되는 경우 저장하지 않음
    if (stringified === undefined || stringified === 'undefined') {
      console.warn(
        `localStorage에 ${key} 저장 건너뜀: stringify 결과가 undefined`
      );
      return false;
    }

    localStorage.setItem(key, stringified);
    return true;
  } catch (error) {
    console.warn(`localStorage 저장 실패: ${key}`, error);
    return false;
  }
}

/**
 * 안전한 localStorage 읽기 함수
 * 타입 체크와 에러 처리를 포함합니다
 */
export function safeGetLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);

    if (!stored || stored === 'undefined' || stored === 'null') {
      return defaultValue;
    }

    const parsed = JSON.parse(stored);

    // 타입이 일치하는지 확인
    if (typeof parsed === typeof defaultValue) {
      return parsed;
    }

    console.warn(`localStorage 값의 타입이 예상과 다름: ${key}`);
    return defaultValue;
  } catch (error) {
    console.warn(`localStorage 읽기 실패: ${key}`, error);
    // 에러가 발생한 키 정리
    try {
      localStorage.removeItem(key);
    } catch (cleanupError) {
      console.warn('localStorage 정리 실패:', cleanupError);
    }
    return defaultValue;
  }
}
