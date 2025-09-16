// src/components/multiStepForm/schema/formSchema.ts

import * as z from 'zod';

export const formSchema = z.object({
  // Step 1 - User Info
  userImage: z.string().min(1, '사용자 이미지를 입력해주세요.'),
  nickname: z.string().min(4, '닉네임은 최소 4자 이상이어야 합니다.'),
  emailPrefix: z.string().min(1, '이메일을 입력해주세요.'),
  emailDomain: z.string().min(1, '이메일 도메인을 입력해주세요.'),
  bio: z.string().min(1, '자기소개를 입력해주세요.'),

  // Step 2 - Blog Basic
  title: z
    .string()
    .min(5, '제목은 5자 이상 100자 이하로 작성해주세요.')
    .max(100, '제목은 5자 이상 100자 이하로 작성해주세요.'),
  description: z.string().min(10, '요약은 10자 이상 작성해주세요.'),

  // Step 3 - Blog Media
  media: z.array(z.string()).min(1, '미디어를 최소 1개 이상 추가해주세요.'),
  mainImage: z.string().nullable(),
  sliderImages: z
    .array(z.string())
    .min(1, '슬라이더 이미지를 최소 1개 이상 추가해주세요.'),

  // Step 4 - Modular Editor
  editorCompletedContent: z
    .string()
    .min(5, '에디터 내용이 최소 5자 이상이어야 합니다.'),
  isEditorCompleted: z.boolean(),
});

console.log('📄 formSchema: zod 스키마 정의 완료 (12개 필드, 모든 필드 필수)');

export default formSchema;
