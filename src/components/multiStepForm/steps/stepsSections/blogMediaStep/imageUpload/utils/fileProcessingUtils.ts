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
  const percentageValue = hasValidBytes
    ? Math.round((loadedBytes / totalBytes) * 100)
    : 0;

  console.log('📊 [PROGRESS] 진행률 계산:', {
    loadedBytes,
    totalBytes,
    hasValidBytes,
    percentageValue,
  });

  return percentageValue;
};

const validateBase64Result = (result: unknown): result is string => {
  const isStringType = typeof result === 'string';

  if (!isStringType) {
    console.log('🔍 [VALIDATE_BASE64] 결과가 문자열이 아님:', {
      resultType: typeof result,
    });
    return false;
  }

  const stringResult = result;
  const hasContent = stringResult.length > 0;
  const isBase64Format = stringResult.startsWith('data:');

  const isValidBase64 = hasContent && isBase64Format;

  console.log('🔍 [VALIDATE_BASE64] Base64 결과 검증:', {
    hasContent,
    isBase64Format,
    isValidBase64,
    resultLength: stringResult.length,
  });

  return isValidBase64;
};

const cleanupFileReader = (
  readerInstance: FileReader,
  context: FileProcessingContext
): void => {
  const { fileName, fileId } = context;

  try {
    console.log('🧹 [CLEANUP] FileReader 정리 시작:', { fileName, fileId });

    readerInstance.onprogress = null;
    readerInstance.onload = null;
    readerInstance.onerror = null;
    readerInstance.onabort = null;

    const { readyState } = readerInstance;
    const isCurrentlyLoading = readyState === FileReader.LOADING;

    if (isCurrentlyLoading) {
      readerInstance.abort();
      console.log('⏹️ [CLEANUP] 진행 중인 FileReader 작업 중단:', {
        fileName,
        fileId,
      });
      logger.debug('진행 중인 FileReader 작업 중단', { fileName, fileId });
    }

    console.log('✅ [CLEANUP] FileReader 정리 완료:', { fileName, fileId });
    logger.debug('FileReader 정리 완료', { fileName, fileId });
  } catch (cleanupError) {
    console.error('❌ [CLEANUP] FileReader 정리 중 오류:', {
      fileName,
      fileId,
      error: cleanupError,
    });
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
    console.log(`🔄 [CALLBACK] ${callbackName} 콜백 실행 시작:`, {
      fileName,
      fileId,
    });

    callback(...args);

    console.log(`✅ [CALLBACK] ${callbackName} 콜백 실행 완료:`, {
      fileName,
      fileId,
    });
    logger.debug(`${callbackName} 콜백 실행 완료`, { fileName, fileId });
  } catch (callbackError) {
    console.error(`❌ [CALLBACK] ${callbackName} 콜백 실행 중 오류:`, {
      fileName,
      fileId,
      error: callbackError,
    });
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

  console.log('🔧 [MANAGED_READER] createManagedFileReader 시작:', {
    fileName,
    fileId,
    fileSize,
  });

  logger.debug('createManagedFileReader 시작', {
    fileName,
    fileId,
    fileSize,
  });

  const readerInstance = new FileReader();

  // 🚨 FIXED: Race Condition 수정 - 락 변수 추가
  let cleanupLock = false;

  // 🚨 FIXED: 원자적 체크-설정으로 변경하여 Race Condition 방지
  const performCleanup = (): void => {
    console.log('🔄 [CLEANUP_LOCK] 정리 시도:', {
      fileName,
      fileId,
      cleanupLock,
    });

    // ✅ 이미 정리됐는지 먼저 확인 (원자적 체크)
    if (cleanupLock) {
      console.log('⚠️ [CLEANUP_LOCK] 이미 정리된 FileReader 무시:', {
        fileName,
        fileId,
      });
      logger.debug('이미 정리된 FileReader 무시', { fileName, fileId });
      return;
    }

    // 🔧 락을 먼저 설정하여 다른 호출 차단 (원자적 설정)
    cleanupLock = true;
    console.log('🔒 [CLEANUP_LOCK] 락 설정 완료:', { fileName, fileId });

    try {
      cleanupFileReader(readerInstance, processingContext);
      console.log('✅ [CLEANUP_LOCK] FileReader 정리 성공:', {
        fileName,
        fileId,
      });
      logger.debug('FileReader 정리 성공', { fileName, fileId });
    } catch (cleanupError) {
      console.error('❌ [CLEANUP_LOCK] FileReader 정리 실패:', {
        fileName,
        fileId,
        error: cleanupError,
      });
      logger.error('FileReader 정리 실패', {
        fileName,
        fileId,
        error: cleanupError,
      });

      // 🚨 FIXED: 정리 실패 시에만 락 해제 (재시도 가능하도록)
      cleanupLock = false;
      console.log('🔓 [CLEANUP_LOCK] 정리 실패로 락 해제:', {
        fileName,
        fileId,
      });
      throw cleanupError;
    }
  };

  const handleProgressEvent = (
    progressEvent: ProgressEvent<FileReader>
  ): void => {
    const { lengthComputable, loaded, total } = progressEvent;

    console.log('📊 [PROGRESS_EVENT] 진행률 이벤트 수신:', {
      fileName,
      fileId,
      lengthComputable,
      loaded,
      total,
      cleanupLock,
    });

    // 🚨 FIXED: 정리된 상태면 무시 (Race Condition 방지)
    if (cleanupLock) {
      console.log('⚠️ [PROGRESS_EVENT] 정리된 FileReader 진행률 무시:', {
        fileName,
        fileId,
      });
      logger.debug('정리된 FileReader 진행률 무시', { fileName, fileId });
      return;
    }

    const canCalculateProgress = lengthComputable && total > 0;

    if (!canCalculateProgress) {
      console.warn('⚠️ [PROGRESS_EVENT] 진행률 계산 불가능:', {
        fileName,
        fileId,
        lengthComputable,
        total,
      });
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

    console.log('✅ [SUCCESS_EVENT] 성공 이벤트 수신:', {
      fileName,
      fileId,
      cleanupLock,
    });

    // 🚨 FIXED: 정리된 상태면 무시 (Race Condition 방지)
    if (cleanupLock) {
      console.log('⚠️ [SUCCESS_EVENT] 정리된 FileReader 성공 이벤트 무시:', {
        fileName,
        fileId,
      });
      logger.debug('정리된 FileReader 성공 이벤트 무시', { fileName, fileId });
      return;
    }

    const hasValidTarget = target !== null && target !== undefined;

    if (!hasValidTarget) {
      console.error('❌ [SUCCESS_EVENT] FileReader target이 유효하지 않음:', {
        fileName,
        fileId,
      });
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
      console.error('❌ [SUCCESS_EVENT] FileReader 결과가 유효하지 않음:', {
        fileName,
        fileId,
        resultType: typeof readerResult,
        hasResult: readerResult !== null && readerResult !== undefined,
      });
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

    console.log('✅ [SUCCESS_EVENT] FileReader 성공:', {
      fileName,
      fileId,
      resultLength: readerResult.length,
    });

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
    console.error('❌ [ERROR_EVENT] 에러 이벤트 수신:', {
      fileName,
      fileId,
      cleanupLock,
      errorEvent,
    });

    // 🚨 FIXED: 정리된 상태면 무시 (Race Condition 방지)
    if (cleanupLock) {
      console.log('⚠️ [ERROR_EVENT] 정리된 FileReader 에러 이벤트 무시:', {
        fileName,
        fileId,
      });
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
    console.warn('⚠️ [ABORT_EVENT] 중단 이벤트 수신:', {
      fileName,
      fileId,
      cleanupLock,
    });

    // 🚨 FIXED: 정리된 상태면 무시 (Race Condition 방지)
    if (cleanupLock) {
      console.log('⚠️ [ABORT_EVENT] 정리된 FileReader 중단 이벤트 무시:', {
        fileName,
        fileId,
      });
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

  console.log('🔧 [MANAGED_READER] 이벤트 핸들러 등록 완료:', {
    fileName,
    fileId,
  });

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

  console.log('🔧 [CREATE_READER] createFileReader 시작:', {
    fileName: file.name,
    fileId,
    fileSize: file.size,
  });

  const { reader: managedReader, cleanup: performCleanup } =
    createManagedFileReader(file, fileId, fileHandlers);

  const { name: fileName } = file;

  console.log('📖 [READ_START] readAsDataURL 시작:', { fileName, fileId });
  logger.debug('readAsDataURL 시작', { fileName, fileId });

  try {
    managedReader.readAsDataURL(file);
    console.log('✅ [READ_START] readAsDataURL 시작 성공:', {
      fileName,
      fileId,
    });
  } catch (readError) {
    console.error('❌ [READ_START] readAsDataURL 시작 실패:', {
      fileName,
      fileId,
      error: readError,
    });
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
    console.log('📁 [CREATE_FILELIST] 배열에서 FileList 생성 시작:', {
      filesCount: filesList.length,
    });

    const dataTransferInstance = new DataTransfer();

    filesList.forEach((fileItem, index) => {
      const isValidFile = fileItem instanceof File;

      if (isValidFile) {
        dataTransferInstance.items.add(fileItem);
        console.log(`✅ [CREATE_FILELIST] 파일 ${index + 1} 추가:`, {
          fileName: fileItem.name,
          fileSize: fileItem.size,
        });
      } else {
        console.warn(`⚠️ [CREATE_FILELIST] 유효하지 않은 파일 건너뜀:`, {
          index,
          fileItem,
        });
      }
    });

    const { files: resultFileList } = dataTransferInstance;

    console.log('✅ [CREATE_FILELIST] DataTransfer로 FileList 생성 완료:', {
      원본개수: filesList.length,
      결과개수: resultFileList.length,
    });

    return resultFileList;
  } catch (dataTransferError) {
    console.warn(
      '⚠️ [CREATE_FILELIST] DataTransfer 사용 불가, 호환 객체 생성:',
      {
        error: dataTransferError,
      }
    );
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

    console.log('✅ [CREATE_FILELIST] 호환 객체 생성 완료:', {
      filesCount: filesList.length,
    });

    return fileListCompatibleObject;
  }
};

const isValidFileListObject = (
  unknownObject: unknown
): unknownObject is FileList => {
  const hasValue = unknownObject !== null && unknownObject !== undefined;

  if (!hasValue) {
    console.log('🔍 [VALIDATE_FILELIST] 객체가 null 또는 undefined');
    return false;
  }

  const isObjectType = typeof unknownObject === 'object';

  if (!isObjectType) {
    console.log('🔍 [VALIDATE_FILELIST] 객체 타입이 아님:', {
      type: typeof unknownObject,
    });
    return false;
  }

  const lengthProperty = Reflect.get(unknownObject, 'length');
  const itemProperty = Reflect.get(unknownObject, 'item');

  const hasValidLength = typeof lengthProperty === 'number';
  const hasValidItemMethod = typeof itemProperty === 'function';

  const isValidFileList = hasValidLength && hasValidItemMethod;

  console.log('🔍 [VALIDATE_FILELIST] FileList 검증 결과:', {
    hasValidLength,
    hasValidItemMethod,
    isValidFileList,
  });

  return isValidFileList;
};

export const convertFilesToFileList = (inputFiles: File[]): FileList => {
  console.log('🔄 [CONVERT_FILELIST] File 배열을 FileList로 변환 시작:', {
    filesCount: inputFiles.length,
    fileNames: inputFiles.map(({ name }) => name),
  });

  logger.debug('File 배열을 FileList로 변환 시작', {
    filesCount: inputFiles.length,
    fileNames: inputFiles.map(({ name }) => name),
  });

  try {
    const convertedFileList = createFileListFromArray(inputFiles);

    const isValidFileList = isValidFileListObject(convertedFileList);

    if (!isValidFileList) {
      console.error('❌ [CONVERT_FILELIST] 생성된 FileList가 유효하지 않음');
      throw new Error('생성된 FileList가 유효하지 않습니다');
    }

    console.log('✅ [CONVERT_FILELIST] FileList 변환 성공:', {
      originalCount: inputFiles.length,
      convertedCount: convertedFileList.length,
    });

    logger.info('FileList 변환 성공', {
      originalCount: inputFiles.length,
      convertedCount: convertedFileList.length,
    });

    return convertedFileList;
  } catch (conversionError) {
    console.error('❌ [CONVERT_FILELIST] FileList 변환 실패:', {
      error: conversionError,
      filesCount: inputFiles.length,
    });
    logger.error('FileList 변환 실패', {
      error: conversionError,
      filesCount: inputFiles.length,
    });

    throw new Error(`FileList 변환에 실패했습니다: ${conversionError}`);
  }
};
