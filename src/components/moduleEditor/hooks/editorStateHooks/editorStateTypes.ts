// 📁 hooks/useEditorState/editorStateTypes.ts

import {
  Container,
  ParagraphBlock,
  ToastOptions,
} from '../../../../store/shared/commonTypes';
import { SubStep } from '../../types/editor';
// ✅ types/paragraph.ts에서 LocalParagraph import (타입 충돌 해결)
import { LocalParagraph } from '../../types/paragraph';

// 🔥 [Context 제거] Zustand 전용 타입 정의

// ✅ LocalParagraph는 별도 파일에서 import하여 사용 (타입 일관성 보장)
// ❌ 제거된 코드: type LocalParagraph = ParagraphBlock;

// ✨ [Zustand 전용] Store 액션 타입 정의들

// EditorCore Store 액션 타입 정의 - 에디터의 핵심 데이터를 관리하는 store
// 1. 컨테이너, 단락, 완성 콘텐츠 등 에디터의 핵심 데이터 관리 2. 영구 저장과 복원 기능
interface EditorCoreStoreActions {
  // 조회 함수들
  getContainers: () => Container[]; // 1. 저장된 컨테이너 목록 조회 2. 섹션 구조 복원
  getParagraphs: () => LocalParagraph[]; // 1. 저장된 단락 목록 조회 2. 작성 내용 복원
  getCompletedContent: () => string; // 1. 완성된 콘텐츠 조회 2. 최종 결과물 확인
  getIsCompleted: () => boolean; // 1. 완료 상태 조회 2. 작업 완료 여부 확인

  // 업데이트 함수들
  setContainers: (containers: Container[]) => void; // 1. 컨테이너 목록 저장 2. 섹션 구조 영구 보관
  setParagraphs: (paragraphs: LocalParagraph[]) => void; // 1. 단락 목록 저장 2. 작성 내용 영구 보관
  setCompletedContent: (content: string) => void; // 1. 완성 콘텐츠 저장 2. 최종 결과물 영구 보관
  setIsCompleted: (completed: boolean) => void; // 1. 완료 상태 저장 2. 작업 완료 표시
}

// EditorUI Store 액션 타입 정의 - 에디터의 UI 상태를 관리하는 store
// 1. 현재 단계, 선택 상태, 활성 요소 등 UI 관련 모든 상태 관리 2. 사용자 인터랙션 추적
interface EditorUIStoreActions {
  // 조회 함수들
  getCurrentSubStep: () => SubStep; // 1. 현재 에디터 단계 조회 2. structure 또는 writing 단계 확인
  getIsTransitioning: () => boolean; // 1. 전환 애니메이션 상태 조회 2. 단계 변경 중인지 확인
  getActiveParagraphId: () => string | null; // 1. 활성 단락 ID 조회 2. 현재 편집 중인 단락 확인
  getIsPreviewOpen: () => boolean; // 1. 미리보기 상태 조회 2. 미리보기 패널 열림 여부 확인
  getSelectedParagraphIds: () => string[]; // 1. 선택된 단락 목록 조회 2. 다중 선택된 단락들 확인
  getTargetContainerId: () => string; // 1. 타겟 컨테이너 ID 조회 2. 단락 이동 대상 확인

  // 액션 함수들
  goToWritingStep: () => void; // 1. writing 단계로 이동 2. 구조 설정 완료 후 글쓰기 시작
  goToStructureStep: () => void; // 1. structure 단계로 이동 2. 구조 재설정을 위한 되돌아가기
  setActiveParagraphId: (id: string | null) => void; // 1. 활성 단락 설정 2. 편집 대상 지정 또는 해제
  togglePreview: () => void; // 1. 미리보기 토글 2. 미리보기 패널 열기/닫기
  toggleParagraphSelection: (paragraphId: string) => void; // 1. 단락 선택 토글 2. 개별 단락 선택/해제
  setSelectedParagraphIds: (ids: string[]) => void; // 1. 선택 단락 목록 설정 2. 다중 선택 상태 일괄 변경
  setTargetContainerId: (containerId: string) => void; // 1. 타겟 컨테이너 설정 2. 단락 이동 대상 지정
  clearSelectedParagraphs: () => void; // 1. 선택 상태 초기화 2. 모든 단락 선택 해제
}

// Toast Store 액션 타입 정의 - 알림 메시지를 관리하는 store
// 1. 사용자에게 성공/실패/경고 메시지 표시 2. 즉각적인 피드백 제공
interface ToastStoreActions {
  addToast: (options: ToastOptions) => void; // 1. 토스트 메시지 추가 2. 제목, 설명, 색상 등 설정 가능
}

// Zustand 전용 타입들만 export
export type {
  LocalParagraph,
  EditorCoreStoreActions,
  EditorUIStoreActions,
  ToastStoreActions,
};
