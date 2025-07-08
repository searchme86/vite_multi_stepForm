// import { create } from 'zustand';
// import { persist } from 'zustand/middleware';
// import {
//   initialFormDataState,
//   type FormDataState,
// } from './initialFormDataState';
// import type { FormDataGetters } from './getterFormData';
// import type { FormDataSetters } from './setterFormData';
// import { createPersistConfig } from '../shared/persistConfig';

// type FormDataStore = FormDataState & FormDataGetters & FormDataSetters;

// export const useFormDataStore = create<FormDataStore>()(
//   persist(
//     (set, get) => ({
//       ...initialFormDataState,

//       getUserImage: () => get().userImage,
//       setUserImage: (userImage?: string) => set({ userImage }),

//       getNickname: () => get().nickname,
//       setNickname: (nickname: string) => set({ nickname }),

//       getEmailPrefix: () => get().emailPrefix,
//       setEmailPrefix: (emailPrefix: string) => set({ emailPrefix }),

//       getEmailDomain: () => get().emailDomain,
//       setEmailDomain: (emailDomain: string) => set({ emailDomain }),

//       getBio: () => get().bio,
//       setBio: (bio?: string) => set({ bio }),

//       getTitle: () => get().title,
//       setTitle: (title: string) => set({ title }),

//       getDescription: () => get().description,
//       setDescription: (description: string) => set({ description }),

//       getTags: () => get().tags,
//       setTags: (tags?: string) => set({ tags }),

//       getContent: () => get().content,
//       setContent: (content: string) => set({ content }),

//       getMedia: () => get().media,
//       setMedia: (media?: string[]) => set({ media }),

//       getMainImage: () => get().mainImage,
//       setMainImage: (mainImage?: string | null) => set({ mainImage }),

//       getSliderImages: () => get().sliderImages,
//       setSliderImages: (sliderImages?: string[]) => set({ sliderImages }),

//       getFormData: () => {
//         const state = get();
//         return {
//           userImage: state.userImage,
//           nickname: state.nickname,
//           emailPrefix: state.emailPrefix,
//           emailDomain: state.emailDomain,
//           bio: state.bio,
//           title: state.title,
//           description: state.description,
//           tags: state.tags,
//           content: state.content,
//           media: state.media,
//           mainImage: state.mainImage,
//           sliderImages: state.sliderImages,
//         };
//       },

//       isFormValid: () => {
//         const state = get();
//         return !!(
//           state.nickname.trim() &&
//           state.emailPrefix.trim() &&
//           state.emailDomain.trim() &&
//           state.title.trim() &&
//           state.description.trim()
//         );
//       },

//       getEmailAddress: () => {
//         const state = get();
//         if (!state.emailPrefix || !state.emailDomain) return '';
//         return `${state.emailPrefix}@${state.emailDomain}`;
//       },

//       updateFormData: (updates: Partial<FormDataState>) =>
//         set((state) => ({ ...state, ...updates })),

//       resetFormData: () => set(initialFormDataState),

//       addMediaItem: (mediaUrl: string) =>
//         set((state) => ({
//           media: state.media ? [...state.media, mediaUrl] : [mediaUrl],
//         })),

//       removeMediaItem: (mediaUrl: string) =>
//         set((state) => ({
//           media: state.media
//             ? state.media.filter((url) => url !== mediaUrl)
//             : undefined,
//         })),

//       addSliderImage: (imageUrl: string) =>
//         set((state) => ({
//           sliderImages: state.sliderImages
//             ? [...state.sliderImages, imageUrl]
//             : [imageUrl],
//         })),

//       removeSliderImage: (imageUrl: string) =>
//         set((state) => ({
//           sliderImages: state.sliderImages
//             ? state.sliderImages.filter((url) => url !== imageUrl)
//             : undefined,
//         })),
//     }),
//     createPersistConfig('form-data-storage', 'local')
//   )
// );
