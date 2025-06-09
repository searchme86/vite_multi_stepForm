import { Button, Badge } from '@heroui/react';
import { Icon } from '@iconify/react';

interface StepControlsProps {
  sortedContainers: any[];
  goToStructureStep: () => void;
  saveAllToContext: () => void;
  completeEditor: () => void;
}

function StepControls({
  sortedContainers,
  goToStructureStep,
  saveAllToContext,
  completeEditor,
}: StepControlsProps) {
  console.log('🎛️ [STEP_CONTROLS] 렌더링:', {
    containersCount: sortedContainers.length,
  });

  const handleGoToStructure = () => {
    console.log('🔙 [STEP_CONTROLS] 구조 수정 버튼 클릭');
    goToStructureStep();
  };

  const handleSave = () => {
    console.log('💾 [STEP_CONTROLS] 저장 버튼 클릭');
    saveAllToContext();
  };

  const handleComplete = () => {
    console.log('✅ [STEP_CONTROLS] 완성 버튼 클릭');
    completeEditor();
  };

  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          color="default"
          variant="flat"
          onPress={handleGoToStructure}
          startContent={<Icon icon="lucide:arrow-left" />}
          aria-label="구조 설계 단계로 돌아가기"
        >
          구조 수정
        </Button>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>구조:</span>
          {sortedContainers.map((container, index) => (
            <div key={container.id} className="flex items-center gap-2">
              {index > 0 && (
                <Icon icon="lucide:arrow-right" className="text-gray-400" />
              )}
              <Badge color="primary" variant="flat">
                {container.name}
              </Badge>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            color="secondary"
            variant="flat"
            onPress={handleSave}
            startContent={<Icon icon="lucide:save" />}
            aria-label="현재 작성 내용 저장"
          >
            저장
          </Button>
          <Button
            type="button"
            color="success"
            onPress={handleComplete}
            endContent={<Icon icon="lucide:check" />}
            aria-label="글 작성 완료"
          >
            완성
          </Button>
        </div>
      </div>
    </div>
  );
}

export default StepControls;
