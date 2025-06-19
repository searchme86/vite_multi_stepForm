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
    },
  },
  darkMode: 'class',
  plugins: [heroui()],
};
