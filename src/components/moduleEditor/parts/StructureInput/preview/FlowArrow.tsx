// 📁 parts/StructureInput/preview/FlowArrow.tsx
import React from 'react';
import { Icon } from '@iconify/react';

function FlowArrow() {
  console.log('➡️ [FLOW_ARROW] 렌더링');

  return <Icon icon="lucide:arrow-right" className="text-gray-400" />;
}

export default React.memo(FlowArrow);
