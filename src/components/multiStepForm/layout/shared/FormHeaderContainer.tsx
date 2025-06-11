import FormTitle from './FormTitle';
import FormDateDisplay from './FormDateDisplay';
import PreviewToggleButton from './PreviewToggleButton';

interface FormHeaderContainerProps {
  showPreview: boolean;
  onTogglePreview: () => void;
}

function FormHeaderContainer({
  showPreview,
  onTogglePreview,
}: FormHeaderContainerProps) {
  console.log('📋 FormHeaderContainer: 폼 헤더 컨테이너 렌더링', {
    showPreview,
  });

  return (
    <div className="flex flex-col items-start justify-between gap-3 mb-6 sm:flex-row sm:items-center sm:gap-0">
      <FormTitle />
      <div className="flex items-center w-full gap-2 sm:w-auto">
        <FormDateDisplay />
        <PreviewToggleButton
          showPreview={showPreview}
          onToggle={onTogglePreview}
        />
      </div>
    </div>
  );
}

export default FormHeaderContainer;
