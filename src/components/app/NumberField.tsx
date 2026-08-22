import { Input } from "@/components/ui/input";
import { FieldError, HintLabel } from "@/components/app/FieldChrome";
import { useConfigStore } from "@/hooks/use-config";
import { cn } from "@/lib/utils";

export function NumberField({
  label,
  value,
  onChange,
  step = 1,
  hint,
  invalid,
  errorMessage,
  id,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  hint?: string;
  invalid?: boolean;
  errorMessage?: string;
  id?: string;
}) {
  const inputId = id ?? label.replace(/\s+/g, "-").toLowerCase();
  return (
    <div className="min-w-0">
      <HintLabel htmlFor={inputId} hint={hint}>
        {label}
      </HintLabel>
      <Input
        id={inputId}
        type="number"
        step={step}
        value={Number.isFinite(value) ? value : ""}
        aria-invalid={invalid || undefined}
        className={cn("font-mono text-sm tabular-nums")}
        onChange={(event) => {
          const next = Number(event.target.value);
          onChange(Number.isNaN(next) ? 0 : next);
        }}
      />
      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
    </div>
  );
}

export function ConfigNumberField({
  section,
  configKey,
  label,
  step = 1,
  hint,
  invalid,
  errorMessage,
}: {
  section: string;
  configKey: string;
  label: string;
  step?: number;
  hint?: string;
  invalid?: boolean;
  errorMessage?: string;
}) {
  const config = useConfigStore();
  return (
    <NumberField
      label={label}
      value={config.getNumber(section, configKey)}
      onChange={(value) => config.set(section, configKey, value)}
      step={step}
      hint={hint}
      invalid={invalid}
      errorMessage={errorMessage}
    />
  );
}
