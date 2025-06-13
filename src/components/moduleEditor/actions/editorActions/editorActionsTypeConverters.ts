// 📁 actions/editorActions/editorActionsTypeConverters.ts

// ✨ [STATIC IMPORT] Dynamic import를 static import로 변경
import {
  Container as ZustandContainer,
  ParagraphBlock as ZustandParagraphBlock,
} from '../../store/shared/commonTypes';
import { LocalParagraph } from '../../types/paragraph';
import { Container } from '../../types/container';

/**
 * ✨ [ZUSTAND 추가] 기존 Container 타입을 zustand Container 타입으로 변환하는 헬퍼 함수
 * @param legacyContainer - 기존 Container 타입의 컨테이너 객체
 * @returns ZustandContainer - zustand 스토어에서 사용하는 Container 타입 객체
 *
 * 1. 이 함수의 의미: 기존 시스템의 Container 타입을 Zustand 스토어용 Container 타입으로 변환
 * 2. 왜 이 함수를 사용했는지: 기존 타입과 zustand 타입 간 호환성을 위해 타입 변환이 필요
 */
export const convertToZustandContainer = (
  legacyContainer: Container // ✨ [매개변수명 개선] container → legacyContainer로 의미 명확화
): ZustandContainer => {
  // ✨ [STATIC IMPORT] import('../../store/shared/commonTypes').Container 대신 ZustandContainer 사용
  return {
    id: legacyContainer.id, // 1. 컨테이너의 고유 식별자를 그대로 유지 2. ID는 변환 과정에서 변경되지 않아야 하므로
    name: legacyContainer.name, // 1. 컨테이너의 이름을 그대로 유지 2. 사용자가 설정한 섹션 이름이므로
    order: legacyContainer.order, // 1. 컨테이너의 순서를 그대로 유지 2. 화면에 표시될 순서 정보이므로
    createdAt: new Date(), // ✨ [ZUSTAND 변경] zustand 타입에 필요한 createdAt 추가 - 1. 생성 시간을 현재 시간으로 설정 2. zustand 타입 요구사항 충족을 위해
  };
};

/**
 * ✨ [ZUSTAND 추가] 기존 LocalParagraph 타입을 zustand ParagraphBlock 타입으로 변환하는 헬퍼 함수
 * @param legacyParagraph - 기존 LocalParagraph 타입의 단락 객체
 * @returns ZustandParagraphBlock - zustand 스토어에서 사용하는 ParagraphBlock 타입 객체
 *
 * 1. 이 함수의 의미: 기존 시스템의 LocalParagraph 타입을 Zustand 스토어용 ParagraphBlock 타입으로 변환
 * 2. 왜 이 함수를 사용했는지: 타입 시스템 간 호환성을 위해 단락 데이터 변환이 필요
 */
export const convertToZustandParagraph = (
  legacyParagraph: LocalParagraph // ✨ [매개변수명 개선] paragraph → legacyParagraph로 의미 명확화
): ZustandParagraphBlock => {
  // ✨ [STATIC IMPORT] import('../../store/shared/commonTypes').ParagraphBlock 대신 ZustandParagraphBlock 사용
  return {
    id: legacyParagraph.id, // 1. 단락의 고유 식별자를 그대로 유지 2. 단락 추적을 위해 ID는 불변이어야 하므로
    content: legacyParagraph.content, // 1. 단락의 내용을 그대로 유지 2. 사용자가 작성한 텍스트 데이터이므로
    containerId: legacyParagraph.containerId, // 1. 어떤 컨테이너에 속하는지 관계 정보 유지 2. 단락-컨테이너 연결 관계를 위해
    order: legacyParagraph.order, // 1. 단락의 순서를 그대로 유지 2. 컨테이너 내에서의 표시 순서 정보이므로
    createdAt: legacyParagraph.createdAt, // 1. 생성 시간을 그대로 유지 2. 기존 데이터의 시간 정보 보존을 위해
    updatedAt: legacyParagraph.updatedAt, // 1. 수정 시간을 그대로 유지 2. 데이터 변경 이력 추적을 위해
  };
};

/**
 * ✨ [ZUSTAND 추가] zustand Container 타입을 기존 Container 타입으로 변환하는 헬퍼 함수
 * @param zustandContainer - zustand 스토어의 Container 타입 객체
 * @returns Container - 기존 시스템에서 사용하는 Container 타입 객체
 *
 * 1. 이 함수의 의미: Zustand 스토어의 Container 타입을 기존 시스템용 Container 타입으로 역변환
 * 2. 왜 이 함수를 사용했는지: zustand에서 기존 시스템으로 데이터를 다시 변환할 때 필요
 */
export const convertFromZustandContainer = (
  zustandContainer: ZustandContainer // ✨ [매개변수명 개선] container → zustandContainer로 의미 명확화
): Container => {
  return {
    id: zustandContainer.id, // 1. 컨테이너의 고유 식별자를 그대로 유지 2. ID는 시스템 간 변환에서 변경되지 않아야 하므로
    name: zustandContainer.name, // 1. 컨테이너의 이름을 그대로 유지 2. 섹션 이름 데이터 보존을 위해
    order: zustandContainer.order, // 1. 컨테이너의 순서를 그대로 유지 2. 표시 순서 정보 보존을 위해
    // createdAt은 기존 Container 타입에 없으므로 제외 - 1. 기존 타입에 없는 필드는 제거 2. 타입 호환성을 위해
  };
};

/**
 * ✨ [ZUSTAND 추가] zustand ParagraphBlock 타입을 기존 LocalParagraph 타입으로 변환하는 헬퍼 함수
 * @param zustandParagraph - zustand 스토어의 ParagraphBlock 타입 객체
 * @returns LocalParagraph - 기존 시스템에서 사용하는 LocalParagraph 타입 객체
 *
 * 1. 이 함수의 의미: Zustand 스토어의 ParagraphBlock 타입을 기존 시스템용 LocalParagraph 타입으로 역변환
 * 2. 왜 이 함수를 사용했는지: zustand에서 기존 시스템으로 단락 데이터를 다시 변환할 때 필요
 */
export const convertFromZustandParagraph = (
  zustandParagraph: ZustandParagraphBlock // ✨ [매개변수명 개선] paragraph → zustandParagraph로 의미 명확화
): LocalParagraph => {
  return {
    id: zustandParagraph.id, // 1. 단락의 고유 식별자를 그대로 유지 2. 단락 추적을 위해 ID는 불변이어야 하므로
    content: zustandParagraph.content, // 1. 단락의 내용을 그대로 유지 2. 사용자 작성 텍스트 데이터 보존을 위해
    containerId: zustandParagraph.containerId, // 1. 어떤 컨테이너에 속하는지 관계 정보 유지 2. 단락-컨테이너 연결 관계 보존을 위해
    order: zustandParagraph.order, // 1. 단락의 순서를 그대로 유지 2. 컨테이너 내 표시 순서 정보 보존을 위해
    createdAt: zustandParagraph.createdAt, // 1. 생성 시간을 그대로 유지 2. 시간 정보 보존을 위해
    updatedAt: zustandParagraph.updatedAt, // 1. 수정 시간을 그대로 유지 2. 변경 이력 추적을 위해
    originalId: undefined, // LocalParagraph 타입에 있는 선택적 속성 - 1. 기존 타입의 선택적 필드를 undefined로 설정 2. 타입 호환성을 위해
  };
};
