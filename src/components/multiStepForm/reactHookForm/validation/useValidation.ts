import { useCallback } from 'react';
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

interface ToastNotificationOptions {
  title: string;
  description: string;
  color: 'success' | 'warning' | 'danger' | 'primary' | 'default';
}

interface UseValidationProps {
  trigger: UseFormTrigger<FormSchemaValues>;
  errors: FieldErrors<FormSchemaValues>;
  editorState: EditorState;
  addToast: (options: ToastNotificationOptions) => void;
}

export const useValidation = ({
  trigger,
  errors,
  editorState,
  addToast,
}: UseValidationProps) => {
  const validateCurrentStep = useCallback(
    async (currentStep: StepNumber) => {
      console.log('✅ validateCurrentStep: 스텝 유효성 검사 시작', currentStep);

      //====여기부터 추가됨====
      // 🔍 디버깅: 함수 시작 시점의 모든 입력 파라미터 값 확인
      console.group(`🔍 [STEP ${currentStep}] 입력 파라미터 전체 상태 확인`);
      console.log('📋 currentStep:', currentStep);
      console.log('📋 trigger 함수 존재 여부:', typeof trigger === 'function');
      console.log('📋 errors 객체 전체:', errors);
      console.log('📋 errors 객체 키 목록:', Object.keys(errors));
      console.log('📋 editorState 전체 상태:', {
        isCompleted: editorState.isCompleted,
        completedContent: editorState.completedContent,
        completedContentLength: editorState.completedContent?.length || 0,
        completedContentPreview:
          editorState.completedContent?.slice(0, 100) + '...' || 'empty',
      });
      console.log(
        '📋 addToast 함수 존재 여부:',
        typeof addToast === 'function'
      );
      console.groupEnd();
      //====여기까지 추가됨====

      // 현재 스텝에서 검증해야 할 원본 필드 목록 (아직 필터링 전)
      // getStepValidationFields 함수에서 반환된 필드명들의 원시 배열
      const currentStepUnfilteredFieldNames =
        getStepValidationFields(currentStep);

      //====여기부터 추가됨====
      // 🔍 디버깅: 원본 필드 목록 확인
      console.group(`🔍 [STEP ${currentStep}] 원본 필드 목록 분석`);
      console.log(
        '📋 currentStepUnfilteredFieldNames 전체:',
        currentStepUnfilteredFieldNames
      );
      console.log(
        '📋 currentStepUnfilteredFieldNames 길이:',
        currentStepUnfilteredFieldNames.length
      );
      console.log(
        '📋 currentStepUnfilteredFieldNames 타입:',
        typeof currentStepUnfilteredFieldNames
      );
      console.log('📋 currentStepUnfilteredFieldNames 각 항목 상세:');
      currentStepUnfilteredFieldNames.forEach((field, index) => {
        console.log(`   [${index}]: "${field}" (타입: ${typeof field})`);
      });
      console.groupEnd();
      //====여기까지 추가됨====

      // 유효한 폼 스키마 키로만 필터링된 검증 대상 필드 목록
      // filterValidFormFields를 통해 실제 존재하는 필드만 남김
      const currentStepValidFormFieldNames = filterValidFormFields(
        currentStepUnfilteredFieldNames
      );

      //====여기부터 추가됨====
      // 🔍 디버깅: 필터링된 필드 목록 확인
      console.group(`🔍 [STEP ${currentStep}] 필터링된 필드 목록 분석`);
      console.log(
        '📋 currentStepValidFormFieldNames 전체:',
        currentStepValidFormFieldNames
      );
      console.log(
        '📋 currentStepValidFormFieldNames 길이:',
        currentStepValidFormFieldNames.length
      );
      console.log('📋 필터링 전후 길이 비교:', {
        필터링전: currentStepUnfilteredFieldNames.length,
        필터링후: currentStepValidFormFieldNames.length,
        제거된개수:
          currentStepUnfilteredFieldNames.length -
          currentStepValidFormFieldNames.length,
      });
      console.log(
        '📋 제거된 필드들:',
        currentStepUnfilteredFieldNames.filter(
          (field) => !currentStepValidFormFieldNames.includes(field)
        )
      );
      console.groupEnd();
      //====여기까지 추가됨====

      // 에디터 관련 검증이 필요한지 확인하는 플래그
      // 원본 필드 목록에 에디터 완료 관련 필드가 포함되어 있는지 검사
      const requiresEditorCompletionValidation =
        currentStepUnfilteredFieldNames.some(
          (fieldName) =>
            fieldName === 'editorCompleted' || fieldName === 'editor'
        );

      //====여기부터 추가됨====
      // 🔍 디버깅: 에디터 검증 필요 여부 상세 분석
      console.group(`🔍 [STEP ${currentStep}] 에디터 검증 필요성 분석`);
      console.log(
        '📋 requiresEditorCompletionValidation:',
        requiresEditorCompletionValidation
      );
      console.log('📋 에디터 관련 필드 존재 확인:');
      currentStepUnfilteredFieldNames.forEach((fieldName) => {
        const isEditorCompleted = fieldName === 'editorCompleted';
        const isEditor = fieldName === 'editor';
        console.log(
          `   "${fieldName}": editorCompleted=${isEditorCompleted}, editor=${isEditor}`
        );
      });
      console.log(
        '📋 에디터 관련 필드 필터링 결과:',
        currentStepUnfilteredFieldNames.filter(
          (fieldName) =>
            fieldName === 'editorCompleted' || fieldName === 'editor'
        )
      );
      console.groupEnd();
      //====여기까지 추가됨====

      if (requiresEditorCompletionValidation) {
        // 에디터 완료 상태와 내용 존재 여부를 동시에 검증
        const isEditorContentMissing =
          !editorState.isCompleted || !editorState.completedContent.trim();

        //====여기부터 추가됨====
        // 🔍 디버깅: 에디터 내용 검증 상세 분석
        console.group(`🔍 [STEP ${currentStep}] 에디터 내용 검증 상세 분석`);
        console.log('📋 에디터 상태 상세 분석:');
        console.log('   editorState.isCompleted:', editorState.isCompleted);
        console.log(
          '   editorState.completedContent:',
          editorState.completedContent
        );
        console.log(
          '   editorState.completedContent 타입:',
          typeof editorState.completedContent
        );
        console.log(
          '   editorState.completedContent 길이:',
          editorState.completedContent?.length || 0
        );
        console.log(
          '   editorState.completedContent trim() 결과:',
          editorState.completedContent?.trim()
        );
        console.log(
          '   editorState.completedContent trim() 길이:',
          editorState.completedContent?.trim()?.length || 0
        );
        console.log('📋 검증 조건 분석:');
        console.log('   !editorState.isCompleted:', !editorState.isCompleted);
        console.log(
          '   !editorState.completedContent.trim():',
          !editorState.completedContent?.trim()
        );
        console.log(
          '   isEditorContentMissing (최종 결과):',
          isEditorContentMissing
        );
        console.groupEnd();
        //====여기까지 추가됨====

        if (isEditorContentMissing) {
          console.log('❌ validateCurrentStep: 에디터 완료 검증 실패');

          //====여기부터 추가됨====
          // 🔍 디버깅: 에디터 검증 실패 시 상세 정보
          console.group('🔍 에디터 검증 실패 상세 정보');
          console.log('📋 실패 원인 분석:');
          if (!editorState.isCompleted) {
            console.log('   ❌ 에디터 완료 상태가 false');
          }
          if (!editorState.completedContent?.trim()) {
            console.log('   ❌ 에디터 내용이 비어있음');
          }
          console.log('📋 토스트 알림 옵션:', {
            title: '에디터 작성 미완료',
            description: '모듈화된 에디터에서 글 작성을 완료해주세요.',
            color: 'warning',
          });
          console.groupEnd();
          //====여기까지 추가됨====

          addToast({
            title: '에디터 작성 미완료',
            description: '모듈화된 에디터에서 글 작성을 완료해주세요.',
            color: 'warning',
          });
          return false;
        }
        console.log('✅ validateCurrentStep: 에디터 완료 검증 성공');

        //====여기부터 추가됨====
        // 🔍 디버깅: 에디터 검증 성공 시 상세 정보
        console.group('🔍 에디터 검증 성공 상세 정보');
        console.log('📋 성공 조건 확인:');
        console.log('   ✅ editorState.isCompleted:', editorState.isCompleted);
        console.log(
          '   ✅ editorState.completedContent 존재:',
          !!editorState.completedContent?.trim()
        );
        console.log(
          '   ✅ 내용 길이:',
          editorState.completedContent?.trim()?.length || 0
        );
        console.groupEnd();
        //====여기까지 추가됨====

        return true;
      }

      const hasNoFieldsToValidate = currentStepValidFormFieldNames.length === 0;

      //====여기부터 추가됨====
      // 🔍 디버깅: 검증할 필드 존재 여부 확인
      console.group(`🔍 [STEP ${currentStep}] 검증할 필드 존재 여부 확인`);
      console.log('📋 hasNoFieldsToValidate:', hasNoFieldsToValidate);
      console.log(
        '📋 currentStepValidFormFieldNames.length:',
        currentStepValidFormFieldNames.length
      );
      console.groupEnd();
      //====여기까지 추가됨====

      if (hasNoFieldsToValidate) {
        console.log('✅ validateCurrentStep: 검증할 필드 없음');
        return true;
      }

      // isValidFormSchemaKey 함수로 검증되어 keyof FormSchemaValues 타입이 보장됨
      const currentStepTypeSafeFormFields =
        currentStepValidFormFieldNames.filter(
          (fieldName): fieldName is keyof FormSchemaValues => {
            // 실제 FormSchemaValues 인터페이스의 키인지 런타임 검증
            const isValidSchemaKey = isValidFormSchemaKey(fieldName);

            //====여기부터 추가됨====
            // 🔍 디버깅: 각 필드별 타입 가드 검증 결과
            console.log(
              `🔍 타입 가드 검증: "${fieldName}" -> isValidSchemaKey: ${isValidSchemaKey}`
            );
            //====여기까지 추가됨====

            // 유효하지 않은 필드 발견시 경고 로그 출력
            if (!isValidSchemaKey) {
              console.warn(`❌ 유효하지 않은 폼 필드: ${fieldName}`);
            }

            return isValidSchemaKey;
          }
        );

      //====여기부터 추가됨====
      // 🔍 디버깅: 타입 가드 통과 필드 목록 확인
      console.group(`🔍 [STEP ${currentStep}] 타입 가드 통과 필드 분석`);
      console.log(
        '📋 currentStepTypeSafeFormFields 전체:',
        currentStepTypeSafeFormFields
      );
      console.log(
        '📋 currentStepTypeSafeFormFields 길이:',
        currentStepTypeSafeFormFields.length
      );
      console.log('📋 타입 가드 전후 길이 비교:', {
        타입가드전: currentStepValidFormFieldNames.length,
        타입가드후: currentStepTypeSafeFormFields.length,
        제거된개수:
          currentStepValidFormFieldNames.length -
          currentStepTypeSafeFormFields.length,
      });
      console.log(
        '📋 타입 가드에서 제거된 필드들:',
        currentStepValidFormFieldNames.filter(
          (field) =>
            !currentStepTypeSafeFormFields.includes(
              field as keyof FormSchemaValues
            )
        )
      );
      console.groupEnd();
      //====여기까지 추가됨====

      // React Hook Form의 trigger 함수로 현재 스텝 필드들의 유효성 검사 실행
      // 모든 지정된 필드가 유효성 검사를 통과했는지 boolean 값으로 반환

      //====여기부터 추가됨====
      // 🔍 디버깅: trigger 함수 호출 전 상태 확인
      console.group(`🔍 [STEP ${currentStep}] trigger 함수 호출 전 상태`);
      console.log(
        '📋 trigger 함수에 전달할 필드들:',
        currentStepTypeSafeFormFields
      );
      console.log('📋 현재 errors 상태:', errors);
      console.log('📋 각 필드별 현재 에러 상태:');
      currentStepTypeSafeFormFields.forEach((fieldName) => {
        const fieldError = errors[fieldName];
        console.log(
          `   "${fieldName}": 에러=${!!fieldError}, 메시지="${
            fieldError?.message || 'none'
          }"`
        );
      });
      console.groupEnd();
      //====여기까지 추가됨====

      const currentStepValidationResult = await trigger(
        currentStepTypeSafeFormFields
      );

      //====여기부터 추가됨====
      // 🔍 디버깅: trigger 함수 호출 후 결과 확인
      console.group(`🔍 [STEP ${currentStep}] trigger 함수 호출 후 결과`);
      console.log(
        '📋 currentStepValidationResult:',
        currentStepValidationResult
      );
      console.log('📋 trigger 호출 후 errors 상태:', errors);
      console.log('📋 각 필드별 trigger 후 에러 상태:');
      currentStepTypeSafeFormFields.forEach((fieldName) => {
        const fieldError = errors[fieldName];
        console.log(
          `   "${fieldName}": 에러=${!!fieldError}, 메시지="${
            fieldError?.message || 'none'
          }"`
        );
      });
      console.groupEnd();
      //====여기까지 추가됨====

      const hasValidationErrors = !currentStepValidationResult;

      //====여기부터 추가됨====
      // 🔍 디버깅: 유효성 검사 에러 여부 확인
      console.group(`🔍 [STEP ${currentStep}] 유효성 검사 에러 여부`);
      console.log('📋 hasValidationErrors:', hasValidationErrors);
      console.log(
        '📋 currentStepValidationResult:',
        currentStepValidationResult
      );
      console.groupEnd();
      //====여기까지 추가됨====

      if (hasValidationErrors) {
        // 현재 스텝 검증 대상 필드와 일치하는 에러 항목들만 추출
        // Object.entries(errors)에서 키가 검증 대상 필드인 것들만 필터링
        const currentStepMatchingErrorEntries = Object.entries(errors).filter(
          ([errorFieldKey, _]) => {
            // 에러 필드 키가 유효한 폼 스키마 키인지 1차 검증
            const isValidErrorFieldKey = isValidFormSchemaKey(errorFieldKey);

            // 검증 대상 필드 목록에 포함되어 있는지 2차 검증
            const isTargetValidationField =
              isValidErrorFieldKey &&
              currentStepTypeSafeFormFields.some(
                (validFieldName) => validFieldName === errorFieldKey
              );

            //====여기부터 추가됨====
            // 🔍 디버깅: 각 에러 필드별 필터링 과정
            console.log(
              `🔍 에러 필드 필터링: "${errorFieldKey}" -> isValidErrorFieldKey: ${isValidErrorFieldKey}, isTargetValidationField: ${isTargetValidationField}`
            );
            //====여기까지 추가됨====

            return isTargetValidationField;
          }
        );

        //====여기부터 추가됨====
        // 🔍 디버깅: 매칭된 에러 항목들 확인
        console.group(`🔍 [STEP ${currentStep}] 매칭된 에러 항목들`);
        console.log(
          '📋 currentStepMatchingErrorEntries 전체:',
          currentStepMatchingErrorEntries
        );
        console.log(
          '📋 currentStepMatchingErrorEntries 길이:',
          currentStepMatchingErrorEntries.length
        );
        console.log('📋 각 에러 항목 상세:');
        currentStepMatchingErrorEntries.forEach(([key, error], index) => {
          console.log(
            `   [${index}] "${key}": 에러객체=${!!error}, 메시지="${
              error?.message || 'none'
            }"`
          );
        });
        console.groupEnd();
        //====여기까지 추가됨====

        // 에러 항목들에서 실제 에러 메시지만 추출한 임시 배열
        // undefined나 빈 값들이 포함될 수 있어 추가 필터링 필요
        const extractedErrorMessageCollection: (string | undefined)[] = [];

        // 각 에러 항목을 순회하며 유효한 에러 메시지만 수집
        for (const [_, fieldErrorObject] of currentStepMatchingErrorEntries) {
          // fieldErrorObject가 존재하고 message 속성이 문자열인지 검증
          const hasValidErrorMessage =
            fieldErrorObject && typeof fieldErrorObject.message === 'string';

          //====여기부터 추가됨====
          // 🔍 디버깅: 각 에러 메시지 추출 과정
          console.log(
            `🔍 에러 메시지 추출: fieldErrorObject=${!!fieldErrorObject}, hasValidErrorMessage=${hasValidErrorMessage}, message="${
              fieldErrorObject?.message || 'none'
            }"`
          );
          //====여기까지 추가됨====

          if (hasValidErrorMessage) {
            extractedErrorMessageCollection.push(fieldErrorObject.message);
          }
        }

        //====여기부터 추가됨====
        // 🔍 디버깅: 추출된 에러 메시지 컬렉션 확인
        console.group(`🔍 [STEP ${currentStep}] 추출된 에러 메시지 컬렉션`);
        console.log(
          '📋 extractedErrorMessageCollection 전체:',
          extractedErrorMessageCollection
        );
        console.log(
          '📋 extractedErrorMessageCollection 길이:',
          extractedErrorMessageCollection.length
        );
        console.groupEnd();
        //====여기까지 추가됨====

        // undefined 값들을 제거하고 문자열만 남긴 안전한 에러 메시지 배열
        const validDefinedErrorMessages =
          extractedErrorMessageCollection.filter(
            (errorMessage): errorMessage is string =>
              typeof errorMessage === 'string'
          );

        //====여기부터 추가됨====
        // 🔍 디버깅: 정의된 에러 메시지들 확인
        console.group(`🔍 [STEP ${currentStep}] 정의된 에러 메시지들`);
        console.log(
          '📋 validDefinedErrorMessages 전체:',
          validDefinedErrorMessages
        );
        console.log(
          '📋 validDefinedErrorMessages 길이:',
          validDefinedErrorMessages.length
        );
        console.groupEnd();
        //====여기까지 추가됨====

        // 최종적으로 빈 문자열까지 제거한 완전히 유효한 에러 메시지 배열
        const finalCleanedErrorMessages = filterDefinedStrings(
          validDefinedErrorMessages
        );

        //====여기부터 추가됨====
        // 🔍 디버깅: 최종 정리된 에러 메시지들 확인
        console.group(`🔍 [STEP ${currentStep}] 최종 정리된 에러 메시지들`);
        console.log(
          '📋 finalCleanedErrorMessages 전체:',
          finalCleanedErrorMessages
        );
        console.log(
          '📋 finalCleanedErrorMessages 길이:',
          finalCleanedErrorMessages.length
        );
        console.log('📋 각 에러 메시지 상세:');
        finalCleanedErrorMessages.forEach((message, index) => {
          console.log(`   [${index}]: "${message}"`);
        });
        console.groupEnd();
        //====여기까지 추가됨====

        // 디버깅용 유효성 검사 실패 로그 출력
        logValidation(currentStep, false, finalCleanedErrorMessages);

        // 사용자에게 표시할 에러 메시지가 존재하는지 확인
        const hasErrorMessagesToShow = finalCleanedErrorMessages.length > 0;

        //====여기부터 추가됨====
        // 🔍 디버깅: 에러 메시지 표시 여부 확인
        console.group(`🔍 [STEP ${currentStep}] 에러 메시지 표시 여부`);
        console.log('📋 hasErrorMessagesToShow:', hasErrorMessagesToShow);
        console.log(
          '📋 finalCleanedErrorMessages.length:',
          finalCleanedErrorMessages.length
        );
        console.groupEnd();
        //====여기까지 추가됨====

        if (hasErrorMessagesToShow) {
          // 첫 번째 에러 메시지를 사용자에게 토스트로 표시
          const firstErrorMessageToShow = finalCleanedErrorMessages[0];

          //====여기부터 추가됨====
          // 🔍 디버깅: 토스트로 표시할 에러 메시지 확인
          console.group(`🔍 [STEP ${currentStep}] 토스트 에러 메시지`);
          console.log('📋 firstErrorMessageToShow:', firstErrorMessageToShow);
          console.log('📋 토스트 옵션:', {
            title: '유효성 검사 실패',
            description: firstErrorMessageToShow,
            color: 'danger',
          });
          console.groupEnd();
          //====여기까지 추가됨====

          addToast({
            title: '유효성 검사 실패',
            description: firstErrorMessageToShow,
            color: 'danger',
          });
        }
      } else {
        // 유효성 검사 성공시 로그 출력
        logValidation(currentStep, true, []);

        //====여기부터 추가됨====
        // 🔍 디버깅: 유효성 검사 성공 시 상태 확인
        console.group(`🔍 [STEP ${currentStep}] 유효성 검사 성공`);
        console.log(
          '📋 currentStepValidationResult:',
          currentStepValidationResult
        );
        console.log('📋 검사된 필드들:', currentStepTypeSafeFormFields);
        console.log('📋 모든 필드가 유효함');
        console.groupEnd();
        //====여기까지 추가됨====
      }

      //====여기부터 추가됨====
      // 🔍 디버깅: 함수 종료 전 최종 상태 확인
      console.group(`🔍 [STEP ${currentStep}] 함수 종료 전 최종 상태`);
      console.log(
        '📋 최종 반환값 (currentStepValidationResult):',
        currentStepValidationResult
      );
      console.log('📋 함수 실행 완료 시각:', new Date().toLocaleTimeString());
      console.log('📋 전체 실행 과정 요약:', {
        스텝: currentStep,
        원본필드수: currentStepUnfilteredFieldNames.length,
        필터링후필드수: currentStepValidFormFieldNames.length,
        타입가드후필드수: currentStepTypeSafeFormFields.length,
        에디터검증필요: requiresEditorCompletionValidation,
        최종검증결과: currentStepValidationResult,
      });
      console.groupEnd();
      //====여기까지 추가됨====

      // 이유: currentStepValidationResult가 최종 검증 결과임을 명확히 함
      return currentStepValidationResult;
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
