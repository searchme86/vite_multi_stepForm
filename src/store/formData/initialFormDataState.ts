export interface FormDataState {
  userImage?: string;
  nickname: string;
  emailPrefix: string;
  emailDomain: string;
  bio?: string;
  title: string;
  description: string;
  tags?: string;
  content: string;
  media?: string[];
  mainImage?: string | null;
  sliderImages?: string[];
}

export const initialFormDataState: FormDataState = {
  userImage: undefined,
  nickname: '',
  emailPrefix: '',
  emailDomain: '',
  bio: undefined,
  title: '',
  description: '',
  tags: undefined,
  content: '',
  media: undefined,
  mainImage: undefined,
  sliderImages: undefined,
};
