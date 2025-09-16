// blogBasicStep/BlogBasicStepContainer.tsx

import React, { useEffect, useCallback } from 'react';
import { useFormContext } from 'react-hook-form';

// 🎣 커스텀 훅들 - 상태 관리와 액션 분리
import { useBlogBasicFormState } from './hooks/useBlogBasicFormState';
import { useBlogBasicActions } from './hooks/useBlogBasicActions';

// 📱 UI 컴포넌트들 - 기능별 분리
import BlogBasicStepGuide from './parts/BlogBasicStepGuide';
import BlogTitleField from './parts/BlogTitleField';
import BlogDescriptionField from './parts/BlogDescriptionField';

interface FormContextValue {
  formState: {
    errors: Record<string, { message?: string }>;
  };
  watch: (fieldName?: string) => unknown;
  getValues: () => Record<string, unknown>;
}

interface FieldChangeInfo {
  fieldName: string;
  newValue: unknown;
  changeType: string;
  timestamp: string;
}

interface ProcessedErrorsMap {
  [fieldName: string]: string;
}

interface ComponentDebugState {
  titleValue: string;
  titleLength: number;
  descriptionValue: string;
  descriptionLength: number;
  isInitialized: boolean;
  hasErrors: boolean;
  errorFields: string[];
  timestamp: string;
}

// 🛡️ FormContext 안전성 검사
function isValidFormContext(context: unknown): context is FormContextValue {
  if (typeof context !== 'object' || context === null) {
    return false;
  }

  const hasFormState = 'formState' in context;
  const hasWatch = 'watch' in context;
  const hasGetValues = 'getValues' in context;

  return hasFormState && hasWatch && hasGetValues;
}

// 🧹 에러 메시지 안전 추출
function extractErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const messageValue = Reflect.get(error, 'message');

    if (typeof messageValue === 'string') {
      return messageValue;
    }

    if (typeof messageValue === 'number') {
      return String(messageValue);
    }
  }

  return '';
}

// 🔍 에러 객체 안전 처리
function processFormErrors(errors: unknown): ProcessedErrorsMap {
  if (typeof errors !== 'object' || errors === null) {
    return {};
  }

  const processedErrors: ProcessedErrorsMap = {};
  const errorEntries = Object.entries(errors);

  errorEntries.forEach(([fieldName, error]) => {
    const errorMessage = extractErrorMessage(error);
    if (errorMessage !== '') {
      processedErrors[fieldName] = errorMessage;
    }
  });

  return processedErrors;
}

// 🔄 필드 변경 로깅 함수 (메모이제이션용)
function logFieldChange(changeInfo: FieldChangeInfo): void {
  console.log('🔄 [BLOG_BASIC_DEBUG] 폼 필드 변경 감지:', changeInfo);
}

// 📊 디버깅 상태 생성 함수
function createDebugState(
  titleValue: string,
  descriptionValue: string,
  isInitialized: boolean,
  processedErrors: ProcessedErrorsMap
): ComponentDebugState {
  return {
    titleValue,
    titleLength: titleValue.length,
    descriptionValue,
    descriptionLength: descriptionValue.length,
    isInitialized,
    hasErrors: Object.keys(processedErrors).length > 0,
    errorFields: Object.keys(processedErrors),
    timestamp: new Date().toISOString(),
  };
}

function BlogBasicStepContainer(): React.ReactNode {
  console.group('🏗️ [BLOG_BASIC_DEBUG] BlogBasicStepContainer 렌더링');
  console.log(
    '📅 [BLOG_BASIC_DEBUG] 렌더링 시작 시간:',
    new Date().toISOString()
  );

  // 🔗 React Hook Form 컨텍스트 연결
  const formContextRaw = useFormContext();

  // 🚫 Early Return: FormContext 유효성 검사
  if (!isValidFormContext(formContextRaw)) {
    console.error('❌ [BLOG_BASIC_DEBUG] FormContext가 유효하지 않음');
    console.groupEnd();
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-danger">Form 컨텍스트 오류가 발생했습니다.</div>
      </div>
    );
  }

  const {
    formState: { errors: errorsRaw },
    watch,
    getValues,
  } = formContextRaw;

  // 🧹 에러 상태 안전 처리
  const processedErrors = processFormErrors(errorsRaw);

  console.log('🔍 [BLOG_BASIC_DEBUG] 처리된 에러:', {
    originalErrors: errorsRaw,
    processedErrors,
    errorCount: Object.keys(processedErrors).length,
  });

  // 🎣 커스텀 훅: 폼 상태 관리
  const blogFormState = useBlogBasicFormState();

  // 🚫 Early Return: 폼 상태 훅 오류
  if (!blogFormState) {
    console.error('❌ [BLOG_BASIC_DEBUG] useBlogBasicFormState 훅 오류');
    console.groupEnd();
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-danger">폼 상태 훅 오류가 발생했습니다.</div>
      </div>
    );
  }

  const { titleValue, descriptionValue, isInitialized } = blogFormState;

  // 🎯 커스텀 훅: 액션 함수들
  const blogActions = useBlogBasicActions();

  // 🚫 Early Return: 액션 훅 오류
  if (!blogActions) {
    console.error('❌ [BLOG_BASIC_DEBUG] useBlogBasicActions 훅 오류');
    console.groupEnd();
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-danger">액션 훅 오류가 발생했습니다.</div>
      </div>
    );
  }

  const { clearTitle, clearDescription } = blogActions;

  // 🔄 메모이제이션된 폼 변경 감지 콜백
  const handleFormChange = useCallback(
    (value: unknown, { name, type }: { name?: string; type?: string }) => {
      const isRelevantField = name === 'title' || name === 'description';

      if (isRelevantField && value && typeof value === 'object' && name) {
        const fieldValue = Reflect.get(value, name);
        const changeInfo: FieldChangeInfo = {
          fieldName: name,
          newValue: fieldValue,
          changeType: type || 'unknown',
          timestamp: new Date().toISOString(),
        };

        logFieldChange(changeInfo);
      }
    },
    []
  );

  // 📊 디버깅 상태 생성
  const currentDebugState = createDebugState(
    titleValue || '',
    descriptionValue || '',
    isInitialized,
    processedErrors
  );

  // 🔍 디버깅: 현재 상태 로깅
  console.log('🔍 [BLOG_BASIC_DEBUG] 현재 상태:', currentDebugState);

  // 🔍 디버깅: React Hook Form 값들과 비교
  const reactHookFormValues = getValues();
  const formTitle = Reflect.get(reactHookFormValues, 'title') || '없음';
  const formDescription =
    Reflect.get(reactHookFormValues, 'description') || '없음';

  console.log('🔍 [BLOG_BASIC_DEBUG] React Hook Form vs 커스텀 훅 비교:', {
    reactHookForm: {
      title: formTitle,
      description: formDescription,
    },
    customHook: {
      title: titleValue || '없음',
      description: descriptionValue || '없음',
    },
    동일한가: {
      title: formTitle === titleValue,
      description: formDescription === descriptionValue,
    },
    timestamp: new Date().toISOString(),
  });

  // 🔍 디버깅: 실시간 폼 변경 감지 설정
  useEffect(() => {
    console.log('🔍 [BLOG_BASIC_DEBUG] 실시간 폼 변경 감지 설정');

    const subscription = watch(handleFormChange);

    return () => {
      console.log('🔄 [BLOG_BASIC_DEBUG] 실시간 폼 변경 감지 해제');
      subscription.unsubscribe();
    };
  }, [watch, handleFormChange]);

  // 🔍 디버깅: 상태 변경 시 로깅
  useEffect(() => {
    console.log('📊 [BLOG_BASIC_DEBUG] 상태 변경 감지:', {
      titleValue: titleValue || '',
      descriptionValue: descriptionValue || '',
      isInitialized,
      timestamp: new Date().toISOString(),
    });
  }, [titleValue, descriptionValue, isInitialized]);

  // 🔍 디버깅: 에러 상태 변경 시 로깅
  useEffect(() => {
    const errorCount = Object.keys(processedErrors).length;

    if (errorCount > 0) {
      const errorMessages = Object.entries(processedErrors).map(
        ([key, message]) => ({
          field: key,
          message,
        })
      );

      console.log('❌ [BLOG_BASIC_DEBUG] 에러 발생:', {
        errors: processedErrors,
        errorMessages,
        timestamp: new Date().toISOString(),
      });
    }
  }, [processedErrors]);

  // ✅ 로딩 조건 제거: 즉시 UI 렌더링
  // 기존의 복잡한 초기화 조건 대신 항상 UI 표시
  console.log(
    '✅ [BLOG_BASIC_DEBUG] UI 렌더링 시작 (초기화 상태:',
    isInitialized,
    ')'
  );
  console.groupEnd();

  // 🎨 메인 UI 렌더링 (초기화 여부와 관계없이 항상 표시)
  return (
    <main className="space-y-6" role="main" aria-labelledby="blog-basic-title">
      {/* 📋 안내 가이드 컴포넌트 */}
      <BlogBasicStepGuide />

      {/* 📝 블로그 제목 입력 필드 */}
      <BlogTitleField
        value={titleValue || ''}
        onClear={clearTitle}
        error={Reflect.get(processedErrors, 'title') || undefined}
      />

      {/* 📄 블로그 요약 입력 필드 */}
      <BlogDescriptionField
        value={descriptionValue || ''}
        onClear={clearDescription}
        error={Reflect.get(processedErrors, 'description') || undefined}
      />

      {/* 🔍 디버깅 정보 표시 */}
      <section
        className="p-4 mt-4 text-xs bg-gray-100 rounded-lg"
        role="region"
        aria-labelledby="debug-info-title"
      >
        <h4 id="debug-info-title" className="font-bold text-blue-600">
          🔍 디버깅 정보 (BlogBasic)
        </h4>
        <div className="mt-2 space-y-1">
          <div>
            제목: {titleValue || '없음'} ({currentDebugState.titleLength}자)
          </div>
          <div>
            요약: {descriptionValue || '없음'} (
            {currentDebugState.descriptionLength}자)
          </div>
          <div>초기화 완료: {isInitialized ? '✅' : '⏳ 진행중...'}</div>
          <div>
            에러 개수:{' '}
            {currentDebugState.hasErrors
              ? `❌ ${Object.keys(processedErrors).length}개`
              : '✅ 없음'}
          </div>
          {currentDebugState.hasErrors ? (
            <div className="text-red-600">
              에러 필드: {currentDebugState.errorFields.join(', ')}
            </div>
          ) : null}
          <div className="text-gray-500">
            마지막 업데이트:{' '}
            {new Date(currentDebugState.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </section>

      {/* 🚨 초기화 상태 표시 (개발용) */}
      {!isInitialized ? (
        <section
          className="p-3 border border-yellow-200 rounded-lg bg-yellow-50"
          role="alert"
          aria-live="polite"
        >
          <div className="text-sm text-yellow-800">
            ⏳ 폼 초기화 진행 중... (백그라운드에서 자동 완료됩니다)
          </div>
        </section>
      ) : null}
    </main>
  );
}

export default BlogBasicStepContainer;
