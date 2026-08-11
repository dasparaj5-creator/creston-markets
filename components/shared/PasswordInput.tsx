"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Optional icon rendered on the left side (e.g. a lock icon), matching
   *  the visual style used on the login page. */
  leftIcon?: React.ReactNode;
}

/**
 * Drop-in replacement for a plain password <input>, adding an eye icon to
 * toggle visibility. Forwards its ref so it works directly with react-hook-
 * form's register() spread, e.g. <PasswordInput {...register("password")} />.
 */
const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, leftIcon, ...props }, ref) => {
    const [visible, setVisible] = useState(false);

    return (
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">{leftIcon}</span>
        )}
        <input
          ref={ref}
          type={visible ? "text" : "password"}
          className={cn("input-field pr-11", leftIcon && "pl-10", className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          tabIndex={-1}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-gold"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

export default PasswordInput;
