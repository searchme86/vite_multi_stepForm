// 📁 parts/StructureInput/examples/SectionExamples.tsx
import React from 'react';
import ExampleCard from './ExampleCard';

const EXAMPLE_SECTIONS = [
  { title: '📄 글 요약', desc: '핵심 내용 정리' },
  { title: '📋 목차', desc: '글의 구성' },
  { title: '🚀 서론', desc: '문제 제기' },
  { title: '💡 본론', desc: '핵심 내용' },
  { title: '📊 분석', desc: '데이터 해석' },
  { title: '🎯 결론', desc: '최종 정리' },
  { title: '🔗 참고자료', desc: '출처 링크' },
  { title: '✨ 추가 팁', desc: '보너스 내용' },
];

function SectionExamples() {
  console.log('💡 [SECTION_EXAMPLES] 렌더링');

  return (
    <div className="p-6 mb-6 border border-blue-200 rounded-lg bg-blue-50">
      <h3 className="mb-3 text-lg font-semibold text-blue-900">💡 섹션 예시</h3>
      <p className="mb-4 text-blue-800">다음과 같은 섹션들을 만들어보세요:</p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {EXAMPLE_SECTIONS.map((item, index) => (
          <ExampleCard key={index} title={item.title} desc={item.desc} />
        ))}
      </div>
      <p className="mt-4 text-sm text-blue-700">
        ⚡ 팁: 최소 2개 이상의 섹션을 만들어야 다음 단계로 진행할 수 있습니다.
      </p>
    </div>
  );
}

export default React.memo(SectionExamples);
