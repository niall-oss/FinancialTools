export interface ProfileField {
  key: string;
  label: string;
  type: "number" | "text";
}

export const PROFILE_FIELDS: ProfileField[] = [
  { key: "annual_salary", label: "Annual salary (€)", type: "number" },
  { key: "age", label: "Age", type: "number" },
];
