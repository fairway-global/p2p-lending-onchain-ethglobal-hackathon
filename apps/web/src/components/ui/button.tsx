import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap border-2 font-inter text-body-m font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-celo-purple disabled:pointer-events-none disabled:opacity-50 disabled:bg-celo-inactive disabled:text-white',
  {
    variants: {
      variant: {
        default: 'bg-celo-yellow text-black border-black hover:bg-black hover:text-celo-yellow hover:border-celo-yellow',
        destructive:
          'bg-celo-error text-white border-black hover:bg-black hover:text-celo-error hover:border-celo-error',
        outline:
          'border-2 border-black bg-transparent text-black hover:bg-black hover:text-celo-yellow',
        secondary:
          'bg-celo-purple text-white border-black hover:bg-black hover:text-celo-purple hover:border-celo-purple',
        accent:
          'bg-celo-forest-green text-white border-black hover:bg-black hover:text-celo-forest-green hover:border-celo-forest-green',
        ghost: 'bg-transparent text-black border-transparent hover:bg-celo-dark-tan hover:border-black',
        link: 'bg-transparent text-black border-transparent underline underline-offset-4 hover:text-celo-purple',
      },
      size: {
        default: 'h-12 px-6 py-3',
        sm: 'h-10 px-4 py-2 text-body-s',
        lg: 'h-14 px-8 py-4 text-body-l',
        icon: 'h-12 w-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
