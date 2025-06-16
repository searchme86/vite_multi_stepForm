import React from 'react';
import { UseFormTrigger, FieldErrors } from 'react-hook-form';
import { FormSchemaValues } from '../../types/formTypes';
import { StepNumber, getStepValidationFields } from '../../types/stepTypes';
import { EditorState } from '../../types/editorTypes';
import { logValidation } from '../../utils/debugUtils';
import {
  filterValidFormFields,
  filterDefinedStrings,
  isValidFormSchemaKey,
} from '../utils/validationHelpers';

//====여기부터 수정됨====
// ✅ 수정: any 타입 제거하고 구체적인 Toast 타입 정의
// 이유: 사용자 선호사항에서 any 타입 사용 금지
interface ToastOptions {
  title: string;
  description: string;
  color: 'success' | 'warning' | 'danger' | 'primary' | 'default';
}
//====여기까지 수정됨====

interface UseValidationProps {
  trigger: UseFormTrigger<FormSchemaValues>;
  errors: FieldErrors<FormSchemaValues>;
  editorState: EditorState;
  //====여기부터 수정됨====
  // ✅ 수정: any 타입을 구체적인 ToastOptions 타입으로 변경
  // 이유: any 타입 사용 금지 및 타입 안전성 확보
  addToast: (options: ToastOptions) => void;
  //====여기까지 수정됨====
}

export const useValidation = ({
  trigger,
  errors,
  editorState,
  addToast,
}: UseValidationProps) => {
  const validateCurrentStep = React.useCallback(
    async (currentStep: StepNumber) => {
      console.log('✅ validateCurrentStep: 스텝 유효성 검사 시작', currentStep);

      const rawFieldsToValidate = getStepValidationFields(currentStep);
      const fieldsToValidate = filterValidFormFields(rawFieldsToValidate);

      const hasEditorValidation = rawFieldsToValidate.some(
        (field) => field === 'editorCompleted' || field === 'editor'
      );

      if (hasEditorValidation) {
        if (!editorState.isCompleted || !editorState.completedContent.trim()) {
          console.log('❌ validateCurrentStep: 에디터 완료 검증 실패');
          addToast({
            title: '에디터 작성 미완료',
            description: '모듈화된 에디터에서 글 작성을 완료해주세요.',
            color: 'warning',
          });
          return false;
        }
        console.log('✅ validateCurrentStep: 에디터 완료 검증 성공');
        return true;
      }

      if (fieldsToValidate.length === 0) {
        console.log('✅ validateCurrentStep: 검증할 필드 없음');
        return true;
      }

      // ✅ 타입 가드를 사용하여 안전한 필드 검증
      // 이유: 타입 단언 없이 런타임 검증과 타입 추론을 동시에 수행
      const safeFieldsToValidate = fieldsToValidate.filter(
        (field): field is keyof FormSchemaValues => {
          // isValidFormSchemaKey 함수를 사용해 실제 FormSchemaValues의 키인지 검증
          // 이 함수는 런타임에서 실제로 유효한 폼 스키마 키인지 확인
          const isValid = isValidFormSchemaKey(field);

          // 디버깅을 위한 로그 출력
          if (!isValid) {
            console.warn(`❌ 유효하지 않은 폼 필드: ${field}`);
          }

          return isValid;
        }
      );

      // 이제 safeFieldsToValidate는 TypeScript가 자동으로
      // (keyof FormSchemaValues)[] 타입으로 추론함
      const isValid = await trigger(safeFieldsToValidate);

      if (!isValid) {
        //====여기부터 수정됨====
        // ✅ 수정: TypeScript 1230 에러 완전 해결 - 바인딩 패턴과 타입 조건자 분리
        // 이유: 구조 분해 할당과 타입 조건자를 동시에 사용할 수 없음
        // 해결: 2단계로 분리하여 처리

        // 1단계: 일반적인 필터링 (타입 조건자 없이)
        const relevantErrorEntries = Object.entries(errors).filter(
          ([key, _]) => {
            // 유효한 폼 스키마 키인지 검증
            const isValidKey = isValidFormSchemaKey(key);

            // 검증된 필드 목록에 포함되어 있는지 확인
            const isTargetField =
              isValidKey &&
              safeFieldsToValidate.some((validField) => validField === key);

            return isTargetField;
          }
        );

        // 2단계: 타입 안전한 에러 메시지 추출
        const rawErrorMessages: (string | undefined)[] = [];

        //====여기부터 수정됨====
        // ✅ 수정: 사용하지 않는 key 변수를 언더스코어로 변경
        // 이유: TypeScript 6133 에러 - 선언되었지만 사용되지 않는 변수 경고 해결
        // 해결: 의도적으로 사용하지 않는 변수임을 명시하기 위해 언더스코어 사용
        for (const [_, fieldError] of relevantErrorEntries) {
          // 이미 필터링된 항목들은 유효한 필드이므로 key 검증 불필요
          // fieldError만 사용하여 메시지 추출
          if (fieldError && typeof fieldError.message === 'string') {
            rawErrorMessages.push(fieldError.message);
          }
        }
        //====여기까지 수정됨====

        // undefined 값들을 안전하게 필터링
        const definedErrorMessages = rawErrorMessages.filter(
          (message): message is string => typeof message === 'string'
        );
        //====여기까지 수정됨====

        const errorMessages = filterDefinedStrings(definedErrorMessages);

        logValidation(currentStep, false, errorMessages);

        if (errorMessages.length > 0) {
          addToast({
            title: '유효성 검사 실패',
            description: errorMessages[0],
            color: 'danger',
          });
        }
      } else {
        logValidation(currentStep, true, []);
      }

      return isValid;
    },
    [
      trigger,
      errors,
      editorState.isCompleted,
      editorState.completedContent,
      addToast,
    ]
  );

  return { validateCurrentStep };
};
