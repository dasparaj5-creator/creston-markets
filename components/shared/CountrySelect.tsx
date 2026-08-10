"use client";

import Select, { SingleValue } from "react-select";
import { COUNTRIES, type CountryOption } from "@/lib/countries";

const selectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderColor: state.isFocused ? "rgba(212,175,55,0.5)" : "rgba(255,255,255,0.1)",
    boxShadow: "none",
    borderRadius: "0.5rem",
    minHeight: "46px",
    "&:hover": { borderColor: "rgba(212,175,55,0.5)" },
  }),
  menu: (base: any) => ({
    ...base,
    backgroundColor: "#111827",
    border: "1px solid rgba(255,255,255,0.1)",
    zIndex: 50,
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isFocused ? "rgba(212,175,55,0.1)" : "transparent",
    color: state.isSelected ? "#D4AF37" : "#F9FAFB",
    cursor: "pointer",
  }),
  singleValue: (base: any) => ({ ...base, color: "#F9FAFB" }),
  input: (base: any) => ({ ...base, color: "#F9FAFB" }),
  placeholder: (base: any) => ({ ...base, color: "#6B7280" }),
};

export default function CountrySelect({
  value,
  onChange,
  placeholder = "Select country…",
}: {
  value: string; // ISO code, e.g. "IN"
  onChange: (isoCode: string) => void;
  placeholder?: string;
}) {
  const selected = COUNTRIES.find((c) => c.code === value) ?? null;

  return (
    <Select<CountryOption>
      instanceId="country-select"
      options={COUNTRIES}
      value={selected}
      onChange={(opt: SingleValue<CountryOption>) => onChange(opt?.code ?? "")}
      getOptionLabel={(c) => `${c.flag} ${c.name}`}
      getOptionValue={(c) => c.code}
      placeholder={placeholder}
      styles={selectStyles}
      classNamePrefix="country-select"
    />
  );
}
