// 📁 parts/ProgressSteps.tsx

import React from 'react';

interface ProgressStepsProps {
  currentSubStep: 'structure' | 'writing';
}

function ProgressSteps({
  currentSubStep,
}: ProgressStepsProps): React.ReactNode {
  console.log('📊 [PROGRESS] ProgressSteps 렌더링:', { currentSubStep });

  return (
    <div className="flex items-center justify-center gap-4 mb-6">
      <div className="flex items-center gap-2">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentSubStep === 'structure'
              ? 'bg-blue-500 text-white'
              : 'bg-green-500 text-white'
          }`}
        >
          1
        </div>
        <span
          className={`text-sm font-medium ${
            currentSubStep === 'structure' ? 'text-gray-900' : 'text-green-600'
          }`}
        >
          구조 설계
        </span>
      </div>

      <div className="w-8 h-1 bg-gray-300 rounded">
        <div
          className={`h-full rounded transition-all duration-500 ${
            currentSubStep === 'writing' ? 'w-full bg-blue-500' : 'w-0'
          }`}
        />
      </div>

      <div className="flex items-center gap-2">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentSubStep === 'writing'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-300 text-gray-600'
          }`}
        >
          2
        </div>
        <span
          className={`text-sm font-medium ${
            currentSubStep === 'writing' ? 'text-gray-900' : 'text-gray-400'
          }`}
        >
          Tiptap 에디터로 글 작성
        </span>
      </div>
    </div>
  );
}

export default React.memo(ProgressSteps);
