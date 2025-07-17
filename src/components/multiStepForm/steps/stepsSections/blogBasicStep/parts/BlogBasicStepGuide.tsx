// blogBasicStep/parts/BlogBasicStepGuide.tsx

/**
 * BlogBasicStep 컴포넌트 - 안내 가이드
 * 블로그 기본 정보 입력에 대한 사용자 가이드를 제공하는 컴포넌트
 * 입력 조건과 방법을 명확히 안내하여 사용자 경험 향상
 */

import React from 'react';

/**
 * 블로그 기본 정보 입력 가이드 컴포넌트
 *
 * 기능:
 * 1. 입력 조건 안내 (제목: 5-100자, 요약: 10자 이상)
 * 2. 사용자에게 친화적인 설명 제공
 * 3. 시각적으로 구분되는 안내 영역
 *
 * 디자인 패턴: Presentation Component (순수 UI)
 */
function BlogBasicStepGuide(): React.ReactNode {
  console.log('📋 [GUIDE_DEBUG] BlogBasicStepGuide 렌더링됨');

  return (
    <header className="p-4 mb-6 rounded-lg bg-default-50" role="banner">
      {/* 📌 가이드 제목 */}
      {/*
        역할: 사용자에게 현재 단계가 무엇인지 명확히 알려줌
        스타일: 크고 굵은 폰트로 시각적 중요도 강조
        웹접근성: h3 태그로 의미적 구조 제공
      */}
      <h3 className="mb-2 text-lg font-medium" id="guide-title">
        블로그 기본 정보 입력 안내
      </h3>

      {/* 📝 상세 안내 내용 */}
      {/*
        역할: 구체적인 입력 조건과 가이드라인 제공
        내용: 제목과 요약의 중요성, 글자 수 제한 안내
        스타일: 부드러운 색상으로 읽기 편하게 구성
        웹접근성: aria-describedby로 제목과 연결
      */}
      <p
        className="text-default-600"
        aria-describedby="guide-title"
        role="text"
      >
        블로그 포스트의 기본 정보를 입력해주세요. 제목은 블로그의 첫인상을
        결정하는 중요한 요소입니다. 간결하면서도 내용을 잘 나타내는 제목과
        요약을 작성해주세요. 제목은 5자 이상 100자 이하, 요약은 10자 이상
        작성해주세요.
      </p>
    </header>
  );
}

// 📤 컴포넌트 내보내기
export default BlogBasicStepGuide;
