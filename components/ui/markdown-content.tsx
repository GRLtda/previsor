'use client'

import ReactMarkdown from 'react-markdown'

interface MarkdownContentProps {
    content: string
    className?: string
}

export function MarkdownContent({ content, className = '' }: MarkdownContentProps) {
    return (
        <div className={`prose-custom ${className}`}>
            <ReactMarkdown
                components={{
                    h1: ({ children }) => (
                        <h3 className="text-base font-bold dark:text-white mt-4 mb-2 first:mt-0">{children}</h3>
                    ),
                    h2: ({ children }) => (
                        <h4 className="text-[15px] font-bold dark:text-white mt-4 mb-2 first:mt-0">{children}</h4>
                    ),
                    h3: ({ children }) => (
                        <h5 className="text-[14px] font-semibold dark:text-white mt-3 mb-1.5">{children}</h5>
                    ),
                    p: ({ children }) => (
                        <p className="text-[14px] font-medium text-[#606E85] dark:text-[#A1A7BB] mb-2 leading-relaxed">{children}</p>
                    ),
                    strong: ({ children }) => (
                        <strong className="font-bold text-foreground dark:text-white/90">{children}</strong>
                    ),
                    ul: ({ children }) => (
                        <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
                    ),
                    ol: ({ children }) => (
                        <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
                    ),
                    li: ({ children }) => (
                        <li className="text-[14px] font-medium text-[#606E85] dark:text-[#A1A7BB]">{children}</li>
                    ),
                    hr: () => (
                        <hr className="border-border/40 my-3" />
                    ),
                    a: ({ href, children }) => (
                        <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                            {children}
                        </a>
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    )
}
