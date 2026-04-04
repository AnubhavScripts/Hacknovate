import * as React from "react"

const Card = React.forwardRef(({ className = "", ...props }, ref) => (
  <div
    ref={ref}
    className={`rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm shadow-sm hover:shadow-lg hover:border-slate-700 transition-all duration-300 overflow-hidden group ${className}`}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef(({ className = "", ...props }, ref) => (
  <div ref={ref} className={`flex flex-col space-y-2 px-6 py-5 border-b border-slate-800 ${className}`} {...props} />
))
CardHeader.displayName = "CardHeader"

const CardFooter = React.forwardRef(({ className = "", ...props }, ref) => (
  <div
    ref={ref}
    className={`flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/30 ${className}`}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

const CardTitle = React.forwardRef(({ className = "", ...props }, ref) => (
  <h2 ref={ref} className={`text-xl font-bold text-slate-100 leading-tight group-hover:text-blue-400 transition-colors ${className}`} {...props} />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef(({ className = "", ...props }, ref) => (
  <p ref={ref} className={`text-sm text-slate-400 font-normal group-hover:text-slate-300 ${className}`} {...props} />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef(({ className = "", ...props }, ref) => (
  <div ref={ref} className={`px-6 py-5 ${className}`} {...props} />
))
CardContent.displayName = "CardContent"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
