// blogMediaStep/imageUpload/hooks/useFileProcessing.ts

import { useRef, useCallback, useEffect } from 'react';
import { validateFile } from '../../utils/fileValidationUtils';
import { generateSecureFileId } from '../utils/fileIdUtils';
import { filterDuplicateFiles } from '../utils/duplicateFileUtils';
import {
  createFileReader,
  convertFilesToFileList,
} from '../utils/fileProcessingUtils';

interface FileProcessingCallbacks {
  updateMediaValue: (files: string[]) => void;
  updateSelectedFileNames: (names: string[]) => void;
  showToastMessage: (toast: any) => void;
  showDuplicateMessage: (files: File[]) => void;
  startFileUpload: (fileId: string, fileName: string) => void;
  updateFileProgress: (fileId: string, progress: number) => void;
  completeFileUpload: (fileId: string, fileName: string) => void;
  failFileUpload: (fileId: string, fileName: string) => void;
}

export const useFileProcessing = (
  currentMediaFilesList: string[],
  currentSelectedFileNames: string[],
  callbacks: FileProcessingCallbacks
) => {
  const currentStateRef = useRef({
    mediaFiles: currentMediaFilesList,
    fileNames: currentSelectedFileNames,
  });

  useEffect(() => {
    currentStateRef.current = {
      mediaFiles: currentMediaFilesList,
      fileNames: currentSelectedFileNames,
    };
  }, [currentMediaFilesList, currentSelectedFileNames]);

  console.log('🔧 [FILE_PROCESSING] useFileProcessing 초기화:', {
    currentMediaFilesCount: currentMediaFilesList.length,
    currentSelectedFileNamesCount: currentSelectedFileNames.length,
    timestamp: new Date().toLocaleTimeString(),
  });

  const processFiles = useCallback(
    (files: FileList) => {
      console.log('🚨 [FILES] processFiles 시작:', {
        fileCount: files.length,
        timestamp: new Date().toLocaleTimeString(),
      });

      const filesArray = Array.from(files);
      const { uniqueFiles, duplicateFiles } = filterDuplicateFiles(
        filesArray,
        currentSelectedFileNames
      );

      const hasDuplicateFiles = duplicateFiles.length > 0;
      if (hasDuplicateFiles) {
        console.log('🎨 [FILES] 중복 파일 발견! 애니메이션 표시:', {
          duplicateFileNames: duplicateFiles.map((f) => f.name),
          duplicateCount: duplicateFiles.length,
        });

        callbacks.showDuplicateMessage(duplicateFiles);
        callbacks.showToastMessage({
          title: '중복 파일 발견',
          description: `${duplicateFiles.length}개의 중복 파일이 제외되었습니다`,
          color: 'warning',
        });
      }

      const hasNoUniqueFiles = uniqueFiles.length === 0;
      if (hasNoUniqueFiles) {
        console.log('⚠️ [FILES] 업로드할 고유 파일이 없음');
        return;
      }

      console.log('✅ [FILES] 고유 파일들 업로드 시작:', {
        uniqueFilesCount: uniqueFiles.length,
        uniqueFileNames: uniqueFiles.map((f) => f.name),
      });

      uniqueFiles.forEach((file) => {
        processIndividualFile(file);
      });
    },
    [currentSelectedFileNames, callbacks]
  );

  const processIndividualFile = useCallback(
    (file: File) => {
      const fileId = generateSecureFileId(file.name);
      const { name: fileName } = file;

      console.log('📁 [FILE_PROCESS] 개별 파일 처리 시작:', {
        fileName,
        fileId,
        fileSize: file.size,
        timestamp: new Date().toLocaleTimeString(),
      });

      const validationResult = validateFile(file);
      const { isValid: fileIsValid, errorMessage: validationError } =
        validationResult;

      const isInvalidFile = !fileIsValid;
      if (isInvalidFile) {
        console.log('❌ [VALIDATION] 파일 검증 실패:', {
          fileName,
          error: validationError || 'unknown',
        });

        callbacks.failFileUpload(fileId, fileName);
        callbacks.showToastMessage({
          title: '업로드 실패',
          description:
            validationError || `${fileName} 파일 검증에 실패했습니다.`,
          color: 'danger',
        });
        return;
      }

      callbacks.startFileUpload(fileId, fileName);

      const handleProgress = (progress: number) => {
        callbacks.updateFileProgress(fileId, progress);
      };

      const handleSuccess = (result: string) => {
        setTimeout(() => {
          console.log('⏰ [TIMEOUT] setTimeout 콜백 실행:', {
            fileName,
            fileId,
            timestamp: new Date().toLocaleTimeString(),
          });

          try {
            const latestMediaFiles = currentStateRef.current.mediaFiles;
            const latestFileNames = currentStateRef.current.fileNames;

            callbacks.updateMediaValue([...latestMediaFiles, result]);
            callbacks.updateSelectedFileNames([...latestFileNames, fileName]);
            callbacks.completeFileUpload(fileId, fileName);

            callbacks.showToastMessage({
              title: '업로드 완료',
              description: `${fileName} 파일이 성공적으로 업로드되었습니다.`,
              color: 'success',
            });

            console.log('✅ [SUCCESS] 파일 업로드 완료:', {
              fileName,
              fileId,
            });
          } catch (uploadError) {
            console.error('❌ [ERROR] 업로드 처리 중 오류:', {
              fileName,
              fileId,
              error: uploadError,
            });

            callbacks.failFileUpload(fileId, fileName);
            callbacks.showToastMessage({
              title: '파일 추가 실패',
              description: '파일을 추가하는 중 오류가 발생했습니다.',
              color: 'danger',
            });
          }
        }, 1500);
      };

      const handleError = (error: ProgressEvent<FileReader>) => {
        console.error('❌ [READER_ERROR] FileReader 에러:', {
          fileName,
          fileId,
          error,
        });

        callbacks.failFileUpload(fileId, fileName);
        callbacks.showToastMessage({
          title: '업로드 실패',
          description: '파일 읽기 중 오류가 발생했습니다.',
          color: 'danger',
        });
      };

      createFileReader(
        file,
        fileId,
        handleProgress,
        handleSuccess,
        handleError
      );
    },
    [callbacks]
  );

  const handleFilesDropped = useCallback(
    (droppedFilesList: File[]) => {
      console.log('🚨 [DROP] handleFilesDropped:', {
        fileCount: droppedFilesList.length,
        fileNames: droppedFilesList.map((f) => f.name),
        timestamp: new Date().toLocaleTimeString(),
      });

      const hasNoFiles = droppedFilesList.length === 0;
      if (hasNoFiles) {
        console.log('⚠️ [DROP] 드롭된 파일이 없음');
        return;
      }

      const fileListObject = convertFilesToFileList(droppedFilesList);
      processFiles(fileListObject);
    },
    [processFiles]
  );

  const handleFileChange = useCallback(
    (changedFileList: FileList) => {
      console.log('🚨 [CHANGE] handleFileChange:', {
        fileCount: changedFileList.length,
        timestamp: new Date().toLocaleTimeString(),
      });

      const hasFiles = changedFileList.length > 0;
      if (hasFiles) {
        processFiles(changedFileList);
      }
    },
    [processFiles]
  );

  return {
    processFiles,
    handleFilesDropped,
    handleFileChange,
  };
};
