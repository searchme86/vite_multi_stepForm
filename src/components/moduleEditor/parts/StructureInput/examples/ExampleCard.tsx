// 📁 parts/StructureInput/examples/ExampleCard.tsx
import React from 'react';

interface ExampleCardProps {
  title: string;
  desc: string;
}

function ExampleCard({ title, desc }: ExampleCardProps) {
  console.log('🎯 [EXAMPLE_CARD] 렌더링:', { title });

  return (
    <div className="p-3 bg-white border border-blue-200 rounded-lg">
      <div className="text-sm font-medium text-blue-900">{title}</div>
      <div className="mt-1 text-xs text-blue-700">{desc}</div>
    </div>
  );
}

export default React.memo(ExampleCard);
