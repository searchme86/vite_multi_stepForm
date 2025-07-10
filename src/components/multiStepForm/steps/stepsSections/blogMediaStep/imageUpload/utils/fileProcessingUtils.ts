// blogMediaStep/imageUpload/utils/fileProcessingUtils.ts

/**
 * 🎯 파일 처리 유틸리티 함수들
 *
 * 📋 용도: 이미지 업로드 과정에서 파일 처리와 관련된 핵심 기능들을 제공
 * 🔧 역할:
 *   1. File 배열을 브라우저 네이티브 FileList로 변환
 *   2. FileReader를 사용한 안전한 파일 읽기 처리
 *   3. 타입 안전성을 보장하는 파일 처리 로직
 *
 * 🎯 목적:
 *   - 드래그 앤 드롭으로 받은 File[] 배열을 FileList로 변환하여 호환성 확보
 *   - FileReader의 비동기 파일 읽기를 안전하게 처리하고 진행률 추적
 *   - 타입 단언(as) 없이 런타임 타입 검증을 통한 안전한 파일 처리
 */

/**
 * 🔄 File 배열을 실제 FileList 객체로 변환하는 핵심 함수
 *
 * 🌟 동작 원리:
 *   1. DataTransfer API를 사용해 브라우저 네이티브 FileList 생성 (우선순위)
 *   2. DataTransfer 미지원 환경에서는 FileList 프로토타입 기반 호환 객체 생성 (fallback)
 */
const createFileListFromArray = (files: File[]) => {
  try {
    // 🌟 Method 1: DataTransfer API를 이용한 실제 FileList 생성
    // 브라우저가 제공하는 네이티브 방식으로 가장 안전하고 호환성이 높음
    const dataTransfer = new DataTransfer();

    // 각 파일을 DataTransfer에 추가
    files.forEach((file) => {
      if (file instanceof File) {
        dataTransfer.items.add(file);
      }
    });

    // DataTransfer.files는 실제 FileList 객체
    return dataTransfer.files;
  } catch (dataTransferError) {
    console.warn('⚠️ [FALLBACK] DataTransfer 사용 불가, 호환 객체 생성:', {
      error: dataTransferError,
      timestamp: new Date().toLocaleTimeString(),
    });

    // 🛡️ Method 2: Fallback - FileList 프로토타입 기반 호환 객체 생성
    // 레거시 브라우저나 특수 환경에서 DataTransfer가 지원되지 않을 때 사용
    const fileListObject = Object.create(FileList.prototype);

    // FileList의 필수 속성들을 정의
    Object.defineProperties(fileListObject, {
      // length 속성: 파일 개수
      length: {
        value: files.length,
        writable: false,
        enumerable: true,
        configurable: false,
      },
      // item 메서드: FileList.item(index) 호출을 위한 표준 메서드
      item: {
        value: function (index: number) {
          const targetFile = files[index];
          return targetFile ?? null; // null fallback으로 안전성 확보
        },
        writable: false,
        enumerable: false,
        configurable: false,
      },
    });

    // 배열처럼 인덱스로 직접 접근 가능하도록 각 파일을 속성으로 추가
    // 예: fileList[0], fileList[1] 형태로 접근 가능
    files.forEach((file, index) => {
      Object.defineProperty(fileListObject, index, {
        value: file,
        writable: false,
        enumerable: true,
        configurable: false,
      });
    });

    return fileListObject;
  }
};

/**
 * ✅ 객체가 유효한 FileList인지 검증하는 타입 가드 함수
 *
 * 검증 항목:
 *   - length 속성이 number 타입인지
 *   - item 메서드가 function 타입인지
 */
const isValidFileList = (obj: unknown): obj is FileList => {
  // unknown 타입을 안전하게 처리하기 위한 null/undefined 체크
  if (obj === null || obj === undefined) {
    return false;
  }

  // 객체 타입인지 먼저 확인
  if (typeof obj !== 'object') {
    return false;
  }

  // Reflect.get으로 안전하게 속성 접근 (타입 단언 없이)
  const lengthProperty = Reflect.get(obj, 'length');
  const itemProperty = Reflect.get(obj, 'item');

  const hasLength = typeof lengthProperty === 'number';
  const hasItemMethod = typeof itemProperty === 'function';

  return hasLength && hasItemMethod;
};

/**
 * 🚀 File 배열을 FileList로 변환하는 메인 함수 (외부 노출용)
 *
 * 📋 전체 과정:
 *   1. 변환 시작 로그 출력
 *   2. createFileListFromArray 호출하여 실제 변환 수행
 *   3. 생성된 FileList 유효성 검증
 *   4. 성공/실패 로그 출력 및 결과 반환
 *
 * @param files - 변환할 File 배열
 * @returns 변환된 FileList 객체
 * @throws FileList 변환 실패 시 Error
 */
export const convertFilesToFileList = (files: File[]): FileList => {
  // 변환 시작 로그: 디버깅과 추적을 위한 상세 정보 출력
  console.log('🔄 [CONVERT] File 배열을 FileList로 변환 시작:', {
    filesCount: files.length,
    fileNames: files.map((f) => f.name),
    timestamp: new Date().toLocaleTimeString(),
  });

  try {
    // 핵심 변환 로직 실행
    const realFileList = createFileListFromArray(files);

    // 생성된 객체가 실제로 FileList로 사용 가능한지 검증
    if (!isValidFileList(realFileList)) {
      throw new Error('생성된 FileList가 유효하지 않습니다');
    }

    // 성공 로그: 변환 결과 확인
    console.log('✅ [CONVERT] FileList 변환 성공:', {
      originalCount: files.length,
      convertedCount: realFileList.length,
      timestamp: new Date().toLocaleTimeString(),
    });

    return realFileList;
  } catch (convertError) {
    // 실패 로그: 에러 정보와 함께 디버깅 정보 출력
    console.error('❌ [CONVERT_ERROR] FileList 변환 실패:', {
      error: convertError,
      filesCount: files.length,
      timestamp: new Date().toLocaleTimeString(),
    });

    throw new Error(`FileList 변환에 실패했습니다: ${convertError}`);
  }
};

/**
 * 📁 FileReader를 사용하여 파일을 안전하게 읽는 함수
 *
 * 🔧 기능:
 *   - 파일 읽기 진행률 추적 및 콜백 호출
 *   - 파일 읽기 완료 시 결과 검증 후 성공 콜백 호출
 *   - 에러 발생 시 상세 로그와 함께 에러 콜백 호출
 *   - 모든 과정에서 타입 안전성 보장 (as 키워드 미사용)
 *
 * @param file - 읽을 File 객체
 * @param fileId - 파일 식별용 고유 ID
 * @param onProgress - 진행률 업데이트 콜백 (0-100 숫자)
 * @param onSuccess - 성공 시 콜백 (Base64 문자열)
 * @param onError - 에러 시 콜백 (ProgressEvent)
 */
export const createFileReader = (
  file: File,
  fileId: string,
  onProgress: (progress: number) => void,
  onSuccess: (result: string) => void,
  onError: (error: ProgressEvent<FileReader>) => void
): void => {
  console.log('🔧 [FILE_READER] createFileReader 함수 시작:', {
    fileName: file.name,
    fileId,
    fileSize: file.size,
    timestamp: new Date().toLocaleTimeString(),
  });

  // FileReader 인스턴스 생성
  const reader = new FileReader();

  // 📊 진행률 추적 이벤트 핸들러
  reader.onprogress = (event) => {
    const { lengthComputable, loaded, total } = event;

    // 진행률 계산이 불가능한 경우 early return
    if (!lengthComputable) {
      console.log('⚠️ [PROGRESS] 진행률 계산 불가능:', {
        fileName: file.name,
        fileId,
      });
      return;
    }

    // 진행률 계산 (0-100 범위의 정수)
    const progress = Math.round((loaded / total) * 100);
    onProgress(progress);

    // 진행률 업데이트 로그
    console.log('📊 [PROGRESS] 진행률 업데이트:', {
      fileName: file.name,
      fileId,
      progress,
      timestamp: new Date().toLocaleTimeString(),
    });
  };

  // ✅ 파일 읽기 완료 이벤트 핸들러 - 🚨 디버깅 로그 대폭 추가
  reader.onload = (event) => {
    console.log('🔧 [DEBUG] FileReader onload 이벤트 발생:', {
      fileName: file.name,
      fileId,
      hasEvent: !!event,
      eventType: typeof event,
      timestamp: new Date().toLocaleTimeString(),
    });

    const { target } = event;

    console.log('🔧 [DEBUG] FileReader target 확인:', {
      fileName: file.name,
      fileId,
      hasTarget: !!target,
      targetType: typeof target,
      targetIsFileReader: target instanceof FileReader,
      timestamp: new Date().toLocaleTimeString(),
    });

    // target이 null인 경우 에러 처리
    if (!target) {
      console.error('❌ [TARGET_ERROR] FileReader target이 null입니다:', {
        fileName: file.name,
        fileId,
        event,
        timestamp: new Date().toLocaleTimeString(),
      });
      onError(event);
      return;
    }

    // 🚨 추가 디버깅: target 객체의 속성들 확인
    console.log('🔧 [DEBUG] FileReader target 속성 확인:', {
      fileName: file.name,
      fileId,
      targetKeys: Object.keys(target),
      hasResult: 'result' in target,
      readyState: target.readyState,
      timestamp: new Date().toLocaleTimeString(),
    });

    // Reflect.get으로 안전하게 result 속성 접근 (타입 단언 대신)
    const fileReader = target;
    const readerResult = Reflect.get(fileReader, 'result');

    console.log('🔧 [DEBUG] FileReader result 확인:', {
      fileName: file.name,
      fileId,
      hasResult: readerResult !== null && readerResult !== undefined,
      resultType: typeof readerResult,
      resultIsString: typeof readerResult === 'string',
      resultLength: typeof readerResult === 'string' ? readerResult.length : 0,
      resultPreview:
        typeof readerResult === 'string'
          ? readerResult.slice(0, 50) + '...'
          : 'not string',
      timestamp: new Date().toLocaleTimeString(),
    });

    // 결과가 string이 아닌 경우 에러 처리
    if (typeof readerResult !== 'string') {
      console.error('❌ [RESULT_TYPE_ERROR] 결과가 string이 아닙니다:', {
        fileName: file.name,
        fileId,
        resultType: typeof readerResult,
        resultValue: readerResult,
        timestamp: new Date().toLocaleTimeString(),
      });
      onError(event);
      return;
    }

    // 🎯 타입 가드 통과 후 string으로 확정
    const validStringResult: string = readerResult;

    // 🚨 추가 검증: 빈 문자열 체크 (타입 안전성 보장)
    const resultLength = validStringResult.length;
    if (resultLength === 0) {
      console.error('❌ [EMPTY_RESULT] 결과가 빈 문자열입니다:', {
        fileName: file.name,
        fileId,
        timestamp: new Date().toLocaleTimeString(),
      });
      onError(event);
      return;
    }

    // 🚨 추가 검증: Base64 형식 체크
    if (!validStringResult.startsWith('data:')) {
      console.error(
        '❌ [INVALID_BASE64] 결과가 올바른 Base64 형식이 아닙니다:',
        {
          fileName: file.name,
          fileId,
          resultStart: validStringResult.slice(0, 20),
          timestamp: new Date().toLocaleTimeString(),
        }
      );
      onError(event);
      return;
    }

    // 성공 로그
    console.log('📁 [READER_LOAD] FileReader 완료:', {
      fileName: file.name,
      fileId,
      resultLength: validStringResult.length,
      timestamp: new Date().toLocaleTimeString(),
    });

    console.log('🎯 [SUCCESS] onSuccess 호출 직전:', {
      fileName: file.name,
      fileId,
      onSuccessType: typeof onSuccess,
      timestamp: new Date().toLocaleTimeString(),
    });

    // 성공 콜백 호출 (Base64 문자열 전달)
    try {
      onSuccess(validStringResult);
      console.log('✅ [SUCCESS] onSuccess 호출 완료:', {
        fileName: file.name,
        fileId,
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (onSuccessError) {
      console.error(
        '❌ [SUCCESS_CALLBACK_ERROR] onSuccess 콜백 실행 중 에러:',
        {
          fileName: file.name,
          fileId,
          error: onSuccessError,
          timestamp: new Date().toLocaleTimeString(),
        }
      );
      onError(event);
    }
  };

  // ❌ 에러 이벤트 핸들러
  reader.onerror = (error) => {
    console.error('❌ [READER_ERROR] FileReader 에러:', {
      fileName: file.name,
      fileId,
      error,
      timestamp: new Date().toLocaleTimeString(),
    });

    onError(error);
  };

  console.log('🔧 [FILE_READER] readAsDataURL 시작:', {
    fileName: file.name,
    fileId,
    timestamp: new Date().toLocaleTimeString(),
  });

  // 파일을 Data URL(Base64) 형태로 읽기 시작
  // readAsDataURL은 이미지 파일을 브라우저에서 표시할 수 있는 Base64 문자열로 변환
  reader.readAsDataURL(file);
};
