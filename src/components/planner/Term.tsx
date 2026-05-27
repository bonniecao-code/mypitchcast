import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { glossary, type GlossaryKey } from "@/lib/glossary";
import { cn } from "@/lib/utils";

type Props = {
  term: GlossaryKey;
  children: React.ReactNode;
  className?: string;
  hideIcon?: boolean;
};

/**
 * Wraps a label in a tooltip that explains the financial term in plain English.
 * Use for any jargon: MRR, ARR, LTV, CAC, churn, burn, COGS, mix %, etc.
 */
export function Term({ term, children, className, hideIcon }: Props) {
  const entry = glossary[term];
  if (!entry) return <>{children}</>;
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center gap-1 cursor-help underline decoration-dotted decoration-muted-foreground/50 underline-offset-4",
              className
            )}
          >
            {children}
            {!hideIcon && <HelpCircle className="h-3 w-3 text-muted-foreground/60" />}
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-[260px] bg-popover border border-border text-popover-foreground p-3"
        >
          <div className="font-display text-sm font-semibold mb-1">{entry.title}</div>
          <div className="text-xs text-muted-foreground leading-relaxed">{entry.body}</div>
          {entry.example && (
            <div className="text-[10px] text-primary/90 mt-2 num">{entry.example}</div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
