//====여기부터 수정됨====
// ✅ 수정: 파일 전체 교체 - 실제 CustomGalleryManager 구현
// 이유: 기존 내용이 GalleryViewContainer와 동일했음
import React from 'react';
import { CustomGalleryView } from '../../../../../types/galleryTypes';

interface CustomGalleryManagerProps {
  galleryViews: CustomGalleryView[];
  onAddView: (view: CustomGalleryView) => void;
  onUpdateView: (id: string, updates: Partial<CustomGalleryView>) => void;
  onRemoveView: (id: string) => void;
  onClearViews: () => void;
}

function CustomGalleryManager({
  galleryViews,
  onAddView,
  onUpdateView,
  onRemoveView,
  onClearViews,
}: CustomGalleryManagerProps) {
  console.log('🖼️ CustomGalleryManager: 커스텀 갤러리 관리자 렌더링');

  const handleCreateGallery = React.useCallback(
    (name: string, images: string[]) => {
      const newGallery: CustomGalleryView = {
        id: `gallery-${Date.now()}`,
        name,
        config: {
          id: `config-${Date.now()}`,
          layout: 'grid',
          columns: 3,
          spacing: 8,
          borderRadius: 4,
          showTitles: true,
        },
        images,
        createdAt: new Date(),
      };

      onAddView(newGallery);
    },
    [onAddView]
  );

  const handleEditGallery = React.useCallback(
    (id: string, name: string) => {
      onUpdateView(id, { name });
    },
    [onUpdateView]
  );

  const handleDeleteGallery = React.useCallback(
    (id: string) => {
      if (window.confirm('정말로 이 갤러리를 삭제하시겠습니까?')) {
        onRemoveView(id);
      }
    },
    [onRemoveView]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">갤러리 관리</h3>
        <button
          onClick={onClearViews}
          className="px-3 py-1 text-sm text-white bg-red-500 rounded"
          type="button"
        >
          모두 삭제
        </button>
      </div>

      <div className="grid gap-4">
        {galleryViews.map((gallery) => (
          <div key={gallery.id} className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{gallery.name}</h4>
              <div className="space-x-2">
                <button
                  onClick={() => handleEditGallery(gallery.id, gallery.name)}
                  className="px-2 py-1 text-xs text-white bg-blue-500 rounded"
                  type="button"
                >
                  편집
                </button>
                <button
                  onClick={() => handleDeleteGallery(gallery.id)}
                  className="px-2 py-1 text-xs text-white bg-red-500 rounded"
                  type="button"
                >
                  삭제
                </button>
              </div>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              이미지 {gallery.images.length}개
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CustomGalleryManager;
//====여기까지 수정됨====
