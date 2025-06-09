// 📁 utils/validation.ts

export const validateSectionInputs = (
  inputs: string[]
): { isValid: boolean; validInputs: string[] } => {
  console.log('🔍 [VALIDATION] 섹션 입력 검증 시작:', {
    totalInputs: inputs.length,
  });

  const validInputs = inputs.filter((input) => input.trim().length > 0);
  const isValid = validInputs.length >= 2;

  console.log('📊 [VALIDATION] 섹션 검증 결과:', {
    validCount: validInputs.length,
    isValid,
    validInputs,
  });

  return { isValid, validInputs };
};

export const validateParagraphSelection = (selectedIds: string[]): boolean => {
  console.log('🔍 [VALIDATION] 단락 선택 검증:', {
    selectedCount: selectedIds.length,
  });

  const isValid = selectedIds.length > 0;

  console.log('📊 [VALIDATION] 단락 선택 검증 결과:', { isValid });

  return isValid;
};

export const validateContainerTarget = (targetContainerId: string): boolean => {
  console.log('🔍 [VALIDATION] 컨테이너 대상 검증:', { targetContainerId });

  const isValid = !!targetContainerId.trim();

  console.log('📊 [VALIDATION] 컨테이너 대상 검증 결과:', { isValid });

  return isValid;
};

export const validateParagraphContent = (content: string): boolean => {
  console.log('🔍 [VALIDATION] 단락 내용 검증:', {
    contentLength: content?.length,
  });

  const isValid = !!(content && content.trim().length > 0);

  console.log('📊 [VALIDATION] 단락 내용 검증 결과:', {
    isValid,
    trimmedLength: content?.trim().length,
  });

  return isValid;
};

export const validateImageFiles = (
  files: File[]
): { validFiles: File[]; errors: string[] } => {
  console.log('🔍 [VALIDATION] 이미지 파일 검증 시작:', {
    fileCount: files.length,
  });

  const errors: string[] = [];
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ];

  const maxSize = 10 * 1024 * 1024; // 10MB

  const validFiles = files.filter((file) => {
    console.log('📁 [VALIDATION] 개별 파일 검증:', {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    if (!allowedTypes.includes(file.type)) {
      console.log('❌ [VALIDATION] 지원하지 않는 파일 타입:', file.type);
      errors.push(`${file.name}: 지원하지 않는 파일 형식입니다.`);
      return false;
    }

    if (file.size > maxSize) {
      console.log('❌ [VALIDATION] 파일 크기 초과:', {
        size: file.size,
        maxSize,
      });
      errors.push(`${file.name}: 파일 크기가 10MB를 초과합니다.`);
      return false;
    }

    console.log('✅ [VALIDATION] 파일 검증 통과:', file.name);
    return true;
  });

  console.log('📊 [VALIDATION] 이미지 파일 검증 완료:', {
    totalFiles: files.length,
    validFiles: validFiles.length,
    errors: errors.length,
  });

  return { validFiles, errors };
};

interface EditorStateValidation {
  containers: any[];
  paragraphs: any[];
  completedContent: string;
  isCompleted: boolean;
}

export const validateEditorState = (state: EditorStateValidation): boolean => {
  console.log('🔍 [VALIDATION] 에디터 상태 검증 시작:', {
    containerCount: state.containers.length,
    paragraphCount: state.paragraphs.length,
    hasCompletedContent: !!state.completedContent,
    isCompleted: state.isCompleted,
  });

  // 최소 1개 이상의 컨테이너가 있어야 함
  if (state.containers.length === 0) {
    console.log('❌ [VALIDATION] 컨테이너가 없음');
    return false;
  }

  // 컨테이너에 할당된 단락이 최소 1개 이상 있어야 함
  const assignedParagraphs = state.paragraphs.filter((p) => p.containerId);
  if (assignedParagraphs.length === 0) {
    console.log('❌ [VALIDATION] 할당된 단락이 없음');
    return false;
  }

  // 할당된 단락 중 내용이 있는 단락이 최소 1개 이상 있어야 함
  const validContentParagraphs = assignedParagraphs.filter(
    (p) => p.content && p.content.trim().length > 0
  );

  if (validContentParagraphs.length === 0) {
    console.log('❌ [VALIDATION] 유효한 내용의 단락이 없음');
    return false;
  }

  console.log('✅ [VALIDATION] 에디터 상태 검증 통과:', {
    containers: state.containers.length,
    assignedParagraphs: assignedParagraphs.length,
    validContentParagraphs: validContentParagraphs.length,
  });

  return true;
};

export const validateMoveDirection = (
  currentIndex: number,
  direction: 'up' | 'down',
  totalItems: number
): boolean => {
  console.log('🔍 [VALIDATION] 이동 방향 검증:', {
    currentIndex,
    direction,
    totalItems,
  });

  const isValid = !(
    (direction === 'up' && currentIndex === 0) ||
    (direction === 'down' && currentIndex === totalItems - 1)
  );

  console.log('📊 [VALIDATION] 이동 방향 검증 결과:', { isValid });

  return isValid;
};
