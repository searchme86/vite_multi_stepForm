// src/components/multiStepForm/steps/stepsSections/userInfoStep/UserInfoStepContainer.tsx

import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { useUserInfoFormSync } from './hooks/useUserInfoFormSync';
import UserProfileImageSection from './parts/UserProfileImageSection';
import UserBasicInfoSection from './parts/UserBasicInfoSection';
import UserBioSection from './parts/UserBioSection';
import type { ToastColor } from './types/userInfoTypes';
import {
  debugTypeCheck,
  isStringValue,
  ensureStringValue,
} from './types/userInfoTypes';

const isDevelopmentMode = (): boolean => {
  try {
    const { hostname = '' } = window?.location || {};
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isDevPort =
      window?.location?.port && parseInt(window.location.port, 10) >= 3000;

    return isLocalhost || Boolean(isDevPort);
  } catch (debugError) {
    console.log('⚠️ 개발 모드 감지 실패, 기본값 false 사용:', { debugError });
    return false;
  }
};

function UserInfoStepContainer() {
  console.group('🎯 [USER_INFO_DEBUG] UserInfoStepContainer 렌더링');
  console.log(
    '📅 [USER_INFO_DEBUG] 렌더링 시작 시간:',
    new Date().toISOString()
  );

  const { watch, setValue, getValues } = useFormContext();
  const { updateFormValue, addToast, formValues } = useUserInfoFormSync();

  console.log('🔍 [USER_INFO_DEBUG] 현재 상태:', {
    formValues,
    nickname: formValues.nickname || '없음',
    emailPrefix: formValues.emailPrefix || '없음',
    emailDomain: formValues.emailDomain || '없음',
    bioLength: isStringValue(formValues.bio) ? formValues.bio.length : 0,
    hasUserImage: Boolean(formValues.userImage),
    timestamp: new Date().toISOString(),
  });

  const watchedUserImage = watch('userImage');
  const currentUserImage = ensureStringValue(
    watchedUserImage || formValues.userImage,
    ''
  );

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
    hasWatchedImage: Boolean(watchedUserImage),
    hasStoreImage: Boolean(formValues.userImage),
    imageLength: currentUserImage.length,
    watchedImageType: typeof watchedUserImage,
    storeImageType: typeof formValues.userImage,
    timestamp: new Date().toISOString(),
  });

  useEffect(() => {
    console.log('🔍 [USER_INFO_DEBUG] 실시간 폼 변경 감지 설정');

    const subscription = watch(
      (formValue, { name: fieldName, type: changeType }) => {
        const validFieldNames = [
          'userImage',
          'nickname',
          'emailPrefix',
          'emailDomain',
          'bio',
        ];
        const isValidField = fieldName && validFieldNames.includes(fieldName);

        if (isValidField) {
          const { [fieldName]: newValue } = formValue;
          console.log('🔄 [USER_INFO_DEBUG] 폼 필드 변경 감지:', {
            fieldName,
            newValue,
            changeType,
            timestamp: new Date().toISOString(),
          });
        }
      }
    );

    return () => {
      console.log('🔄 [USER_INFO_DEBUG] 실시간 폼 변경 감지 해제');
      subscription.unsubscribe();
    };
  }, [watch]);

  useEffect(() => {
    console.log('📊 [USER_INFO_DEBUG] 상태 변경 감지:', {
      formValues,
      timestamp: new Date().toISOString(),
    });
  }, [formValues]);

  const handleImageChange = (imageData: unknown): void => {
    console.log('🖼️ [USER_INFO_DEBUG] 이미지 변경 처리:', {
      hasData: Boolean(imageData),
      dataType: typeof imageData,
      timestamp: new Date().toISOString(),
    });
    debugTypeCheck(imageData, 'string');

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

      const hasValidImageData =
        safeImageData && safeImageData.trim().length > 0;

      if (hasValidImageData) {
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
    } catch (imageUpdateError) {
      const errorMessage =
        imageUpdateError instanceof Error
          ? imageUpdateError.message
          : '알 수 없는 오류';

      console.error('❌ [USER_INFO_DEBUG] 이미지 변경 실패:', {
        error: imageUpdateError,
        imageData: safeImageData,
        errorType: typeof imageUpdateError,
        errorMessage,
        timestamp: new Date().toISOString(),
      });

      addToast({
        title: '이미지 업데이트 실패',
        description: '프로필 이미지 업데이트 중 오류가 발생했습니다.',
        color: 'danger' satisfies ToastColor,
      });
    }
  };

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

    const hasDomainValue = safeDomain && safeDomain.trim().length > 0;

    if (!hasDomainValue) {
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
    } catch (domainUpdateError) {
      const errorMessage =
        domainUpdateError instanceof Error
          ? domainUpdateError.message
          : '알 수 없는 오류';

      console.error('❌ [USER_INFO_DEBUG] 도메인 선택 실패:', {
        error: domainUpdateError,
        domain: safeDomain,
        errorType: typeof domainUpdateError,
        errorMessage,
        timestamp: new Date().toISOString(),
      });

      addToast({
        title: '도메인 선택 실패',
        description: '이메일 도메인 선택 중 오류가 발생했습니다.',
        color: 'danger' satisfies ToastColor,
      });
    }
  };

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

    const hasDomainValue = safeDomain && safeDomain.trim().length > 0;

    if (hasDomainValue) {
      addToast({
        title: '도메인 선택 완료',
        description: `${safeDomain}이 선택되었습니다.`,
        color: 'success' satisfies ToastColor,
      });
    }
  };

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

  const isDevMode = isDevelopmentMode();

  return (
    <main className="space-y-4 sm:space-y-6">
      <section className="p-3 rounded-lg bg-default-50 sm:p-4">
        <h3 className="mb-2 text-base font-medium sm:text-lg">
          유저 정보 입력 안내
        </h3>
        <p className="text-xs sm:text-sm text-default-600">
          블로그 작성자 정보를 입력해주세요. 닉네임, 이메일은 필수 입력
          항목입니다.
        </p>
      </section>

      <section className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6 sm:items-start">
        <UserProfileImageSection
          currentImage={currentUserImage}
          onImageChange={handleImageChange}
          onError={handleImageError}
        />

        <UserBasicInfoSection
          onDomainSelect={handleDomainSelect}
          onValidationSuccess={handleValidationSuccess}
          onValidationError={handleValidationError}
          setValue={setValue}
        />
      </section>

      <section>
        <UserBioSection
          maxLength={500}
          placeholder="간단한 자기소개를 입력하세요"
        />
      </section>

      {isDevMode ? (
        <section className="p-4 mt-4 text-xs bg-gray-100 rounded-lg">
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
        </section>
      ) : null}
    </main>
  );
}

export default UserInfoStepContainer;
