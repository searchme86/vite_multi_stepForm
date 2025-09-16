import React from 'react';
import { ImageViewConfig } from '../../../../../types/galleryTypes';

interface ImageViewConfigDefaultsProps {
  onSelectDefault: (config: ImageViewConfig) => void;
}

function ImageViewConfigDefaults({
  onSelectDefault,
}: ImageViewConfigDefaultsProps) {
  console.log('🖼️ ImageViewConfigDefaults: 이미지 뷰 기본 설정 렌더링');

  const defaultConfigs = React.useMemo(
    () => [
      {
        name: '그리드 (3열)',
        config: {
          id: 'grid-3',
          layout: 'grid',
          columns: 3,
          spacing: 8,
          borderRadius: 4,
          showTitles: true,
        } as ImageViewConfig,
      },
      {
        name: '그리드 (4열)',
        config: {
          id: 'grid-4',
          layout: 'grid',
          columns: 4,
          spacing: 6,
          borderRadius: 4,
          showTitles: true,
        } as ImageViewConfig,
      },
      {
        name: '리스트 뷰',
        config: {
          id: 'list',
          layout: 'list',
          columns: 1,
          spacing: 12,
          borderRadius: 8,
          showTitles: true,
        } as ImageViewConfig,
      },
      {
        name: '갤러리 뷰',
        config: {
          id: 'gallery',
          layout: 'gallery',
          columns: 2,
          spacing: 16,
          borderRadius: 12,
          showTitles: false,
        } as ImageViewConfig,
      },
    ],
    []
  );

  const handleSelectDefault = React.useCallback(
    (config: ImageViewConfig) => {
      console.log('🖼️ ImageViewConfigDefaults: 기본 설정 선택', config);
      onSelectDefault({ ...config, id: `config-${Date.now()}` });
    },
    [onSelectDefault]
  );

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">기본 설정</h4>
      <div className="grid grid-cols-2 gap-2">
        {defaultConfigs.map((item, index) => (
          <button
            key={index}
            onClick={() => handleSelectDefault(item.config)}
            className="p-3 text-left transition-colors border rounded-lg hover:bg-gray-50"
            type="button"
          >
            <div className="text-sm font-medium">{item.name}</div>
            <div className="mt-1 text-xs text-gray-500">
              {item.config.columns}열 · 간격 {item.config.spacing}px
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default ImageViewConfigDefaults;
