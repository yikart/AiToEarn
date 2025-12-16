'use client'

import { Toaster as Sonner, type ToasterProps } from 'sonner'

export const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-white group-[.toaster]:text-zinc-950 group-[.toaster]:border-zinc-200 group-[.toaster]:shadow-lg dark:group-[.toaster]:bg-zinc-950 dark:group-[.toaster]:text-zinc-50 dark:group-[.toaster]:border-zinc-800',
          description: 'group-[.toast]:text-zinc-500 dark:group-[.toast]:text-zinc-400',
          actionButton:
            'group-[.toast]:bg-zinc-900 group-[.toast]:text-zinc-50 dark:group-[.toast]:bg-zinc-50 dark:group-[.toast]:text-zinc-900',
          cancelButton:
            'group-[.toast]:bg-zinc-100 group-[.toast]:text-zinc-500 dark:group-[.toast]:bg-zinc-800 dark:group-[.toast]:text-zinc-400',
          success: 'group-[.toaster]:!bg-green-50 group-[.toaster]:!text-green-900 group-[.toaster]:!border-green-200 dark:group-[.toaster]:!bg-green-950 dark:group-[.toaster]:!text-green-100 dark:group-[.toaster]:!border-green-800',
          error: 'group-[.toaster]:!bg-red-50 group-[.toaster]:!text-red-900 group-[.toaster]:!border-red-200 dark:group-[.toaster]:!bg-red-950 dark:group-[.toaster]:!text-red-100 dark:group-[.toaster]:!border-red-800',
          warning: 'group-[.toaster]:!bg-yellow-50 group-[.toaster]:!text-yellow-900 group-[.toaster]:!border-yellow-200 dark:group-[.toaster]:!bg-yellow-950 dark:group-[.toaster]:!text-yellow-100 dark:group-[.toaster]:!border-yellow-800',
          info: 'group-[.toaster]:!bg-blue-50 group-[.toaster]:!text-blue-900 group-[.toaster]:!border-blue-200 dark:group-[.toaster]:!bg-blue-950 dark:group-[.toaster]:!text-blue-100 dark:group-[.toaster]:!border-blue-800',
        },
      }}
      {...props}
    />
  )
}

