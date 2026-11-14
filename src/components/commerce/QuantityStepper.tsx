import { useId } from "react";
import { Button } from "@/components/ui/Button";
interface QuantityStepperProps {
  value: string; onChange: (value: string) => void;
  min: number; step: number; max?: number; disabled?: boolean;
  label?: string; error?: string;
}
export function QuantityStepper({ value, onChange, min, step, max = 2147483647,
  disabled = false, label = "Quantity", error }: QuantityStepperProps) {
  const id = useId();
  const number = Number(value);
  const valid = Number.isSafeInteger(number) && number >= min && (number - min) % step === 0;
  const base = valid ? number : min;
  return <div className="space-y-2">
    <label htmlFor={id} className="block text-xs font-medium">{label}</label>
    <div className="inline-flex items-center gap-2">
      <Button variant="secondary" size="icon" aria-label={`Decrease ${label.toLowerCase()}`}
        disabled={disabled || (valid && base <= min)} onClick={() => onChange(String(Math.max(min, base - step)))}>−</Button>
      <input id={id} type="number" min={min} max={max} step={step} value={value}
        disabled={disabled} onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined}
        className="min-h-11 w-24 rounded-lg border border-border bg-surface px-2 text-center font-mono text-sm disabled:opacity-50" />
      <Button variant="secondary" size="icon" aria-label={`Increase ${label.toLowerCase()}`}
        disabled={disabled || base + step > max} onClick={() => onChange(String(valid ? base + step : min))}>+</Button>
    </div>
    {error && <p id={`${id}-error`} className="text-xs text-danger">{error}</p>}
  </div>;
}
