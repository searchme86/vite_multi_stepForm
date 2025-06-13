export const logFormValuesUpdate = (formValues: any) => {
  console.log('🔄 MultiStepForm formValues 업데이트:', {
    sliderImagesLength: formValues.sliderImages?.length || 0,
    sliderImagesFirst:
      formValues.sliderImages?.[0]?.slice(0, 30) + '...' || 'none',
    editorCompletedContent:
      formValues.editorCompletedContent?.slice(0, 50) + '...' || 'none',
    isEditorCompleted: formValues.isEditorCompleted || false,
    timestamp: new Date().toLocaleTimeString(),
  });
};

// export const logToast = (options: any) => {
//   console.log('🔔 Toast:', options);
// };

export const logStepChange = (
  currentStep: number,
  direction: 'next' | 'prev' | 'direct'
) => {
  console.log(`🔄 Step ${direction}:`, currentStep);
};

export const logValidation = (
  step: number,
  isValid: boolean,
  errors?: string[]
) => {
  console.log(`✅ Validation Step ${step}:`, { isValid, errors });
};
