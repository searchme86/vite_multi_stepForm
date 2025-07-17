// userInfoStep/UserInfoStepContainer.tsx - 디버깅 버전

import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { useUserInfoFormSync } from './hooks/useUserInfoFormSync';
import UserProfileImageSection from './parts/UserProfileImageSection';
import UserBasicInfoSection from './parts/UserBasicInfoSection';
import UserBioSection from './parts/UserBioSection';
import {
  debugTypeCheck,
  isStringValue,
  ensureStringValue,
  ToastColor,
} from './types/userInfoTypes';

function UserInfoStepContainer() {
  console.group('🎯 [USER_INFO_DEBUG] UserInfoStepContainer 렌더링');
  console.log(
    '📅 [USER_INFO_DEBUG] 렌더링 시작 시간:',
    new Date().toISOString()
  );

  // React Hook Form 컨텍스트 (기존 코드와 호환성 유지)
  const { watch, setValue, getValues } = useFormContext();

  // zustand 스토어와 실시간 동기화 훅
  const { updateFormValue, addToast, formValues } = useUserInfoFormSync();

  // 🔍 디버깅: 현재 상태 로깅
  console.log('🔍 [USER_INFO_DEBUG] 현재 상태:', {
    formValues,
    nickname: formValues.nickname || '없음',
    emailPrefix: formValues.emailPrefix || '없음',
    emailDomain: formValues.emailDomain || '없음',
    bioLength: isStringValue(formValues.bio) ? formValues.bio.length : 0,
    hasUserImage: !!formValues.userImage,
    timestamp: new Date().toISOString(),
  });

  // 현재 사용자 이미지 값 감시 (타입단언 없이)
  const watchedUserImage = watch('userImage');
  const currentUserImage = ensureStringValue(
    watchedUserImage || formValues.userImage,
    ''
  );

  // 🔍 디버깅: React Hook Form 값들과 비교
  const reactHookFormValues = getValues();
  console.log('🔍 [USER_INFO_DEBUG] React Hook Form vs 커스텀 훅 비교:', {
    reactHookForm: {
      userImage: reactHookFormValues.userImage || '없음',
      nickname: reactHookFormValues.nickname || '없음',
      emailPrefix: reactHookFormValues.emailPrefix || '없음',
      emailDomain: reactHookFormValues.emailDomain || '없음',
      bio: reactHookFormValues.bio || '없음',
    },
    customHook: {
      userImage: formValues.userImage || '없음',
      nickname: formValues.nickname || '없음',
      emailPrefix: formValues.emailPrefix || '없음',
      emailDomain: formValues.emailDomain || '없음',
      bio: formValues.bio || '없음',
    },
    동일한가: {
      userImage: reactHookFormValues.userImage === formValues.userImage,
      nickname: reactHookFormValues.nickname === formValues.nickname,
      emailPrefix: reactHookFormValues.emailPrefix === formValues.emailPrefix,
      emailDomain: reactHookFormValues.emailDomain === formValues.emailDomain,
      bio: reactHookFormValues.bio === formValues.bio,
    },
    timestamp: new Date().toISOString(),
  });

  console.log('🖼️ [USER_INFO_DEBUG] 현재 이미지 상태:', {
    hasWatchedImage: !!watchedUserImage,
    hasStoreImage: !!formValues.userImage,
    imageLength: currentUserImage.length,
    watchedImageType: typeof watchedUserImage,
    storeImageType: typeof formValues.userImage,
    timestamp: new Date().toISOString(),
  });

  // 🔍 디버깅: 실시간 폼 변경 감지
  useEffect(() => {
    console.log('🔍 [USER_INFO_DEBUG] 실시간 폼 변경 감지 설정');

    const subscription = watch((value, { name, type }) => {
      if (
        name &&
        ['userImage', 'nickname', 'emailPrefix', 'emailDomain', 'bio'].includes(
          name
        )
      ) {
        console.log('🔄 [USER_INFO_DEBUG] 폼 필드 변경 감지:', {
          fieldName: name,
          newValue: value[name],
          changeType: type,
          timestamp: new Date().toISOString(),
        });
      }
    });

    return () => {
      console.log('🔄 [USER_INFO_DEBUG] 실시간 폼 변경 감지 해제');
      subscription.unsubscribe();
    };
  }, [watch]);

  // 🔍 디버깅: 상태 변경 시 로깅
  useEffect(() => {
    console.log('📊 [USER_INFO_DEBUG] 상태 변경 감지:', {
      formValues,
      timestamp: new Date().toISOString(),
    });
  }, [formValues]);

  // 이미지 변경 처리 함수 (타입단언 없이)
  const handleImageChange = (imageData: unknown): void => {
    console.log('🖼️ [USER_INFO_DEBUG] 이미지 변경 처리:', {
      hasData: !!imageData,
      dataType: typeof imageData,
      timestamp: new Date().toISOString(),
    });
    debugTypeCheck(imageData, 'string');

    // 이미지 데이터 타입 검증
    const safeImageData = ensureStringValue(imageData);

    if (!isStringValue(imageData)) {
      console.warn(
        '⚠️ [USER_INFO_DEBUG] 이미지 데이터가 문자열이 아니므로 변환:',
        {
          originalData: imageData,
          originalType: typeof imageData,
          convertedData: safeImageData,
          timestamp: new Date().toISOString(),
        }
      );
    }

    try {
      updateFormValue('userImage', safeImageData);

      if (safeImageData && safeImageData.trim().length > 0) {
        addToast({
          title: '프로필 이미지 업데이트',
          description: '프로필 이미지가 성공적으로 업데이트되었습니다.',
          color: 'success' satisfies ToastColor,
        });
      }

      console.log('✅ [USER_INFO_DEBUG] 이미지 변경 완료:', {
        imageLength: safeImageData.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ [USER_INFO_DEBUG] 이미지 변경 실패:', {
        error,
        imageData: safeImageData,
        errorType: typeof error,
        errorMessage:
          error instanceof Error ? error.message : '알 수 없는 오류',
        timestamp: new Date().toISOString(),
      });

      addToast({
        title: '이미지 업데이트 실패',
        description: '프로필 이미지 업데이트 중 오류가 발생했습니다.',
        color: 'danger' satisfies ToastColor,
      });
    }
  };

  // 이메일 도메인 선택 처리 함수 (타입단언 없이)
  const handleDomainSelect = (domain: unknown): void => {
    console.log('📧 [USER_INFO_DEBUG] 도메인 선택 처리:', {
      domain,
      domainType: typeof domain,
      timestamp: new Date().toISOString(),
    });
    debugTypeCheck(domain, 'string');

    const safeDomain = ensureStringValue(domain);

    if (!isStringValue(domain)) {
      console.warn('⚠️ [USER_INFO_DEBUG] 도메인이 문자열이 아니므로 변환:', {
        originalDomain: domain,
        originalType: typeof domain,
        convertedDomain: safeDomain,
        timestamp: new Date().toISOString(),
      });
    }

    if (!safeDomain || safeDomain.trim().length === 0) {
      console.warn('⚠️ [USER_INFO_DEBUG] 빈 도메인 값:', {
        domain: safeDomain,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    try {
      updateFormValue('emailDomain', safeDomain);
      console.log('✅ [USER_INFO_DEBUG] 도메인 선택 완료:', {
        domain: safeDomain,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ [USER_INFO_DEBUG] 도메인 선택 실패:', {
        error,
        domain: safeDomain,
        errorType: typeof error,
        errorMessage:
          error instanceof Error ? error.message : '알 수 없는 오류',
        timestamp: new Date().toISOString(),
      });

      addToast({
        title: '도메인 선택 실패',
        description: '이메일 도메인 선택 중 오류가 발생했습니다.',
        color: 'danger' satisfies ToastColor,
      });
    }
  };

  // 도메인 검증 성공 처리 (타입단언 없이)
  const handleValidationSuccess = (domain: unknown): void => {
    console.log('✅ [USER_INFO_DEBUG] 도메인 검증 성공:', {
      domain,
      timestamp: new Date().toISOString(),
    });
    debugTypeCheck(domain, 'string');

    const safeDomain = ensureStringValue(domain);

    if (!isStringValue(domain)) {
      console.warn('⚠️ [USER_INFO_DEBUG] 도메인이 문자열이 아니므로 변환:', {
        originalDomain: domain,
        originalType: typeof domain,
        convertedDomain: safeDomain,
        timestamp: new Date().toISOString(),
      });
    }

    if (safeDomain && safeDomain.trim().length > 0) {
      addToast({
        title: '도메인 선택 완료',
        description: `${safeDomain}이 선택되었습니다.`,
        color: 'success' satisfies ToastColor,
      });
    }
  };

  // 검증 오류 처리 (타입단언 없이)
  const handleValidationError = (message: unknown): void => {
    console.log('❌ [USER_INFO_DEBUG] 검증 오류:', {
      message,
      timestamp: new Date().toISOString(),
    });
    debugTypeCheck(message, 'string');

    const safeMessage = ensureStringValue(message, '입력 확인이 필요합니다.');

    if (!isStringValue(message)) {
      console.warn('⚠️ [USER_INFO_DEBUG] 메시지가 문자열이 아니므로 변환:', {
        originalMessage: message,
        originalType: typeof message,
        convertedMessage: safeMessage,
        timestamp: new Date().toISOString(),
      });
    }

    addToast({
      title: '입력 확인 필요',
      description: safeMessage,
      color: 'warning' satisfies ToastColor,
    });
  };

  // 이미지 업로드 오류 처리 (타입단언 없이)
  const handleImageError = (message: unknown): void => {
    console.log('❌ [USER_INFO_DEBUG] 이미지 오류:', {
      message,
      timestamp: new Date().toISOString(),
    });
    debugTypeCheck(message, 'string');

    const safeMessage = ensureStringValue(
      message,
      '이미지 처리 중 오류가 발생했습니다.'
    );

    if (!isStringValue(message)) {
      console.warn('⚠️ [USER_INFO_DEBUG] 메시지가 문자열이 아니므로 변환:', {
        originalMessage: message,
        originalType: typeof message,
        convertedMessage: safeMessage,
        timestamp: new Date().toISOString(),
      });
    }

    addToast({
      title: '이미지 업로드 오류',
      description: safeMessage,
      color: 'danger' satisfies ToastColor,
    });
  };

  console.log('🎯 [USER_INFO_DEBUG] 렌더링 준비 완료');
  console.groupEnd();

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 안내 메시지 섹션 */}
      <div className="p-3 rounded-lg bg-default-50 sm:p-4">
        <h3 className="mb-2 text-base font-medium sm:text-lg">
          유저 정보 입력 안내
        </h3>
        <p className="text-xs sm:text-sm text-default-600">
          블로그 작성자 정보를 입력해주세요. 닉네임, 이메일은 필수 입력
          항목입니다.
        </p>
      </div>

      {/* 사용자 프로필 섹션 (반응형 레이아웃) */}
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6 sm:items-start">
        {/* 프로필 이미지 섹션 */}
        <UserProfileImageSection
          currentImage={currentUserImage}
          onImageChange={handleImageChange}
          onError={handleImageError}
        />

        {/* 기본 정보 입력 섹션 */}
        <UserBasicInfoSection
          onDomainSelect={handleDomainSelect}
          onValidationSuccess={handleValidationSuccess}
          onValidationError={handleValidationError}
          setValue={setValue}
        />
      </div>

      {/* 자기소개 섹션 (전체 너비) */}
      <UserBioSection
        maxLength={500}
        placeholder="간단한 자기소개를 입력하세요"
      />

      {/* 🔍 디버깅 정보 표시 (개발 모드에서만) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="p-4 mt-4 text-xs bg-gray-100 rounded-lg">
          <h4 className="font-bold text-blue-600">🔍 디버깅 정보 (UserInfo)</h4>
          <div className="mt-2 space-y-1">
            <div>닉네임: {formValues.nickname || '없음'}</div>
            <div>
              이메일: {formValues.emailPrefix || '없음'}@
              {formValues.emailDomain || '없음'}
            </div>
            <div>
              자기소개: {formValues.bio ? `${formValues.bio.length}자` : '없음'}
            </div>
            <div>
              프로필 이미지: {formValues.userImage ? '설정됨' : '미설정'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserInfoStepContainer;
