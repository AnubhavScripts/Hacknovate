import * as React from "react"
import { Slot } from "@radix-ui/react-slot"

const buttonVariants = {
  primary: "bg-blue-600 text-white hover:bg-blue-700",
  secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300",
  outline: "border border-gray-300 text-gray-900 hover:bg-gray-50",
  ghost: "hover:bg-gray-100 text-gray-900",
  destructive: "bg-red-600 text-white hover:bg-red-700",
}

const sizeVariants = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
}

const Button = React.forwardRef(
  ({ className = "", variant = "primary", size = "md", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    return (
      <Comp
        className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${buttonVariants[variant]} ${sizeVariants[size]} ${className}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
