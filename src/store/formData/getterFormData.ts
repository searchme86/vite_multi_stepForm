import type { FormDataState } from './initialFormDataState';
import {
  createDynamicMethods,
  type DynamicStoreMethods,
} from '../shared/dynamicTypeFactory';
import { initialFormDataState } from './initialFormDataState';

export interface FormDataGetters extends DynamicStoreMethods<FormDataState> {
  getFormData: () => FormDataState;
  isFormValid: () => boolean;
  getEmailAddress: () => string;
}

export const createFormDataGetters = (): FormDataGetters => {
  const dynamicMethods = createDynamicMethods(initialFormDataState);

  return {
    ...dynamicMethods,
    getFormData: () => {
      throw new Error('getFormData must be implemented in store');
    },
    isFormValid: () => {
      throw new Error('isFormValid must be implemented in store');
    },
    getEmailAddress: () => {
      throw new Error('getEmailAddress must be implemented in store');
    },
  };
};
