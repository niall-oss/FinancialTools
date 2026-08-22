import { Checkbox } from "@/components/ui/checkbox";
import { HintLabel } from "@/components/app/FieldChrome";
import { useConfigStore } from "@/hooks/use-config";

export function CheckboxField({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  hint?: string;
}) {
  return (
    <div className="flex min-h-8 items-center gap-2">
      <Checkbox checked={checked} onCheckedChange={(value) => onChange(value === true)} />
      <HintLabel hint={hint} className="mb-0">{label}</HintLabel>
    </div>
  );
}

export function ConfigCheckboxField({
  section,
  configKey,
  label,
  hint,
}: {
  section: string;
  configKey: string;
  label: string;
  hint?: string;
}) {
  const config = useConfigStore();
  return (
    <CheckboxField
      label={label}
      checked={config.getBoolean(section, configKey)}
      onChange={(value) => config.set(section, configKey, value)}
      hint={hint}
    />
  );
}
