import React from 'react';
import { ToastOptions } from '../../../types/toastTypes';
import { logToast } from '../../../utils/debugUtils';

export const useToastCreation = () => {
  const addToast = React.useCallback((options: ToastOptions) => {
    console.log('🔔 addToast: 토스트 생성 시작');
    logToast(options);

    if (typeof window !== 'undefined') {
      const toastElement = document.createElement('div');
      toastElement.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
        options.color === 'success'
          ? 'bg-green-500 text-white'
          : options.color === 'danger'
          ? 'bg-red-500 text-white'
          : options.color === 'warning'
          ? 'bg-yellow-500 text-black'
          : 'bg-blue-500 text-white'
      }`;

      toastElement.innerHTML = `
        <div class="font-semibold">${options.title}</div>
        <div class="text-sm">${options.description}</div>
      `;

      console.log('🔔 addToast: DOM에 토스트 엘리먼트 추가');
      document.body.appendChild(toastElement);

      setTimeout(() => {
        if (document.body.contains(toastElement)) {
          console.log('🔔 addToast: 토스트 엘리먼트 제거');
          document.body.removeChild(toastElement);
        }
      }, 3000);
    }
  }, []);

  return { addToast };
};
