// 📁 imageUpload/utils/fileProcessingUtils.ts

import { createLogger } from './loggerUtils';

const logger = createLogger('FILE_PROCESSING');

interface FileReaderManager {
  reader: FileReader;
  cleanup: () => void;
}

interface FileReaderEventHandlers {
  onProgress: (progress: number) => void;
  onSuccess: (result: string) => void;
  onError: (error: Error) => void;
}

interface FileProcessingContext {
  file: File;
  fileId: string;
  fileName: string;
  fileSize: number;
}

const calculateProgressPercentage = (
  loadedBytes: number,
  totalBytes: number
): number => {
  const hasValidBytes = totalBytes > 0;

  return hasValidBytes ? Math.round((loadedBytes / totalBytes) * 100) : 0;
};

const validateBase64Result = (result: unknown): result is string => {
  const isStringType = typeof result === 'string';

  if (!isStringType) {
    return false;
  }

  const stringResult = result;
  const hasContent = stringResult.length > 0;
  const isBase64Format = stringResult.startsWith('data:');

  return hasContent && isBase64Format;
};

const cleanupFileReader = (
  readerInstance: FileReader,
  context: FileProcessingContext
): void => {
  const { fileName, fileId } = context;

  try {
    readerInstance.onprogress = null;
    readerInstance.onload = null;
    readerInstance.onerror = null;
    readerInstance.onabort = null;

    const { readyState } = readerInstance;
    const isCurrentlyLoading = readyState === FileReader.LOADING;

    if (isCurrentlyLoading) {
      readerInstance.abort();
      logger.debug('진행 중인 FileReader 작업 중단', { fileName, fileId });
    }

    logger.debug('FileReader 정리 완료', { fileName, fileId });
  } catch (cleanupError) {
    logger.error('FileReader 정리 중 오류', {
      fileName,
      fileId,
      error: cleanupError,
    });
  }
};

const executeSafeCallback = <T extends unknown[]>(
  callback: (...args: T) => void,
  args: T,
  context: FileProcessingContext,
  callbackName: string
): void => {
  const { fileName, fileId } = context;

  try {
    callback(...args);

    logger.debug(`${callbackName} 콜백 실행 완료`, { fileName, fileId });
  } catch (callbackError) {
    logger.error(`${callbackName} 콜백 실행 중 오류`, {
      fileName,
      fileId,
      error: callbackError,
    });
  }
};

const createManagedFileReader = (
  file: File,
  fileId: string,
  handlers: FileReaderEventHandlers
): FileReaderManager => {
  const { name: fileName, size: fileSize } = file;
  const { onProgress, onSuccess, onError } = handlers;

  const processingContext: FileProcessingContext = {
    file,
    fileId,
    fileName,
    fileSize,
  };

  logger.debug('createManagedFileReader 시작', {
    fileName,
    fileId,
    fileSize,
  });

  const readerInstance = new FileReader();
  let isCleanedUp = false;

  // 🚨 Race Condition 수정: 정리 상태 먼저 설정 후 작업 수행
  const performCleanup = (): void => {
    // 이미 정리됐는지 먼저 확인
    if (isCleanedUp) {
      logger.debug('이미 정리된 FileReader 무시', { fileName, fileId });
      return;
    }

    // 🔧 상태를 먼저 설정하여 다른 호출 차단
    isCleanedUp = true;

    try {
      cleanupFileReader(readerInstance, processingContext);
      logger.debug('FileReader 정리 성공', { fileName, fileId });
    } catch (cleanupError) {
      logger.error('FileReader 정리 실패', {
        fileName,
        fileId,
        error: cleanupError,
      });

      // 정리 실패 시 상태 되돌리기 (재시도 가능하도록)
      isCleanedUp = false;
      throw cleanupError;
    }
  };

  const handleProgressEvent = (
    progressEvent: ProgressEvent<FileReader>
  ): void => {
    const { lengthComputable, loaded, total } = progressEvent;

    // 정리된 상태면 무시
    if (isCleanedUp) {
      logger.debug('정리된 FileReader 진행률 무시', { fileName, fileId });
      return;
    }

    const canCalculateProgress = lengthComputable && total > 0;

    if (!canCalculateProgress) {
      logger.warn('진행률 계산 불가능', { fileName, fileId });
      return;
    }

    const progressPercentage = calculateProgressPercentage(loaded, total);

    executeSafeCallback(
      onProgress,
      [progressPercentage],
      processingContext,
      'onProgress'
    );
  };

  const handleSuccessEvent = (loadEvent: ProgressEvent<FileReader>): void => {
    const { target } = loadEvent;

    // 정리된 상태면 무시
    if (isCleanedUp) {
      logger.debug('정리된 FileReader 성공 이벤트 무시', { fileName, fileId });
      return;
    }

    const hasValidTarget = target !== null && target !== undefined;

    if (!hasValidTarget) {
      logger.error('FileReader target이 유효하지 않음', { fileName, fileId });
      const targetError = new Error(
        `FileReader target이 유효하지 않음: ${fileName}`
      );
      executeSafeCallback(onError, [targetError], processingContext, 'onError');
      performCleanup();
      return;
    }

    const { result: readerResult } = target;
    const isValidResult = validateBase64Result(readerResult);

    if (!isValidResult) {
      logger.error('FileReader 결과가 유효하지 않음', {
        fileName,
        fileId,
        resultType: typeof readerResult,
        hasResult: readerResult !== null && readerResult !== undefined,
      });
      const resultError = new Error(
        `FileReader 결과가 유효하지 않음: ${fileName}`
      );
      executeSafeCallback(onError, [resultError], processingContext, 'onError');
      performCleanup();
      return;
    }

    logger.info('FileReader 성공', {
      fileName,
      fileId,
      resultLength: readerResult.length,
    });

    executeSafeCallback(
      onSuccess,
      [readerResult],
      processingContext,
      'onSuccess'
    );

    performCleanup();
  };

  const handleErrorEvent = (errorEvent: ProgressEvent<FileReader>): void => {
    // 정리된 상태면 무시
    if (isCleanedUp) {
      logger.debug('정리된 FileReader 에러 이벤트 무시', { fileName, fileId });
      return;
    }

    logger.error('FileReader 에러', { fileName, fileId, error: errorEvent });

    const fileReaderError = new Error(`FileReader 에러 발생: ${fileName}`);

    executeSafeCallback(
      onError,
      [fileReaderError],
      processingContext,
      'onError'
    );

    performCleanup();
  };

  const handleAbortEvent = (): void => {
    // 정리된 상태면 무시
    if (isCleanedUp) {
      logger.debug('정리된 FileReader 중단 이벤트 무시', { fileName, fileId });
      return;
    }

    logger.warn('FileReader 중단됨', { fileName, fileId });
    performCleanup();
  };

  readerInstance.onprogress = handleProgressEvent;
  readerInstance.onload = handleSuccessEvent;
  readerInstance.onerror = handleErrorEvent;
  readerInstance.onabort = handleAbortEvent;

  return {
    reader: readerInstance,
    cleanup: performCleanup,
  };
};

export const createFileReader = (
  file: File,
  fileId: string,
  onProgress: (progress: number) => void,
  onSuccess: (result: string) => void,
  onError: (error: Error) => void
): (() => void) => {
  const fileHandlers: FileReaderEventHandlers = {
    onProgress,
    onSuccess,
    onError,
  };

  const { reader: managedReader, cleanup: performCleanup } =
    createManagedFileReader(file, fileId, fileHandlers);

  const { name: fileName } = file;

  logger.debug('readAsDataURL 시작', { fileName, fileId });

  try {
    managedReader.readAsDataURL(file);
  } catch (readError) {
    logger.error('readAsDataURL 시작 실패', {
      fileName,
      fileId,
      error: readError,
    });

    performCleanup();

    const fileReadError =
      readError instanceof Error
        ? readError
        : new Error(`readAsDataURL 시작 실패: ${fileName}`);

    onError(fileReadError);
  }

  return performCleanup;
};

const createFileListFromArray = (filesList: File[]): FileList => {
  try {
    const dataTransferInstance = new DataTransfer();

    filesList.forEach((fileItem) => {
      const isValidFile = fileItem instanceof File;

      if (isValidFile) {
        dataTransferInstance.items.add(fileItem);
      }
    });

    const { files: resultFileList } = dataTransferInstance;

    return resultFileList;
  } catch (dataTransferError) {
    logger.warn('DataTransfer 사용 불가, 호환 객체 생성', {
      error: dataTransferError,
    });

    const fileListCompatibleObject = Object.create(FileList.prototype);

    Object.defineProperties(fileListCompatibleObject, {
      length: {
        value: filesList.length,
        writable: false,
        enumerable: true,
        configurable: false,
      },
      item: {
        value: function (requestedIndex: number): File | null {
          const isValidIndex =
            requestedIndex >= 0 && requestedIndex < filesList.length;
          const targetFile = isValidIndex
            ? filesList[requestedIndex]
            : undefined;

          return targetFile ?? null;
        },
        writable: false,
        enumerable: false,
        configurable: false,
      },
    });

    filesList.forEach((fileItem, fileIndex) => {
      Object.defineProperty(fileListCompatibleObject, fileIndex, {
        value: fileItem,
        writable: false,
        enumerable: true,
        configurable: false,
      });
    });

    return fileListCompatibleObject;
  }
};

const isValidFileListObject = (
  unknownObject: unknown
): unknownObject is FileList => {
  const hasValue = unknownObject !== null && unknownObject !== undefined;

  if (!hasValue) {
    return false;
  }

  const isObjectType = typeof unknownObject === 'object';

  if (!isObjectType) {
    return false;
  }

  const lengthProperty = Reflect.get(unknownObject, 'length');
  const itemProperty = Reflect.get(unknownObject, 'item');

  const hasValidLength = typeof lengthProperty === 'number';
  const hasValidItemMethod = typeof itemProperty === 'function';

  return hasValidLength && hasValidItemMethod;
};

export const convertFilesToFileList = (inputFiles: File[]): FileList => {
  logger.debug('File 배열을 FileList로 변환 시작', {
    filesCount: inputFiles.length,
    fileNames: inputFiles.map(({ name }) => name),
  });

  try {
    const convertedFileList = createFileListFromArray(inputFiles);

    const isValidFileList = isValidFileListObject(convertedFileList);

    if (!isValidFileList) {
      throw new Error('생성된 FileList가 유효하지 않습니다');
    }

    logger.info('FileList 변환 성공', {
      originalCount: inputFiles.length,
      convertedCount: convertedFileList.length,
    });

    return convertedFileList;
  } catch (conversionError) {
    logger.error('FileList 변환 실패', {
      error: conversionError,
      filesCount: inputFiles.length,
    });

    throw new Error(`FileList 변환에 실패했습니다: ${conversionError}`);
  }
};
