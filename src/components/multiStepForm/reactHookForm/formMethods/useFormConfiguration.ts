// src/components/multiStepForm/reactHookForm/formMethods/useFormConfiguration.ts

import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import type { UseFormProps, Resolver } from 'react-hook-form';
import type { FormSchemaValues } from '../../types/formTypes';
import { formSchema } from '../../schema/formSchema';
import {
  getDefaultFormSchemaValues,
  getAllFieldNames,
} from '../../utils/formFieldsLoader';

// 🚀 타입 안전한 폼 설정 인터페이스
interface OptimizedFormConfiguration
  extends Partial<UseFormProps<FormSchemaValues>> {
  readonly resolver: Resolver<FormSchemaValues>;
  readonly defaultValues: Readonly<FormSchemaValues>;
  readonly mode: 'onChange';
  readonly reValidateMode: 'onChange';
  readonly shouldFocusError: boolean;
  readonly shouldUnregister: false;
  readonly criteriaMode: 'firstError' | 'all';
  readonly delayError: number;
}

interface FormConfigurationVariant {
  readonly configurationId: string;
  readonly delayError: number;
  readonly shouldFocusError: boolean;
  readonly criteriaMode: 'firstError' | 'all';
}

interface ConfigurationMetadata {
  readonly creationTime: number;
  readonly accessCount: number;
  readonly lastUsedTime: number;
  readonly variantId: string;
}

interface OptimizedConfigurationResult {
  readonly formConfig: OptimizedFormConfiguration;
  readonly metadata: ConfigurationMetadata;
  readonly memoryStats: {
    readonly cacheHitCount: number;
    readonly configurationCount: number;
    readonly lastOptimizationTime: number;
  };
}

// 🚀 구체 타입: 빈 배열 생성 함수들
const createEmptyStringArray = (): string[] => {
  console.log('🔧 [DYNAMIC_CONFIG] 빈 문자열 배열 생성');
  const emptyArray: string[] = [];
  return emptyArray;
};

const createNullableImageField = (): string | null => {
  console.log('🔧 [DYNAMIC_CONFIG] nullable 이미지 필드 생성');
  return null;
};

// 🚀 동적 기본값 생성 함수 - 12개 필드만 (content, tags 제거)
const createDynamicImmutableDefaultFormValues =
  (): Readonly<FormSchemaValues> => {
    console.log(
      '🔧 [DYNAMIC_CONFIG] 동적 불변 FormValues 생성 시작 (12개 필드)'
    );

    const dynamicDefaultValues = getDefaultFormSchemaValues();
    const allFieldNames = getAllFieldNames();

    console.log('🔧 [DYNAMIC_CONFIG] 동적 필드 목록 (12개):', allFieldNames);
    console.log('🔧 [DYNAMIC_CONFIG] 동적 기본값:', dynamicDefaultValues);

    // Map을 사용하여 타입 안전성 확보
    const dynamicValuesMap = new Map(Object.entries(dynamicDefaultValues));

    console.log(
      '🔧 [DYNAMIC_CONFIG] 각 필드별 타입 안전 처리 시작 (12개 필드)'
    );

    // 각 필드별로 정확한 타입 처리 (타입단언 제거) - 12개 필드만
    const safeUserImage = (): string => {
      const rawValue = dynamicValuesMap.get('userImage');
      return typeof rawValue === 'string' ? rawValue : '';
    };

    const safeNickname = (): string => {
      const rawValue = dynamicValuesMap.get('nickname');
      return typeof rawValue === 'string' ? rawValue : '';
    };

    const safeEmailPrefix = (): string => {
      const rawValue = dynamicValuesMap.get('emailPrefix');
      return typeof rawValue === 'string' ? rawValue : '';
    };

    const safeEmailDomain = (): string => {
      const rawValue = dynamicValuesMap.get('emailDomain');
      return typeof rawValue === 'string' ? rawValue : '';
    };

    const safeBio = (): string => {
      const rawValue = dynamicValuesMap.get('bio');
      return typeof rawValue === 'string' ? rawValue : '';
    };

    const safeTitle = (): string => {
      const rawValue = dynamicValuesMap.get('title');
      return typeof rawValue === 'string' ? rawValue : '';
    };

    const safeDescription = (): string => {
      const rawValue = dynamicValuesMap.get('description');
      return typeof rawValue === 'string' ? rawValue : '';
    };

    const safeMedia = (): string[] => {
      const rawValue = dynamicValuesMap.get('media');
      return Array.isArray(rawValue)
        ? rawValue.filter((item) => typeof item === 'string')
        : createEmptyStringArray();
    };

    const safeMainImage = (): string | null => {
      const rawValue = dynamicValuesMap.get('mainImage');
      if (rawValue === null) {
        return null;
      }
      if (typeof rawValue === 'string') {
        return rawValue;
      }
      return createNullableImageField();
    };

    const safeSliderImages = (): string[] => {
      const rawValue = dynamicValuesMap.get('sliderImages');
      return Array.isArray(rawValue)
        ? rawValue.filter((item) => typeof item === 'string')
        : createEmptyStringArray();
    };

    const safeEditorCompletedContent = (): string => {
      const rawValue = dynamicValuesMap.get('editorCompletedContent');
      return typeof rawValue === 'string' ? rawValue : '';
    };

    const safeIsEditorCompleted = (): boolean => {
      const rawValue = dynamicValuesMap.get('isEditorCompleted');
      return typeof rawValue === 'boolean' ? rawValue : false;
    };

    // FormSchemaValues 타입으로 안전하게 변환 (12개 필드만, content/tags 제거)
    const formValuesWithTypeSafety: FormSchemaValues = {
      userImage: safeUserImage(),
      nickname: safeNickname(),
      emailPrefix: safeEmailPrefix(),
      emailDomain: safeEmailDomain(),
      bio: safeBio(),
      title: safeTitle(),
      description: safeDescription(),
      media: safeMedia(),
      mainImage: safeMainImage(),
      sliderImages: safeSliderImages(),
      editorCompletedContent: safeEditorCompletedContent(),
      isEditorCompleted: safeIsEditorCompleted(),
    };

    console.log(
      '✅ [DYNAMIC_CONFIG] 동적 불변 FormValues 생성 완료 (12개 필드)'
    );
    return Object.freeze(formValuesWithTypeSafety);
  };

// 🚀 구체 타입: Resolver 생성 함수
const createFormResolver = (): Resolver<FormSchemaValues> => {
  console.log('🔧 [DYNAMIC_CONFIG] Resolver 생성');
  const resolverFunction = zodResolver(formSchema);

  // 타입 검증을 통한 안전한 반환
  const isValidResolver = (
    resolver: unknown
  ): resolver is Resolver<FormSchemaValues> => {
    return typeof resolver === 'function';
  };

  const resolverValidationResult = isValidResolver(resolverFunction);

  if (resolverValidationResult) {
    console.log('✅ [DYNAMIC_CONFIG] Resolver 생성 완료');
    return resolverFunction;
  }

  throw new Error('Invalid resolver created');
};

// 🚀 메모리 최적화: 동적 불변 기본값 (12개 필드)
const DYNAMIC_IMMUTABLE_DEFAULT_FORM_VALUES: Readonly<FormSchemaValues> =
  createDynamicImmutableDefaultFormValues();

// 🚀 메모리 최적화: 불변 해결자
const IMMUTABLE_FORM_RESOLVER: Resolver<FormSchemaValues> = Object.freeze(
  createFormResolver()
);

// 🚀 메모리 최적화: 사전 정의된 설정 변형들
const CONFIGURATION_VARIANTS_MAP = new Map<string, FormConfigurationVariant>([
  [
    'default',
    Object.freeze({
      configurationId: 'default',
      delayError: 300,
      shouldFocusError: true,
      criteriaMode: 'firstError' as const,
    }),
  ],
  [
    'fast',
    Object.freeze({
      configurationId: 'fast',
      delayError: 100,
      shouldFocusError: true,
      criteriaMode: 'firstError' as const,
    }),
  ],
  [
    'thorough',
    Object.freeze({
      configurationId: 'thorough',
      delayError: 500,
      shouldFocusError: true,
      criteriaMode: 'all' as const,
    }),
  ],
]);

// 🚀 WeakMap 기반 설정 메타데이터 (자동 GC)
const configurationMetadataWeakMap = new WeakMap<
  OptimizedFormConfiguration,
  ConfigurationMetadata
>();

// 🚀 메모리 효율적인 설정 캐시
const optimizedConfigurationCache = new Map<
  string,
  {
    readonly configuration: OptimizedFormConfiguration;
    readonly creationTime: number;
    readonly accessCount: number;
  }
>();

// 🚀 구체 타입: 설정 객체 생성 함수
const buildOptimizedConfiguration = (
  variant: FormConfigurationVariant
): OptimizedFormConfiguration => {
  console.log(
    '🔧 [DYNAMIC_CONFIG] 최적화된 설정 빌드:',
    variant.configurationId
  );

  const { delayError, shouldFocusError, criteriaMode } = variant;

  // 각 속성을 명시적으로 구성
  const configResolver: Resolver<FormSchemaValues> = IMMUTABLE_FORM_RESOLVER;
  const configDefaultValues: Readonly<FormSchemaValues> =
    DYNAMIC_IMMUTABLE_DEFAULT_FORM_VALUES;
  const configMode: 'onChange' = 'onChange';
  const configReValidateMode: 'onChange' = 'onChange';
  const configShouldUnregister: false = false;

  // 구체적으로 타입이 검증된 설정 객체 생성
  const optimizedConfig: OptimizedFormConfiguration = {
    resolver: configResolver,
    defaultValues: configDefaultValues,
    mode: configMode,
    reValidateMode: configReValidateMode,
    shouldFocusError: shouldFocusError,
    shouldUnregister: configShouldUnregister,
    criteriaMode: criteriaMode,
    delayError,
  };

  console.log('✅ [DYNAMIC_CONFIG] 최적화된 설정 빌드 완료');
  return Object.freeze(optimizedConfig);
};

// 🚀 메모리 최적화된 설정 생성
const createOptimizedFormConfiguration = (
  variant: FormConfigurationVariant
): OptimizedFormConfiguration => {
  console.log(
    '🔧 [DYNAMIC_CONFIG] 메모리 최적화된 폼 설정 생성:',
    variant.configurationId
  );

  const optimizedConfiguration = buildOptimizedConfiguration(variant);

  // WeakMap에 메타데이터 저장
  const currentTime = Date.now();
  configurationMetadataWeakMap.set(optimizedConfiguration, {
    creationTime: currentTime,
    accessCount: 0,
    lastUsedTime: currentTime,
    variantId: variant.configurationId,
  });

  console.log('✅ [DYNAMIC_CONFIG] 메모리 최적화된 폼 설정 생성 완료');
  return optimizedConfiguration;
};

// 🚀 메타데이터 업데이트 유틸리티
const updateConfigurationMetadata = (
  configuration: OptimizedFormConfiguration,
  updateFn: (metadata: ConfigurationMetadata) => Partial<ConfigurationMetadata>
): void => {
  const existingMetadata = configurationMetadataWeakMap.get(configuration);

  const hasExistingMetadata = existingMetadata !== undefined;

  if (hasExistingMetadata) {
    const updatedMetadata: ConfigurationMetadata = {
      ...existingMetadata,
      ...updateFn(existingMetadata),
    };

    configurationMetadataWeakMap.set(configuration, updatedMetadata);
  }
};

// 🚀 메모리 최적화된 설정 조회 또는 생성
const getOrCreateOptimizedConfiguration = (
  variantId: string = 'default'
): OptimizedFormConfiguration => {
  console.log('🔧 [DYNAMIC_CONFIG] 설정 조회 또는 생성:', variantId);

  // 사전 정의된 변형 확인
  const predefinedVariant = CONFIGURATION_VARIANTS_MAP.get(variantId);
  const defaultVariant = CONFIGURATION_VARIANTS_MAP.get('default');
  const variant =
    predefinedVariant !== undefined ? predefinedVariant : defaultVariant;

  if (variant === undefined) {
    throw new Error(`유효하지 않은 설정 변형: ${variantId}`);
  }

  // 새로운 설정 생성
  const newConfiguration = createOptimizedFormConfiguration(variant);

  console.log('✅ [DYNAMIC_CONFIG] 설정 조회 또는 생성 완료');
  return newConfiguration;
};

// 🚀 메모리 최적화된 메인 훅
export const useFormConfiguration = (
  variantId: string = 'default'
): OptimizedConfigurationResult => {
  console.log(
    '📝 [DYNAMIC_CONFIG] useFormConfiguration: 메모리 최적화된 폼 설정 초기화 (12개 필드)'
  );

  // 최적화된 설정 조회 (메모이제이션)
  const formConfig = React.useMemo(() => {
    console.log('🔧 [DYNAMIC_CONFIG] useMemo: 폼 설정 생성');
    return getOrCreateOptimizedConfiguration(variantId);
  }, [variantId]);

  // 메타데이터 조회 (메모이제이션)
  const metadata = React.useMemo(() => {
    console.log('🔧 [DYNAMIC_CONFIG] useMemo: 메타데이터 조회');
    const configMetadata = configurationMetadataWeakMap.get(formConfig);

    const hasConfigMetadata = configMetadata !== undefined;

    if (hasConfigMetadata) {
      return configMetadata;
    }

    // fallback 메타데이터
    const currentTime = Date.now();
    const fallbackMetadata: ConfigurationMetadata = {
      creationTime: currentTime,
      accessCount: 0,
      lastUsedTime: currentTime,
      variantId: 'unknown',
    };

    return fallbackMetadata;
  }, [formConfig]);

  // 메모리 통계 계산 (메모이제이션)
  const memoryStats = React.useMemo(() => {
    console.log('🔧 [DYNAMIC_CONFIG] useMemo: 메모리 통계 계산');
    const statsObject = {
      cacheHitCount: 0,
      configurationCount: optimizedConfigurationCache.size,
      lastOptimizationTime: metadata.lastUsedTime,
    };

    return statsObject;
  }, [metadata.lastUsedTime]);

  // 접근 시간 업데이트
  React.useEffect(() => {
    console.log('🔧 [DYNAMIC_CONFIG] useEffect: 접근 시간 업데이트');
    updateConfigurationMetadata(formConfig, () => ({
      lastUsedTime: Date.now(),
    }));
  }, [formConfig]);

  console.log(
    '📝 [DYNAMIC_CONFIG] useFormConfiguration: 메모리 최적화 초기화 완료 (12개 필드)'
  );

  const resultObject: OptimizedConfigurationResult = {
    formConfig,
    metadata,
    memoryStats,
  };

  return resultObject;
};

// 🚀 설정 변형 관리 유틸리티
export const getAvailableConfigurationVariants = (): ReadonlyArray<string> => {
  const variantKeys = Array.from(CONFIGURATION_VARIANTS_MAP.keys());
  return variantKeys;
};

export const addCustomConfigurationVariant = (
  variantId: string,
  variant: Omit<FormConfigurationVariant, 'configurationId'>
): boolean => {
  console.log(
    '🔧 [DYNAMIC_CONFIG] 사용자 정의 설정 변형 추가 시도:',
    variantId
  );

  const hasExistingVariant = CONFIGURATION_VARIANTS_MAP.has(variantId);
  if (hasExistingVariant) {
    console.warn('⚠️ [DYNAMIC_CONFIG] 이미 존재하는 설정 변형:', variantId);
    return false;
  }

  const customVariant: FormConfigurationVariant = {
    configurationId: variantId,
    delayError: variant.delayError,
    shouldFocusError: variant.shouldFocusError,
    criteriaMode: variant.criteriaMode,
  };

  // 원본 Map에 직접 추가 (타입 안전성 유지)
  CONFIGURATION_VARIANTS_MAP.set(variantId, Object.freeze(customVariant));

  console.log(
    '✅ [DYNAMIC_CONFIG] 사용자 정의 설정 변형 추가 완료:',
    variantId
  );
  return true;
};

// 🚀 설정 메타데이터 조회
export const getFormConfigurationMetadata = (
  configuration: OptimizedFormConfiguration
): ConfigurationMetadata | null => {
  const metadata = configurationMetadataWeakMap.get(configuration);
  const hasMetadata = metadata !== undefined;
  return hasMetadata ? metadata : null;
};
