// blogBasicStep/BlogBasicStepContainer.tsx - 디버깅 버전

import React, { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

// 🎣 커스텀 훅들 - 상태 관리와 액션 분리
import { useBlogBasicFormState } from './hooks/useBlogBasicFormState';
import { useBlogBasicActions } from './hooks/useBlogBasicActions';

// 📱 UI 컴포넌트들 - 기능별 분리
import BlogBasicStepGuide from './parts/BlogBasicStepGuide';
import BlogTitleField from './parts/BlogTitleField';
import BlogDescriptionField from './parts/BlogDescriptionField';

function BlogBasicStepContainer(): React.ReactNode {
  console.group('🏗️ [BLOG_BASIC_DEBUG] BlogBasicStepContainer 렌더링');
  console.log(
    '📅 [BLOG_BASIC_DEBUG] 렌더링 시작 시간:',
    new Date().toISOString()
  );

  // 🔗 React Hook Form 컨텍스트 연결
  const formContext = useFormContext();
  const {
    formState: { errors },
    watch,
    getValues,
  } = formContext;

  // 🎣 커스텀 훅: 폼 상태 관리
  const { titleValue, descriptionValue, isInitialized } =
    useBlogBasicFormState();

  // 🎯 커스텀 훅: 액션 함수들
  const { clearTitle, clearDescription } = useBlogBasicActions();

  // 🔍 디버깅: 현재 상태 로깅
  console.log('🔍 [BLOG_BASIC_DEBUG] 현재 상태:', {
    titleValue,
    titleLength: titleValue.length,
    descriptionValue,
    descriptionLength: descriptionValue.length,
    isInitialized,
    hasErrors: Object.keys(errors).length > 0,
    errorFields: Object.keys(errors),
    timestamp: new Date().toISOString(),
  });

  // 🔍 디버깅: React Hook Form 값들과 비교
  const reactHookFormValues = getValues();
  console.log('🔍 [BLOG_BASIC_DEBUG] React Hook Form vs 커스텀 훅 비교:', {
    reactHookForm: {
      title: reactHookFormValues.title || '없음',
      description: reactHookFormValues.description || '없음',
    },
    customHook: {
      title: titleValue || '없음',
      description: descriptionValue || '없음',
    },
    동일한가: {
      title: reactHookFormValues.title === titleValue,
      description: reactHookFormValues.description === descriptionValue,
    },
    timestamp: new Date().toISOString(),
  });

  // 🔍 디버깅: 실시간 폼 변경 감지
  useEffect(() => {
    console.log('🔍 [BLOG_BASIC_DEBUG] 실시간 폼 변경 감지 설정');

    const subscription = watch((value, { name, type }) => {
      if (name === 'title' || name === 'description') {
        console.log('🔄 [BLOG_BASIC_DEBUG] 폼 필드 변경 감지:', {
          fieldName: name,
          newValue: value[name],
          changeType: type,
          timestamp: new Date().toISOString(),
        });
      }
    });

    return () => {
      console.log('🔄 [BLOG_BASIC_DEBUG] 실시간 폼 변경 감지 해제');
      subscription.unsubscribe();
    };
  }, [watch]);

  // 🔍 디버깅: 상태 변경 시 로깅
  useEffect(() => {
    console.log('📊 [BLOG_BASIC_DEBUG] 상태 변경 감지:', {
      titleValue,
      descriptionValue,
      timestamp: new Date().toISOString(),
    });
  }, [titleValue, descriptionValue]);

  // 🔍 디버깅: 에러 상태 변경 시 로깅
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.log('❌ [BLOG_BASIC_DEBUG] 에러 발생:', {
        errors,
        errorMessages: Object.entries(errors).map(([key, error]) => ({
          field: key,
          message: error?.message,
        })),
        timestamp: new Date().toISOString(),
      });
    }
  }, [errors]);

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
    <div className="space-y-6">
      {/* 📋 안내 가이드 컴포넌트 */}
      <BlogBasicStepGuide />

      {/* 📝 블로그 제목 입력 필드 */}
      <BlogTitleField
        value={titleValue}
        onClear={clearTitle}
        error={errors.title?.message?.toString()}
      />

      {/* 📄 블로그 요약 입력 필드 */}
      <BlogDescriptionField
        value={descriptionValue}
        onClear={clearDescription}
        error={errors.description?.message?.toString()}
      />

      {/* 🔍 디버깅 정보 표시 (개발 모드에서만) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="p-4 mt-4 text-xs bg-gray-100 rounded-lg">
          <h4 className="font-bold text-blue-600">
            🔍 디버깅 정보 (BlogBasic)
          </h4>
          <div className="mt-2 space-y-1">
            <div>
              제목: {titleValue || '없음'} ({titleValue.length}자)
            </div>
            <div>
              요약: {descriptionValue || '없음'} ({descriptionValue.length}자)
            </div>
            <div>초기화 완료: {isInitialized ? '✅' : '❌'}</div>
            <div>에러 개수: {Object.keys(errors).length}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BlogBasicStepContainer;
