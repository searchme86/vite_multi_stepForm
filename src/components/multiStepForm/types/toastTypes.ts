export interface ToastOptions {
  title: string;
  description: string;
  color: 'success' | 'danger' | 'warning' | 'primary';
  hideCloseButton?: boolean;
}

export type ToastColor = 'success' | 'danger' | 'warning' | 'primary';

export interface ToastElementConfig {
  className: string;
  innerHTML: string;
  timeout: number;
}
