import { zodResolver } from '@hookform/resolvers/zod';
import { FormSchemaValues } from '../../types/formTypes';
import { formSchema } from '../../schema/formSchema';

export const useFormConfiguration = () => {
  console.log('📝 useFormConfiguration: 폼 설정 초기화');

  const formConfig = {
    resolver: zodResolver(formSchema),
    defaultValues: {
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
    } as FormSchemaValues,
    mode: 'onChange' as const,
    reValidateMode: 'onChange' as const,
    shouldFocusError: true,
    shouldUnregister: false,
  };

  console.log('📝 useFormConfiguration: 폼 설정 완료');
  return formConfig;
};
