import React from 'react';
import { CustomGalleryView } from '../../../../types/galleryTypes';

export const useCustomGalleryViews = () => {
  const [customGalleryViews, setCustomGalleryViews] = React.useState<
    CustomGalleryView[]
  >([]);

  const addCustomGalleryView = React.useCallback((view: CustomGalleryView) => {
    console.log('🖼️ addCustomGalleryView: 갤러리 뷰 추가', view);
    setCustomGalleryViews((prev) => {
      const existingIndex = prev.findIndex(
        (existing) => existing.id === view.id
      );
      if (existingIndex !== -1) {
        console.log('🖼️ addCustomGalleryView: 기존 뷰 업데이트');
        const updated = [...prev];
        updated[existingIndex] = view;
        return updated;
      }
      console.log('🖼️ addCustomGalleryView: 새 뷰 추가');
      return [view, ...prev];
    });
  }, []);

  const removeCustomGalleryView = React.useCallback((id: string) => {
    console.log('🖼️ removeCustomGalleryView: 갤러리 뷰 제거', id);
    setCustomGalleryViews((prev) => prev.filter((view) => view.id !== id));
  }, []);

  const clearCustomGalleryViews = React.useCallback(() => {
    console.log('🖼️ clearCustomGalleryViews: 모든 갤러리 뷰 초기화');
    setCustomGalleryViews([]);
  }, []);

  const updateCustomGalleryView = React.useCallback(
    (id: string, updates: Partial<CustomGalleryView>) => {
      console.log('🖼️ updateCustomGalleryView: 갤러리 뷰 업데이트', {
        id,
        updates,
      });
      setCustomGalleryViews((prev) =>
        prev.map((view) => (view.id === id ? { ...view, ...updates } : view))
      );
    },
    []
  );

  return {
    customGalleryViews,
    addCustomGalleryView,
    removeCustomGalleryView,
    clearCustomGalleryViews,
    updateCustomGalleryView,
  };
};
