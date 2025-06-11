import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormSchemaValues } from '../../types/formTypes';
import { formSchema } from '../../schema/formSchema';

export const useFormMethods = () => {
  console.log('📝 useFormMethods: react-hook-form 메소드 초기화');

  const methods = useForm<FormSchemaValues>({
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
    },
    mode: 'onChange',
  });

  const {
    handleSubmit,
    formState: { errors },
    trigger,
    watch,
    setValue,
  } = methods;

  console.log('📝 useFormMethods: 초기화 완료');

  return {
    methods,
    handleSubmit,
    errors,
    trigger,
    watch,
    setValue,
  };
};
