import * as z from 'zod';

export const formSchema = z.object({
  // Step 1 - User Info
  userImage: z.string().optional(),
  nickname: z.string().min(4, '닉네임은 최소 4자 이상이어야 합니다.'),
  emailPrefix: z.string().min(1, '이메일을 입력해주세요.'),
  emailDomain: z.string().min(1, '이메일 도메인을 입력해주세요.'),
  bio: z.string().optional(),

  // Step 2 - Blog Basic
  title: z
    .string()
    .min(5, '제목은 5자 이상 100자 이하로 작성해주세요.')
    .max(100, '제목은 5자 이상 100자 이하로 작성해주세요.'),
  description: z.string().min(10, '요약은 10자 이상 작성해주세요.'),

  // Step 3 - Blog Content
  tags: z.string().optional(),
  content: z.string().min(5, '블로그 내용이 최소 5자 이상이어야 합니다.'),

  // Step 4 - Blog Media
  media: z.array(z.string()).optional(),
  mainImage: z.string().nullable().optional(),
  sliderImages: z.array(z.string()).optional(),

  // Step 5 - Modular Editor
  editorCompletedContent: z.string().optional(),
  isEditorCompleted: z.boolean().optional(),
});

console.log('📄 formSchema: zod 스키마 정의 완료');

export default formSchema;
