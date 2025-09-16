// blogMediaStep/mainImage/MainImageContainer.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { useBlogMediaStepState } from '../hooks/useBlogMediaStepState';
import { useMainImageValidation } from './hooks/useMainImageValidation';
import { useMultiStepFormStore } from '../../../../store/multiStepForm/multiStepFormStore';

interface MainImageContainerProps {
  className?: string;
}

interface FormValues {
  mainImage: string;
  media: string[];
  sliderImages: string[];
}

function MainImageContainer({
  className: additionalCssClasses = '',
}: MainImageContainerProps): React.ReactNode {
  console.log('🚀 MainImageContainer 렌더링 시작 - 실시간 미리보기:', {
    hasAdditionalClasses: additionalCssClasses.length > 0,
    timestamp: new Date().toLocaleTimeString(),
  });

  // ✅ 폼과 스토어 연결
  const { getValues } = useFormContext<FormValues>();
  const multiStepFormStore = useMultiStepFormStore();
  const blogMediaStepState = useBlogMediaStepState();
  const { formValues: currentFormValues } = blogMediaStepState ?? {};
  const safeFormValues = currentFormValues ?? {};
  const { media: mediaFilesList = [], mainImage: rawMainImageUrl = '' } =
    safeFormValues;

  // ✅ currentMainImageUrl null 안전성 보장 (타입 가드)
  const currentMainImageUrl =
    typeof rawMainImageUrl === 'string' ? rawMainImageUrl : '';

  console.log('🔒 [TYPE_SAFETY] currentMainImageUrl 타입 안전성 확인:', {
    rawMainImageUrl,
    processedMainImageUrl: currentMainImageUrl,
    isString: typeof currentMainImageUrl === 'string',
    length: currentMainImageUrl.length,
  });

  // ✅ 이미지 상태 관리
  const [isImageLoading, setIsImageLoading] = useState<boolean>(false);
  const [hasImageError, setHasImageError] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<{
    isFormSynced: boolean;
    isStoreSynced: boolean;
  }>({
    isFormSynced: true,
    isStoreSynced: true,
  });
  const [forceUpdateTrigger, setForceUpdateTrigger] = useState<number>(0);

  // ✅ 이전 상태 추적용 ref
  const previousMainImageUrl = useRef<string>('');
  const imageLoadTimeoutRef = useRef<number | null>(null);

  console.log('🔧 MainImageContainer 상태 확인:', {
    hasFormValues:
      currentFormValues !== null && currentFormValues !== undefined,
    mediaFilesCount: mediaFilesList.length,
    hasMainImage: currentMainImageUrl.length > 0,
    isImageLoading,
    hasImageError,
    syncStatus,
    timestamp: new Date().toLocaleTimeString(),
  });

  // ✅ 메인 이미지 유효성 검증
  const mainImageValidationHook = useMainImageValidation({
    formValues: currentFormValues ?? {},
  });
  const { getMainImageValidationStatus } = mainImageValidationHook;

  // ✅ 상태 계산 (Boolean() 대신 실무형 변환)
  const hasMainImage = currentMainImageUrl.length > 0;
  const hasMediaFiles = mediaFilesList.length > 0;
  const validationStatus = getMainImageValidationStatus();
  const { isValidMainImage, issues: validationIssueList } = validationStatus;

  // ✅ 개발 모드 확인 함수 (환경변수 안전 접근)
  const checkIsDevelopmentMode = useCallback((): boolean => {
    try {
      const globalProcess = globalThis.process;
      const hasGlobalProcess =
        globalProcess !== null && globalProcess !== undefined;

      if (!hasGlobalProcess) {
        return false;
      }

      const { env: environmentVariables } = globalProcess;
      const hasEnvironmentVariables =
        environmentVariables !== null && environmentVariables !== undefined;

      if (!hasEnvironmentVariables) {
        return false;
      }

      const { NODE_ENV: nodeEnvironment } = environmentVariables;
      const isDevelopmentEnvironment = nodeEnvironment === 'development';

      return isDevelopmentEnvironment;
    } catch (environmentCheckError) {
      console.warn(
        '⚠️ [ENV_CHECK] 환경변수 확인 중 오류:',
        environmentCheckError
      );
      return false;
    }
  }, []);

  // ✅ 스토어 동기화 상태 확인
  const checkStoreSyncStatus = useCallback(() => {
    const currentFormData = getValues();
    const currentStoreData = multiStepFormStore.getFormValues();

    const formMainImage = currentFormData.mainImage ?? '';
    const storeMainImage = currentStoreData.mainImage ?? '';

    const isFormSynced = formMainImage === currentMainImageUrl;
    const isStoreSynced = storeMainImage === currentMainImageUrl;

    const newSyncStatus = { isFormSynced, isStoreSynced };

    // 동기화 상태가 변경된 경우에만 업데이트
    const hasStatusChanged =
      newSyncStatus.isFormSynced !== syncStatus.isFormSynced ||
      newSyncStatus.isStoreSynced !== syncStatus.isStoreSynced;

    if (hasStatusChanged) {
      setSyncStatus(newSyncStatus);
      console.log('🔄 [SYNC_CHECK] 스토어 동기화 상태 변경:', {
        formMainImage,
        storeMainImage,
        currentMainImageUrl,
        newSyncStatus,
      });
    }

    return newSyncStatus;
  }, [getValues, multiStepFormStore, currentMainImageUrl, syncStatus]);

  // ✅ 실시간 업데이트 감지
  useEffect(() => {
    const isMainImageChanged =
      previousMainImageUrl.current !== currentMainImageUrl;

    if (isMainImageChanged) {
      console.log('🖼️ [MAIN_IMAGE_CHANGE] 메인 이미지 변경 감지:', {
        previousUrl: previousMainImageUrl.current.slice(0, 30) + '...',
        currentUrl: currentMainImageUrl.slice(0, 30) + '...',
        timestamp: new Date().toLocaleTimeString(),
      });

      // 이미지 변경 시 상태 초기화
      setIsImageLoading(currentMainImageUrl.length > 0);
      setHasImageError(false);

      // 이전 URL 업데이트
      previousMainImageUrl.current = currentMainImageUrl;

      // 동기화 상태 확인
      checkStoreSyncStatus();

      // 강제 업데이트 트리거
      setForceUpdateTrigger((prevTrigger) => prevTrigger + 1);
    }
  }, [currentMainImageUrl, checkStoreSyncStatus]);

  // ✅ 주기적 동기화 상태 확인
  useEffect(() => {
    const syncCheckInterval = setInterval(() => {
      checkStoreSyncStatus();
    }, 1000); // 1초마다 동기화 상태 확인

    return () => clearInterval(syncCheckInterval);
  }, [checkStoreSyncStatus]);

  // ✅ 이미지 로딩 타임아웃 관리
  useEffect(() => {
    if (isImageLoading && currentMainImageUrl.length > 0) {
      // 10초 후 로딩 타임아웃
      imageLoadTimeoutRef.current = window.setTimeout(() => {
        console.warn('⏰ [IMAGE_TIMEOUT] 이미지 로딩 타임아웃:', {
          imageUrl: currentMainImageUrl.slice(0, 50) + '...',
        });
        setIsImageLoading(false);
        setHasImageError(true);
      }, 10000);
    }

    return () => {
      const timeoutRef = imageLoadTimeoutRef.current;
      const hasActiveTimeout = timeoutRef !== null;

      if (hasActiveTimeout) {
        window.clearTimeout(timeoutRef);
        imageLoadTimeoutRef.current = null;
      }
    };
  }, [isImageLoading, currentMainImageUrl]);

  // ✅ 이미지 크기 계산 (순수 함수)
  const calculateMainImageSizeInKB = useCallback((imageUrl: string): number => {
    const isValidImageUrl = typeof imageUrl === 'string' && imageUrl.length > 0;

    return isValidImageUrl ? Math.round(imageUrl.length / 1024) : 0;
  }, []);

  // ✅ 이미지 로드 성공 핸들러
  const handleImageLoadSuccess = useCallback(
    (loadEvent: React.SyntheticEvent<HTMLImageElement>) => {
      const { currentTarget: loadedImageElement } = loadEvent;
      const { naturalWidth, naturalHeight } = loadedImageElement;

      console.log('✅ [MAIN_IMAGE_LOAD] 메인 이미지 로드 성공:', {
        naturalWidth,
        naturalHeight,
        timestamp: new Date().toLocaleTimeString(),
      });

      setIsImageLoading(false);
      setHasImageError(false);

      // 타임아웃 클리어
      const timeoutRef = imageLoadTimeoutRef.current;
      const hasActiveTimeout = timeoutRef !== null;

      if (hasActiveTimeout) {
        window.clearTimeout(timeoutRef);
        imageLoadTimeoutRef.current = null;
      }
    },
    []
  );

  // ✅ 이미지 로드 실패 핸들러
  const handleImageLoadError = useCallback(
    (errorEvent: React.SyntheticEvent<HTMLImageElement>) => {
      console.error('❌ [MAIN_IMAGE_ERROR] 메인 이미지 로드 실패:', {
        errorEvent,
        imageUrl: currentMainImageUrl.slice(0, 50) + '...',
        timestamp: new Date().toLocaleTimeString(),
      });

      setIsImageLoading(false);
      setHasImageError(true);

      // 타임아웃 클리어
      const timeoutRef = imageLoadTimeoutRef.current;
      const hasActiveTimeout = timeoutRef !== null;

      if (hasActiveTimeout) {
        window.clearTimeout(timeoutRef);
        imageLoadTimeoutRef.current = null;
      }
    },
    [currentMainImageUrl]
  );

  // ✅ 이미지 재시도 핸들러
  const handleImageRetry = useCallback(() => {
    console.log('🔄 [IMAGE_RETRY] 이미지 로드 재시도:', {
      imageUrl: currentMainImageUrl.slice(0, 50) + '...',
    });

    setIsImageLoading(true);
    setHasImageError(false);
    setForceUpdateTrigger((prevTrigger) => prevTrigger + 1);
  }, [currentMainImageUrl]);

  // ✅ 빈 상태 렌더링 (기존 로직 유지)
  const renderEmptyMainImageState = useCallback(() => {
    console.log('🔄 renderEmptyMainImageState 호출');

    const shouldShowUploadGuide = !hasMediaFiles;
    const shouldShowSelectionGuide = hasMediaFiles && !hasMainImage;

    return (
      <div className="flex items-center justify-center p-8 transition-all duration-300 ease-in-out border-2 border-gray-300 border-dashed rounded-lg bg-gray-50">
        <div className="text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2z"
              />
            </svg>
          </div>

          {shouldShowUploadGuide ? (
            <>
              <h3 className="mb-2 text-lg font-medium text-gray-900">
                메인 이미지 없음
              </h3>
              <p className="text-gray-600">
                먼저 이미지를 업로드한 후 메인 이미지를 선택해주세요.
              </p>
            </>
          ) : shouldShowSelectionGuide ? (
            <>
              <h3 className="mb-2 text-lg font-medium text-gray-900">
                메인 이미지를 선택해주세요
              </h3>
              <p className="text-gray-600">
                업로드된 이미지에 마우스를 올리고 🏠 버튼을 클릭하여
                <br />
                메인 이미지로 설정할 수 있습니다.
              </p>
            </>
          ) : null}
        </div>
      </div>
    );
  }, [hasMediaFiles, hasMainImage]);

  // ✅ 메인 이미지 미리보기 렌더링 (개선됨)
  const renderMainImagePreview = useCallback(() => {
    const hasNoMainImage = !hasMainImage || currentMainImageUrl.length === 0;

    if (hasNoMainImage) {
      return null; // early return
    }

    console.log('🔄 renderMainImagePreview 호출:', {
      currentMainImagePreview: currentMainImageUrl.slice(0, 30) + '...',
      isValidMainImage,
      isImageLoading,
      hasImageError,
      forceUpdateTrigger,
    });

    const mainImageSizeKB = calculateMainImageSizeInKB(currentMainImageUrl);
    const { isFormSynced, isStoreSynced } = syncStatus;
    const isSyncedProperly = isFormSynced && isStoreSynced;
    const isDevelopmentMode = checkIsDevelopmentMode();

    return (
      <div className="overflow-hidden transition-all duration-300 ease-in-out bg-white border border-gray-200 rounded-lg shadow-sm">
        {/* 헤더 영역 - 동기화 상태 표시 추가 */}
        <header className="p-4 border-b border-gray-200 bg-blue-50">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-blue-900">
                현재 메인 이미지
              </h3>
              {!isSyncedProperly && (
                <span className="px-2 py-1 text-xs text-orange-700 bg-orange-100 rounded-full">
                  ⚠️ 동기화 중
                </span>
              )}
            </div>
            <p className="text-sm text-blue-700">
              블로그에 표시될 대표 이미지입니다
            </p>
            <p className="mt-1 text-xs text-blue-600">
              💡 다른 이미지로 변경하려면 상단 업로드 영역에서 🏠 버튼을
              클릭하세요
            </p>
          </div>
        </header>

        {/* 이미지 미리보기 영역 */}
        <main className="p-4">
          <div className="relative overflow-hidden bg-gray-100 rounded-lg aspect-video">
            {/* 로딩 상태 */}
            {isImageLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <div className="w-8 h-8 mx-auto mb-2 border-2 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                  <p className="text-sm text-gray-600">이미지 로딩 중...</p>
                </div>
              </div>
            )}

            {/* 에러 상태 */}
            {hasImageError && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-red-100 rounded-full">
                    <svg
                      className="w-6 h-6 text-red-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                  <p className="mb-2 text-sm text-gray-600">
                    이미지를 불러올 수 없습니다
                  </p>
                  <button
                    type="button"
                    onClick={handleImageRetry}
                    className="px-3 py-1 text-xs text-blue-600 transition-colors border border-blue-300 rounded hover:bg-blue-50"
                  >
                    다시 시도
                  </button>
                </div>
              </div>
            )}

            {/* 실제 이미지 */}
            <img
              key={`main-image-${forceUpdateTrigger}`} // 강제 리렌더링용 key
              src={currentMainImageUrl}
              alt="현재 메인 이미지 미리보기"
              className={`object-cover w-full h-full transition-opacity duration-300 ${
                isImageLoading || hasImageError ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={handleImageLoadSuccess}
              onError={handleImageLoadError}
              loading="lazy"
            />
          </div>

          {/* 이미지 정보 표시 */}
          <div className="mt-3 text-sm text-gray-600">
            <div className="flex items-center justify-between">
              <span>파일 크기: {mainImageSizeKB} KB</span>
              <div className="flex items-center gap-2">
                {!isValidMainImage && (
                  <span className="px-2 py-1 text-xs text-red-700 bg-red-100 rounded">
                    ⚠️ 검증 실패
                  </span>
                )}
                {!isSyncedProperly && (
                  <span className="px-2 py-1 text-xs text-orange-700 bg-orange-100 rounded">
                    🔄 동기화 중
                  </span>
                )}
              </div>
            </div>

            {/* 동기화 상태 디테일 (개발 모드에서만) */}
            {isDevelopmentMode && (
              <div className="p-2 mt-2 text-xs rounded bg-gray-50">
                <div className="text-gray-500">
                  동기화 상태: 폼({isFormSynced ? '✅' : '❌'}) | 스토어(
                  {isStoreSynced ? '✅' : '❌'})
                </div>
              </div>
            )}
          </div>

          {/* 검증 이슈 표시 */}
          {validationIssueList.length > 0 && (
            <div className="p-3 mt-3 border border-red-200 rounded-lg bg-red-50">
              <h4 className="mb-1 text-sm font-medium text-red-800">
                검증 오류
              </h4>
              <ul className="space-y-1 text-sm text-red-700">
                {validationIssueList.map((issueMessage, issueIndex) => (
                  <li
                    key={`validation-issue-${issueIndex}`}
                    className="flex items-start gap-1"
                  >
                    <span className="text-red-500">•</span>
                    <span>{issueMessage}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </main>
      </div>
    );
  }, [
    hasMainImage,
    currentMainImageUrl,
    isValidMainImage,
    isImageLoading,
    hasImageError,
    forceUpdateTrigger,
    calculateMainImageSizeInKB,
    syncStatus,
    validationIssueList,
    handleImageLoadSuccess,
    handleImageLoadError,
    handleImageRetry,
    checkIsDevelopmentMode,
  ]);

  const finalCssClasses = `space-y-4 ${additionalCssClasses}`.trim();

  console.log('🎨 MainImageContainer 최종 렌더링 준비:', {
    finalCssClasses,
    hasMainImage,
    hasMediaFiles,
    isValidMainImage,
    isImageLoading,
    hasImageError,
    syncStatus,
    renderingMode: hasMainImage ? 'preview' : 'empty',
    timestamp: new Date().toLocaleTimeString(),
  });

  return (
    <section
      className={finalCssClasses}
      role="region"
      aria-labelledby="main-image-preview-section-title"
      aria-describedby="main-image-preview-section-description"
      aria-live="polite" // 실시간 업데이트 접근성
    >
      <header className="sr-only">
        <h2 id="main-image-preview-section-title">메인 이미지 미리보기 섹션</h2>
        <p id="main-image-preview-section-description">
          현재 선택된 메인 이미지를 실시간으로 미리보기할 수 있습니다. 이미지
          변경은 상단 업로드 영역에서 가능하며, 로딩 상태와 에러 상황도
          표시됩니다.
        </p>
      </header>

      <main>
        {hasMainImage ? renderMainImagePreview() : renderEmptyMainImageState()}
      </main>
    </section>
  );
}

export default MainImageContainer;
