// import type { FormDataState } from './initialFormDataState';
// import {
//   createDynamicMethods,
//   type DynamicStoreMethods,
// } from '../shared/dynamicTypeFactory';
// import { initialFormDataState } from './initialFormDataState';

// export interface FormDataSetters extends DynamicStoreMethods<FormDataState> {
//   updateFormData: (updates: Partial<FormDataState>) => void;
//   resetFormData: () => void;
//   addMediaItem: (mediaUrl: string) => void;
//   removeMediaItem: (mediaUrl: string) => void;
//   addSliderImage: (imageUrl: string) => void;
//   removeSliderImage: (imageUrl: string) => void;
// }

// export const createFormDataSetters = (): FormDataSetters => {
//   const dynamicMethods = createDynamicMethods(initialFormDataState);

//   return {
//     ...dynamicMethods,
//     updateFormData: () => {
//       throw new Error('updateFormData must be implemented in store');
//     },
//     resetFormData: () => {
//       throw new Error('resetFormData must be implemented in store');
//     },
//     addMediaItem: () => {
//       throw new Error('addMediaItem must be implemented in store');
//     },
//     removeMediaItem: () => {
//       throw new Error('removeMediaItem must be implemented in store');
//     },
//     addSliderImage: () => {
//       throw new Error('addSliderImage must be implemented in store');
//     },
//     removeSliderImage: () => {
//       throw new Error('removeSliderImage must be implemented in store');
//     },
//   };
// };
