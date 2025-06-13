import React from 'react';
import { ImageViewConfig } from '../../../../types/galleryTypes';

interface ImageViewConfigManagerProps {
  config: ImageViewConfig;
  onConfigChange: (config: ImageViewConfig) => void;
  children: React.ReactNode;
}

function ImageViewConfigManager({
  config,
  onConfigChange,
  children,
}: ImageViewConfigManagerProps) {
  console.log('🖼️ ImageViewConfigManager: 이미지 뷰 설정 관리자 렌더링');

  const updateConfig = React.useCallback(
    (updates: Partial<ImageViewConfig>) => {
      console.log('🖼️ ImageViewConfigManager: 설정 업데이트', updates);

      const newConfig = { ...config, ...updates };
      onConfigChange(newConfig);
    },
    [config, onConfigChange]
  );

  const resetToDefaults = React.useCallback(() => {
    console.log('🖼️ ImageViewConfigManager: 기본값으로 초기화');

    const defaultConfig: ImageViewConfig = {
      id: `config-${Date.now()}`,
      layout: 'grid',
      columns: 3,
      spacing: 8,
      borderRadius: 4,
      showTitles: true,
    };

    onConfigChange(defaultConfig);
  }, [onConfigChange]);

  const validateConfig = React.useCallback(
    (configToValidate: ImageViewConfig): boolean => {
      console.log('🖼️ ImageViewConfigManager: 설정 검증');

      const isValid =
        configToValidate.columns > 0 &&
        configToValidate.columns <= 6 &&
        configToValidate.spacing >= 0 &&
        configToValidate.spacing <= 32 &&
        configToValidate.borderRadius >= 0 &&
        configToValidate.borderRadius <= 20;

      console.log('🖼️ ImageViewConfigManager: 검증 결과', isValid);
      return isValid;
    },
    []
  );

  React.useEffect(() => {
    if (!validateConfig(config)) {
      console.log(
        '🖼️ ImageViewConfigManager: 잘못된 설정 감지, 기본값으로 초기화'
      );
      resetToDefaults();
    }
  }, [config, validateConfig, resetToDefaults]);

  const contextValue = React.useMemo(
    () => ({
      config,
      updateConfig,
      resetToDefaults,
      validateConfig,
    }),
    [config, updateConfig, resetToDefaults, validateConfig]
  );

  return (
    <div data-config-manager="image-view">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            configManager: contextValue,
          } as any);
        }
        return child;
      })}
    </div>
  );
}

export default ImageViewConfigManager;
