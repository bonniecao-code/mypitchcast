import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (v: string) => void;
  as?: "div" | "span" | "h3";
  className?: string;
  placeholder?: string;
  multiline?: boolean;
};

export function EditableText({
  value,
  onChange,
  as: Tag = "div",
  className,
  placeholder,
  multiline = false,
}: Props) {
  const ref = useRef<HTMLElement | null>(null);

  // Keep DOM in sync when value changes externally (e.g. AI seed, reset).
  useEffect(() => {
    if (ref.current && ref.current.innerText !== value) {
      ref.current.innerText = value;
    }
  }, [value]);

  return (
    <Tag
      ref={ref as never}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      onBlur={(e) => {
        const next = (e.currentTarget as HTMLElement).innerText.trim();
        if (next !== value) onChange(next);
      }}
      onKeyDown={(e) => {
        if (!multiline && e.key === "Enter") {
          e.preventDefault();
          (e.currentTarget as HTMLElement).blur();
        }
      }}
      className={cn(
        "outline-none rounded px-1 -mx-1 transition-colors",
        "hover:bg-secondary/40 focus:bg-secondary/60 focus:ring-1 focus:ring-primary/40",
        "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/60",
        className
      )}
    />
  );
}
