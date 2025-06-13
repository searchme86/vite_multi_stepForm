import { Input, Select, SelectItem } from '@heroui/react';
import { useFormContext } from 'react-hook-form';
import { useEmailDomainSelection } from '../hooks/useEmailDomainSelection';
import {
  debugTypeCheck,
  EmailDomain,
  isValidEmailDomain,
  isStringValue,
  ensureStringValue,
} from '../types/userInfoTypes';

interface UserBasicInfoSectionProps {
  readonly onDomainSelect: (domain: string) => void;
  readonly onValidationSuccess: (domain: string) => void;
  readonly onValidationError: (message: string) => void;
  readonly setValue?: (fieldName: string, value: string) => void;
}

const hasMessageProperty = (error: object): error is { message: unknown } => {
  return 'message' in error;
};

const isObjectWithToString = (obj: object): obj is Record<string, unknown> => {
  return typeof obj === 'object' && obj !== null;
};

const hasToStringMethod = (error: object): error is { toString(): string } => {
  if (!('toString' in error)) {
    return false;
  }

  if (!isObjectWithToString(error)) {
    return false;
  }

  return typeof error.toString === 'function';
};

const getErrorMessage = (error: unknown): string => {
  console.log('🔧 getErrorMessage: 에러 메시지 추출', error);

  if (error === undefined || error === null) {
    console.log('✅ getErrorMessage: 에러 없음');
    return '';
  }

  if (isStringValue(error)) {
    console.log('✅ getErrorMessage: 문자열 에러 메시지', error);
    return error;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    hasMessageProperty(error)
  ) {
    const message = error.message;
    const stringMessage = ensureStringValue(message);

    console.log('✅ getErrorMessage: 객체의 message 속성', {
      originalMessage: message,
      messageType: typeof message,
      stringMessage,
    });
    return stringMessage;
  }

  if (typeof error === 'object' && error !== null && hasToStringMethod(error)) {
    try {
      const stringError = error.toString();
      console.log('✅ getErrorMessage: toString 결과', {
        originalError: error,
        stringError,
      });
      return ensureStringValue(stringError);
    } catch (toStringError) {
      console.warn('⚠️ getErrorMessage: toString 실행 중 오류', toStringError);
    }
  }

  const fallbackMessage = '알 수 없는 오류가 발생했습니다.';
  console.warn('⚠️ getErrorMessage: 알 수 없는 에러 타입, fallback 사용', {
    error,
    errorType: typeof error,
    fallbackMessage,
  });
  return fallbackMessage;
};

function UserBasicInfoSection({
  onDomainSelect,
  onValidationSuccess,
  onValidationError,
  setValue: propSetValue,
}: UserBasicInfoSectionProps) {
  console.log('👤 UserBasicInfoSection: 기본 정보 섹션 렌더링');

  debugTypeCheck(onDomainSelect, 'function');
  debugTypeCheck(onValidationSuccess, 'function');
  debugTypeCheck(onValidationError, 'function');

  const {
    register,
    formState: { errors },
    trigger,
    setValue,
  } = useFormContext();

  console.log('👤 UserBasicInfoSection: 현재 폼 에러들', errors);

  const { emailDomains, handleDomainSelect } = useEmailDomainSelection({
    onDomainSelect,
    onValidationSuccess,
    onValidationError,
    trigger,
    setValue: propSetValue || setValue,
  });

  console.log(
    '👤 UserBasicInfoSection: 사용 가능한 도메인 개수',
    emailDomains.length
  );

  const nicknameError = getErrorMessage(errors.nickname?.message);
  const emailPrefixError = getErrorMessage(errors.emailPrefix?.message);
  const emailDomainError = getErrorMessage(errors.emailDomain?.message);

  console.log('👤 UserBasicInfoSection: 추출된 에러 메시지들', {
    nicknameError,
    emailPrefixError,
    emailDomainError,
  });

  return (
    <div className="w-full space-y-4">
      <Input
        label="닉네임"
        placeholder="닉네임을 입력하세요"
        {...register('nickname')}
        errorMessage={nicknameError || undefined}
        isInvalid={!!errors.nickname}
        aria-describedby={errors.nickname ? 'nickname-error' : undefined}
        aria-required="true"
      />
      {errors.nickname && nicknameError && (
        <div
          id="nickname-error"
          className="sr-only"
          role="alert"
          aria-live="polite"
        >
          {nicknameError}
        </div>
      )}

      <div className="flex flex-col items-start gap-2 sm:flex-row">
        <Input
          label="이메일"
          placeholder="이메일 아이디"
          className="w-full"
          {...register('emailPrefix')}
          errorMessage={emailPrefixError || undefined}
          isInvalid={!!errors.emailPrefix}
          aria-describedby={
            errors.emailPrefix ? 'email-prefix-error' : undefined
          }
          aria-required="true"
        />
        {errors.emailPrefix && emailPrefixError && (
          <div
            id="email-prefix-error"
            className="sr-only"
            role="alert"
            aria-live="polite"
          >
            {emailPrefixError}
          </div>
        )}

        <span className="self-center hidden mt-3 sm:block" aria-hidden="true">
          @
        </span>
        <span className="block w-full text-center sm:hidden" aria-hidden="true">
          @
        </span>

        <div className="flex flex-row w-full gap-2">
          <Input
            label="도메인"
            placeholder="도메인"
            className="flex-1"
            {...register('emailDomain')}
            errorMessage={emailDomainError || undefined}
            isInvalid={!!errors.emailDomain}
            aria-describedby={
              errors.emailDomain ? 'email-domain-error' : undefined
            }
            aria-required="true"
          />
          {errors.emailDomain && emailDomainError && (
            <div
              id="email-domain-error"
              className="sr-only"
              role="alert"
              aria-live="polite"
            >
              {emailDomainError}
            </div>
          )}

          {/*====여기부터 수정됨====*/}
          {/* ✅ 수정: selectionMode를 single로 명시하여 타입 안전성 확보 */}
          {/* 이유: HeroUI Select의 SharedSelection 타입 에러 해결 */}
          <Select
            label="선택"
            placeholder="선택"
            className="w-32"
            selectionMode="single"
            onSelectionChange={handleDomainSelect}
            aria-label="이메일 도메인 선택"
          >
            {/*====여기까지 수정됨====*/}
            {emailDomains.map((domain: EmailDomain) => {
              if (!isValidEmailDomain(domain)) {
                console.warn(
                  '⚠️ UserBasicInfoSection: 유효하지 않은 도메인 객체',
                  {
                    domain,
                    domainType: typeof domain,
                  }
                );
                return null;
              }

              return (
                <SelectItem
                  key={domain.value}
                  aria-label={`${domain.label} 도메인 선택`}
                >
                  {domain.label}
                </SelectItem>
              );
            })}
          </Select>
        </div>
      </div>
    </div>
  );
}

export default UserBasicInfoSection;
