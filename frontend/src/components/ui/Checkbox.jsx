import * as React from "react"
import { Check } from "lucide-react"

const Checkbox = React.forwardRef(({ className = "", checked = false, ...props }, ref) => (
  <div
    ref={ref}
    className={`flex h-5 w-5 items-center justify-center rounded border-2 border-gray-300 transition-colors ${
      checked ? 'bg-blue-600 border-blue-600' : 'bg-white hover:border-gray-400'
    } cursor-pointer ${className}`}
    {...props}
  >
    {checked && <Check size={16} className="text-white" />}
  </div>
))
Checkbox.displayName = "Checkbox"

export { Checkbox }
