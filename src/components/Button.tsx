import React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { LoadingSpinner } from "./LoadingSpinner"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./Tooltip"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition duration-100 cursor-default hover:brightness-[80%] active:brightness-[70%] disabled:pointer-events-none disabled:brightness-50 disabled:saturate-80 [&_svg.lucide]:text-muted-foreground",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border border-border bg-background text-foreground",
        secondary: "border border-border bg-secondary text-foreground",
        ghost: "bg-transparent text-foreground hover:bg-secondary hover:text-secondary-foreground",
        link: "bg-transparent text-muted-foreground underline underline-offset-2",
      },
      size: {
        default: "px-3 py-1",
        sm: "px-2",
        lg: "h-11 px-8",
        icon: "h-10 w-10 p-0",
        iconsm: "h-8 w-8 p-0",
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
  asChild?: boolean;
  loading?: boolean;
  tooltip?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, tooltip, asChild = false, loading = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return loading? (
      <Comp
      ref={ref}
      disabled
      className={cn("relative", buttonVariants({ variant, size, className }))}
      {...props}>
        {children}
        <div className="absolute-cover backdrop-brightness-50 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </Comp>
    ) : (
      tooltip? (
        <TooltipProvider>
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <Comp
              ref={ref}
              className={cn(buttonVariants({ variant, size, className }))}
              {...props}>
                {children}
              </Comp>
            </TooltipTrigger>
            <TooltipContent>
              {tooltip}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}>
          {children}
        </Comp>
      )
    );
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
