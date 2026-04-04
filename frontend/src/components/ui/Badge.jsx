import * as React from "react"

const Badge = React.forwardRef(({ className = "", variant = "default", ...props }, ref) => {
  const variants = {
    default: "bg-blue-100/80 text-blue-700 border border-blue-200/60 shadow-sm font-semibold",
    secondary: "bg-slate-100/80 text-slate-700 border border-slate-200/60 shadow-sm font-semibold",
    success: "bg-green-100/80 text-green-700 border border-green-200/60 shadow-sm font-semibold",
    warning: "bg-amber-100/80 text-amber-700 border border-amber-200/60 shadow-sm font-semibold",
    destructive: "bg-red-100/80 text-red-700 border border-red-200/60 shadow-sm font-semibold",
    active: "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200/60 shadow-sm font-semibold",
    paused: "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border border-amber-200/60 shadow-sm font-semibold",
  }

  return (
    <div
      ref={ref}
      className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold transition-all duration-200 hover:shadow-md ${variants[variant]} ${className}`}
      {...props}
    />
  )
})
Badge.displayName = "Badge"

export { Badge }
