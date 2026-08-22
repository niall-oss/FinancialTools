import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldError, HintLabel } from "@/components/app/FieldChrome";
import { useConfigStore } from "@/hooks/use-config";
import { cn } from "@/lib/utils";

export function SelectField({
  label,
  value,
  options,
  onChange,
  hint,
  invalid,
  errorMessage,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  hint?: string;
  invalid?: boolean;
  errorMessage?: string;
}) {
  return (
    <div className="min-w-0">
      <HintLabel hint={hint}>{label}</HintLabel>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          size="sm"
          aria-invalid={invalid || undefined}
          className={cn("h-8 w-full font-mono text-sm")}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" align="start" className="w-(--radix-select-trigger-width)">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} className="font-mono text-sm">
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
    </div>
  );
}

export function ConfigSelectField({
  section,
  configKey,
  label,
  options,
  hint,
  invalid,
  errorMessage,
}: {
  section: string;
  configKey: string;
  label: string;
  options: { value: string; label: string }[];
  hint?: string;
  invalid?: boolean;
  errorMessage?: string;
}) {
  const config = useConfigStore();
  return (
    <SelectField
      label={label}
      value={config.getString(section, configKey)}
      options={options}
      onChange={(value) => config.set(section, configKey, value)}
      hint={hint}
      invalid={invalid}
      errorMessage={errorMessage}
    />
  );
}
