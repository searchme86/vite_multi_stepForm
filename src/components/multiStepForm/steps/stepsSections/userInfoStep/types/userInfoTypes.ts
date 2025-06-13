export interface EmailDomain {
  readonly label: string;
  readonly value: string;
}

export interface ImageUploadState {
  readonly imageSrc: string;
  readonly showCropper: boolean;
  readonly cropData: string | null;
}

export interface UserInfoFields {
  readonly nickname: string;
  readonly emailPrefix: string;
  readonly emailDomain: string;
  readonly bio: string;
  readonly userImage: string;
}

export type ToastColor =
  | 'success'
  | 'danger'
  | 'warning'
  | 'primary'
  | 'default';

const isStringRecord = (obj: object): obj is Record<string, unknown> => {
  return typeof obj === 'object' && obj !== null;
};

const hasStringPropertyInternal = (obj: object, key: string): boolean => {
  if (!isStringRecord(obj)) {
    return false;
  }

  return key in obj && typeof obj[key] === 'string';
};

const getStringProperty = (obj: object, key: string): string | undefined => {
  if (hasStringPropertyInternal(obj, key) && isStringRecord(obj)) {
    const value = obj[key];
    return typeof value === 'string' ? value : undefined;
  }
  return undefined;
};

export const isValidEmailDomain = (domain: unknown): domain is EmailDomain => {
  console.log('🔍 isValidEmailDomain: 이메일 도메인 타입 검증 시작', domain);

  if (typeof domain !== 'object' || domain === null) {
    console.log('❌ isValidEmailDomain: 객체가 아니거나 null임', {
      domain,
      type: typeof domain,
    });
    return false;
  }

  if (!('label' in domain) || !('value' in domain)) {
    console.log('❌ isValidEmailDomain: label 또는 value 속성이 없음', {
      hasLabel: 'label' in domain,
      hasValue: 'value' in domain,
    });
    return false;
  }

  const labelValue = getStringProperty(domain, 'label');
  const valueValue = getStringProperty(domain, 'value');

  if (labelValue === undefined || valueValue === undefined) {
    let labelType = 'unknown';
    let valueType = 'unknown';

    if (isStringRecord(domain)) {
      labelType = typeof domain.label;
      valueType = typeof domain.value;
    }

    console.log('❌ isValidEmailDomain: label 또는 value가 문자열이 아님', {
      labelType,
      valueType,
    });
    return false;
  }

  if (labelValue.trim().length === 0 || valueValue.trim().length === 0) {
    console.log('❌ isValidEmailDomain: label 또는 value가 빈 문자열', {
      labelLength: labelValue.trim().length,
      valueLength: valueValue.trim().length,
    });
    return false;
  }

  console.log('✅ isValidEmailDomain: 검증 성공', {
    label: labelValue,
    value: valueValue,
  });
  return true;
};

export const isValidImageFile = (file: unknown): file is File => {
  console.log('🔍 isValidImageFile: 이미지 파일 타입 검증 시작', file);

  if (!(file instanceof File)) {
    console.log('❌ isValidImageFile: File 객체가 아님', {
      file,
      type: typeof file,
    });
    return false;
  }

  const isImageType = file.type.startsWith('image/');
  if (!isImageType) {
    console.log('❌ isValidImageFile: 이미지 타입이 아님', {
      fileName: file.name,
      mimeType: file.type,
    });
    return false;
  }

  console.log('✅ isValidImageFile: 검증 성공', {
    fileName: file.name,
    mimeType: file.type,
    size: file.size,
  });
  return true;
};

export const isNonEmptyString = (value: unknown): value is string => {
  console.log('🔍 isNonEmptyString: 비어있지 않은 문자열 검증', value);

  if (typeof value !== 'string') {
    console.log('❌ isNonEmptyString: 문자열이 아님', {
      value,
      type: typeof value,
    });
    return false;
  }

  const isNonEmpty = value.trim().length > 0;
  if (!isNonEmpty) {
    console.log('❌ isNonEmptyString: 빈 문자열', {
      value,
      trimmedLength: value.trim().length,
    });
    return false;
  }

  console.log('✅ isNonEmptyString: 검증 성공', {
    value,
    length: value.length,
  });
  return true;
};

const isValidColorValue = (color: string): color is ToastColor => {
  const validColors: readonly string[] = [
    'success',
    'danger',
    'warning',
    'primary',
    'default',
  ];

  return validColors.includes(color);
};

export const isValidToastColor = (color: unknown): color is ToastColor => {
  console.log('🔍 isValidToastColor: Toast 색상 타입 검증 시작', color);

  if (typeof color !== 'string') {
    console.log('❌ isValidToastColor: 문자열이 아님', {
      color,
      type: typeof color,
    });
    return false;
  }

  const isValidColor = isValidColorValue(color);

  if (!isValidColor) {
    console.log('❌ isValidToastColor: 유효하지 않은 색상', {
      providedColor: color,
    });
    return false;
  }

  console.log('✅ isValidToastColor: 검증 성공', { color });
  return true;
};

export const isStringValue = (value: unknown): value is string => {
  const isString = typeof value === 'string';
  console.log('🔍 isStringValue: 문자열 타입 검증', {
    value,
    type: typeof value,
    isString,
  });
  return isString;
};

export const ensureStringValue = (value: unknown, fallback = ''): string => {
  console.log('🔧 ensureStringValue: 문자열 값 보장', { value, fallback });

  if (isStringValue(value)) {
    console.log('✅ ensureStringValue: 이미 문자열', { value });
    return value;
  }

  console.log('⚠️ ensureStringValue: 문자열이 아니므로 fallback 사용', {
    originalValue: value,
    originalType: typeof value,
    fallback,
  });
  return fallback;
};

export const debugTypeCheck = (value: unknown, expectedType: string): void => {
  const actualType = typeof value;
  const isCorrectType = actualType === expectedType;

  console.log(
    `🔍 Type Check - Expected: ${expectedType}, Actual: ${actualType}, Match: ${isCorrectType}`,
    { value, expectedType, actualType, isCorrectType }
  );

  if (!isCorrectType) {
    console.warn('⚠️ 타입 불일치 감지:', {
      value,
      expectedType,
      actualType,
      suggestion: `값을 ${expectedType} 타입으로 변환하거나 타입 검증을 추가하세요.`,
    });
  }
};

export const isObject = (value: unknown): value is object => {
  return typeof value === 'object' && value !== null;
};

export const isNonNullObject = <T extends object>(
  value: unknown
): value is T => {
  return isObject(value);
};

export const hasProperty = <K extends string>(
  obj: object,
  key: K
): obj is object & Record<K, unknown> => {
  return key in obj;
};

export const hasStringProperty = <K extends string>(
  obj: object,
  key: K
): obj is object & Record<K, string> => {
  if (!hasProperty(obj, key)) {
    return false;
  }

  if (!isStringRecord(obj)) {
    return false;
  }

  const value = obj[key];
  return typeof value === 'string';
};

export const ensureValidToastColor = (color: unknown): ToastColor => {
  console.log('🎯 ensureValidToastColor: Toast 색상 보장', color);

  if (isValidToastColor(color)) {
    console.log('✅ ensureValidToastColor: 유효한 색상', color);
    return color;
  }

  const fallbackColor: ToastColor = 'default';
  console.warn('⚠️ ensureValidToastColor: 유효하지 않은 색상, fallback 사용', {
    providedColor: color,
    providedType: typeof color,
    fallbackColor,
  });

  return fallbackColor;
};
