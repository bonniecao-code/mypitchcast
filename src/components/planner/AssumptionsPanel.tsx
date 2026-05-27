import type { Assumptions } from "@/lib/forecast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Term } from "./Term";
import type { GlossaryKey } from "@/lib/glossary";

type Props = {
  value: Assumptions;
  onChange: (a: Assumptions) => void;
};

const fields: { key: keyof Assumptions; label: string; suffix?: string; term?: GlossaryKey }[] = [
  { key: "startingVisitors",   label: "Starting monthly visitors", term: "visitors" },
  { key: "visitorGrowthPct",   label: "Visitor growth", suffix: "% / mo" },
  { key: "signupConvPct",      label: "Visitor → signup", suffix: "%", term: "signup-conv" },
  { key: "paidConvPct",        label: "Signup → paid",   suffix: "%", term: "paid-conv" },
  { key: "monthlyChurnPct",    label: "Monthly churn",   suffix: "%", term: "churn" },
  { key: "cac",                label: "CAC", suffix: "$", term: "cac" },
  { key: "fixedCostsMonthly",  label: "Fixed costs", suffix: "$/mo", term: "fixed-costs" },
  { key: "variableCostPct",    label: "Variable costs", suffix: "% of rev", term: "variable-costs" },
  { key: "months",             label: "Forecast horizon", suffix: "months" },
];

export function AssumptionsPanel({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {fields.map((f) => (
        <div key={f.key}>
          <Label className="text-xs text-muted-foreground flex justify-between">
            <span>{f.term ? <Term term={f.term}>{f.label}</Term> : f.label}</span>
            {f.suffix && <span className="text-muted-foreground/70">{f.suffix}</span>}
          </Label>
          <Input
            type="number"
            className="num"
            value={value[f.key]}
            onChange={(e) => onChange({ ...value, [f.key]: Number(e.target.value) })}
          />
        </div>
      ))}
    </div>
  );
}
