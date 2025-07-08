// blogMediaStep/imageUpload/ImageUploadContainer.tsx

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { useBlogMediaStepState } from '../hooks/useBlogMediaStepState';

import FileDropZone from './parts/FileDropZone';
import FileSelectButton, {
  type FileSelectButtonRef,
} from './parts/FileSelectButton';
import { Progress } from '@heroui/react';
import { validateFile } from '../utils/fileValidationUtils';

// 안전한 고유 ID 생성을 위한 카운터
let globalFileIdCounter = 0;

// 고유한 파일 ID 생성 함수
const generateSecureFileId = (fileNameForId: string): string => {
  const currentTimestamp = Date.now();
  const incrementedCounter = ++globalFileIdCounter;
  const randomIdentifier = Math.random().toString(36).substring(2, 9);
  const fileNameHash = fileNameForId.slice(0, 5).replace(/[^a-zA-Z0-9]/g, '');

  const secureFileId = `file-${currentTimestamp}-${incrementedCounter}-${randomIdentifier}-${fileNameHash}`;

  console.log('🆔 [FILE_ID] 안전한 파일 ID 생성:', {
    fileNameForId: fileNameForId.slice(0, 20) + '...',
    secureFileId,
    counter: incrementedCounter,
    timestamp: new Date().toLocaleTimeString(),
  });

  return secureFileId;
};

// 🔄 중복 파일 체크 함수
const checkDuplicateFile = (
  newFile: File,
  existingFileNames: string[]
): boolean => {
  const isDuplicate = existingFileNames.includes(newFile.name);

  console.log('🔍 [DUPLICATE_CHECK] 중복 파일 체크:', {
    fileName: newFile.name,
    fileSize: newFile.size,
    isDuplicate,
    existingFileNames,
    timestamp: new Date().toLocaleTimeString(),
  });

  return isDuplicate;
};

// 🔄 중복 파일 필터링 함수
const filterDuplicateFiles = (
  files: File[],
  existingFileNames: string[]
): { uniqueFiles: File[]; duplicateFiles: File[] } => {
  const uniqueFiles: File[] = [];
  const duplicateFiles: File[] = [];

  files.forEach((file) => {
    const isDuplicate = checkDuplicateFile(file, existingFileNames);

    if (isDuplicate) {
      duplicateFiles.push(file);
    } else {
      uniqueFiles.push(file);
    }
  });

  console.log('🔄 [FILTER_DUPLICATES] 중복 파일 필터링 결과:', {
    totalFiles: files.length,
    uniqueFilesCount: uniqueFiles.length,
    duplicateFilesCount: duplicateFiles.length,
    uniqueFileNames: uniqueFiles.map((f) => f.name),
    duplicateFileNames: duplicateFiles.map((f) => f.name),
    timestamp: new Date().toLocaleTimeString(),
  });

  return { uniqueFiles, duplicateFiles };
};

// 🎯 삭제 확인 UI 상태 타입
interface DeleteConfirmState {
  isVisible: boolean;
  imageIndex: number;
  imageName: string;
}

// 🎨 중복 알림 메시지 상태 타입
interface DuplicateMessageState {
  isVisible: boolean;
  message: string;
  fileNames: string[];
  animationKey: number; // 🔥 애니메이션 강제 재실행을 위한 키 추가
}

function ImageUploadContainer(): React.ReactNode {
  console.log(
    '🚀 [CONTAINER] ImageUploadContainer 렌더링 시작 (중복알림애니메이션-버그수정):',
    {
      timestamp: new Date().toLocaleTimeString(),
    }
  );

  const {
    formValues: currentFormValues,
    uiState: currentUiState,
    setMediaValue: updateMediaValue,
    setSelectedFileNames: updateSelectedFileNames,
    addToast: showToastMessage,
    selectionState: currentSelectionState,
  } = useBlogMediaStepState();

  const { media: currentMediaFilesList } = currentFormValues;
  const { dragActive: isDragActive, isMobile: isMobileDevice } = currentUiState;
  const { selectedFileNames: currentSelectedFileNames } = currentSelectionState;

  console.log(
    '📊 [STATE] BlogMediaStepState 현재 상태 (중복알림애니메이션-버그수정):',
    {
      currentMediaFilesCount: currentMediaFilesList.length,
      currentSelectedFileNamesCount: currentSelectedFileNames.length,
      isDragActive,
      isMobileDevice,
      timestamp: new Date().toLocaleTimeString(),
    }
  );

  const fileSelectButtonRef = useRef<FileSelectButtonRef>(null);

  // 🔥 핵심 수정: 최신 상태 추적을 위한 ref 추가
  const currentStateRef = useRef({
    mediaFiles: currentMediaFilesList,
    fileNames: currentSelectedFileNames,
  });

  // 상태 변경 시마다 ref 업데이트
  useEffect(() => {
    currentStateRef.current = {
      mediaFiles: currentMediaFilesList,
      fileNames: currentSelectedFileNames,
    };
  }, [currentMediaFilesList, currentSelectedFileNames]);

  // ✅ 원본 방식: 단순한 상태 관리 (복잡한 매핑 제거)
  const [uploading, setUploading] = useState<Record<string, number>>({});
  const [uploadStatus, setUploadStatus] = useState<
    Record<string, 'uploading' | 'success' | 'error'>
  >({});

  // 🎯 새로 추가: 삭제 확인 UI 상태
  const [deleteConfirmState, setDeleteConfirmState] =
    useState<DeleteConfirmState>({
      isVisible: false,
      imageIndex: -1,
      imageName: '',
    });

  // 📱 새로 추가: 모바일 터치 상태 관리 (각 이미지별)
  const [touchActiveImages, setTouchActiveImages] = useState<Set<number>>(
    new Set()
  );

  // 🎨 새로 추가: 중복 알림 메시지 상태
  const [duplicateMessageState, setDuplicateMessageState] =
    useState<DuplicateMessageState>({
      isVisible: false,
      message: '',
      fileNames: [],
      animationKey: 0, // 🔥 애니메이션 키 초기화
    });

  // 🎨 중복 알림 애니메이션 타이머 ref
  const duplicateMessageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  // 🔥 애니메이션 키를 ref로 관리하여 클로저 문제 해결
  const animationKeyRef = useRef<number>(0);

  // 🎨 중복 알림 메시지 표시 함수 - 버그 수정 버전
  const showDuplicateMessage = useCallback((duplicateFiles: File[]) => {
    const fileNamesText = duplicateFiles.map((file) => file.name).join(', ');
    const message =
      duplicateFiles.length === 1
        ? `"${duplicateFiles[0].name}" 파일이 이미 추가되어 있어요`
        : `${duplicateFiles.length}개 파일이 이미 추가되어 있어요`;

    // 🔥 매번 새로운 애니메이션 키 생성 (timestamp + random 기반)
    const newAnimationKey = Date.now() + Math.random();
    animationKeyRef.current = newAnimationKey;

    console.log(
      '🎨 [DUPLICATE_MESSAGE] 중복 알림 메시지 표시 - 버그 수정 버전:',
      {
        duplicateFilesCount: duplicateFiles.length,
        message,
        fileNamesText,
        newAnimationKey,
        timestamp: new Date().toLocaleTimeString(),
      }
    );

    // 🔥 핵심 수정: 기존 타이머가 있으면 제거하고 상태 즉시 리셋
    if (duplicateMessageTimerRef.current) {
      clearTimeout(duplicateMessageTimerRef.current);
      console.log('🎨 [DUPLICATE_MESSAGE] 기존 타이머 제거 및 즉시 리셋');

      // 🔥 즉시 상태를 false로 만들어서 애니메이션 리셋
      setDuplicateMessageState((prev) => ({
        ...prev,
        isVisible: false,
      }));
    }

    // 🔥 짧은 지연 후 새로운 애니메이션 시작 (이전 애니메이션 완전 종료 대기)
    setTimeout(
      () => {
        console.log('🎨 [DUPLICATE_MESSAGE] 새로운 애니메이션 시작:', {
          newAnimationKey,
          message,
          forceNewAnimation: true,
        });

        setDuplicateMessageState({
          isVisible: true,
          message,
          fileNames: duplicateFiles.map((file) => file.name),
          animationKey: newAnimationKey,
        });

        // 5초 후 자동으로 사라짐
        duplicateMessageTimerRef.current = setTimeout(() => {
          console.log(
            '⏰ [DUPLICATE_MESSAGE] 자동 사라짐 타이머 실행 - 애니메이션 키:',
            newAnimationKey
          );
          setDuplicateMessageState((prev) => ({
            ...prev,
            isVisible: false,
          }));

          // 애니메이션 완료 후 상태 초기화
          setTimeout(() => {
            console.log(
              '🎨 [DUPLICATE_MESSAGE] 상태 초기화 완료 - 애니메이션 키:',
              newAnimationKey
            );
            setDuplicateMessageState({
              isVisible: false,
              message: '',
              fileNames: [],
              animationKey: newAnimationKey, // 키는 유지하되 다른 상태만 초기화
            });
          }, 800); // 애니메이션 시간과 맞춤 (800ms)
        }, 5000); // 5초
      },
      duplicateMessageTimerRef.current ? 300 : 50
    ); // 기존 타이머가 있었다면 300ms 지연, 없었다면 50ms 지연
  }, []); // 🔥 dependency 완전 제거하여 메모이제이션 문제 해결

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (duplicateMessageTimerRef.current) {
        clearTimeout(duplicateMessageTimerRef.current);
      }
    };
  }, []);

  // ✅ 중복 방지 기능이 추가된 파일 처리 함수
  const handleFiles = useCallback(
    (files: FileList) => {
      console.log(
        '🚨 [FILES] handleFiles 시작 (중복알림애니메이션-버그수정):',
        {
          fileCount: files.length,
          timestamp: new Date().toLocaleTimeString(),
        }
      );

      const filesArray = Array.from(files);

      // 🔄 중복 파일 필터링
      const { uniqueFiles, duplicateFiles } = filterDuplicateFiles(
        filesArray,
        currentSelectedFileNames
      );

      // 🎨 중복 파일이 있으면 애니메이션 알림 표시
      if (duplicateFiles.length > 0) {
        console.log('🎨 [FILES] 중복 파일 발견! 애니메이션 표시 - 버그 수정:', {
          duplicateFileNames: duplicateFiles.map((f) => f.name),
          duplicateCount: duplicateFiles.length,
          currentAnimationKey: duplicateMessageState.animationKey,
          willCreateNewKey: true,
        });
        showDuplicateMessage(duplicateFiles);

        // 기존 토스트 알림도 유지 (선택적)
        showToastMessage({
          title: '중복 파일 발견',
          description: `${duplicateFiles.length}개의 중복 파일이 제외되었습니다`,
          color: 'warning',
        });
      }

      // 업로드할 고유 파일이 없으면 종료
      if (uniqueFiles.length === 0) {
        console.log('⚠️ [FILES] 업로드할 고유 파일이 없음');
        return;
      }

      console.log('✅ [FILES] 고유 파일들 업로드 시작:', {
        uniqueFilesCount: uniqueFiles.length,
        uniqueFileNames: uniqueFiles.map((f) => f.name),
        timestamp: new Date().toLocaleTimeString(),
      });

      // 고유 파일들만 업로드 처리
      uniqueFiles.forEach((file, fileIndex) => {
        const reader = new FileReader();
        const fileId = generateSecureFileId(file.name);
        const { name: fileName } = file;

        console.log(
          '📁 [FILE_PROCESS] 개별 파일 처리 시작 (중복알림애니메이션-수정):',
          {
            fileName,
            fileId,
            fileIndex,
            fileSize: file.size,
            timestamp: new Date().toLocaleTimeString(),
          }
        );

        // 파일 검증
        const validationResult = validateFile(file);
        const { isValid: fileIsValid, errorMessage: validationError } =
          validationResult;

        if (!fileIsValid) {
          console.log(
            '❌ [VALIDATION] 파일 검증 실패 (중복알림애니메이션-수정):',
            {
              fileName,
              error: validationError || 'unknown',
            }
          );

          setUploadStatus((prev) => ({ ...prev, [fileName]: 'error' }));
          showToastMessage({
            title: '업로드 실패',
            description:
              validationError || `${fileName} 파일 검증에 실패했습니다.`,
            color: 'danger',
          });
          return;
        }

        // ✅ 원본 방식: 단순한 상태 설정
        setUploading((prev) => ({ ...prev, [fileId]: 0 }));
        setUploadStatus((prev) => ({ ...prev, [fileName]: 'uploading' }));

        reader.onprogress = (event) => {
          const { lengthComputable, loaded, total } = event;
          if (lengthComputable) {
            const progress = Math.round((loaded / total) * 100);
            setUploading((prev) => ({ ...prev, [fileId]: progress }));

            console.log(
              '📊 [PROGRESS] 진행률 업데이트 (중복알림애니메이션-수정):',
              {
                fileName,
                fileId,
                progress,
                timestamp: new Date().toLocaleTimeString(),
              }
            );
          }
        };

        // ✅ 원본 방식: 단순한 완료 처리
        reader.onload = (e) => {
          const { target: readerTarget } = e;
          const result = readerTarget?.result as string;

          console.log(
            '📁 [READER_LOAD] FileReader 완료 (중복알림애니메이션-수정):',
            {
              fileName,
              fileId,
              resultLength: result ? result.length : 0,
              timestamp: new Date().toLocaleTimeString(),
            }
          );

          // ✅ 원본과 동일한 1.5초 지연 처리
          setTimeout(() => {
            console.log(
              '⏰ [TIMEOUT] setTimeout 콜백 실행 (중복알림애니메이션-수정):',
              {
                fileName,
                fileId,
                timestamp: new Date().toLocaleTimeString(),
              }
            );

            try {
              // 🔥 핵심 수정: ref로 최신 상태 참조하여 클로저 문제 해결
              const latestMediaFiles = currentStateRef.current.mediaFiles;
              const latestFileNames = currentStateRef.current.fileNames;

              updateMediaValue([...latestMediaFiles, result]);
              updateSelectedFileNames([...latestFileNames, fileName]);

              setUploadStatus((prev) => ({ ...prev, [fileName]: 'success' }));

              // ✅ 원본 방식: 단순한 업로딩 상태 제거
              setUploading((prev) => {
                const newState = { ...prev };
                delete newState[fileId];
                return newState;
              });

              showToastMessage({
                title: '업로드 완료',
                description: `${fileName} 파일이 성공적으로 업로드되었습니다.`,
                color: 'success',
              });

              console.log(
                '✅ [SUCCESS] 파일 업로드 완료 (중복알림애니메이션-수정):',
                {
                  fileName,
                  fileId,
                  timestamp: new Date().toLocaleTimeString(),
                }
              );
            } catch (uploadError) {
              console.error(
                '❌ [ERROR] 업로드 처리 중 오류 (중복알림애니메이션-수정):',
                {
                  fileName,
                  fileId,
                  error: uploadError,
                  timestamp: new Date().toLocaleTimeString(),
                }
              );

              setUploadStatus((prev) => ({ ...prev, [fileName]: 'error' }));
              showToastMessage({
                title: '파일 추가 실패',
                description: '파일을 추가하는 중 오류가 발생했습니다.',
                color: 'danger',
              });
            }
          }, 1500); // 원본과 동일한 1.5초 지연
        };

        reader.onerror = (error) => {
          console.error(
            '❌ [READER_ERROR] FileReader 에러 (중복알림애니메이션-수정):',
            {
              fileName,
              fileId,
              error,
              timestamp: new Date().toLocaleTimeString(),
            }
          );

          setUploadStatus((prev) => ({ ...prev, [fileName]: 'error' }));
          showToastMessage({
            title: '업로드 실패',
            description: '파일 읽기 중 오류가 발생했습니다.',
            color: 'danger',
          });
        };

        reader.readAsDataURL(file);
      });
    },
    [
      updateMediaValue,
      updateSelectedFileNames,
      showToastMessage,
      currentSelectedFileNames,
      showDuplicateMessage,
    ]
  );

  // 파일 드롭 핸들러
  const handleFilesDropped = useCallback(
    (droppedFilesList: File[]) => {
      console.log('🚨 [DROP] handleFilesDropped (중복알림애니메이션-수정):', {
        fileCount: droppedFilesList.length,
        fileNames: droppedFilesList.map((f) => f.name),
        timestamp: new Date().toLocaleTimeString(),
      });

      const hasNoFiles = droppedFilesList.length === 0;
      if (hasNoFiles) {
        console.log('⚠️ [DROP] 드롭된 파일이 없음');
        return;
      }

      const fileListObject = {
        length: droppedFilesList.length,
        item: (index: number) => droppedFilesList[index] || null,
        [Symbol.iterator]: function* () {
          for (let i = 0; i < droppedFilesList.length; i++) {
            yield droppedFilesList[i];
          }
        },
      } as FileList;

      handleFiles(fileListObject);
    },
    [handleFiles]
  );

  // 파일 선택 버튼 클릭
  const handleFileSelectClick = useCallback(() => {
    const hasActiveUploads = Object.keys(uploading).length > 0;

    console.log('🚨 [CLICK] handleFileSelectClick (중복알림애니메이션-수정):', {
      hasActiveUploads,
      timestamp: new Date().toLocaleTimeString(),
    });

    if (hasActiveUploads) {
      console.log('⚠️ [CLICK] 업로드 중이므로 파일 선택 무시');
      showToastMessage({
        title: '업로드 진행 중',
        description: '현재 업로드가 진행 중입니다. 완료 후 다시 시도해주세요.',
        color: 'warning',
      });
      return;
    }

    const { current: fileSelectButtonElement } = fileSelectButtonRef;
    const hasClickFunction = fileSelectButtonElement?.clickFileInput;
    if (hasClickFunction) {
      fileSelectButtonElement.clickFileInput();
    }
  }, [uploading, showToastMessage]);

  // 파일 변경 이벤트
  const handleFileChange = useCallback(
    (changedFileList: FileList) => {
      console.log('🚨 [CHANGE] handleFileChange (중복알림애니메이션-수정):', {
        fileCount: changedFileList.length,
        timestamp: new Date().toLocaleTimeString(),
      });

      const hasFiles = changedFileList.length > 0;
      if (hasFiles) {
        handleFiles(changedFileList);
      }
    },
    [handleFiles]
  );

  // 🎯 삭제 버튼 클릭 핸들러 - alert() 대신 UI 표시
  const handleDeleteButtonClick = useCallback(
    (imageIndex: number, imageDisplayName: string) => {
      console.log('🗑️ [DELETE_UI] 삭제 확인 UI 표시:', {
        imageIndex,
        imageDisplayName,
        timestamp: new Date().toLocaleTimeString(),
      });

      setDeleteConfirmState({
        isVisible: true,
        imageIndex,
        imageName: imageDisplayName,
      });
    },
    []
  );

  // 🎯 삭제 확인 핸들러
  const handleDeleteConfirm = useCallback(() => {
    const { imageIndex, imageName } = deleteConfirmState;

    console.log('✅ [DELETE_CONFIRM] 삭제 확인:', {
      imageIndex,
      imageName,
      timestamp: new Date().toLocaleTimeString(),
    });

    try {
      // 🔥 핵심 수정: ref로 최신 상태 참조하여 클로저 문제 해결
      const latestMediaFiles = currentStateRef.current.mediaFiles;
      const latestFileNames = currentStateRef.current.fileNames;

      const updatedMediaFiles = latestMediaFiles.filter(
        (_, filterIndex) => filterIndex !== imageIndex
      );
      const updatedFileNames = latestFileNames.filter(
        (_, filterIndex) => filterIndex !== imageIndex
      );

      updateMediaValue(updatedMediaFiles);
      updateSelectedFileNames(updatedFileNames);

      showToastMessage({
        title: '이미지 삭제 완료',
        description: `"${imageName}" 이미지가 삭제되었습니다.`,
        color: 'success',
      });

      console.log('✅ [DELETE] 이미지 삭제 완료 (중복알림애니메이션-수정):', {
        imageName,
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (deleteError) {
      console.error('❌ [DELETE_ERROR] 삭제 처리 중 오류:', {
        imageName,
        error: deleteError,
        timestamp: new Date().toLocaleTimeString(),
      });

      showToastMessage({
        title: '삭제 실패',
        description: '이미지 삭제 중 오류가 발생했습니다.',
        color: 'danger',
      });
    }

    // 삭제 확인 UI 숨김
    setDeleteConfirmState({
      isVisible: false,
      imageIndex: -1,
      imageName: '',
    });
  }, [
    deleteConfirmState,
    updateMediaValue,
    updateSelectedFileNames,
    showToastMessage,
  ]);

  // 🎯 삭제 취소 핸들러
  const handleDeleteCancel = useCallback(() => {
    console.log('❌ [DELETE_CANCEL] 삭제 취소:', {
      timestamp: new Date().toLocaleTimeString(),
    });

    setDeleteConfirmState({
      isVisible: false,
      imageIndex: -1,
      imageName: '',
    });
  }, []);

  // 📱 모바일 터치 핸들러 - 토글 방식
  const handleImageTouch = useCallback(
    (imageIndex: number) => {
      console.log('📱 [TOUCH] 이미지 터치:', {
        imageIndex,
        isMobileDevice,
        timestamp: new Date().toLocaleTimeString(),
      });

      setTouchActiveImages((prevTouchActive) => {
        const newTouchActive = new Set(prevTouchActive);

        if (newTouchActive.has(imageIndex)) {
          // 이미 활성화된 상태면 비활성화
          newTouchActive.delete(imageIndex);
          console.log('📱 [TOUCH] 터치 상태 비활성화:', { imageIndex });
        } else {
          // 비활성화된 상태면 활성화
          newTouchActive.add(imageIndex);
          console.log('📱 [TOUCH] 터치 상태 활성화:', { imageIndex });
        }

        return newTouchActive;
      });
    },
    [isMobileDevice]
  );

  // 📱 외부 클릭 시 터치 상태 리셋
  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as Element;
      const isImageCard = target.closest('[data-image-card]');

      if (!isImageCard && touchActiveImages.size > 0) {
        console.log('📱 [TOUCH] 외부 클릭으로 터치 상태 리셋');
        setTouchActiveImages(new Set());
      }
    };

    if (isMobileDevice) {
      document.addEventListener('click', handleDocumentClick);
      return () => document.removeEventListener('click', handleDocumentClick);
    }
  }, [touchActiveImages.size, isMobileDevice]);

  // ✅ 원본 방식: 단순한 업로드 상태 확인
  const hasActiveUploads = Object.keys(uploading).length > 0;
  const isCurrentlyUploading = hasActiveUploads;

  console.log('📊 [RENDER] 렌더링 최종 상태 (중복알림애니메이션-버그수정):', {
    hasActiveUploads,
    isCurrentlyUploading,
    uploadingKeys: Object.keys(uploading),
    uploadStatusKeys: Object.keys(uploadStatus),
    deleteConfirmVisible: deleteConfirmState.isVisible,
    touchActiveImagesCount: touchActiveImages.size,
    duplicateMessageVisible: duplicateMessageState.isVisible,
    duplicateMessage: duplicateMessageState.message,
    duplicateAnimationKey: duplicateMessageState.animationKey, // 🔥 애니메이션 키 로그 추가
    animationKeyRef: animationKeyRef.current, // 🔥 ref 키도 추가 로그
    isMobileDevice,
    timestamp: new Date().toLocaleTimeString(),
  });

  return (
    <div
      className="space-y-4"
      role="region"
      aria-labelledby="image-upload-section"
      aria-describedby="image-upload-description"
    >
      <h2 id="image-upload-section" className="sr-only">
        이미지 업로드 섹션
      </h2>
      <p id="image-upload-description" className="sr-only">
        드래그 앤 드롭 또는 파일 선택 버튼을 통해 이미지를 업로드할 수 있습니다.
      </p>

      <FileDropZone
        dragActive={isDragActive}
        setDragActive={() => {
          console.log('🔧 setDragActive 호출됨 (중복알림애니메이션-수정)');
        }}
        onFilesDropped={handleFilesDropped}
        onFileSelectClick={handleFileSelectClick}
        isUploading={isCurrentlyUploading}
        className="transition-all duration-200"
      />

      <FileSelectButton
        ref={fileSelectButtonRef}
        onFileChange={handleFileChange}
        multiple={true}
        disabled={isCurrentlyUploading}
      />

      {/* ✅ 원본 방식: 단순한 업로드 진행률 표시 */}
      {hasActiveUploads && (
        <div
          role="status"
          aria-labelledby="upload-progress-heading"
          aria-live="polite"
          className="space-y-2"
        >
          <h3 id="upload-progress-heading" className="text-sm font-medium">
            업로드 중...
          </h3>

          {/* ✅ 원본과 동일한 단순한 진행률 표시 */}
          {Object.entries(uploading).map(([fileId, progress]) => {
            console.log(
              '🔄 [PROGRESS_ITEM] 진행률 아이템 렌더링 (중복알림애니메이션-수정):',
              {
                fileId,
                progress,
                timestamp: new Date().toLocaleTimeString(),
              }
            );

            return (
              <div key={fileId} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>파일 업로드 중</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress
                  value={progress}
                  color="primary"
                  size="sm"
                  aria-label={`파일 업로드 진행률 ${progress}%`}
                  classNames={{
                    base: 'w-full',
                    track: 'bg-default-200',
                    indicator: 'transition-all duration-300',
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* 🎨 업로드된 이미지 표시 영역 - div ul li 구조 + flex 가로 스크롤 + 터치 지원 + 중복 알림 애니메이션 */}
      {(() => {
        const hasUploadedImages = currentMediaFilesList.length > 0;

        console.log(
          '🖼️ [RENDER] 이미지 표시 영역 렌더링 (중복알림애니메이션-수정):',
          {
            hasUploadedImages,
            currentMediaFilesListLength: currentMediaFilesList.length,
            currentSelectedFileNamesLength: currentSelectedFileNames.length,
            timestamp: new Date().toLocaleTimeString(),
          }
        );

        return hasUploadedImages ? (
          <section
            className="p-4 border border-gray-200 rounded-lg bg-gray-50"
            role="region"
            aria-labelledby="uploaded-images-heading"
          >
            {/* 🎨 완전히 수정된 Header - flex 레이아웃 + 중복 알림 애니메이션 */}
            <header className="flex items-center justify-between mb-4">
              <h3
                id="uploaded-images-heading"
                className="text-lg font-semibold text-gray-800"
              >
                업로드된 이미지들 ({currentMediaFilesList.length}개)
              </h3>

              {/* 🎨 완전히 수정된 중복 알림 메시지 - 오른쪽에서 왼쪽으로 슬라이드인/아웃 */}
              <div className="relative flex items-center justify-end h-8 overflow-hidden w-96">
                {duplicateMessageState.message && ( // 🔥 메시지가 있을 때만 컨테이너 렌더링
                  <div
                    key={`duplicate-message-${duplicateMessageState.animationKey}`} // 🔥 더 명확한 키 네이밍
                    className={`absolute transition-all duration-700 ease-out ${
                      duplicateMessageState.isVisible
                        ? 'right-0 opacity-100'
                        : '-right-96 opacity-0'
                    }`}
                  >
                    <p
                      className="px-4 py-2 text-sm font-medium text-orange-600 bg-orange-100 border border-orange-200 rounded-lg shadow-md whitespace-nowrap"
                      role="alert"
                      aria-live="polite"
                      title={duplicateMessageState.fileNames.join(', ')}
                    >
                      <Icon
                        icon="lucide:alert-triangle"
                        className="inline w-4 h-4 mr-2"
                        aria-hidden="true"
                      />
                      {duplicateMessageState.message}
                    </p>
                  </div>
                )}
              </div>
            </header>

            {/* 🎯 div ul li 구조로 변경 + flex 가로 스크롤 + 터치 지원 */}
            <div className="relative">
              <style>
                {`.scroll-hidden::-webkit-scrollbar { display: none; }`}
              </style>
              <ul
                className="flex gap-3 pb-2 overflow-x-auto scroll-hidden"
                style={{
                  scrollbarWidth: 'none' /* Firefox */,
                  msOverflowStyle: 'none' /* Internet Explorer 10+ */,
                }}
                role="list"
                aria-label="업로드된 이미지 목록"
              >
                {currentMediaFilesList.map((imageUrl, imageIndex) => {
                  const imageDisplayName =
                    currentSelectedFileNames[imageIndex] ||
                    `이미지 ${imageIndex + 1}`;
                  const imageKeyForReact = `uploaded-image-${imageIndex}-${imageDisplayName}`;

                  // 📱 터치 상태 확인 (모바일에서 터치된 상태인지)
                  const isTouchActive = touchActiveImages.has(imageIndex);

                  return (
                    <li
                      key={imageKeyForReact}
                      data-image-card={true}
                      className={`relative flex-shrink-0 overflow-hidden transition-shadow duration-300 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-lg w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 ${
                        isMobileDevice ? 'cursor-pointer' : 'group'
                      }`}
                      role="listitem"
                      aria-labelledby={`image-title-${imageIndex}`}
                      onClick={
                        isMobileDevice
                          ? () => handleImageTouch(imageIndex)
                          : undefined
                      }
                    >
                      {/* 이미지 번호 표시 */}
                      <div className="absolute z-20 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-600 rounded-full shadow-md top-1.5 left-1.5 sm:w-6 sm:h-6 sm:top-2 sm:left-2">
                        {imageIndex + 1}
                      </div>

                      {/* 이미지 표시 */}
                      <div className="flex items-center justify-center w-full h-full bg-gray-100">
                        <img
                          src={imageUrl}
                          alt={`업로드된 이미지 ${
                            imageIndex + 1
                          }: ${imageDisplayName}`}
                          className="object-cover w-full h-full"
                          onLoad={(loadEvent) => {
                            const { currentTarget: loadedImage } = loadEvent;
                            const { naturalWidth, naturalHeight } = loadedImage;
                            console.log(
                              '🖼️ [IMAGE_LOAD] 이미지 로드 완료 (중복알림애니메이션-수정):',
                              {
                                imageIndex,
                                imageDisplayName,
                                naturalWidth,
                                naturalHeight,
                              }
                            );
                          }}
                          onError={(errorEvent) => {
                            console.error(
                              '❌ [IMAGE_ERROR] 이미지 로드 실패 (중복알림애니메이션-수정):',
                              {
                                imageIndex,
                                imageDisplayName,
                                errorEvent,
                              }
                            );
                          }}
                        />
                      </div>

                      {/* 🎨 오버레이 - 데스크탑(hover) vs 모바일(터치) 지원 */}
                      <div
                        className={`absolute inset-x-0 bottom-0 z-10 transition-all duration-300 transform bg-black bg-opacity-70 backdrop-blur-sm ${
                          isMobileDevice
                            ? isTouchActive
                              ? 'translate-y-0'
                              : 'translate-y-full'
                            : 'translate-y-full group-hover:translate-y-0'
                        }`}
                      >
                        <div className="p-2 text-white sm:p-3">
                          <h4
                            id={`image-title-${imageIndex}`}
                            className="text-xs font-medium truncate sm:text-sm"
                            title={imageDisplayName}
                          >
                            {imageDisplayName}
                          </h4>
                          <div className="mt-1 text-xs text-gray-200">
                            <span>{Math.round(imageUrl.length / 1024)} KB</span>
                          </div>
                        </div>
                      </div>

                      {/* 🗑️ 삭제 버튼 - 데스크탑(hover) vs 모바일(터치) 지원 */}
                      <button
                        type="button"
                        className={`absolute z-20 flex items-center justify-center transition-all duration-300 transform bg-red-500 shadow-lg rounded-lg hover:bg-red-600 hover:scale-110 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 w-6 h-6 top-1.5 right-1.5 sm:w-8 sm:h-8 sm:top-2 sm:right-2 ${
                          isMobileDevice
                            ? isTouchActive
                              ? 'opacity-100'
                              : 'opacity-0 pointer-events-none'
                            : 'opacity-0 group-hover:opacity-100'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation(); // 모바일에서 이미지 터치 이벤트와 충돌 방지
                          handleDeleteButtonClick(imageIndex, imageDisplayName);
                        }}
                        aria-label={`${imageDisplayName} 이미지 삭제`}
                        title={`${imageDisplayName} 이미지 삭제`}
                      >
                        <Icon
                          icon="lucide:trash-2"
                          className="w-3 h-3 text-white sm:w-4 sm:h-4"
                          aria-hidden="true"
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>

              {/* 가로 스크롤 가이드 (옵션) */}
              {currentMediaFilesList.length > 4 && (
                <div className="absolute top-0 right-0 z-10 flex items-center justify-center w-8 h-8 text-gray-400 pointer-events-none">
                  <Icon
                    icon="lucide:chevron-right"
                    className="w-4 h-4"
                    aria-hidden="true"
                  />
                </div>
              )}
            </div>

            {/* 🎯 이미지 요약 정보 + 삭제 확인 UI 영역 - 고정 높이로 애니메이션 공간 확보 */}
            <footer
              className="relative p-3 mt-4 overflow-hidden border border-blue-200 rounded-lg bg-blue-50"
              style={{
                minHeight: deleteConfirmState.isVisible ? '120px' : '60px',
              }}
            >
              {/* 기본 정보 표시 */}
              <div
                className={`transition-all duration-300 ${
                  deleteConfirmState.isVisible
                    ? 'transform -translate-y-2 opacity-70'
                    : 'transform translate-y-0 opacity-100'
                }`}
              >
                <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-medium text-blue-800">
                    총 {currentMediaFilesList.length}개의 이미지가
                    업로드되었습니다
                  </span>
                  <span className="text-blue-600">
                    총 크기:{' '}
                    {Math.round(
                      currentMediaFilesList.reduce(
                        (totalSize, imageUrl) => totalSize + imageUrl.length,
                        0
                      ) / 1024
                    )}{' '}
                    KB
                  </span>
                </div>
                {currentMediaFilesList.length > 1 &&
                  !deleteConfirmState.isVisible && (
                    <p className="mt-2 text-xs text-blue-600">
                      💡 가로로 스크롤하여 모든 이미지를 확인하세요
                      {isMobileDevice && ' (모바일: 터치하여 상세 정보 보기)'}
                    </p>
                  )}
              </div>

              {/* 🎯 삭제 확인 UI - 애니메이션과 함께 나타나고 사라짐 */}
              <div
                className={`absolute inset-0 p-3 bg-red-50 border-red-200 transition-all duration-500 ${
                  deleteConfirmState.isVisible
                    ? 'transform translate-y-0 opacity-100'
                    : 'transform translate-y-full opacity-0 pointer-events-none'
                }`}
                role="dialog"
                aria-labelledby="delete-confirm-text"
                aria-live="polite"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {/* 왼쪽: 삭제 확인 텍스트 */}
                  <div className="flex-1">
                    <p
                      id="delete-confirm-text"
                      className="text-sm font-medium text-red-800"
                    >
                      "{deleteConfirmState.imageName}" 이미지를
                      삭제하시겠습니까?
                    </p>
                    <p className="mt-1 text-xs text-red-600">
                      삭제된 이미지는 복구할 수 없습니다.
                    </p>
                  </div>

                  {/* 오른쪽: 버튼 그룹 */}
                  <div>
                    <ul className="flex gap-2" role="list">
                      <li role="listitem">
                        <button
                          type="button"
                          className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
                          onClick={handleDeleteCancel}
                          aria-label="이미지 삭제 취소"
                        >
                          취소
                        </button>
                      </li>
                      <li role="listitem">
                        <button
                          type="button"
                          className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 border border-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
                          onClick={handleDeleteConfirm}
                          aria-label="이미지 삭제 확인"
                        >
                          삭제
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </footer>
          </section>
        ) : null;
      })()}

      {isMobileDevice && (
        <div
          className="p-3 text-sm text-blue-700 rounded-lg bg-blue-50"
          role="note"
          aria-labelledby="mobile-tip-heading"
        >
          <p id="mobile-tip-heading" className="font-medium">
            모바일 팁:
          </p>
          <p>
            여러 파일을 한 번에 선택하려면 파일 선택 시 여러 개를 선택하세요.
            업로드된 이미지는 가로로 스크롤하여 확인할 수 있습니다. 이미지를
            터치하면 상세 정보와 삭제 버튼을 확인할 수 있습니다.
          </p>
        </div>
      )}
    </div>
  );
}

export default ImageUploadContainer;
