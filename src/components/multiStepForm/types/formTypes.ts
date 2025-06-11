import * as z from 'zod';
import { formSchema } from '../schema/formSchema';

export type FormSchemaValues = z.infer<typeof formSchema>;

export interface FormValues {
  userImage: string;
  nickname: string;
  emailPrefix: string;
  emailDomain: string;
  bio: string;
  title: string;
  description: string;
  tags: string;
  content: string;
  media: string[];
  mainImage: string | null;
  sliderImages: string[];
  editorCompletedContent: string;
  isEditorCompleted: boolean;
}

export default formSchema;
