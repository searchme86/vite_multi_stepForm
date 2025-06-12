import React from 'react';

interface ToastManagerProps {
  maxToasts?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

function ToastManager({
  maxToasts = 5,
  position = 'top-right',
}: ToastManagerProps) {
  console.log('🔔 ToastManager: 토스트 매니저 렌더링', { maxToasts, position });

  return null;
}

export default ToastManager;
