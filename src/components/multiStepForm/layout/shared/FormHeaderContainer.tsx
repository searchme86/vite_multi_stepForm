// src/components/multiStepForm/layout/shared/FormHeaderContainer.tsx

import FormTitle from './FormTitle';
import FormDateDisplay from './FormDateDisplay';
import PreviewToggleButton from './PreviewToggleButton';

function FormHeaderContainer() {
  return (
    <header className="flex flex-col items-start justify-between gap-3 mb-6 sm:flex-row sm:items-center sm:gap-0">
      <FormTitle />
      <nav
        className="flex items-center w-full gap-2 sm:w-auto mb-xs:ml-auto mb-xs:w-auto"
        aria-label="폼 헤더 네비게이션"
      >
        <FormDateDisplay />
        <PreviewToggleButton />
      </nav>
    </header>
  );
}

export default FormHeaderContainer;
