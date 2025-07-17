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
function processFormErrors(errors: unknown): Record<string, string> {
  if (typeof errors !== 'object' || errors === null) {
    return {};
  }

  const processedErrors: Record<string, string> = {};
  const errorEntries = Object.entries(errors);

  errorEntries.forEach(([fieldName, error]) => {
    const errorMessage = extractErrorMessage(error);
    if (errorMessage) {
      processedErrors[fieldName] = errorMessage;
    }
  });

  return processedErrors;
}

// 🔄 필드 변경 로깅 함수 (메모이제이션용)
function logFieldChange(changeInfo: FieldChangeInfo): void {
  console.log('🔄 [BLOG_BASIC_DEBUG] 폼 필드 변경 감지:', changeInfo);
}

function BlogBasicStepContainer(): React.ReactNode {
  console.group('🏗️ [BLOG_BASIC_DEBUG] BlogBasicStepContainer 렌더링');
  console.log(
    '📅 [BLOG_BASIC_DEBUG] 렌더링 시작 시간:',
    new Date().toISOString()
  );

  // 🔗 React Hook Form 컨텍스트 연결
  const formContextRaw = useFormContext();

  // 🛡️ FormContext 안전성 검사
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
  ); // 빈 의존성 배열로 한 번만 생성

  // 🔍 디버깅: 현재 상태 로깅
  console.log('🔍 [BLOG_BASIC_DEBUG] 현재 상태:', {
    titleValue,
    titleLength: titleValue ? titleValue.length : 0,
    descriptionValue,
    descriptionLength: descriptionValue ? descriptionValue.length : 0,
    isInitialized,
    hasErrors: Object.keys(processedErrors).length > 0,
    errorFields: Object.keys(processedErrors),
    timestamp: new Date().toISOString(),
  });

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

  // 🔍 디버깅: 실시간 폼 변경 감지 (메모이제이션으로 무한루프 방지)
  useEffect(() => {
    console.log('🔍 [BLOG_BASIC_DEBUG] 실시간 폼 변경 감지 설정');

    const subscription = watch(handleFormChange);

    return () => {
      console.log('🔄 [BLOG_BASIC_DEBUG] 실시간 폼 변경 감지 해제');
      subscription.unsubscribe();
    };
  }, [watch, handleFormChange]); // handleFormChange는 메모이제이션되어 안정적

  // 🔍 디버깅: 상태 변경 시 로깅 (필수 의존성만)
  useEffect(() => {
    console.log('📊 [BLOG_BASIC_DEBUG] 상태 변경 감지:', {
      titleValue,
      descriptionValue,
      timestamp: new Date().toISOString(),
    });
  }, [titleValue, descriptionValue]); // 꼭 필요한 의존성만

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
  }, [processedErrors]); // processedErrors는 매번 새로 생성되지만 내용이 같으면 React가 최적화

  // 🚫 초기화되지 않은 상태에서는 로딩 표시
  if (!isInitialized) {
    console.log('⏳ [BLOG_BASIC_DEBUG] 초기화 대기 중');
    console.groupEnd();
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-default-500">로딩 중...</div>
      </div>
    );
  }

  console.log('✅ [BLOG_BASIC_DEBUG] 초기화 완료, UI 렌더링 시작');
  console.groupEnd();

  // 🎨 메인 UI 렌더링
  return (
    <main className="space-y-6" role="main" aria-labelledby="blog-basic-title">
      {/* 📋 안내 가이드 컴포넌트 */}
      <BlogBasicStepGuide />

      {/* 📝 블로그 제목 입력 필드 */}
      <BlogTitleField
        value={titleValue || ''}
        onClear={clearTitle}
        error={processedErrors.title}
      />

      {/* 📄 블로그 요약 입력 필드 */}
      <BlogDescriptionField
        value={descriptionValue || ''}
        onClear={clearDescription}
        error={processedErrors.description}
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
            제목: {titleValue || '없음'} ({titleValue ? titleValue.length : 0}
            자)
          </div>
          <div>
            요약: {descriptionValue || '없음'} (
            {descriptionValue ? descriptionValue.length : 0}자)
          </div>
          <div>초기화 완료: {isInitialized ? '✅' : '❌'}</div>
          <div>에러 개수: {Object.keys(processedErrors).length}</div>
        </div>
      </section>
    </main>
  );
}

export default BlogBasicStepContainer;
