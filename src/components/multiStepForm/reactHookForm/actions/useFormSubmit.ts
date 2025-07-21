// src/components/multiStepForm/reactHookForm/actions/useFormSubmit.ts

import { useCallback } from 'react';
import type { FormSchemaValues } from '../../types/formTypes';

// 🔧 토스트 옵션
interface ToastOptions {
  title: string;
  description: string;
  color: 'success' | 'danger' | 'warning' | 'info';
}

// 🔧 Props 인터페이스
interface UseFormSubmitProps {
  addToast: (options: ToastOptions) => void;
}

// 🔧 검증 결과
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// 🔧 폼 데이터 검증
const validateFormSubmission = (data: FormSchemaValues): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 필수 필드 검증
  const { nickname, title, content } = data;

  if (!nickname || typeof nickname !== 'string' || nickname.trim() === '') {
    errors.push('닉네임이 필요합니다');
  }

  if (!title || typeof title !== 'string' || title.trim() === '') {
    errors.push('제목이 필요합니다');
  }

  if (!content || typeof content !== 'string' || content.trim() === '') {
    errors.push('내용이 필요합니다');
  }

  // 이메일 필드 검증
  const { emailPrefix, emailDomain } = data;
  const hasEmailPrefix =
    emailPrefix && typeof emailPrefix === 'string' && emailPrefix.trim() !== '';
  const hasEmailDomain =
    emailDomain && typeof emailDomain === 'string' && emailDomain.trim() !== '';

  if (hasEmailPrefix && !hasEmailDomain) {
    warnings.push('이메일 도메인이 누락되었습니다');
  }

  if (!hasEmailPrefix && hasEmailDomain) {
    warnings.push('이메일 아이디가 누락되었습니다');
  }

  // 에디터 완료 상태 검증
  const { isEditorCompleted, editorCompletedContent } = data;
  const editorContentExists =
    editorCompletedContent &&
    typeof editorCompletedContent === 'string' &&
    editorCompletedContent.trim() !== '';

  if (isEditorCompleted && !editorContentExists) {
    warnings.push('에디터 완료 상태이지만 내용이 없습니다');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

// 🔧 제출 데이터 최적화
const optimizeSubmissionData = (data: FormSchemaValues): FormSchemaValues => {
  const {
    userImage = '',
    mainImage = null,
    media = [],
    sliderImages = [],
    ...otherData
  } = data;

  // 이미지 크기 체크 (200KB 제한)
  const optimizedUserImage =
    typeof userImage === 'string' && userImage.length <= 200000
      ? userImage
      : '';

  const optimizedMainImage =
    typeof mainImage === 'string' && mainImage.length <= 200000
      ? mainImage
      : null;

  const optimizedMedia = Array.isArray(media)
    ? media.filter((item): item is string => {
        return typeof item === 'string' && item.length <= 200000;
      })
    : [];

  const optimizedSliderImages = Array.isArray(sliderImages)
    ? sliderImages.filter((item): item is string => {
        return typeof item === 'string' && item.length <= 200000;
      })
    : [];

  return {
    ...otherData,
    userImage: optimizedUserImage,
    mainImage: optimizedMainImage,
    media: optimizedMedia,
    sliderImages: optimizedSliderImages,
  };
};

export const useFormSubmit = ({ addToast }: UseFormSubmitProps) => {
  const onSubmit = useCallback(
    (data: FormSchemaValues) => {
      console.log('📤 폼 제출 시작');

      // 1단계: 데이터 검증
      const validation = validateFormSubmission(data);
      if (!validation.isValid) {
        addToast({
          title: '폼 제출 실패',
          description: `검증 실패: ${validation.errors.join(', ')}`,
          color: 'danger',
        });
        return;
      }

      // 경고 사항 알림
      if (validation.warnings.length > 0) {
        addToast({
          title: '제출 경고',
          description: validation.warnings.join(', '),
          color: 'warning',
        });
      }

      // 2단계: 데이터 최적화
      const optimizedData = optimizeSubmissionData(data);

      // 3단계: 실제 제출 처리 (모의)
      setTimeout(() => {
        // 성공률 90%로 모의 실패 케이스 포함
        const shouldFail = Math.random() < 0.1;

        if (shouldFail) {
          addToast({
            title: '제출 실패',
            description: '서버 오류로 제출에 실패했습니다',
            color: 'danger',
          });
          return;
        }

        addToast({
          title: '폼 제출 성공',
          description: '블로그 포스트가 성공적으로 생성되었습니다.',
          color: 'success',
        });

        console.log('✅ 폼 제출 성공');
      }, 1000);
    },
    [addToast]
  );

  return { onSubmit };
};
