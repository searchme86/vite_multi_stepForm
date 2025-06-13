import { useCallback, useMemo } from 'react';
import {
  EmailDomain,
  isValidEmailDomain,
  debugTypeCheck,
  isStringValue,
  //====여기부터 수정됨====
  // ✅ 수정: 사용되지 않는 ensureStringValue import 제거
  // 이유: TypeScript 경고 해결
  //====여기까지 수정됨====
} from '../types/userInfoTypes';
import {
  getDefaultEmailDomains,
  sanitizeUserInput,
} from '../utils/userInfoHelpers';
import { validateEmailDomain } from '../utils/userInfoValidation';

interface UseEmailDomainSelectionProps {
  readonly onDomainSelect: (domain: string) => void;
  readonly onValidationSuccess: (domain: string) => void;
  readonly onValidationError: (message: string) => void;
  readonly trigger?: (fieldName: string) => Promise<boolean>;
  readonly setValue?: (fieldName: string, value: string) => void;
}

interface UseEmailDomainSelectionReturn {
  readonly emailDomains: readonly EmailDomain[];
  //====여기부터 수정됨====
  // ✅ 수정: HeroUI Select의 onSelectionChange 타입에 맞게 변경
  // 이유: SharedSelection 타입은 단일 선택 시 Key, 다중 선택 시 Set<Key>를 받을 수 있음
  readonly handleDomainSelect: (keys: React.Key | Set<React.Key>) => void;
  //====여기까지 수정됨====
  readonly validateSelectedDomain: (domain: string) => Promise<boolean>;
  readonly isValidDomain: (domain: string) => boolean;
}

export const useEmailDomainSelection = ({
  onDomainSelect,
  onValidationSuccess,
  onValidationError,
  trigger,
  setValue,
}: UseEmailDomainSelectionProps): UseEmailDomainSelectionReturn => {
  console.log('📧 useEmailDomainSelection: 이메일 도메인 선택 훅 초기화');

  debugTypeCheck(onDomainSelect, 'function');
  debugTypeCheck(onValidationSuccess, 'function');
  debugTypeCheck(onValidationError, 'function');

  const emailDomains = useMemo<readonly EmailDomain[]>(() => {
    console.log('📧 useEmailDomainSelection: 도메인 목록 생성');
    const domains = getDefaultEmailDomains();

    domains.forEach((domain, index) => {
      if (!isValidEmailDomain(domain)) {
        console.error(
          `❌ useEmailDomainSelection: 잘못된 도메인 타입 at index ${index}`,
          {
            domain,
            index,
            domainType: typeof domain,
          }
        );
      } else {
        console.log(
          `✅ useEmailDomainSelection: 유효한 도메인 at index ${index}`,
          domain
        );
      }
    });

    return domains;
  }, []);

  const isValidDomain = useCallback((domain: unknown): boolean => {
    console.log('🔍 isValidDomain: 도메인 유효성 검사', domain);
    debugTypeCheck(domain, 'string');

    if (!isStringValue(domain)) {
      console.log('❌ isValidDomain: 도메인이 문자열이 아님', {
        domain,
        type: typeof domain,
      });
      return false;
    }

    const sanitizedDomain = sanitizeUserInput(domain, {
      trimWhitespace: true,
      toLowerCase: true,
    });

    const isValid = validateEmailDomain(sanitizedDomain);
    console.log(`✅ isValidDomain: 검사 결과`, {
      originalDomain: domain,
      sanitizedDomain,
      isValid,
    });

    return isValid;
  }, []);

  const validateSelectedDomain = useCallback(
    async (domain: unknown): Promise<boolean> => {
      console.log('🔍 validateSelectedDomain: 선택된 도메인 검증 시작', domain);
      debugTypeCheck(domain, 'string');

      if (!isStringValue(domain)) {
        const errorMessage = '도메인이 문자열이 아닙니다.';
        console.log('❌ validateSelectedDomain: 도메인 타입 오류', {
          domain,
          type: typeof domain,
          errorMessage,
        });
        onValidationError(errorMessage);
        return false;
      }

      try {
        if (!isValidDomain(domain)) {
          const errorMessage = '올바른 이메일 도메인을 선택해주세요.';
          console.log('❌ validateSelectedDomain: 기본 검증 실패', {
            domain,
            errorMessage,
          });
          onValidationError(errorMessage);
          return false;
        }

        if (trigger && typeof trigger === 'function') {
          console.log('🔍 validateSelectedDomain: React Hook Form 검증 실행');
          const isReactHookFormValid = await trigger('emailDomain');

          if (!isReactHookFormValid) {
            const errorMessage = '이메일 도메인 형식이 올바르지 않습니다.';
            console.log(
              '❌ validateSelectedDomain: React Hook Form 검증 실패',
              {
                domain,
                errorMessage,
              }
            );
            onValidationError(errorMessage);
            return false;
          }
        }

        console.log('✅ validateSelectedDomain: 모든 검증 통과', { domain });
        onValidationSuccess(domain);
        return true;
      } catch (error) {
        const errorMessage = '도메인 검증 중 오류가 발생했습니다.';
        console.error('❌ validateSelectedDomain: 검증 중 오류 발생', {
          error,
          domain,
          errorMessage,
          errorType: typeof error,
          errorInstance:
            error instanceof Error ? error.message : '알 수 없는 오류',
        });
        onValidationError(errorMessage);
        return false;
      }
    },
    [isValidDomain, trigger, onValidationSuccess, onValidationError]
  );

  const handleDomainSelect = useCallback(
    //====여기부터 수정됨====
    // ✅ 수정: HeroUI Select의 SharedSelection 타입에 맞게 변경
    // 이유: onSelectionChange는 단일 선택 시 Key, 다중 선택 시 Set<Key>를 전달할 수 있음
    (keys: React.Key | Set<React.Key>): void => {
      console.log('📧 handleDomainSelect: 도메인 선택 처리 시작');
      debugTypeCheck(keys, 'object');

      // 단일 Key인지 Set<Key>인지 확인
      let selectedKey: React.Key | null = null;

      if (keys instanceof Set) {
        // Set의 경우 첫 번째 값 사용 (단일 선택 모드에서는 하나만 있을 것)
        const firstKey = keys.values().next().value;
        selectedKey = firstKey || null;
        console.log('📧 handleDomainSelect: Set에서 첫 번째 키 추출', {
          setSize: keys.size,
          selectedKey,
        });
      } else {
        // 단일 Key인 경우
        selectedKey = keys;
        console.log('📧 handleDomainSelect: 단일 키 사용', { selectedKey });
      }

      if (!selectedKey) {
        console.log('⚠️ handleDomainSelect: 빈 키 선택됨', { selectedKey });
        return;
      }

      const selectedValue = String(selectedKey);
      console.log('📧 handleDomainSelect: 선택된 값', { selectedValue });

      if (!selectedValue || selectedValue.trim().length === 0) {
        console.log('⚠️ handleDomainSelect: 빈 값 선택됨', { selectedValue });
        return;
      }

      try {
        const sanitizedDomain = sanitizeUserInput(selectedValue, {
          trimWhitespace: true,
          toLowerCase: true,
        });

        console.log('📧 handleDomainSelect: 정리된 도메인', {
          original: selectedValue,
          sanitized: sanitizedDomain,
        });

        // React Hook Form setValue 직접 호출
        if (setValue && typeof setValue === 'function') {
          setValue('emailDomain', sanitizedDomain);
          console.log(
            '✅ handleDomainSelect: React Hook Form 필드 즉시 업데이트',
            {
              fieldName: 'emailDomain',
              value: sanitizedDomain,
            }
          );
        }

        onDomainSelect(sanitizedDomain);

        // 비동기 검증은 별도로 실행
        validateSelectedDomain(sanitizedDomain)
          .then((isValid) => {
            if (isValid) {
              console.log('✅ handleDomainSelect: 도메인 선택 및 검증 완료', {
                selectedDomain: sanitizedDomain,
              });
            } else {
              console.log('❌ handleDomainSelect: 도메인 검증 실패', {
                selectedDomain: sanitizedDomain,
              });
            }
          })
          .catch((error) => {
            const errorMessage = '도메인 검증 중 오류가 발생했습니다.';
            console.error('❌ handleDomainSelect: 비동기 검증 실패', {
              error,
              selectedValue,
              errorMessage,
            });
            onValidationError(errorMessage);
          });
      } catch (error) {
        const errorMessage = '도메인 선택 중 오류가 발생했습니다.';
        console.error('❌ handleDomainSelect: 도메인 선택 처리 중 오류', {
          error,
          selectedValue,
          errorMessage,
          errorType: typeof error,
          errorInstance:
            error instanceof Error ? error.message : '알 수 없는 오류',
        });
        onValidationError(errorMessage);
      }
    },
    //====여기까지 수정됨====
    [onDomainSelect, validateSelectedDomain, setValue, onValidationError]
  );

  console.log('✅ useEmailDomainSelection: 이메일 도메인 선택 훅 초기화 완료', {
    domainCount: emailDomains.length,
    hasTrigger: !!trigger,
  });

  return {
    emailDomains,
    handleDomainSelect,
    validateSelectedDomain,
    isValidDomain,
  };
};
