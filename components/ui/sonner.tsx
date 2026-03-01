"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react"

function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:dark:bg-[#1c1c24] group-[.toaster]:border group-[.toaster]:border-black/10 group-[.toaster]:dark:border-white/5 group-[.toaster]:shadow-none p-4 rounded-xl flex items-start gap-3 w-full",
          title: "text-sm font-semibold text-black dark:text-white mt-1.5",
          description: "text-sm font-medium text-[#8A8C99] group-[.toast]:text-[#8A8C99]",
          actionButton:
            "group-[.toast]:bg-black group-[.toast]:dark:bg-white group-[.toast]:text-white group-[.toast]:dark:text-black rounded-lg text-sm font-medium",
          cancelButton:
            "group-[.toast]:bg-black/5 group-[.toast]:dark:bg-white/5 group-[.toast]:text-[#8A8C99] rounded-lg text-sm font-medium",
          closeButton: "text-[#8A8C99] hover:text-black dark:hover:text-white transition-colors cursor-pointer",
          icon: "shrink-0",
        },
      }}
      icons={{
        success: (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 shrink-0">
            <CheckCircle2 className="size-4.5" />
          </div>
        ),
        error: (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10 text-red-500 shrink-0">
            <AlertCircle className="size-4.5" />
          </div>
        ),
        warning: (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-500 shrink-0">
            <AlertTriangle className="size-4.5" />
          </div>
        ),
        info: (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-500 shrink-0">
            <Info className="size-4.5" />
          </div>
        ),
      }}
      {...props}
    />
  )
}

export { Toaster }
