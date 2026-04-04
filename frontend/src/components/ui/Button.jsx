import * as React from "react"
import { Slot } from "@radix-ui/react-slot"

const buttonVariants = {
  // Premium primary button with gradient
  primary: "relative bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 text-white font-semibold shadow-lg shadow-blue-500/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/40 active:translate-y-0 active:shadow-md after:absolute after:inset-0 after:rounded-lg after:bg-gradient-to-r after:from-blue-400 after:to-blue-300 after:opacity-0 hover:after:opacity-20 after:transition-opacity",
  
  // Secondary button
  secondary: "bg-slate-100 text-slate-900 font-semibold hover:bg-slate-200 border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md active:bg-slate-150",
  
  // Outline button
  outline: "border-2 border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 hover:border-blue-400 hover:text-blue-600 transition-all",
  
  // Ghost button
  ghost: "text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 font-medium transition-colors",
  
  // Destructive/Delete button
  destructive: "bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold shadow-lg shadow-red-500/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-red-500/40 active:translate-y-0",
  
  // Success button
  success: "bg-gradient-to-r from-green-600 to-green-500 text-white font-semibold shadow-lg shadow-green-500/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-green-500/40 active:translate-y-0",
  
  // Warning button
  warning: "bg-gradient-to-r from-amber-600 to-amber-500 text-white font-semibold shadow-lg shadow-amber-500/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-500/40 active:translate-y-0",
}

const sizeVariants = {
  xs: "px-2.5 py-1.5 text-xs rounded-lg",
  sm: "px-3.5 py-2 text-sm rounded-lg",
  md: "px-5 py-2.5 text-base rounded-lg",
  lg: "px-7 py-3.5 text-lg rounded-lg",
  xl: "px-8 py-4 text-lg rounded-xl",
}

const Button = React.forwardRef(
  ({ className = "", variant = "primary", size = "md", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    return (
      <Comp
        className={`inline-flex items-center justify-center font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:shadow-none gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 relative overflow-hidden ${buttonVariants[variant]} ${sizeVariants[size]} ${className}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
