// 📁 imageUpload/parts/FileDropZone.tsx

import React, { memo, useCallback, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { useImageUploadContext } from '../context/ImageUploadContext';
import { createLogger } from '../utils/loggerUtils';
import { handleDragEvent, handleDropEvent } from '../../utils/dragAndDropUtils';

const logger = createLogger('FILE_DROP_ZONE');

function FileDropZone(): React.ReactNode {
  // ✅ Context에서 모든 데이터 가져오기 (Props 0개)
  const { handleFilesDropped, handleFileSelectClick, hasActiveUploads } =
    useImageUploadContext();

  // ✅ 내부 상태로 드래그 상태 관리 (props로 받지 않음)
  const [dragState, setDragState] = useState({
    isDragActive: false,
    dragEventCount: 0,
  });

  const { isDragActive } = dragState;

  logger.debug('FileDropZone 렌더링', {
    isDragActive,
    hasActiveUploads,
  });

  // 🚀 성능 최적화: 드래그 상태 업데이트 함수 메모이제이션
  const updateDragActiveState = useCallback((newDragActive: boolean) => {
    setDragState((previousState) => {
      const { dragEventCount: previousCount } = previousState;

      const updatedState = {
        isDragActive: newDragActive,
        dragEventCount: previousCount + 1,
      };

      logger.debug('드래그 상태 업데이트', {
        newDragActive,
        eventCount: updatedState.dragEventCount,
      });

      return updatedState;
    });
  }, []);

  // 🚀 성능 최적화: 드래그 이벤트 핸들러 메모이제이션
  const handleDragEventCallback = useCallback(
    (dragEvent: React.DragEvent) => {
      logger.debug('드래그 이벤트 처리', {
        eventType: dragEvent.type,
        isDragActive,
      });

      try {
        handleDragEvent(dragEvent, updateDragActiveState);
      } catch (dragEventError) {
        logger.error('드래그 이벤트 처리 중 오류', {
          eventType: dragEvent.type,
          error: dragEventError,
        });
      }
    },
    [updateDragActiveState, isDragActive]
  );

  // 🚀 성능 최적화: 드롭 이벤트 핸들러 메모이제이션
  const handleDropEventCallback = useCallback(
    (dropEvent: React.DragEvent) => {
      logger.debug('드롭 이벤트 처리 시작');

      try {
        handleDropEvent(dropEvent, updateDragActiveState, handleFilesDropped);

        logger.info('드롭 이벤트 처리 완료');
      } catch (dropEventError) {
        logger.error('드롭 이벤트 처리 중 오류', {
          error: dropEventError,
        });
      }
    },
    [updateDragActiveState, handleFilesDropped]
  );

  // 🚀 성능 최적화: 클릭 이벤트 핸들러 메모이제이션
  const handleClickEventCallback = useCallback(() => {
    logger.debug('FileDropZone 클릭 이벤트 처리', {
      hasActiveUploads,
    });

    // 🔧 early return으로 중첩 방지
    if (hasActiveUploads) {
      logger.warn('업로드 중이므로 파일 선택 무시');
      return;
    }

    try {
      handleFileSelectClick();

      logger.info('파일 선택 클릭 처리 완료');
    } catch (fileSelectError) {
      logger.error('파일 선택 클릭 처리 중 오류', {
        error: fileSelectError,
      });
    }
  }, [hasActiveUploads, handleFileSelectClick]);

  // 🚀 성능 최적화: 드롭존 스타일 클래스 메모이제이션
  const dropZoneStyleConfiguration = useMemo(() => {
    const baseClasses =
      'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200';

    const dragStateClasses = isDragActive
      ? 'border-primary bg-primary-50'
      : 'border-default-300';

    const uploadStateClasses = hasActiveUploads
      ? 'opacity-50 cursor-not-allowed'
      : 'hover:border-primary-400';

    const finalClassName = [baseClasses, dragStateClasses, uploadStateClasses]
      .filter(Boolean)
      .join(' ');

    logger.debug('드롭존 스타일 클래스 계산', {
      isDragActive,
      hasActiveUploads,
      finalClassNameLength: finalClassName.length,
    });

    return {
      finalClassName,
      isDragActive,
      isUploadInProgress: hasActiveUploads,
    };
  }, [isDragActive, hasActiveUploads]);

  // 🚀 성능 최적화: 아이콘 스타일 메모이제이션
  const iconStyleConfiguration = useMemo(() => {
    const baseIconClasses = 'text-4xl transition-colors duration-200';
    const iconColorClasses = isDragActive ? 'text-primary' : 'text-default-400';
    const finalIconClassName = `${baseIconClasses} ${iconColorClasses}`;

    return {
      finalIconClassName,
      iconName: 'lucide:upload-cloud',
    };
  }, [isDragActive]);

  // 🚀 성능 최적화: 메시지 콘텐츠 메모이제이션
  const messageContent = useMemo(() => {
    const getMainMessage = (): string => {
      if (hasActiveUploads) {
        return '업로드 진행 중...';
      }

      return isDragActive
        ? '파일을 놓아주세요'
        : '클릭하여 파일을 업로드하거나 드래그 앤 드롭하세요';
    };

    const getDescriptionMessage = (): string => {
      return hasActiveUploads
        ? '업로드가 완료될 때까지 기다려주세요'
        : '지원 형식: SVG, JPG, PNG (최대 10MB)';
    };

    const mainMessage = getMainMessage();
    const descriptionMessage = getDescriptionMessage();
    const shouldShowButton = !hasActiveUploads;
    const shouldShowProgressIndicator = hasActiveUploads;

    logger.debug('메시지 콘텐츠 생성', {
      mainMessage,
      descriptionMessage,
      hasActiveUploads,
      isDragActive,
    });

    return {
      mainMessage,
      descriptionMessage,
      shouldShowButton,
      shouldShowProgressIndicator,
    };
  }, [hasActiveUploads, isDragActive]);

  // 🔧 구조분해할당으로 데이터 접근
  const { finalClassName } = dropZoneStyleConfiguration;
  const { finalIconClassName, iconName } = iconStyleConfiguration;
  const {
    mainMessage,
    descriptionMessage,
    shouldShowButton,
    shouldShowProgressIndicator,
  } = messageContent;

  return (
    <div
      className={finalClassName}
      onDragEnter={handleDragEventCallback}
      onDragOver={handleDragEventCallback}
      onDragLeave={handleDragEventCallback}
      onDrop={handleDropEventCallback}
      onClick={handleClickEventCallback}
      role="region"
      aria-label="파일 업로드 영역"
      aria-describedby="drop-zone-description"
    >
      <div className="flex flex-col items-center gap-2">
        {/* 업로드 아이콘 */}
        <Icon
          icon={iconName}
          className={finalIconClassName}
          aria-hidden="true"
        />

        {/* 메인 메시지 */}
        <h3 className="text-lg font-medium">{mainMessage}</h3>

        {/* 설명 텍스트 */}
        <p id="drop-zone-description" className="text-sm text-default-500">
          {descriptionMessage}
        </p>

        {/* 업로드 중이 아닐 때만 버튼 표시 */}
        {shouldShowButton ? (
          <div className="mt-2">
            <span className="inline-flex items-center px-4 py-2 text-sm font-medium transition-colors border rounded-lg text-primary border-primary hover:bg-primary-50">
              파일 선택
            </span>
          </div>
        ) : null}

        {/* 업로드 중 표시 */}
        {shouldShowProgressIndicator ? (
          <div className="flex items-center gap-2 mt-2 text-primary">
            <Icon
              icon="lucide:loader-2"
              className="text-sm animate-spin"
              aria-hidden="true"
            />
            <span className="text-sm">파일 처리 중...</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default memo(FileDropZone);
