// blogMediaStep/imageGallery/parts/gallery/ImageTable.tsx - ImageGallery 컴포넌트

import React from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Checkbox,
  Button,
  Progress,
} from '@heroui/react';
import { Icon } from '@iconify/react';
import { ImageFileInfo } from '../../utils/galleryUtils';

interface ImageTableProps {
  displayFiles: Array<ImageFileInfo & { index: number }>;
  selectedFiles: number[];
  isAllSelected: boolean;
  mainImage: string | null;
  sliderImages: string[];
  uploading: Record<string, number>;
  uploadStatus: Record<string, 'uploading' | 'success' | 'error'>;
  onSelectFile: (index: number) => void;
  onSelectAll: () => void;
  onOpenModal: (imageUrl: string, imageName: string) => void;
  onSetMainImage: (index: number) => void;
  onCancelMainImage: () => void;
  onToggleSlider: (imageUrl: string) => void;
  onRemoveMedia: (index: number) => void;
  formatFileSize: (size: number) => string;
}

function ImageTable({
  displayFiles,
  selectedFiles,
  isAllSelected,
  mainImage,
  sliderImages,
  uploading,
  uploadStatus,
  onSelectFile,
  onSelectAll,
  onOpenModal,
  onSetMainImage,
  onCancelMainImage,
  onToggleSlider,
  onRemoveMedia,
  formatFileSize,
}: ImageTableProps): React.ReactNode {
  console.log('🔧 ImageTable 렌더링:', {
    displayFilesCount: displayFiles.length,
    selectedCount: selectedFiles.length,
    isAllSelected,
    hasMainImage: !!mainImage,
  });

  const tooltipTexts = {
    mainImage: '메인 이미지로 설정',
    cancelMainImage: '메인 이미지 해제',
    slider: '슬라이더에 추가/제거',
    delete: '이미지 삭제',
  };

  return (
    <div className="hidden md:block">
      <Table
        aria-label="업로드된 이미지 목록"
        removeWrapper
        classNames={{
          table: 'min-h-[200px]',
          tbody: 'divide-y divide-default-200',
        }}
      >
        <TableHeader>
          <TableColumn scope="col" className="w-10">
            <Checkbox
              isSelected={isAllSelected && displayFiles.length > 0}
              isIndeterminate={
                selectedFiles.length > 0 &&
                selectedFiles.length < displayFiles.length
              }
              onValueChange={onSelectAll}
            />
          </TableColumn>
          <TableColumn scope="col">파일</TableColumn>
          <TableColumn scope="col">진행률</TableColumn>
          <TableColumn scope="col">크기</TableColumn>
          <TableColumn scope="col" className="text-center">
            액션
          </TableColumn>
        </TableHeader>

        <TableBody>
          {displayFiles.map((fileItem) => {
            const { url: file, index, name, size } = fileItem;
            const uploadProgress = Object.values(uploading)[0] || 100;
            const isUploaded =
              uploadStatus[name] === 'success' || uploadProgress === 100;
            const isMain = mainImage === file;
            const isSelected = selectedFiles.includes(index);

            console.log('🖼️ ImageTable 행 렌더링:', {
              index,
              name,
              isMain,
              isSelected,
              isUploaded,
            });

            return (
              <TableRow
                key={index}
                className={isMain ? 'bg-primary-50 border-primary-200' : ''}
              >
                <TableCell>
                  <Checkbox
                    isSelected={isSelected}
                    onValueChange={() => onSelectFile(index)}
                  />
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0 w-16 h-16 cursor-pointer group">
                      <div className="absolute z-10 flex items-center justify-center w-6 h-6 text-xs font-bold text-white rounded-full shadow-lg -top-2 -left-2 bg-primary">
                        {index + 1}
                      </div>

                      <img
                        src={file}
                        alt={`업로드 이미지 ${index + 1}`}
                        className="object-cover w-full h-full rounded-md"
                        onClick={() => onOpenModal(file, name)}
                      />

                      <div className="absolute inset-0 flex items-center justify-center transition-all bg-black bg-opacity-0 rounded-md opacity-0 group-hover:bg-opacity-30 group-hover:opacity-100">
                        <Icon
                          icon="lucide:zoom-in"
                          className="text-sm text-white"
                        />
                      </div>

                      {isMain && (
                        <div className="absolute p-1 text-white rounded-full -top-1 -right-1 bg-primary">
                          <Icon icon="lucide:crown" className="text-xs" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <span
                        className="text-sm font-medium block max-w-[100px] truncate"
                        title={name}
                      >
                        {name}
                      </span>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  {!isUploaded ? (
                    <div className="w-full max-w-[100px]">
                      <Progress
                        aria-label="업로드 중..."
                        value={uploadProgress}
                        size="sm"
                        color="primary"
                      />
                      <span className="text-xs text-default-500">
                        {Math.round(uploadProgress)}%
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Icon
                        icon="lucide:check-circle"
                        className="text-sm text-success"
                      />
                      <span className="text-sm text-success">완료</span>
                    </div>
                  )}
                </TableCell>

                <TableCell>
                  <span className="text-sm text-default-500">
                    {formatFileSize(size)}
                  </span>
                </TableCell>

                <TableCell>
                  <div className="flex items-center justify-center gap-1">
                    {!isMain ? (
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="default"
                        onPress={() => onSetMainImage(index)}
                        aria-label={`이미지 ${index + 1} 메인 이미지로 선택`}
                        title={tooltipTexts.mainImage}
                        type="button"
                      >
                        <Icon icon="lucide:home" className="text-sm" />
                      </Button>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="primary"
                          className="cursor-default bg-primary-100"
                          aria-label="현재 메인 이미지"
                          title="현재 메인 이미지"
                          isDisabled
                          type="button"
                        >
                          <Icon icon="lucide:home" className="text-sm" />
                        </Button>

                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="warning"
                          onPress={onCancelMainImage}
                          aria-label="메인 이미지 해제"
                          title={tooltipTexts.cancelMainImage}
                          type="button"
                        >
                          <Icon icon="lucide:x" className="text-sm" />
                        </Button>
                      </div>
                    )}

                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color={
                        sliderImages.includes(file) ? 'success' : 'default'
                      }
                      onPress={() => onToggleSlider(file)}
                      aria-label={`이미지 ${index + 1} 슬라이더에 ${
                        sliderImages.includes(file) ? '제거' : '추가'
                      }`}
                      title={tooltipTexts.slider}
                      type="button"
                    >
                      <Icon
                        icon={
                          sliderImages.includes(file)
                            ? 'lucide:check'
                            : 'lucide:plus'
                        }
                        className="text-sm"
                      />
                    </Button>

                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      onPress={() => onRemoveMedia(index)}
                      aria-label={`파일 ${name} 삭제`}
                      title={tooltipTexts.delete}
                      type="button"
                    >
                      <Icon icon="lucide:trash-2" className="text-sm" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export default ImageTable;
