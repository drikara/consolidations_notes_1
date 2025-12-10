//lib/toast.ts
'use client'

import { toast as hotToast } from 'react-hot-toast'

export const toast = {
  success: (message: string) => hotToast.success(message, {
    duration: 4000,
    position: 'top-right',
    style: {
      background: '#10b981',
      color: 'white',
      fontWeight: '500',
    },
  }),
  error: (message: string) => hotToast.error(message, {
    duration: 5000,
    position: 'top-right',
    style: {
      background: '#ef4444',
      color: 'white',
      fontWeight: '500',
    },
  }),
  loading: (message: string) => hotToast.loading(message, {
    position: 'top-right',
    style: {
      background: '#f59e0b',
      color: 'white',
      fontWeight: '500',
    },
  }),
}