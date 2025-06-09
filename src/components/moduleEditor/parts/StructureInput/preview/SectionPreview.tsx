// 📁 parts/StructureInput/preview/SectionPreview.tsx
import React from 'react';
import PreviewChip from './PreviewChip';
import FlowArrow from './FlowArrow';

interface SectionPreviewProps {
  containerInputs: string[];
}

function SectionPreview({ containerInputs }: SectionPreviewProps) {
  console.log('👀 [SECTION_PREVIEW] 렌더링:', {
    inputCount: containerInputs.length,
  });

  const validInputs = containerInputs.filter(
    (input) => input.trim().length > 0
  );

  return (
    <div className="p-6 rounded-lg bg-gray-50">
      <h3 className="mb-4 text-lg font-semibold">📋 생성될 구조 미리보기</h3>
      <div className="flex flex-wrap items-center gap-3">
        {validInputs.map((input, index) => (
          <div key={`preview-${index}`} className="flex items-center gap-3">
            {index > 0 && <FlowArrow />}
            <PreviewChip text={input.trim()} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default React.memo(SectionPreview);
