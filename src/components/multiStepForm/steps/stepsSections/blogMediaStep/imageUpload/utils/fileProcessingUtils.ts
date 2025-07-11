// 📁 imageUpload/utils/fileProcessingUtils.ts

import { createLogger } from './loggerUtils';

const logger = createLogger('FILE_PROCESSING');

// 🛡️ 메모리 누수 방지: FileReader 인스턴스 관리 개선
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

// 🔧 파일 읽기 진행률 계산 함수
const calculateProgressPercentage = (
  loadedBytes: number,
  totalBytes: number
): number => {
  const hasValidBytes = totalBytes > 0;

  return hasValidBytes ? Math.round((loadedBytes / totalBytes) * 100) : 0;
};

// 🔧 Base64 결과 검증 함수
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

// 🔧 FileReader 안전 정리 함수
const cleanupFileReader = (
  readerInstance: FileReader,
  context: FileProcessingContext
): void => {
  const { fileName, fileId } = context;

  try {
    // FileReader 이벤트 핸들러 제거
    readerInstance.onprogress = null;
    readerInstance.onload = null;
    readerInstance.onerror = null;
    readerInstance.onabort = null;

    // 진행 중인 읽기 작업 중단
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

// 🔧 안전한 콜백 실행 함수
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

  // 🛡️ 안전한 정리 함수
  const performCleanup = (): void => {
    const hasAlreadyCleanedUp = isCleanedUp;

    if (hasAlreadyCleanedUp) {
      return;
    }

    cleanupFileReader(readerInstance, processingContext);
    isCleanedUp = true;
  };

  // 🛡️ 안전한 진행률 처리 함수
  const handleProgressEvent = (
    progressEvent: ProgressEvent<FileReader>
  ): void => {
    const { lengthComputable, loaded, total } = progressEvent;
    const hasAlreadyCleanedUp = isCleanedUp;

    if (hasAlreadyCleanedUp) {
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

  // 🛡️ 안전한 성공 처리 함수
  const handleSuccessEvent = (loadEvent: ProgressEvent<FileReader>): void => {
    const { target } = loadEvent;
    const hasAlreadyCleanedUp = isCleanedUp;

    if (hasAlreadyCleanedUp) {
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

    performCleanup(); // 성공 시 자동 정리
  };

  // 🛡️ 안전한 에러 처리 함수
  const handleErrorEvent = (errorEvent: ProgressEvent<FileReader>): void => {
    const hasAlreadyCleanedUp = isCleanedUp;

    if (hasAlreadyCleanedUp) {
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

    performCleanup(); // 에러 시 자동 정리
  };

  // 🛡️ 안전한 중단 처리 함수
  const handleAbortEvent = (): void => {
    logger.warn('FileReader 중단됨', { fileName, fileId });
    performCleanup();
  };

  // 이벤트 핸들러 설정
  readerInstance.onprogress = handleProgressEvent;
  readerInstance.onload = handleSuccessEvent;
  readerInstance.onerror = handleErrorEvent;
  readerInstance.onabort = handleAbortEvent;

  return {
    reader: readerInstance,
    cleanup: performCleanup,
  };
};

// 🔧 기존 createFileReader 함수 수정 (메모리 관리 개선)
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

    // Error 객체로 변환하여 전달
    const fileReadError =
      readError instanceof Error
        ? readError
        : new Error(`readAsDataURL 시작 실패: ${fileName}`);

    onError(fileReadError);
  }

  // cleanup 함수 반환 (호출자가 필요시 정리 가능)
  return performCleanup;
};

/**
 * 🔄 File 배열을 실제 FileList 객체로 변환하는 핵심 함수
 */
const createFileListFromArray = (filesList: File[]): FileList => {
  try {
    // 🌟 Method 1: DataTransfer API를 이용한 실제 FileList 생성
    const dataTransferInstance = new DataTransfer();

    // 각 파일을 DataTransfer에 추가
    filesList.forEach((fileItem) => {
      const isValidFile = fileItem instanceof File;

      if (isValidFile) {
        dataTransferInstance.items.add(fileItem);
      }
    });

    // DataTransfer.files는 실제 FileList 객체
    const { files: resultFileList } = dataTransferInstance;

    return resultFileList;
  } catch (dataTransferError) {
    logger.warn('DataTransfer 사용 불가, 호환 객체 생성', {
      error: dataTransferError,
    });

    // 🛡️ Method 2: Fallback - FileList 프로토타입 기반 호환 객체 생성
    const fileListCompatibleObject = Object.create(FileList.prototype);

    // FileList의 필수 속성들을 정의
    Object.defineProperties(fileListCompatibleObject, {
      // length 속성: 파일 개수
      length: {
        value: filesList.length,
        writable: false,
        enumerable: true,
        configurable: false,
      },
      // item 메서드: FileList.item(index) 호출을 위한 표준 메서드
      item: {
        value: function (requestedIndex: number): File | null {
          const isValidIndex =
            requestedIndex >= 0 && requestedIndex < filesList.length;
          const targetFile = isValidIndex
            ? filesList[requestedIndex]
            : undefined;

          return targetFile ?? null; // null fallback으로 안전성 확보
        },
        writable: false,
        enumerable: false,
        configurable: false,
      },
    });

    // 배열처럼 인덱스로 직접 접근 가능하도록 각 파일을 속성으로 추가
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

/**
 * ✅ 객체가 유효한 FileList인지 검증하는 타입 가드 함수
 */
const isValidFileListObject = (
  unknownObject: unknown
): unknownObject is FileList => {
  // unknown 타입을 안전하게 처리하기 위한 null/undefined 체크
  const hasValue = unknownObject !== null && unknownObject !== undefined;

  if (!hasValue) {
    return false;
  }

  // 객체 타입인지 먼저 확인
  const isObjectType = typeof unknownObject === 'object';

  if (!isObjectType) {
    return false;
  }

  // Reflect.get으로 안전하게 속성 접근 (타입 단언 없이)
  const lengthProperty = Reflect.get(unknownObject, 'length');
  const itemProperty = Reflect.get(unknownObject, 'item');

  const hasValidLength = typeof lengthProperty === 'number';
  const hasValidItemMethod = typeof itemProperty === 'function';

  return hasValidLength && hasValidItemMethod;
};

/**
 * 🚀 File 배열을 FileList로 변환하는 메인 함수 (외부 노출용)
 */
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
