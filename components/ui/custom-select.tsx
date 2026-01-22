'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface SelectOption {
    value: string
    label: string
}

interface CustomSelectProps {
    options: SelectOption[]
    value: string
    onChange: (value: string) => void
    placeholder?: string
    prefix?: string
    className?: string
}

export function CustomSelect({
    options,
    value,
    onChange,
    placeholder = 'Selecione',
    prefix,
    className
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const selectRef = useRef<HTMLDivElement>(null)

    const selectedOption = options.find(opt => opt.value === value)

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div ref={selectRef} className={cn("relative h-10 min-w-[175px] rounded-lg", className)}>
            {/* Trigger */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex size-full items-center justify-between whitespace-nowrap rounded-lg border border-black/10 bg-white px-3 py-2 text-[13px] font-medium text-muted-foreground dark:border-none dark:bg-white/5 dark:text-white"
            >
                <div className="text-muted-foreground">
                    {prefix && <span>{prefix}: </span>}
                    <span className="ml-0.5 text-foreground">
                        {selectedOption?.label || placeholder}
                    </span>
                </div>
                <svg
                    className={cn(
                        "ml-6 size-4 transition-transform duration-300",
                        isOpen && "rotate-180"
                    )}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 top-full z-20 mt-1 h-auto w-full animate-fade-down rounded-md border border-black/5 bg-white shadow-lg dark:border-white/5 dark:bg-[#1E2024] dark:shadow-none lg:left-0">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                                onChange(option.value)
                                setIsOpen(false)
                            }}
                            className="w-full px-4 h-10 text-left flex items-center text-muted-foreground dark:text-white text-sm font-medium justify-between hover:bg-black/5 dark:hover:bg-white/5"
                        >
                            <span>{option.label}</span>
                            <div className="relative flex items-center justify-center">
                                <input
                                    type="radio"
                                    checked={value === option.value}
                                    readOnly
                                    className="peer size-4 cursor-pointer appearance-none rounded-full border border-muted-foreground checked:border-blue-500 dark:border-gray-600 dark:checked:border-blue-500"
                                />
                                <div className={cn(
                                    "pointer-events-none absolute inset-0 z-0 m-auto size-[10px] rounded-full",
                                    value === option.value && "bg-blue-500"
                                )} />
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
