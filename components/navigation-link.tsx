"use client"

import Link from "next/link"
import { type ComponentProps } from "react"
import { useNavigationFeedback } from "@/components/navigation-feedback"

type NavigationLinkProps = Omit<ComponentProps<typeof Link>, "href"> & { href: string }

export function NavigationLink({ href, children, onClick, ...props }: NavigationLinkProps) {
  const beginNavigation = useNavigationFeedback()
  return (
    <Link
      {...props}
      prefetch={props.prefetch ?? true}
      href={href}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || props.target || props.download) return
        const destination = new URL(href, window.location.href)
        if (destination.origin !== window.location.origin || (destination.pathname === window.location.pathname && destination.search === window.location.search)) return
        beginNavigation?.()
      }}
    >
      {children}
    </Link>
  )
}
