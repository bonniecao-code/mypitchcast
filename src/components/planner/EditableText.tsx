import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
  className?: string;
  ariaLabel?: string;
};

/**
 * Click-to-edit text. Renders as a styled span/div with a dotted underline on hover
 * to hint editability. Commits on blur.
 */
export function EditableText({
  value,
  onChange,
  placeholder = "Click to edit",
  multiline = false,
  maxLength = 500,
  className,
  ariaLabel,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // Keep DOM in sync when value changes from outside (e.g. reset).
  useEffect(() => {
    const el = ref.current;
    if (el && el.textContent !== value) {
      el.textContent = value;
    }
  }, [value]);

  return (
    <div
      ref={ref}
      role="textbox"
      aria-label={ariaLabel}
      aria-multiline={multiline}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      onKeyDown={(e) => {
        if (!multiline && e.key === "Enter") {
          e.preventDefault();
          (e.target as HTMLElement).blur();
        }
      }}
      onBlur={(e) => {
        let text = (e.currentTarget.textContent ?? "").trim();
        if (text.length > maxLength) text = text.slice(0, maxLength);
        if (text !== value) onChange(text);
      }}
      className={cn(
        "outline-none rounded-sm transition",
        "hover:bg-primary/5 focus:bg-primary/10 px-1 -mx-1",
        "border-b border-dashed border-transparent hover:border-primary/40 focus:border-primary",
        "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/50",
        className,
      )}
    >
      {value}
    </div>
  );
}
