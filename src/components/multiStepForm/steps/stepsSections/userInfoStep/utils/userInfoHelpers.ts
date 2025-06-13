import {
  EmailDomain,
  isValidEmailDomain,
  debugTypeCheck,
  ensureStringValue,
  isStringValue,
} from '../types/userInfoTypes';

export const getDefaultEmailDomains = (): readonly EmailDomain[] => {
  console.log('📧 getDefaultEmailDomains: 기본 이메일 도메인 목록 생성');

  const domains: readonly EmailDomain[] = [
    { label: 'gmail.com', value: 'gmail.com' },
    { label: 'naver.com', value: 'naver.com' },
    { label: 'daum.net', value: 'daum.net' },
    { label: 'yahoo.com', value: 'yahoo.com' },
  ];

  domains.forEach((domain, index) => {
    if (!isValidEmailDomain(domain)) {
      console.error(
        `❌ getDefaultEmailDomains: 잘못된 도메인 타입 at index ${index}`,
        domain
      );
    } else {
      console.log(
        `✅ getDefaultEmailDomains: 유효한 도메인 at index ${index}`,
        domain
      );
    }
  });

  console.log('✅ getDefaultEmailDomains: 도메인 목록 생성 완료', domains);
  return domains;
};

export const convertImageToBase64 = (file: File): Promise<string> => {
  console.log('🖼️ convertImageToBase64: 이미지 변환 시작');

  if (!(file instanceof File)) {
    const errorMessage = '유효하지 않은 파일 객체입니다.';
    console.error('❌ convertImageToBase64: 파일이 File 객체가 아님');
    return Promise.reject(new Error(errorMessage));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const result = event.target?.result;
      debugTypeCheck(result, 'string');

      if (isStringValue(result)) {
        console.log('✅ convertImageToBase64: 변환 성공');
        resolve(result);
      } else {
        const errorMessage = '이미지 변환에 실패했습니다.';
        console.error('❌ convertImageToBase64: 변환 결과가 문자열이 아님');
        reject(new Error(errorMessage));
      }
    };

    reader.onerror = (fileError) => {
      const errorMessage = '이미지 읽기에 실패했습니다.';
      console.error('❌ convertImageToBase64: 변환 실패', fileError);
      reject(new Error(errorMessage));
    };

    reader.readAsDataURL(file);
  });
};

export const createDebounce = <T extends readonly unknown[]>(
  func: (...args: T) => void,
  delay: number
): ((...args: T) => void) => {
  console.log('⏱️ createDebounce: 디바운스 함수 생성', { delay });

  if (typeof delay !== 'number' || delay < 0 || !Number.isFinite(delay)) {
    const fallbackDelay = 300;
    console.warn('⚠️ createDebounce: 유효하지 않은 delay 값, 기본값 사용', {
      providedDelay: delay,
      delayType: typeof delay,
      isFinite: Number.isFinite(delay),
      fallbackDelay,
    });
    delay = fallbackDelay;
  }

  let timeoutId: number | null = null;

  return (...args: T) => {
    debugTypeCheck(args, 'array');

    if (!Array.isArray(args)) {
      console.error('❌ createDebounce: args가 배열이 아님', {
        args,
        type: typeof args,
        isArray: Array.isArray(args),
      });
      return;
    }

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      console.log('⏱️ createDebounce: 이전 타이머 제거');
    }

    timeoutId = setTimeout(() => {
      console.log('⏱️ createDebounce: 함수 실행', args);
      try {
        func.apply(undefined, args);
        console.log('✅ createDebounce: 디바운스된 함수 실행 성공');
      } catch (error) {
        console.error('❌ createDebounce: 디바운스된 함수 실행 중 오류', {
          error,
          args,
          errorMessage:
            error instanceof Error ? error.message : '알 수 없는 오류',
        });
      }
    }, delay);
  };
};

export const sanitizeUserInput = (
  input: unknown,
  options: {
    trimWhitespace?: boolean;
    toLowerCase?: boolean;
    removeSpecialChars?: boolean;
  } = {}
): string => {
  console.log('🧹 sanitizeUserInput: 입력값 정리 시작', { input, options });
  debugTypeCheck(input, 'string');

  const stringInput = ensureStringValue(input);

  if (!isStringValue(input)) {
    console.warn('⚠️ sanitizeUserInput: 입력값이 문자열이 아니므로 변환', {
      originalInput: input,
      originalType: typeof input,
      convertedInput: stringInput,
    });
  }

  let sanitized = stringInput;

  if (options.trimWhitespace !== false) {
    const beforeTrim = sanitized;
    sanitized = sanitized.trim();
    console.log('🧹 sanitizeUserInput: 공백 제거 완료', {
      before: beforeTrim,
      after: sanitized,
      removed: beforeTrim.length - sanitized.length,
    });
  }

  if (options.toLowerCase === true) {
    const beforeLower = sanitized;
    sanitized = sanitized.toLowerCase();
    console.log('🧹 sanitizeUserInput: 소문자 변환 완료', {
      before: beforeLower,
      after: sanitized,
      changed: beforeLower !== sanitized,
    });
  }

  if (options.removeSpecialChars === true) {
    const beforeSpecial = sanitized;
    sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '');
    console.log('🧹 sanitizeUserInput: 특수문자 제거 완료', {
      before: beforeSpecial,
      after: sanitized,
      removedChars: beforeSpecial.length - sanitized.length,
    });
  }

  console.log('✅ sanitizeUserInput: 정리 완료', {
    original: input,
    sanitized,
    changed: stringInput !== sanitized,
  });

  return sanitized;
};

type ValidFormFieldName =
  | 'nickname'
  | 'emailPrefix'
  | 'emailDomain'
  | 'bio'
  | 'userImage';

const isValidFieldNameType = (
  fieldName: string
): fieldName is ValidFormFieldName => {
  const validFields: readonly string[] = [
    'nickname',
    'emailPrefix',
    'emailDomain',
    'bio',
    'userImage',
  ];

  return validFields.includes(fieldName);
};

export const isValidFormFieldName = (
  fieldName: unknown
): fieldName is ValidFormFieldName => {
  console.log('📝 isValidFormFieldName: 필드명 검증 시작', fieldName);
  debugTypeCheck(fieldName, 'string');

  if (!isStringValue(fieldName)) {
    console.log('❌ isValidFormFieldName: 필드명이 문자열이 아님', {
      fieldName,
      type: typeof fieldName,
    });
    return false;
  }

  const isValid = isValidFieldNameType(fieldName);

  console.log('📝 isValidFormFieldName: 필드명 검증 완료', {
    fieldName,
    isValid,
  });

  return isValid;
};

const isStringRecord = (obj: object): obj is Record<string, unknown> => {
  return typeof obj === 'object' && obj !== null;
};

export const safeGetProperty = <T>(
  obj: unknown,
  key: string,
  typeGuard: (value: unknown) => value is T
): T | undefined => {
  console.log('🔧 safeGetProperty: 안전한 속성 접근', { obj, key });

  if (typeof obj !== 'object' || obj === null) {
    console.log('❌ safeGetProperty: 객체가 아니거나 null', {
      obj,
      type: typeof obj,
    });
    return undefined;
  }

  if (!(key in obj)) {
    console.log('❌ safeGetProperty: 속성이 존재하지 않음', {
      key,
      availableKeys: Object.keys(obj),
    });
    return undefined;
  }

  let value: unknown;
  if (isStringRecord(obj)) {
    value = obj[key];
  } else {
    console.log('❌ safeGetProperty: 객체가 Record 형태가 아님', {
      obj,
      objType: typeof obj,
    });
    return undefined;
  }

  if (typeGuard(value)) {
    console.log('✅ safeGetProperty: 속성 접근 성공', { key, value });
    return value;
  }

  console.log('❌ safeGetProperty: 타입 검증 실패', {
    key,
    value,
    valueType: typeof value,
  });
  return undefined;
};
