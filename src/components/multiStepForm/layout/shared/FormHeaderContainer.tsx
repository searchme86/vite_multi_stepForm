// src/components/multiStepForm/layout/shared/FormHeaderContainer.tsx

import FormTitle from './FormTitle';
import FormDateDisplay from './FormDateDisplay';
import PreviewToggleButton from './PreviewToggleButton';

function FormHeaderContainer() {
  console.log(
    '📋 FormHeaderContainer: 폼 헤더 컨테이너 렌더링 - Zustand 직접 사용'
  );

  return (
    <div className="flex flex-col items-start justify-between gap-3 mb-6 sm:flex-row sm:items-center sm:gap-0">
      <FormTitle />
      <div className="flex items-center w-full gap-2 sm:w-auto mb-xs:ml-auto mb-xs:w-auto">
        <FormDateDisplay />
        <PreviewToggleButton />
      </div>
    </div>
  );
}

export default FormHeaderContainer;
