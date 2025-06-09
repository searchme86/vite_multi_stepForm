// 📁 parts/StructureInput/controls/AddRemoveButtons.tsx
import React from 'react';
import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';

interface AddRemoveButtonsProps {
  onAdd: () => void;
  onRemove: () => void;
  canRemove: boolean;
}

function AddRemoveButtons({
  onAdd,
  onRemove,
  canRemove,
}: AddRemoveButtonsProps) {
  console.log('🔧 [ADD_REMOVE_BUTTONS] 렌더링:', { canRemove });

  return (
    <div className="flex gap-3">
      <Button
        type="button"
        color="default"
        variant="flat"
        onPress={onAdd}
        startContent={<Icon icon="lucide:plus" />}
        aria-label="새 섹션 추가"
      >
        섹션 추가
      </Button>
      <Button
        type="button"
        color="danger"
        variant="flat"
        onPress={onRemove}
        isDisabled={!canRemove}
        startContent={<Icon icon="lucide:minus" />}
        aria-label="마지막 섹션 삭제"
      >
        마지막 섹션 삭제
      </Button>
    </div>
  );
}

export default React.memo(AddRemoveButtons);
