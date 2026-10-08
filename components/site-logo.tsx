import Image from "next/image"

export function SiteLogo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <Image
      src="/icon.svg"
      alt="雪落山庄标志"
      width={64}
      height={64}
      priority
      unoptimized
      className={`shrink-0 dark:invert ${className}`}
    />
  )
}
