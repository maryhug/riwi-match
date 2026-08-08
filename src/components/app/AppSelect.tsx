import type { ReactNode } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type AppSelectProps = {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  onValueChange: (value: string) => void;
  placeholder?: string;
  value: string;
};

/** Standard app selector, visually aligned with the floating navigation menu. */
export function AppSelect({
  children,
  className,
  disabled,
  onValueChange,
  placeholder,
  value,
}: AppSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        aria-label={placeholder}
        className={cn(
          "h-10 rounded-xl border-border bg-card/80 px-3 text-sm shadow-sm backdrop-blur-xl transition hover:bg-card focus:ring-2 focus:ring-primary/40",
          className,
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-52 rounded-xl border-border bg-card/95 p-1.5 shadow-xl backdrop-blur-md">
        {children}
      </SelectContent>
    </Select>
  );
}

export function AppSelectItem({ children, value }: { children: ReactNode; value: string }) {
  return (
    <SelectItem
      value={value}
      className="cursor-pointer rounded-lg py-2 pl-2.5 pr-8 text-xs focus:bg-primary/10 focus:text-primary data-[state=checked]:bg-primary/10 data-[state=checked]:font-semibold data-[state=checked]:text-primary"
    >
      {children}
    </SelectItem>
  );
}
