import { heroui } from '@heroui/react';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      screens: {
        // 모바일 디바이스 (축약형 네이밍)
        'mb-xs': '375px', // iPhone SE
        'mb-sm': '390px', // iPhone 12–16 (390px–393px)
        'mb-md': '412px', // Samsung Galaxy, OnePlus, Xiaomi
        'mb-lg': '430px', // iPhone Pro Max
        'mb-xl': '480px', // Google Pixel 8/9

        // 태블릿 & 데스크톱 (축약형 네이밍)
        tb: '768px', // 태블릿
        dk: '1024px', // 데스크톱 소형
        'dk-lg': '1280px', // 데스크톱 중형
        'dk-xl': '1536px', // 데스크톱 대형
      },

      // 🎯 미리보기 패널 애니메이션 커스텀 설정 (더 긴 시간 추가)
      transitionDuration: {
        200: '200ms',
        250: '250ms',
        350: '350ms',
        400: '400ms',
        450: '450ms',
        500: '500ms',
        600: '600ms',
        700: '700ms', // 🎯 새로 추가 - 모바일/데스크탑 미리보기 패널용
        800: '800ms',
        900: '900ms', // 🎯 새로 추가 - 더 부드러운 애니메이션용
        1000: '1000ms', // 🎯 새로 추가 - 최대 지연 시간
      },

      transitionTimingFunction: {
        // 기본 이징 함수들
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
        'smooth-in': 'cubic-bezier(0.4, 0, 1, 1)',
        'smooth-out': 'cubic-bezier(0, 0, 0.2, 1)',
        'smooth-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',

        // 모바일 터치 최적화 이징
        'touch-smooth': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'touch-spring': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'touch-elastic': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',

        // 패널 슬라이드 전용 이징 (더 부드러운 애니메이션)
        'panel-slide': 'cubic-bezier(0.23, 1, 0.32, 1)',
        'panel-bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'panel-elastic': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'panel-smooth': 'cubic-bezier(0.16, 1, 0.3, 1)', // 🎯 패널 전용 부드러운 애니메이션

        // 드래그 응답성 최적화
        'drag-response': 'cubic-bezier(0.2, 0, 0.38, 0.9)',
        'drag-settle': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },

      // 🎯 커스텀 애니메이션 키프레임
      keyframes: {
        // 기본 슬라이드 애니메이션
        'slide-up': {
          '0%': {
            transform: 'translateY(100%)',
            opacity: '0.8',
          },
          '100%': {
            transform: 'translateY(0)',
            opacity: '1',
          },
        },
        'slide-down': {
          '0%': {
            transform: 'translateY(0)',
            opacity: '1',
          },
          '100%': {
            transform: 'translateY(100%)',
            opacity: '0.8',
          },
        },
        'slide-left': {
          '0%': {
            transform: 'translateX(100%)',
            opacity: '0',
          },
          '100%': {
            transform: 'translateX(0)',
            opacity: '1',
          },
        },
        'slide-right': {
          '0%': {
            transform: 'translateX(0)',
            opacity: '1',
          },
          '100%': {
            transform: 'translateX(100%)',
            opacity: '0',
          },
        },

        // 모바일 바텀 시트 전용 애니메이션 (더 부드럽게 수정)
        'bottom-sheet-up': {
          '0%': {
            transform: 'translateY(100%)',
            opacity: '0.9',
          },
          '50%': {
            transform: 'translateY(-1%)',
            opacity: '0.95',
          },
          '100%': {
            transform: 'translateY(0)',
            opacity: '1',
          },
        },
        'bottom-sheet-down': {
          '0%': {
            transform: 'translateY(0)',
            opacity: '1',
          },
          '50%': {
            transform: 'translateY(1%)',
            opacity: '0.95',
          },
          '100%': {
            transform: 'translateY(100%)',
            opacity: '0.9',
          },
        },

        // 데스크탑 패널 전용 애니메이션 (더 부드럽게 수정)
        'desktop-panel-in': {
          '0%': {
            transform: 'translateX(100%) scale(0.98)',
            opacity: '0',
          },
          '100%': {
            transform: 'translateX(0) scale(1)',
            opacity: '1',
          },
        },
        'desktop-panel-out': {
          '0%': {
            transform: 'translateX(0) scale(1)',
            opacity: '1',
          },
          '100%': {
            transform: 'translateX(100%) scale(0.98)',
            opacity: '0',
          },
        },

        // 드래그 피드백 애니메이션
        'drag-feedback': {
          '0%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-2px)' },
          '100%': { transform: 'translateY(0)' },
        },

        // 오버레이 애니메이션
        'overlay-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '0.5' },
        },
        'overlay-out': {
          '0%': { opacity: '0.5' },
          '100%': { opacity: '0' },
        },

        // 터치 햅틱 피드백 애니메이션
        'touch-haptic': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.98)' },
          '100%': { transform: 'scale(1)' },
        },
      },

      // 🎯 커스텀 애니메이션 클래스 (더 부드러운 애니메이션으로 수정)
      animation: {
        // 기본 슬라이드 애니메이션
        'slide-up': 'slide-up 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'slide-down': 'slide-down 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'slide-left': 'slide-left 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'slide-right': 'slide-right 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',

        // 모바일 바텀 시트 애니메이션 (더 부드럽게 수정)
        'bottom-sheet-up': 'bottom-sheet-up 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        'bottom-sheet-down':
          'bottom-sheet-down 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',

        // 데스크탑 패널 애니메이션 (더 부드럽게 수정)
        'desktop-panel-in':
          'desktop-panel-in 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        'desktop-panel-out':
          'desktop-panel-out 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',

        // 드래그 피드백 애니메이션
        'drag-feedback': 'drag-feedback 0.2s cubic-bezier(0.2, 0, 0.38, 0.9)',

        // 오버레이 애니메이션
        'overlay-in': 'overlay-in 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        'overlay-out': 'overlay-out 0.3s cubic-bezier(0.4, 0, 0.2, 1)',

        // 터치 햅틱 피드백
        'touch-haptic': 'touch-haptic 0.15s cubic-bezier(0.2, 0, 0.38, 0.9)',

        // 부드러운 바운스 애니메이션
        'bounce-soft': 'bounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'spring-gentle': 'bounce 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)',

        // 페이드 애니메이션
        'fade-in': 'fade-in 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-out': 'fade-out 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      },

      // 🎯 미리보기 패널 전용 커스텀 클래스
      backdropBlur: {
        panel: '12px',
      },

      boxShadow: {
        panel: '0 -4px 24px rgba(0, 0, 0, 0.15)',
        'panel-mobile': '0 -8px 32px rgba(0, 0, 0, 0.2)',
        'panel-desktop': '0 4px 24px rgba(0, 0, 0, 0.12)',
      },

      borderRadius: {
        panel: '1.5rem',
        'panel-mobile': '1.75rem',
      },

      zIndex: {
        panel: '40',
        'panel-overlay': '35',
        'panel-modal': '50',
      },
    },
  },

  darkMode: 'class',
  plugins: [heroui()],
};
