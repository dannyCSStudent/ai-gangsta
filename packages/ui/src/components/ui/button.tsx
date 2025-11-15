import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../../utils/cn"; // make sure you have this helper (typical in shadcn setup)

/**
 * Base button style variants
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-2xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none shadow-sm",
  {
    variants: {
      variant: {
        default:
          "bg-green-500 text-black hover:bg-green-600 active:bg-green-700",
        secondary:
          "bg-zinc-800 text-white hover:bg-zinc-700 active:bg-zinc-600",
        outline:
          "border border-zinc-700 text-white hover:bg-zinc-800/50",
        ghost:
          "text-zinc-400 hover:text-white hover:bg-zinc-800/40",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

/**
 * Button component
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
