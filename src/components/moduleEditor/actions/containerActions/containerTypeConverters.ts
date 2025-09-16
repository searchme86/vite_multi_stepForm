// 📁 actions/containerActions/containerTypeConverters.ts

import { LocalParagraph } from '../../types/paragraph';
import { Container } from '../../types/container';
// ✨ [개선] Dynamic Import → Static Import 변경
import {
  ParagraphBlock,
  Container as ZustandContainer,
} from '../../../../store/shared/commonTypes.ts';

/**
 * Zustand ParagraphBlock 타입을 LocalParagraph 타입으로 변환하는 함수
 *
 * 함수의 목적: Zustand 스토어의 ParagraphBlock 데이터를 LocalParagraph 형식으로 변환
 * 사용 목적: Zustand 스토어와 기존 Context 시스템 간의 타입 호환성을 위해
 * 비즈니스 의미: 두 다른 상태관리 시스템 간의 데이터 타입 통일화
 */
export const convertFromZustandParagraph = (
  zustandParagraphData: ParagraphBlock // Zustand에서 사용하는 ParagraphBlock 타입 데이터를 매개변수로 받음
): LocalParagraph => {
  // LocalParagraph 타입으로 반환하여 기존 시스템과 호환
  // fallback: zustandParagraphData가 undefined나 null일 경우를 대비한 기본값 처리
  if (!zustandParagraphData) {
    console.warn(
      '⚠️ [TYPE_CONVERTER] zustandParagraphData가 undefined 또는 null입니다'
    );
    // 기본값으로 빈 LocalParagraph 객체 반환하여 애플리케이션 중단 방지
    return {
      id: `fallback-${Date.now()}`, // 고유한 ID 생성으로 중복 방지
      content: '', // 빈 문자열로 초기화하여 에러 방지
      containerId: null, // 할당되지 않은 상태로 설정 (LocalParagraph 타입에 맞춰 null 사용)
      order: 0, // 기본 순서값으로 0 설정
      createdAt: new Date(), // 현재 시간으로 생성시간 설정
      updatedAt: new Date(), // 현재 시간으로 수정시간 설정
      originalId: undefined, // 선택적 속성으로 undefined 설정
    };
  }

  return {
    id: zustandParagraphData.id, // Zustand paragraph의 ID를 그대로 사용
    content: zustandParagraphData.content || '', // content가 없을 경우 빈 문자열로 fallback
    containerId: zustandParagraphData.containerId, // 컨테이너 ID 매핑
    order: zustandParagraphData.order || 0, // order가 없을 경우 0으로 fallback
    createdAt: zustandParagraphData.createdAt || new Date(), // 생성일이 없을 경우 현재 시간으로 fallback
    updatedAt: zustandParagraphData.updatedAt || new Date(), // 수정일이 없을 경우 현재 시간으로 fallback
    originalId: undefined, // LocalParagraph 타입에만 있는 선택적 속성으로 undefined 설정
  };
};

/**
 * Zustand Container 타입을 로컬 Container 타입으로 변환하는 함수
 *
 * 함수의 목적: Zustand 스토어의 Container 데이터를 로컬 Container 형식으로 변환
 * 사용 목적: Zustand 스토어의 Container와 기존 시스템의 Container 타입 간 호환을 위해
 * 비즈니스 의미: 상태관리 시스템 변경 시에도 기존 코드 호환성 유지
 */
export const convertFromZustandContainer = (
  zustandContainerData: ZustandContainer // Zustand Container 타입 데이터를 매개변수로 받음
): Container => {
  // 기존 Container 타입으로 반환
  // fallback: zustandContainerData가 undefined나 null일 경우를 대비한 기본값 처리
  if (!zustandContainerData) {
    console.warn(
      '⚠️ [TYPE_CONVERTER] zustandContainerData가 undefined 또는 null입니다'
    );
    // 기본값으로 빈 Container 객체 반환하여 애플리케이션 중단 방지
    return {
      id: `fallback-container-${Date.now()}`, // 고유한 컨테이너 ID 생성
      name: '기본 컨테이너', // 기본 이름 설정하여 UI 표시 문제 방지
      order: 0, // 기본 순서값으로 0 설정
    };
  }

  return {
    id: zustandContainerData.id, // Zustand container의 ID를 그대로 사용
    name: zustandContainerData.name || '이름 없음', // name이 없을 경우 기본 이름으로 fallback
    order: zustandContainerData.order || 0, // order가 없을 경우 0으로 fallback
    // 주의: createdAt은 기존 Container 타입에 없으므로 제외
    // Zustand Container에는 createdAt이 있지만 LocalContainer에는 없어서 매핑하지 않음
  };
};
