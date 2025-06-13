// userInfoStep/UserInfoStepContainer.tsx

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

/**
 * UserInfoStep 컴포넌트 - 메인 컨테이너
 * 사용자 정보 입력 스텝의 모든 기능을 통합 관리합니다.
 * React Hook Form과 zustand 스토어 간의 실시간 동기화를 제공합니다.
 *
 * 🔧 타입 안전성 개선:
 * - 모든 'as' 타입 단언 제거
 * - 모든 이벤트 핸들러의 안전한 타입 처리
 * - Toast 메시지의 타입 안전한 처리
 */

function UserInfoStepContainer() {
  console.log(
    '🎯 UserInfoStepContainer: 사용자 정보 입력 컨테이너 렌더링 시작'
  );

  // React Hook Form 컨텍스트 (기존 코드와 호환성 유지)
  //====여기부터 수정됨====
  // ✅ 수정: setValue 함수 추가
  // 이유: UserBasicInfoSection에서 셀렉트박스 선택 시 즉시 도메인 인풋 필드에 값을 설정하기 위함
  const { watch, setValue } = useFormContext();
  //====여기까지 수정됨====

  // zustand 스토어와 실시간 동기화 훅
  const { updateFormValue, addToast, formValues } = useUserInfoFormSync();

  console.log('🎯 UserInfoStepContainer: 현재 폼 값들', {
    nickname: formValues.nickname,
    emailPrefix: formValues.emailPrefix,
    emailDomain: formValues.emailDomain,
    bioLength: isStringValue(formValues.bio) ? formValues.bio.length : 0,
    hasUserImage: !!formValues.userImage,
  });

  // 현재 사용자 이미지 값 감시 (타입단언 없이)
  const watchedUserImage = watch('userImage');
  const currentUserImage = ensureStringValue(
    watchedUserImage || formValues.userImage,
    ''
  );

  console.log('🖼️ UserInfoStepContainer: 현재 이미지 상태', {
    hasWatchedImage: !!watchedUserImage,
    hasStoreImage: !!formValues.userImage,
    imageLength: currentUserImage.length,
    watchedImageType: typeof watchedUserImage,
    storeImageType: typeof formValues.userImage,
  });

  // 이미지 변경 처리 함수 (타입단언 없이)
  const handleImageChange = (imageData: unknown): void => {
    console.log('🖼️ handleImageChange: 이미지 변경 처리', {
      hasData: !!imageData,
      dataType: typeof imageData,
    });
    debugTypeCheck(imageData, 'string');

    // 이미지 데이터 타입 검증
    const safeImageData = ensureStringValue(imageData);

    if (!isStringValue(imageData)) {
      console.warn(
        '⚠️ handleImageChange: 이미지 데이터가 문자열이 아니므로 변환',
        {
          originalData: imageData,
          originalType: typeof imageData,
          convertedData: safeImageData,
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

      console.log('✅ handleImageChange: 이미지 변경 완료', {
        imageLength: safeImageData.length,
      });
    } catch (error) {
      console.error('❌ handleImageChange: 이미지 변경 실패', {
        error,
        imageData: safeImageData,
        errorType: typeof error,
        errorMessage:
          error instanceof Error ? error.message : '알 수 없는 오류',
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
    console.log('📧 handleDomainSelect: 도메인 선택 처리', domain);
    debugTypeCheck(domain, 'string');

    const safeDomain = ensureStringValue(domain);

    if (!isStringValue(domain)) {
      console.warn('⚠️ handleDomainSelect: 도메인이 문자열이 아니므로 변환', {
        originalDomain: domain,
        originalType: typeof domain,
        convertedDomain: safeDomain,
      });
    }

    if (!safeDomain || safeDomain.trim().length === 0) {
      console.warn('⚠️ handleDomainSelect: 빈 도메인 값', {
        domain: safeDomain,
      });
      return;
    }

    try {
      updateFormValue('emailDomain', safeDomain);
      console.log('✅ handleDomainSelect: 도메인 선택 완료', {
        domain: safeDomain,
      });
    } catch (error) {
      console.error('❌ handleDomainSelect: 도메인 선택 실패', {
        error,
        domain: safeDomain,
        errorType: typeof error,
        errorMessage:
          error instanceof Error ? error.message : '알 수 없는 오류',
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
    console.log('✅ handleValidationSuccess: 도메인 검증 성공', domain);
    debugTypeCheck(domain, 'string');

    const safeDomain = ensureStringValue(domain);

    if (!isStringValue(domain)) {
      console.warn(
        '⚠️ handleValidationSuccess: 도메인이 문자열이 아니므로 변환',
        {
          originalDomain: domain,
          originalType: typeof domain,
          convertedDomain: safeDomain,
        }
      );
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
    console.log('❌ handleValidationError: 검증 오류', message);
    debugTypeCheck(message, 'string');

    const safeMessage = ensureStringValue(message, '입력 확인이 필요합니다.');

    if (!isStringValue(message)) {
      console.warn(
        '⚠️ handleValidationError: 메시지가 문자열이 아니므로 변환',
        {
          originalMessage: message,
          originalType: typeof message,
          convertedMessage: safeMessage,
        }
      );
    }

    addToast({
      title: '입력 확인 필요',
      description: safeMessage,
      color: 'warning' satisfies ToastColor,
    });
  };

  // 이미지 업로드 오류 처리 (타입단언 없이)
  const handleImageError = (message: unknown): void => {
    console.log('❌ handleImageError: 이미지 오류', message);
    debugTypeCheck(message, 'string');

    const safeMessage = ensureStringValue(
      message,
      '이미지 처리 중 오류가 발생했습니다.'
    );

    if (!isStringValue(message)) {
      console.warn('⚠️ handleImageError: 메시지가 문자열이 아니므로 변환', {
        originalMessage: message,
        originalType: typeof message,
        convertedMessage: safeMessage,
      });
    }

    addToast({
      title: '이미지 업로드 오류',
      description: safeMessage,
      color: 'danger' satisfies ToastColor,
    });
  };

  console.log('🎯 UserInfoStepContainer: 렌더링 준비 완료');

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
        {/*====여기부터 수정됨====*/}
        {/* ✅ 수정: setValue prop 추가 */}
        {/* 이유: UserBasicInfoSection에서 셀렉트박스 선택 시 즉시 도메인 인풋 필드에 값을 설정할 수 있도록 함 */}
        <UserBasicInfoSection
          onDomainSelect={handleDomainSelect}
          onValidationSuccess={handleValidationSuccess}
          onValidationError={handleValidationError}
          setValue={setValue}
        />
        {/*====여기까지 수정됨====*/}
      </div>

      {/* 자기소개 섹션 (전체 너비) */}
      <UserBioSection
        maxLength={500}
        placeholder="간단한 자기소개를 입력하세요"
      />
    </div>
  );
}

export default UserInfoStepContainer;
