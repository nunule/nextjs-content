import React from "react"

export function SiteLogo({ className = "w-9 h-9" }: { className?: string }) {
  return (
    <span
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden rounded-xl bg-white border-[1.5px] border-black shadow-sm transition-transform duration-200 group-hover:scale-105 ${className}`}
      aria-label="雪落山庄标志"
      role="img"
    >
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2005/svg"
        className="w-full h-full p-1"
      >
        {/* 纯白底色 */}
        <rect width="40" height="40" rx="6" fill="#ffffff" />

        {/* 飘雪纹样 / 晶体雪花与雪点 */}
        <circle cx="10" cy="11" r="1.2" fill="#000000" />
        <circle cx="30" cy="9" r="1" fill="#000000" />
        <circle cx="14" cy="20" r="0.9" fill="#000000" />
        <circle cx="28" cy="17" r="1.1" fill="#000000" />

        {/* 顶部主雪花 */}
        <path
          d="M20 5V11M17 8H23M17.5 6.5L22.5 9.5M17.5 9.5L22.5 6.5"
          stroke="#000000"
          strokeWidth="1.4"
          strokeLinecap="round"
        />

        {/* 山庄飞檐屋脊 (中式楼阁剪影线条) */}
        <path
          d="M12 21C15 20.2 18 18 20 16C22 18 25 20.2 28 21"
          stroke="#000000"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* 楼宇廊柱 */}
        <path
          d="M16 21.2V26M24 21.2V26"
          stroke="#000000"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M14 26H26"
          stroke="#000000"
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        {/* 雪山山峦连线 (双重雪峰) */}
        <path
          d="M4 35L13 25L18 29.5L26 21L36 35"
          stroke="#000000"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* 地平雪基线 */}
        <path
          d="M3 35H37"
          stroke="#000000"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  )
}
