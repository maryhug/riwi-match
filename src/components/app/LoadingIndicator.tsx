import curvaMatchLogo from "@/assets/CurvaMatch.svg";
import { cn } from "@/lib/utils";

type LoadingIndicatorProps = {
  className?: string;
  label?: string;
};

/** Branded, looping feedback for data-loading regions. */
export function LoadingIndicator({ className, label = "Cargando…" }: LoadingIndicatorProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground",
        className,
      )}
    >
      <img src={curvaMatchLogo} alt="" aria-hidden="true" className="login-logo-loading w-28" />
      <span>{label}</span>
    </div>
  );
}
