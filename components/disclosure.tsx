"use client"

import { useId, useState, type ReactNode } from "react"

interface DisclosureProps {
  title: ReactNode
  children: ReactNode
  defaultOpen?: boolean
  className?: string
  buttonClassName?: string
  label?: string
}

export function Disclosure({ title, children, defaultOpen = false, className = "", buttonClassName = "", label }: DisclosureProps) {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()

  return (
    <div className={className}>
      <button
        type="button"
        className={`flex w-full items-center justify-between gap-3 text-left ${buttonClassName}`}
        aria-label={label}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
      >
        <span className="min-w-0 flex-1">{title}</span>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`h-4 w-4 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      <div id={id} className="disclosure-content" data-open={open} aria-hidden={!open} {...(!open ? { inert: "" } : {})}>
        <div className="min-h-0 overflow-hidden">{children}</div>
      </div>
    </div>
  )
}
