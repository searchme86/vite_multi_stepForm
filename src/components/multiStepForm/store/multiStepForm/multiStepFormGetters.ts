// src/components/multiStepForm/store/multiStepForm/multiStepFormGetters.ts

import { MultiStepFormState } from './initialMultiStepFormState';
import { FormValues } from '../../types/formTypes';
import { StepNumber } from '../../types/stepTypes';

export interface MultiStepFormGetters {
  getFormValues: () => FormValues;
  getCurrentStep: () => StepNumber;
  getProgressWidth: () => number;
  getShowPreview: () => boolean;
  getEditorCompletedContent: () => string;
  getIsEditorCompleted: () => boolean;
}

/**
 * 멀티스텝 폼 Getter 함수들을 생성하는 팩토리 함수
 *
 * 변경사항:
 * - 타입단언 제거
 * - 구조분해할당과 fallback 처리 추가
 * - 안전한 상태 접근 방법 개선
 * - 디버깅 로그 강화
 *
 * @param get Zustand 스토어의 get 함수
 * @returns MultiStepFormGetters 객체
 */
export const createMultiStepFormGetters = (
  get: () => MultiStepFormState
): MultiStepFormGetters => {
  console.log('🔧 [GETTERS] MultiStepFormGetters 생성 중...');

  return {
    /**
     * 현재 폼 값들을 가져오는 함수
     * 수정사항: 구조분해할당과 fallback 추가
     */
    getFormValues: () => {
      try {
        const currentState = get();

        if (!currentState) {
          console.warn('⚠️ [GETTERS] 현재 상태가 없음, 기본값 반환');
          return {
            userImage: '',
            nickname: '',
            emailPrefix: '',
            emailDomain: '',
            bio: '',
            title: '',
            description: '',
            tags: '',
            content: '',
            media: [],
            mainImage: null,
            sliderImages: [],
            editorCompletedContent: '',
            isEditorCompleted: false,
          };
        }

        const { formValues } = currentState;

        // formValues가 undefined인 경우 fallback 처리
        if (!formValues) {
          console.warn('⚠️ [GETTERS] formValues가 없음, 기본값 반환');
          return {
            userImage: '',
            nickname: '',
            emailPrefix: '',
            emailDomain: '',
            bio: '',
            title: '',
            description: '',
            tags: '',
            content: '',
            media: [],
            mainImage: null,
            sliderImages: [],
            editorCompletedContent: '',
            isEditorCompleted: false,
          };
        }

        console.log('📋 [GETTERS] getFormValues 호출됨:', {
          hasUserImage: !!formValues.userImage,
          nickname: formValues.nickname || '없음',
          title: formValues.title || '없음',
          mediaCount: Array.isArray(formValues.media)
            ? formValues.media.length
            : 0,
          timestamp: new Date().toISOString(),
        });

        return formValues;
      } catch (error) {
        console.error('❌ [GETTERS] getFormValues 오류:', error);

        // 에러 발생 시 기본값 반환
        return {
          userImage: '',
          nickname: '',
          emailPrefix: '',
          emailDomain: '',
          bio: '',
          title: '',
          description: '',
          tags: '',
          content: '',
          media: [],
          mainImage: null,
          sliderImages: [],
          editorCompletedContent: '',
          isEditorCompleted: false,
        };
      }
    },

    /**
     * 현재 스텝 번호를 가져오는 함수
     * 수정사항: 구조분해할당과 fallback 추가
     */
    getCurrentStep: () => {
      try {
        const currentState = get();

        if (!currentState) {
          console.warn('⚠️ [GETTERS] 현재 상태가 없음, 기본 스텝 1 반환');
          return 1;
        }

        const { currentStep } = currentState;

        // currentStep이 유효한 값인지 확인
        if (
          typeof currentStep !== 'number' ||
          currentStep < 1 ||
          currentStep > 5
        ) {
          console.warn(
            '⚠️ [GETTERS] 유효하지 않은 스텝 번호, 기본 스텝 1 반환:',
            currentStep
          );
          return 1;
        }

        console.log('📍 [GETTERS] getCurrentStep 호출됨:', {
          currentStep,
          timestamp: new Date().toISOString(),
        });

        return currentStep;
      } catch (error) {
        console.error('❌ [GETTERS] getCurrentStep 오류:', error);
        return 1; // 에러 발생 시 기본 스텝 반환
      }
    },

    /**
     * 현재 진행률 퍼센트를 가져오는 함수
     * 수정사항: 구조분해할당과 fallback 추가
     */
    getProgressWidth: () => {
      try {
        const currentState = get();

        if (!currentState) {
          console.warn('⚠️ [GETTERS] 현재 상태가 없음, 기본 진행률 0 반환');
          return 0;
        }

        const { progressWidth } = currentState;

        // progressWidth가 유효한 값인지 확인
        if (
          typeof progressWidth !== 'number' ||
          progressWidth < 0 ||
          progressWidth > 100
        ) {
          console.warn(
            '⚠️ [GETTERS] 유효하지 않은 진행률, 기본값 0 반환:',
            progressWidth
          );
          return 0;
        }

        console.log('📊 [GETTERS] getProgressWidth 호출됨:', {
          progressWidth,
          timestamp: new Date().toISOString(),
        });

        return progressWidth;
      } catch (error) {
        console.error('❌ [GETTERS] getProgressWidth 오류:', error);
        return 0; // 에러 발생 시 기본값 반환
      }
    },

    /**
     * 미리보기 패널 표시 상태를 가져오는 함수
     * 수정사항: 구조분해할당과 fallback 추가
     */
    getShowPreview: () => {
      try {
        const currentState = get();

        if (!currentState) {
          console.warn(
            '⚠️ [GETTERS] 현재 상태가 없음, 미리보기 상태 false 반환'
          );
          return false;
        }

        const { showPreview } = currentState;

        // showPreview가 boolean이 아닌 경우 fallback 처리
        const validShowPreview =
          typeof showPreview === 'boolean' ? showPreview : false;

        console.log('👀 [GETTERS] getShowPreview 호출됨:', {
          showPreview: validShowPreview,
          timestamp: new Date().toISOString(),
        });

        return validShowPreview;
      } catch (error) {
        console.error('❌ [GETTERS] getShowPreview 오류:', error);
        return false; // 에러 발생 시 기본값 반환
      }
    },

    /**
     * 에디터 완성 내용을 가져오는 함수
     * 수정사항: 구조분해할당과 fallback 추가
     */
    getEditorCompletedContent: () => {
      try {
        const currentState = get();

        if (!currentState) {
          console.warn('⚠️ [GETTERS] 현재 상태가 없음, 빈 에디터 내용 반환');
          return '';
        }

        const { editorCompletedContent } = currentState;

        // editorCompletedContent가 문자열이 아닌 경우 fallback 처리
        const validContent =
          typeof editorCompletedContent === 'string'
            ? editorCompletedContent
            : '';

        console.log('📝 [GETTERS] getEditorCompletedContent 호출됨:', {
          contentLength: validContent.length,
          hasContent: validContent.length > 0,
          preview:
            validContent.slice(0, 50) + (validContent.length > 50 ? '...' : ''),
          timestamp: new Date().toISOString(),
        });

        return validContent;
      } catch (error) {
        console.error('❌ [GETTERS] getEditorCompletedContent 오류:', error);
        return ''; // 에러 발생 시 빈 문자열 반환
      }
    },

    /**
     * 에디터 완료 상태를 가져오는 함수
     * 수정사항: 구조분해할당과 fallback 추가
     */
    getIsEditorCompleted: () => {
      try {
        const currentState = get();

        if (!currentState) {
          console.warn(
            '⚠️ [GETTERS] 현재 상태가 없음, 에디터 완료 상태 false 반환'
          );
          return false;
        }

        const { isEditorCompleted } = currentState;

        // isEditorCompleted가 boolean이 아닌 경우 fallback 처리
        const validIsCompleted =
          typeof isEditorCompleted === 'boolean' ? isEditorCompleted : false;

        console.log('✅ [GETTERS] getIsEditorCompleted 호출됨:', {
          isCompleted: validIsCompleted,
          timestamp: new Date().toISOString(),
        });

        return validIsCompleted;
      } catch (error) {
        console.error('❌ [GETTERS] getIsEditorCompleted 오류:', error);
        return false; // 에러 발생 시 기본값 반환
      }
    },
  };
};

console.log('📄 [GETTERS] multiStepFormGetters 모듈 로드 완료');
