// userInfoStep/parts/UserBioSection.tsx

import { Textarea } from '@heroui/react';
import { useFormContext } from 'react-hook-form';
import { debugTypeCheck } from '../types/userInfoTypes';

/**
 * UserInfoStep - 자기소개 섹션 컴포넌트
 * 사용자 자기소개 입력 필드를 제공합니다.
 */

interface UserBioSectionProps {
  readonly maxLength?: number;
  readonly placeholder?: string;
}

function UserBioSection({
  maxLength = 500,
  placeholder = '간단한 자기소개를 입력하세요',
}: UserBioSectionProps) {
  console.log('📝 UserBioSection: 자기소개 섹션 렌더링', {
    maxLength,
    placeholder,
  });

  debugTypeCheck(maxLength, 'number');
  debugTypeCheck(placeholder, 'string');

  // React Hook Form 컨텍스트
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();

  // 현재 자기소개 값 감시
  const bioValue = watch('bio') || '';
  console.log('📝 UserBioSection: 현재 자기소개 길이', bioValue.length);

  // 자기소개 초기화 함수
  const clearBio = (): void => {
    console.log('🗑️ clearBio: 자기소개 내용 초기화');
    setValue('bio', '');
  };

  // 글자 수 계산
  const currentLength = bioValue.trim().length;
  const isOverLimit = currentLength > maxLength;

  console.log('📝 UserBioSection: 글자 수 상태', {
    currentLength,
    maxLength,
    isOverLimit,
  });

  return (
    <div className="w-full space-y-2">
      {/* 자기소개 입력 필드 */}
      <Textarea
        label="자기소개"
        placeholder={placeholder}
        minRows={3}
        maxRows={6}
        {...register('bio', {
          maxLength: {
            value: maxLength,
            message: `자기소개는 최대 ${maxLength}자까지 입력 가능합니다.`,
          },
        })}
        errorMessage={errors.bio?.message?.toString()}
        isInvalid={!!errors.bio || isOverLimit}
        aria-describedby="bio-info bio-counter"
        aria-label="자기소개 입력"
      />

      {/* 자기소개 정보 및 도구들 */}
      <div className="flex items-center justify-between">
        {/* 도움말 텍스트 */}
        <p id="bio-info" className="text-xs text-default-500" role="note">
          선택사항입니다. 간단한 소개를 작성해보세요.
        </p>

        {/* 오른쪽 도구들 */}
        <div className="flex items-center gap-2">
          {/* 글자 수 카운터 */}
          <span
            id="bio-counter"
            className={`text-xs ${
              isOverLimit
                ? 'text-danger'
                : currentLength > maxLength * 0.8
                ? 'text-warning'
                : 'text-default-400'
            }`}
            role="status"
            aria-live="polite"
            aria-label={`현재 ${currentLength}자, 최대 ${maxLength}자`}
          >
            {currentLength}/{maxLength}
          </span>

          {/* 초기화 버튼 (내용이 있을 때만 표시) */}
          {currentLength > 0 && (
            <button
              type="button"
              onClick={clearBio}
              className="text-xs transition-colors text-default-400 hover:text-default-600"
              aria-label="자기소개 내용 지우기"
            >
              지우기
            </button>
          )}
        </div>
      </div>

      {/* 글자 수 초과 경고 */}
      {isOverLimit && (
        <p className="text-xs text-danger" role="alert" aria-live="assertive">
          자기소개가 너무 깁니다. {maxLength}자 이하로 작성해주세요.
        </p>
      )}

      {/* 에러 메시지용 숨겨진 요소 */}
      {errors.bio && (
        <div className="sr-only" role="alert" aria-live="polite">
          {errors.bio.message?.toString()}
        </div>
      )}
    </div>
  );
}

export default UserBioSection;
