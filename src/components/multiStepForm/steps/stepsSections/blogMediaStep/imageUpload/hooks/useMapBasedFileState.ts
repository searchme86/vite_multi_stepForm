// 📁 imageUpload/hooks/useMapBasedFileState.ts

import { useState, useCallback, useRef } from 'react';
import type {
  FileItem,
  FileProcessingMap,
  FileOrderArray,
  MapBasedFileState,
  FileStateActions,
  UseMapBasedFileStateResult,
  FileStatus,
} from '../types/imageUploadTypes';

const generateFileId = (): string => {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `file_${timestamp}_${randomSuffix}`;
};

const isValidFileId = (id: string): boolean => {
  const hasValidFormat = typeof id === 'string' && id.length > 0;
  const matchesPattern = /^file_\d+_[a-z0-9]{6}$/.test(id);
  return hasValidFormat && matchesPattern;
};

const isPlaceholderUrl = (url: string): boolean => {
  const hasPlaceholderPrefix = url.startsWith('placeholder-');
  const hasProcessingSuffix = url.includes('-processing');
  return hasPlaceholderPrefix && hasProcessingSuffix;
};

const createFileItem = (
  fileName: string,
  url: string,
  id?: string,
  status: FileStatus = 'pending'
): FileItem => {
  const fileId = id && isValidFileId(id) ? id : generateFileId();

  return {
    id: fileId,
    fileName,
    url,
    status,
    timestamp: Date.now(),
    uploadProgress: status === 'processing' ? 0 : undefined,
  };
};

const validateFileItem = (item: unknown): item is FileItem => {
  const isValidObject = item && typeof item === 'object';
  if (!isValidObject) {
    return false;
  }

  const id = Reflect.get(item, 'id');
  const fileName = Reflect.get(item, 'fileName');
  const url = Reflect.get(item, 'url');
  const status = Reflect.get(item, 'status');
  const timestamp = Reflect.get(item, 'timestamp');

  const hasValidId = typeof id === 'string' && isValidFileId(id);
  const hasValidFileName = typeof fileName === 'string' && fileName.length > 0;
  const hasValidUrl = typeof url === 'string' && url.length > 0;
  const hasValidStatus = [
    'pending',
    'processing',
    'completed',
    'error',
  ].includes(status);
  const hasValidTimestamp = typeof timestamp === 'number';

  return (
    hasValidId &&
    hasValidFileName &&
    hasValidUrl &&
    hasValidStatus &&
    hasValidTimestamp
  );
};

export function useMapBasedFileState(): UseMapBasedFileStateResult {
  const [fileMap, setFileMap] = useState<FileProcessingMap>(new Map());
  const [fileOrder, setFileOrder] = useState<FileOrderArray>([]);
  const stateUpdateCountRef = useRef<number>(0);

  console.log('🗃️ [MAP_FILE_STATE] 훅 초기화:', {
    fileCount: fileMap.size,
    orderCount: fileOrder.length,
    updateCount: stateUpdateCountRef.current,
  });

  const addFile = useCallback(
    (fileName: string, url: string, id?: string): string => {
      const hasValidFileName = fileName && fileName.length > 0;
      const hasValidUrl = url && url.length > 0;

      if (!hasValidFileName || !hasValidUrl) {
        console.warn('⚠️ [ADD_FILE] 유효하지 않은 파일 데이터:', {
          fileName,
          url,
        });
        return '';
      }

      const fileItem = createFileItem(
        fileName,
        url,
        id,
        isPlaceholderUrl(url) ? 'processing' : 'pending'
      );
      const fileId = fileItem.id;

      setFileMap((prev: FileProcessingMap) => {
        const newMap = new Map(prev);
        newMap.set(fileId, fileItem);

        console.log('✅ [ADD_FILE] 파일 추가 완료:', {
          fileId,
          fileName,
          url: url.slice(0, 30) + '...',
          status: fileItem.status,
          mapSize: newMap.size,
        });

        return newMap;
      });

      setFileOrder((prev: FileOrderArray) => {
        const isAlreadyInOrder = prev.includes(fileId);
        if (isAlreadyInOrder) {
          return prev;
        }

        const newOrder = [...prev, fileId];

        console.log('✅ [ADD_FILE] 순서 배열 업데이트:', {
          fileId,
          orderLength: newOrder.length,
          orderArray: newOrder,
        });

        return newOrder;
      });

      stateUpdateCountRef.current += 1;
      return fileId;
    },
    []
  );

  const updateFile = useCallback(
    (
      id: string,
      updates: { fileName?: string; url?: string; status?: FileStatus }
    ): boolean => {
      const isValidId = isValidFileId(id);
      if (!isValidId) {
        console.warn('⚠️ [UPDATE_FILE] 유효하지 않은 파일 ID:', id);
        return false;
      }

      let updateSuccess = false;

      setFileMap((prev: FileProcessingMap) => {
        const hasFile = prev.has(id);
        if (!hasFile) {
          console.warn('⚠️ [UPDATE_FILE] 존재하지 않는 파일 ID:', id);
          return prev;
        }

        const currentFile = prev.get(id);
        if (!currentFile || !validateFileItem(currentFile)) {
          console.warn('⚠️ [UPDATE_FILE] 유효하지 않은 파일 데이터:', {
            id,
            currentFile,
          });
          return prev;
        }

        const updatedFile: FileItem = {
          ...currentFile,
          ...updates,
          id,
        };

        const isValidUpdatedFile = validateFileItem(updatedFile);
        if (!isValidUpdatedFile) {
          console.warn(
            '⚠️ [UPDATE_FILE] 업데이트된 파일 데이터 유효성 검사 실패:',
            updatedFile
          );
          return prev;
        }

        const newMap = new Map(prev);
        newMap.set(id, updatedFile);
        updateSuccess = true;

        console.log('✅ [UPDATE_FILE] 파일 업데이트 완료:', {
          fileId: id,
          updates: Object.keys(updates),
          newStatus: updatedFile.status,
          mapSize: newMap.size,
        });

        return newMap;
      });

      if (updateSuccess) {
        stateUpdateCountRef.current += 1;
      }

      return updateSuccess;
    },
    []
  );

  const removeFile = useCallback((id: string): boolean => {
    const isValidId = isValidFileId(id);
    if (!isValidId) {
      console.warn('⚠️ [REMOVE_FILE] 유효하지 않은 파일 ID:', id);
      return false;
    }

    let removeSuccess = false;

    setFileMap((prev: FileProcessingMap) => {
      const hasFile = prev.has(id);
      if (!hasFile) {
        console.warn('⚠️ [REMOVE_FILE] 존재하지 않는 파일 ID:', id);
        return prev;
      }

      const newMap = new Map(prev);
      const removedFile = newMap.get(id);
      newMap.delete(id);
      removeSuccess = true;

      console.log('✅ [REMOVE_FILE] 파일 제거 완료:', {
        fileId: id,
        fileName: removedFile?.fileName,
        mapSize: newMap.size,
      });

      return newMap;
    });

    if (removeSuccess) {
      setFileOrder((prev: FileOrderArray) => {
        const newOrder = prev.filter((fileId: string) => fileId !== id);

        console.log('✅ [REMOVE_FILE] 순서 배열 업데이트:', {
          removedId: id,
          orderLength: newOrder.length,
        });

        return newOrder;
      });

      stateUpdateCountRef.current += 1;
    }

    return removeSuccess;
  }, []);

  const clearAllFiles = useCallback((): void => {
    console.log('🧹 [CLEAR_ALL] 모든 파일 초기화 시작:', {
      currentFileCount: fileMap.size,
      currentOrderCount: fileOrder.length,
    });

    setFileMap(new Map());
    setFileOrder([]);
    stateUpdateCountRef.current += 1;

    console.log('✅ [CLEAR_ALL] 모든 파일 초기화 완료');
  }, [fileMap.size, fileOrder.length]);

  const reorderFiles = useCallback(
    (newOrder: readonly string[]): boolean => {
      const isValidArray = Array.isArray(newOrder);
      if (!isValidArray) {
        console.warn('⚠️ [REORDER_FILES] 유효하지 않은 순서 배열:', newOrder);
        return false;
      }

      const validIds = newOrder.filter(
        (id: string) => isValidFileId(id) && fileMap.has(id)
      );
      const isValidOrderLength = validIds.length === newOrder.length;

      if (!isValidOrderLength) {
        console.warn('⚠️ [REORDER_FILES] 일부 ID가 유효하지 않음:', {
          originalLength: newOrder.length,
          validLength: validIds.length,
          invalidIds: newOrder.filter(
            (id: string) => !isValidFileId(id) || !fileMap.has(id)
          ),
        });
        return false;
      }

      setFileOrder(validIds);
      stateUpdateCountRef.current += 1;

      console.log('✅ [REORDER_FILES] 파일 순서 재정렬 완료:', {
        newOrderLength: validIds.length,
        newOrder: validIds,
      });

      return true;
    },
    [fileMap]
  );

  const getFileById = useCallback(
    (id: string): FileItem | undefined => {
      const isValidId = isValidFileId(id);
      if (!isValidId) {
        return undefined;
      }

      const file = fileMap.get(id);
      const isValidFile = file && validateFileItem(file);

      return isValidFile ? file : undefined;
    },
    [fileMap]
  );

  const getFilesByStatus = useCallback(
    (status: FileStatus): readonly FileItem[] => {
      const files: FileItem[] = [];

      fileMap.forEach((file: FileItem) => {
        const isMatchingStatus = file.status === status;
        const isValidFile = validateFileItem(file);

        if (isMatchingStatus && isValidFile) {
          files.push(file);
        }
      });

      console.log('🔍 [GET_BY_STATUS] 상태별 파일 조회:', {
        status,
        count: files.length,
        totalFiles: fileMap.size,
      });

      return files;
    },
    [fileMap]
  );

  const getFileUrls = useCallback((): string[] => {
    const urls: string[] = [];

    fileOrder.forEach((id: string) => {
      const file = fileMap.get(id);
      const isValidFile = file && validateFileItem(file);

      if (isValidFile) {
        urls.push(file.url);
      }
    });

    console.log('📋 [GET_URLS] 파일 URL 목록 조회:', {
      count: urls.length,
      orderCount: fileOrder.length,
      mapSize: fileMap.size,
    });

    return urls;
  }, [fileMap, fileOrder]);

  const getFileNames = useCallback((): string[] => {
    const names: string[] = [];

    fileOrder.forEach((id: string) => {
      const file = fileMap.get(id);
      const isValidFile = file && validateFileItem(file);

      if (isValidFile) {
        names.push(file.fileName);
      }
    });

    console.log('📋 [GET_NAMES] 파일명 목록 조회:', {
      count: names.length,
      orderCount: fileOrder.length,
      mapSize: fileMap.size,
    });

    return names;
  }, [fileMap, fileOrder]);

  const convertToLegacyArrays = useCallback((): {
    urls: string[];
    names: string[];
  } => {
    const urls = getFileUrls();
    const names = getFileNames();

    console.log('🔄 [LEGACY_CONVERT] 레거시 배열 변환:', {
      urlsCount: urls.length,
      namesCount: names.length,
    });

    return { urls, names };
  }, [getFileUrls, getFileNames]);

  const totalFiles = fileMap.size;
  const completedFiles = Array.from(fileMap.values()).filter(
    (file: FileItem) => file.status === 'completed'
  ).length;
  const hasActiveUploads = Array.from(fileMap.values()).some(
    (file: FileItem) =>
      file.status === 'pending' || file.status === 'processing'
  );

  const state: MapBasedFileState = {
    fileMap,
    fileOrder,
    totalFiles,
    completedFiles,
    hasActiveUploads,
  };

  const actions: FileStateActions = {
    addFile,
    updateFile,
    removeFile,
    clearAllFiles,
    reorderFiles,
    getFileById,
    getFilesByStatus,
    getFileUrls,
    getFileNames,
    convertToLegacyArrays,
  };

  return {
    state,
    actions,
  };
}
