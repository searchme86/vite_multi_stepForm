// 📁 parts/StructureInput/preview/PreviewChip.tsx
import React from 'react';
import { Chip } from '@heroui/react';

interface PreviewChipProps {
  text: string;
}

function PreviewChip({ text }: PreviewChipProps) {
  console.log('🏷️ [PREVIEW_CHIP] 렌더링:', { text });

  return (
    <Chip color="primary" variant="flat">
      {text}
    </Chip>
  );
}

export default React.memo(PreviewChip);
