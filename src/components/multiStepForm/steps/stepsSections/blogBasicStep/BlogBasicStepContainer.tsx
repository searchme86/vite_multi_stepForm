// blogBasicStep/BlogBasicStepContainer.tsx

/**
 * BlogBasicStep 컴포넌트
 * 블로그 기본 정보(제목, 요약) 입력을 담당하는 메인 컨테이너
 * React Hook Form과 Zustand 상태 관리를 통합하여 사용
 */

import React from 'react';
import { useFormContext } from 'react-hook-form';

// 🎣 커스텀 훅들 - 상태 관리와 액션 분리
import { useBlogBasicFormState } from './hooks/useBlogBasicFormState';
import { useBlogBasicActions } from './hooks/useBlogBasicActions';

// 📱 UI 컴포넌트들 - 기능별 분리
import BlogBasicStepGuide from './parts/BlogBasicStepGuide';
import BlogTitleField from './parts/BlogTitleField';
import BlogDescriptionField from './parts/BlogDescriptionField';

/**
 * BlogBasicStep 메인 컨테이너 컴포넌트
 *
 * 기능:
 * 1. React Hook Form 컨텍스트 연결
 * 2. Zustand 상태 관리 통합
 * 3. 하위 컴포넌트들 조합
 *
 * 상태 흐름:
 * Input 변경 → React Hook Form → Zustand Store → 다른 컴포넌트들
 */
function BlogBasicStepContainer(): React.ReactNode {
  console.group('🏗️ BlogBasicStepContainer 렌더링');
  console.log('BlogBasicStep 컨테이너 컴포넌트가 마운트되었습니다.');

  // 🔗 React Hook Form 컨텍스트 연결
  // 이유: 부모 컴포넌트(MultiStepForm)에서 제공된 FormProvider 사용
  const formContext = useFormContext();
  const {
    formState: { errors }, // 검증 오류 상태
  } = formContext;

  console.log('📊 React Hook Form 상태:', {
    hasErrors: Object.keys(errors).length > 0,
    errorFields: Object.keys(errors),
  });

  // 🎣 커스텀 훅: 폼 상태 관리 (React Hook Form + Zustand 동기화)
  // 이유: 상태 관리 로직을 별도 파일로 분리하여 재사용성과 테스트 용이성 확보
  const {
    titleValue, // 현재 제목 값 (실시간)
    descriptionValue, // 현재 요약 값 (실시간)
    isInitialized, // 초기화 완료 여부
  } = useBlogBasicFormState();

  // 🎯 커스텀 훅: 액션 함수들 (비즈니스 로직)
  // 이유: 액션 함수들을 별도로 분리하여 컴포넌트 코드 간소화
  const {
    clearTitle, // 제목 초기화 함수
    clearDescription, // 요약 초기화 함수
  } = useBlogBasicActions();

  console.log('📝 현재 폼 값들:', {
    title: titleValue,
    titleLength: titleValue.length,
    description: descriptionValue,
    descriptionLength: descriptionValue.length,
    isInitialized,
  });

  // 🚫 초기화되지 않은 상태에서는 로딩 표시
  // 이유: Zustand 스토어 초기화 완료 후에 UI 렌더링하여 깜빡임 방지
  if (!isInitialized) {
    console.log('⏳ 아직 초기화되지 않음, 로딩 상태');
    console.groupEnd();
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-default-500">로딩 중...</div>
      </div>
    );
  }

  console.log('✅ 초기화 완료, UI 렌더링 시작');
  console.groupEnd();

  // 🎨 메인 UI 렌더링
  return (
    <div className="space-y-6">
      {/* 📋 안내 가이드 컴포넌트 */}
      {/* 이유: 사용자에게 입력 방법과 조건을 명확히 안내 */}
      <BlogBasicStepGuide />

      {/* 📝 블로그 제목 입력 필드 */}
      {/*
        Props 설명:
        - value: 현재 제목 값 (Zustand에서 가져온 실시간 값)
        - onClear: 제목 초기화 함수 (React Hook Form + Zustand 동시 처리)
        - error: React Hook Form 검증 오류 메시지
      */}
      <BlogTitleField
        value={titleValue}
        onClear={clearTitle}
        error={errors.title?.message?.toString()}
      />

      {/* 📄 블로그 요약 입력 필드 */}
      {/*
        Props 설명:
        - value: 현재 요약 값 (Zustand에서 가져온 실시간 값)
        - onClear: 요약 초기화 함수 (React Hook Form + Zustand 동시 처리)
        - error: React Hook Form 검증 오류 메시지
      */}
      <BlogDescriptionField
        value={descriptionValue}
        onClear={clearDescription}
        error={errors.description?.message?.toString()}
      />
    </div>
  );
}

// 📤 컴포넌트 내보내기
// 이유: 외부에서 BlogBasicStep 기능을 사용할 수 있도록 export
export default BlogBasicStepContainer;
