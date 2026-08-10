"use client";

import { useEffect, useState } from "react";
import { isValidPhoneNumber } from "libphonenumber-js";
import { findCountryByCode } from "@/lib/countries";

interface PhoneInputProps {
  countryCode: string; // ISO code, e.g. "IN" -- drives the dial-code prefix shown
  value: string;        // the national number only, digits typed by the user
  onChange: (nationalNumber: string) => void;
  onValidityChange?: (isValid: boolean) => void;
}

/**
 * Phone input that shows a fixed dial-code prefix (derived from the
 * selected country) and validates the entered digits against that
 * country's real phone number rules via libphonenumber-js -- e.g. India
 * requires exactly 10 digits after +91; other countries have different
 * valid lengths, which this library already knows correctly rather than
 * us hand-rolling a wrong universal "must be N digits" rule.
 *
 * IMPORTANT: validity is computed and reported via useEffect, not during
 * render (e.g. inside useMemo). Calling a parent state setter during
 * render is a React anti-pattern that can cause an infinite render loop
 * if the parent's callback prop isn't referentially stable across
 * renders -- which is exactly what caused the page-freeze bug here
 * originally. useEffect runs strictly after render/commit, breaking that
 * cycle even if the parent passes a fresh inline function every time.
 */
export default function PhoneInput({ countryCode, value, onChange, onValidityChange }: PhoneInputProps) {
  const country = findCountryByCode(countryCode);
  const dialCode = country?.dialCode ?? "";
  const [isValid, setIsValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (!countryCode || !value) {
      setIsValid(null);
      onValidityChange?.(false);
      return;
    }
    let valid = false;
    try {
      valid = isValidPhoneNumber(value, countryCode as any);
    } catch {
      valid = false;
    }
    setIsValid(valid);
    onValidityChange?.(valid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryCode, value]);

  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="flex h-[46px] shrink-0 items-center rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-text-muted">
          {country ? `${country.flag} ${dialCode}` : "Select country first"}
        </span>
        <input
          type="tel"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))}
          placeholder="Phone number"
          disabled={!countryCode}
          className="input-field flex-1 disabled:opacity-50"
        />
      </div>
      {isValid === false && value.length > 0 && (
        <p className="mt-1 text-xs text-danger">
          Enter a valid phone number for {country?.name ?? "the selected country"}.
        </p>
      )}
    </div>
  );
}
