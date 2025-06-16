import React from 'react';
import { CustomGalleryView } from '../../../../../types/galleryTypes';
import CustomGalleryManager from './CustomGalleryManager';

interface GalleryViewContainerProps {
  galleryViews: CustomGalleryView[];
  onAddView: (view: CustomGalleryView) => void;
  onUpdateView: (id: string, updates: Partial<CustomGalleryView>) => void;
  onRemoveView: (id: string) => void;
  onClearViews: () => void;
  maxViews?: number;
}

function GalleryViewContainer({
  galleryViews,
  onAddView,
  onUpdateView,
  onRemoveView,
  onClearViews,
  maxViews = 10,
}: GalleryViewContainerProps) {
  console.log('🖼️ GalleryViewContainer: 갤러리 뷰 컨테이너 렌더링');

  const [searchTerm, setSearchTerm] = React.useState('');
  const [sortBy, setSortBy] = React.useState<'name' | 'createdAt'>('createdAt');

  const filteredViews = React.useMemo(() => {
    console.log('🖼️ GalleryViewContainer: 갤러리 뷰 필터링');

    let filtered = galleryViews;

    if (searchTerm.trim()) {
      filtered = filtered.filter((view) =>
        view.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    return filtered;
  }, [galleryViews, searchTerm, sortBy]);

  const handleAddView = React.useCallback(
    (view: CustomGalleryView) => {
      console.log('🖼️ GalleryViewContainer: 갤러리 뷰 추가 시도');

      if (galleryViews.length >= maxViews) {
        alert(`최대 ${maxViews}개의 갤러리만 생성할 수 있습니다.`);
        return;
      }

      onAddView(view);
    },
    [galleryViews.length, maxViews, onAddView]
  );

  const getContainerStats = React.useCallback(() => {
    const stats = {
      total: galleryViews.length,
      filtered: filteredViews.length,
      totalImages: galleryViews.reduce(
        (acc, view) => acc + view.images.length,
        0
      ),
      maxViews,
      remainingSlots: maxViews - galleryViews.length,
    };

    console.log('🖼️ GalleryViewContainer: 컨테이너 통계', stats);
    return stats;
  }, [galleryViews, filteredViews, maxViews]);

  return (
    <div className="space-y-6">
      {/* 검색 및 정렬 */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <input
            type="text"
            placeholder="갤러리 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border rounded-md"
          />
        </div>
        <div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'createdAt')}
            className="p-2 border rounded-md"
          >
            <option value="createdAt">생성일순</option>
            <option value="name">이름순</option>
          </select>
        </div>
      </div>

      {/* 통계 정보 */}
      <div className="p-4 rounded-lg bg-gray-50">
        <div className="grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {getContainerStats().total}
            </div>
            <div className="text-sm text-gray-600">총 갤러리</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {getContainerStats().totalImages}
            </div>
            <div className="text-sm text-gray-600">총 이미지</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {getContainerStats().filtered}
            </div>
            <div className="text-sm text-gray-600">필터된 갤러리</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">
              {getContainerStats().remainingSlots}
            </div>
            <div className="text-sm text-gray-600">남은 슬롯</div>
          </div>
        </div>
      </div>

      {/* 갤러리 관리자 */}
      <CustomGalleryManager
        galleryViews={filteredViews}
        onAddView={handleAddView}
        onUpdateView={onUpdateView}
        onRemoveView={onRemoveView}
        onClearViews={onClearViews}
      />

      {/* 빈 상태 메시지 */}
      {searchTerm && filteredViews.length === 0 && (
        <div className="py-8 text-center text-gray-500">
          "{searchTerm}"에 대한 검색 결과가 없습니다.
        </div>
      )}
    </div>
  );
}

export default GalleryViewContainer;
