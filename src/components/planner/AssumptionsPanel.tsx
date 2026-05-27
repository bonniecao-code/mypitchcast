import type { Assumptions } from "@/lib/forecast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  value: Assumptions;
  onChange: (a: Assumptions) => void;
};

const fields: { key: keyof Assumptions; label: string; suffix?: string }[] = [
  { key: "startingVisitors", label: "Starting monthly visitors" },
  { key: "visitorGrowthPct", label: "Visitor growth", suffix: "% / mo" },
  { key: "signupConvPct", label: "Visitor → signup", suffix: "%" },
  { key: "paidConvPct", label: "Signup → paid", suffix: "%" },
  { key: "monthlyChurnPct", label: "Monthly churn", suffix: "%" },
  { key: "cac", label: "CAC", suffix: "$" },
  { key: "fixedCostsMonthly", label: "Fixed costs", suffix: "$/mo" },
  { key: "variableCostPct", label: "Variable costs", suffix: "% of rev" },
  { key: "months", label: "Forecast horizon", suffix: "months" },
];

export function AssumptionsPanel({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {fields.map((f) => (
        <div key={f.key}>
          <Label className="text-xs text-muted-foreground flex justify-between">
            <span>{f.label}</span>
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
