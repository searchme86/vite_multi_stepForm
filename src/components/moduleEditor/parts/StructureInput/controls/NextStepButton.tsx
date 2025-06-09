// 📁 parts/StructureInput/controls/NextStepButton.tsx
import React from 'react';
import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';

interface NextStepButtonProps {
  onComplete: () => void;
  isValid: boolean;
}

function NextStepButton({ onComplete, isValid }: NextStepButtonProps) {
  console.log('⏭️ [NEXT_STEP_BUTTON] 렌더링:', { isValid });

  return (
    <Button
      type="button"
      color="primary"
      onPress={onComplete}
      isDisabled={!isValid}
      endContent={<Icon icon="lucide:arrow-right" />}
      aria-label="다음 단계로 이동"
    >
      다음: 글 작성하기
    </Button>
  );
}

export default React.memo(NextStepButton);
