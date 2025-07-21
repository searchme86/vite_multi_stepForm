// src/components/multiStepForm/reactHookForm/hooks/useFormConfiguration.ts

import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import type { UseFormProps, Resolver } from 'react-hook-form';
import type { FormSchemaValues } from '../../types/formTypes';
import { formSchema } from '../../schema/formSchema';

// 🚀 타입 안전한 폼 설정 인터페이스 - 타입 유연성 개선
interface OptimizedFormConfiguration
  extends Partial<UseFormProps<FormSchemaValues>> {
  readonly resolver: Resolver<FormSchemaValues>;
  readonly defaultValues: Readonly<FormSchemaValues>;
  readonly mode: 'onChange';
  readonly reValidateMode: 'onChange';
  readonly shouldFocusError: boolean; // boolean 타입으로 변경
  readonly shouldUnregister: false;
  readonly criteriaMode: 'firstError' | 'all'; // 유니온 타입으로 변경
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
  const emptyArray: string[] = [];
  return emptyArray;
};

const createNullableImageField = (): string | null => {
  return null;
};

// 🚀 구체 타입: 불변 기본값 생성 함수
const createImmutableDefaultFormValues = (): Readonly<FormSchemaValues> => {
  const mediaArray = createEmptyStringArray();
  const sliderImagesArray = createEmptyStringArray();
  const mainImageValue = createNullableImageField();

  const formValues: FormSchemaValues = {
    userImage: '',
    nickname: '',
    emailPrefix: '',
    emailDomain: '',
    bio: '',
    title: '',
    description: '',
    tags: '',
    content: '',
    media: mediaArray,
    mainImage: mainImageValue,
    sliderImages: sliderImagesArray,
    editorCompletedContent: '',
    isEditorCompleted: false,
  };

  return Object.freeze(formValues);
};

// 🚀 구체 타입: Resolver 생성 함수
const createFormResolver = (): Resolver<FormSchemaValues> => {
  const resolverFunction = zodResolver(formSchema);

  // 타입 검증을 통한 안전한 반환
  const isValidResolver = (
    resolver: unknown
  ): resolver is Resolver<FormSchemaValues> => {
    return typeof resolver === 'function';
  };

  if (isValidResolver(resolverFunction)) {
    return resolverFunction;
  }

  throw new Error('Invalid resolver created');
};

// 🚀 메모리 최적화: 불변 기본값
const IMMUTABLE_DEFAULT_FORM_VALUES: Readonly<FormSchemaValues> =
  createImmutableDefaultFormValues();

// 🚀 메모리 최적화: 불변 해결자
const IMMUTABLE_FORM_RESOLVER: Resolver<FormSchemaValues> = Object.freeze(
  createFormResolver()
);

// 🚀 메모리 최적화: 사전 정의된 설정 변형들 - 타입 안전성 개선
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

// 🚀 구체 타입: 설정 객체 생성 함수 - 타입 호환성 개선
const buildOptimizedConfiguration = (
  variant: FormConfigurationVariant
): OptimizedFormConfiguration => {
  const { delayError, shouldFocusError, criteriaMode } = variant;

  // 각 속성을 명시적으로 구성
  const configResolver: Resolver<FormSchemaValues> = IMMUTABLE_FORM_RESOLVER;
  const configDefaultValues: Readonly<FormSchemaValues> =
    IMMUTABLE_DEFAULT_FORM_VALUES;
  const configMode: 'onChange' = 'onChange';
  const configReValidateMode: 'onChange' = 'onChange';
  const configShouldUnregister: false = false;

  // 구체적으로 타입이 검증된 설정 객체 생성
  const optimizedConfig: OptimizedFormConfiguration = {
    resolver: configResolver,
    defaultValues: configDefaultValues,
    mode: configMode,
    reValidateMode: configReValidateMode,
    shouldFocusError: shouldFocusError, // 변수 직접 사용으로 타입 호환성 확보
    shouldUnregister: configShouldUnregister,
    criteriaMode: criteriaMode, // 변수 직접 사용으로 타입 호환성 확보
    delayError,
  };

  return Object.freeze(optimizedConfig);
};

// 🚀 메모리 최적화된 설정 생성
const createOptimizedFormConfiguration = (
  variant: FormConfigurationVariant
): OptimizedFormConfiguration => {
  console.log('🔧 메모리 최적화된 폼 설정 생성:', variant.configurationId);

  const optimizedConfiguration = buildOptimizedConfiguration(variant);

  // WeakMap에 메타데이터 저장
  const currentTime = Date.now();
  configurationMetadataWeakMap.set(optimizedConfiguration, {
    creationTime: currentTime,
    accessCount: 0,
    lastUsedTime: currentTime,
    variantId: variant.configurationId,
  });

  console.log('✅ 메모리 최적화된 폼 설정 생성 완료');
  return optimizedConfiguration;
};

// 🚀 메타데이터 업데이트 유틸리티
const updateConfigurationMetadata = (
  configuration: OptimizedFormConfiguration,
  updateFn: (metadata: ConfigurationMetadata) => Partial<ConfigurationMetadata>
): void => {
  const existingMetadata = configurationMetadataWeakMap.get(configuration);

  if (existingMetadata) {
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
  // 사전 정의된 변형 확인
  const predefinedVariant = CONFIGURATION_VARIANTS_MAP.get(variantId);
  const variant =
    predefinedVariant || CONFIGURATION_VARIANTS_MAP.get('default');

  if (!variant) {
    throw new Error(`유효하지 않은 설정 변형: ${variantId}`);
  }

  // 새로운 설정 생성
  const newConfiguration = createOptimizedFormConfiguration(variant);

  return newConfiguration;
};

// 🚀 메모리 최적화된 메인 훅
export const useFormConfiguration = (
  variantId: string = 'default'
): OptimizedConfigurationResult => {
  console.log('📝 useFormConfiguration: 메모리 최적화된 폼 설정 초기화');

  // 최적화된 설정 조회 (메모이제이션)
  const formConfig = React.useMemo(() => {
    return getOrCreateOptimizedConfiguration(variantId);
  }, [variantId]);

  // 메타데이터 조회 (메모이제이션)
  const metadata = React.useMemo(() => {
    const configMetadata = configurationMetadataWeakMap.get(formConfig);

    if (configMetadata) {
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
    const statsObject = {
      cacheHitCount: 0,
      configurationCount: optimizedConfigurationCache.size,
      lastOptimizationTime: metadata.lastUsedTime,
    };

    return statsObject;
  }, [metadata.lastUsedTime]);

  // 접근 시간 업데이트
  React.useEffect(() => {
    updateConfigurationMetadata(formConfig, () => ({
      lastUsedTime: Date.now(),
    }));
  }, [formConfig]);

  console.log('📝 useFormConfiguration: 메모리 최적화 초기화 완료');

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
  const hasExistingVariant = CONFIGURATION_VARIANTS_MAP.has(variantId);
  if (hasExistingVariant) {
    console.warn('⚠️ 이미 존재하는 설정 변형:', variantId);
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

  console.log('✅ 사용자 정의 설정 변형 추가:', variantId);
  return true;
};

// 🚀 설정 메타데이터 조회
export const getFormConfigurationMetadata = (
  configuration: OptimizedFormConfiguration
): ConfigurationMetadata | null => {
  const metadata = configurationMetadataWeakMap.get(configuration);
  return metadata || null;
};
