import React from "react"

export interface InputProps extends React.ComponentProps<"input"> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ className = "", ...props }, ref) => {
		return (
			<input
			className={`bytefight-input ${className}`}
			ref={ref}
			{...props} />
		)
	}
)
Input.displayName = "Input"

export { Input }
