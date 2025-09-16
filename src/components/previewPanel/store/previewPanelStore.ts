// src/components/previewPanel/store/previewPanelStore.ts

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  type PreviewPanelState,
  initialPreviewPanelState,
} from './initialPreviewPanelState';
import {
  type PreviewPanelGetters,
  createPreviewPanelGetters,
} from './getterPreviewPanel';
import {
  type PreviewPanelSetters,
  createPreviewPanelSetters,
} from './setterPreviewPanel';

// 통합된 스토어 타입
export interface PreviewPanelStore
  extends PreviewPanelState,
    PreviewPanelGetters,
    PreviewPanelSetters {}

// Zustand 스토어 생성
export const usePreviewPanelStore = create<PreviewPanelStore>()(
  devtools(
    (set, get) => {
      // Getter와 Setter 생성
      const getters = createPreviewPanelGetters(get);
      const setters = createPreviewPanelSetters(set, get);

      return {
        // 초기 상태
        ...initialPreviewPanelState,

        // Getter 함수들
        ...getters,

        // Setter 함수들
        ...setters,
      };
    },
    {
      name: 'preview-panel-store', // Redux DevTools에서 보이는 이름
      // enabled:
      //   typeof window !== 'undefined' && process.env.NODE_ENV === 'development',
    }
  )
);
