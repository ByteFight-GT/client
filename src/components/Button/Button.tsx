import React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

const buttonVariants = cva(
	"bytefight-button",
  {
    variants: {
      variant: {
        default: "",
        destructive: "bytefight-button--var-destructive",
        outline: "bytefight-button--var-outline",
        secondary: "bytefight-button--var-secondary",
        ghost: "bytefight-button--var-ghost",
        link: "bytefight-button--var-link",
      },
      size: {
        default: "",
        sm: "bytefight-button--sz-sm",
        lg: "bytefight-button--sz-lg",
        icon: "bytefight-button--sz-icon",
				iconsm: "bytefight-button--sz-iconsm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps extends 
	React.ButtonHTMLAttributes<HTMLButtonElement>,
	VariantProps<typeof buttonVariants> 
{
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
			ref={ref}
			className={`${className} ${buttonVariants({ variant, size })}`}
			{...props} />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
