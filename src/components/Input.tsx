import React from "react"

import { cn } from "@/lib/utils";

export interface InputProps extends React.ComponentProps<"input"> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ className = "", ...props }, ref) => {
		return (
			<input
			className={cn(
				"w-full border border-border bg-secondary text-sm px-3 py-1 transition-all duration-100",
				"placeholder:text-muted-foreground",
				"disabled:cursor-not-allowed disabled:opacity-50",
				"file:border-0 file:bg-transparent file:font-medium file:text-foreground",
				className
			)}
			ref={ref}
			{...props} />
		)
	}
)
Input.displayName = "Input"

export { Input }
