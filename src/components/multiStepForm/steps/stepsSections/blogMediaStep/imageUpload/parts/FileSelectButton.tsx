// 📁 imageUpload/parts/FileSelectButton.tsx

import React, {
  useRef,
  useImperativeHandle,
  useCallback,
  useMemo,
} from 'react';
import { useImageUploadContext } from '../context/ImageUploadContext';
import { createLogger } from '../utils/loggerUtils';
import { generateAcceptString } from '../utils/fileFormatUtils';

const logger = createLogger('FILE_SELECT_BUTTON');

// 🚨 FIXED: 인터페이스를 Context의 ref 타입과 일치시킴
export interface FileSelectButtonRef {
  click: () => void;
}

// ✅ forwardRef 제거하고 일반 컴포넌트로 변경
function FileSelectButton(): React.ReactNode {
  // ✅ Context에서 모든 핸들러 가져오기 (Props 0개)
  const { handleFileChange, fileSelectButtonRef } = useImageUploadContext();

  const fileInputRef = useRef<HTMLInputElement>(null);

  logger.debug('FileSelectButton 렌더링');

  // 🚀 성능 최적화: 파일 입력 클릭 함수 메모이제이션
  const triggerFileInputClick = useCallback((): void => {
    const { current: fileInputElement } = fileInputRef;

    logger.debug('파일 입력 클릭 트리거 요청', {
      hasFileInputElement: fileInputElement !== null,
    });

    // 🔧 early return으로 중첩 방지
    if (fileInputElement === null) {
      logger.warn('파일 입력 요소가 존재하지 않음');
      return;
    }

    try {
      fileInputElement.click();

      logger.info('파일 입력 클릭 성공');
    } catch (clickError) {
      logger.error('파일 입력 클릭 중 오류', {
        error: clickError,
      });
    }
  }, []);

  // 🚨 FIXED: Context의 ref에 올바른 메서드명으로 연결
  useImperativeHandle(
    fileSelectButtonRef,
    () => ({
      click: triggerFileInputClick,
    }),
    [triggerFileInputClick]
  );

  // 🚨 FIXED: React.ChangeEvent<HTMLInputElement> 타입에 맞게 수정
  const handleFileChangeEvent = useCallback(
    (changeEvent: React.ChangeEvent<HTMLInputElement>) => {
      const { target } = changeEvent;
      const { files: selectedFiles } = target;

      logger.debug('파일 변경 이벤트 처리', {
        hasTarget: target !== null,
        hasFiles: selectedFiles !== null,
        fileCount: selectedFiles?.length ?? 0,
      });

      // 🔧 early return으로 중첩 방지
      if (selectedFiles === null) {
        logger.warn('선택된 파일이 없음');
        return;
      }

      const hasSelectedFiles = selectedFiles.length > 0;

      if (!hasSelectedFiles) {
        logger.warn('선택된 파일 개수가 0개');
        return;
      }

      try {
        // 🚨 FIXED: ChangeEvent 전체를 전달하는 대신 올바른 방식으로 호출
        handleFileChange(changeEvent);

        const fileNamesList = Array.from(selectedFiles).map(({ name }) => name);

        logger.info('파일 변경 이벤트 처리 완료', {
          fileCount: selectedFiles.length,
          fileNames: fileNamesList,
        });

        // 🔧 파일 입력 값 초기화 (같은 파일 재선택 가능하도록)
        target.value = '';

        logger.debug('파일 입력 값 초기화 완료');
      } catch (fileChangeError) {
        logger.error('파일 변경 처리 중 오류', {
          error: fileChangeError,
          fileCount: selectedFiles.length,
        });
      }
    },
    [handleFileChange]
  );

  // 🚀 성능 최적화: 파일 형식 문자열 메모이제이션
  const acceptString = useMemo(() => {
    try {
      const generatedAcceptString = generateAcceptString();

      logger.debug('파일 형식 문자열 생성', {
        acceptString: generatedAcceptString,
      });

      return generatedAcceptString;
    } catch (acceptStringError) {
      logger.error('파일 형식 문자열 생성 중 오류', {
        error: acceptStringError,
      });

      // fallback으로 기본 이미지 형식들 반환
      return 'image/*,.jpg,.jpeg,.png,.gif,.webp,.svg';
    }
  }, []);

  // 🚀 성능 최적화: 입력 요소 속성 메모이제이션
  const inputElementAttributes = useMemo(() => {
    const multiple = true;
    const disabled = false;
    const className = 'hidden';

    logger.debug('입력 요소 속성 계산', {
      multiple,
      disabled,
      acceptString,
      className,
    });

    return {
      type: 'file' as const,
      className,
      accept: acceptString,
      multiple,
      disabled,
      'aria-label': '파일 입력',
    };
  }, [acceptString]);

  // 🚀 성능 최적화: 접근성 속성 메모이제이션
  const accessibilityAttributes = useMemo(() => {
    const multiple = true;
    const ariaDescribedBy = multiple
      ? 'file-select-help-multiple'
      : 'file-select-help-single';

    const ariaLabel = multiple ? '여러 파일 선택' : '단일 파일 선택';

    return {
      'aria-describedby': ariaDescribedBy,
      'aria-label': ariaLabel,
      role: 'button' as const,
    };
  }, []);

  logger.debug('FileSelectButton 렌더링 준비 완료', {
    hasAcceptString: acceptString.length > 0,
    inputAttributesReady: true,
    accessibilityAttributesReady: true,
    refConnected: true, // ✅ Context ref에 연결됨
  });

  return (
    <>
      {/* 숨겨진 파일 입력 요소 */}
      <input
        ref={fileInputRef}
        {...inputElementAttributes}
        {...accessibilityAttributes}
        onChange={handleFileChangeEvent}
      />

      {/* 접근성을 위한 숨겨진 도움말 텍스트 */}
      <div id="file-select-help-multiple" className="sr-only">
        여러 개의 이미지 파일을 선택할 수 있습니다. 지원 형식: JPG, PNG, GIF,
        WebP, SVG 등
      </div>

      <div id="file-select-help-single" className="sr-only">
        단일 이미지 파일을 선택할 수 있습니다. 지원 형식: JPG, PNG, GIF, WebP,
        SVG 등
      </div>
    </>
  );
}

export default FileSelectButton;
