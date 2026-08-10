import countriesData from "world-countries";

export interface CountryOption {
  code: string;      // ISO 3166-1 alpha-2, e.g. "IN"
  name: string;       // e.g. "India"
  dialCode: string;   // e.g. "+91"
  flag: string;        // emoji flag
}

export const COUNTRIES: CountryOption[] = countriesData
  .filter((c) => c.idd?.root)
  .map((c) => ({
    code: c.cca2,
    name: c.name.common,
    dialCode: `${c.idd.root}${c.idd.suffixes?.[0] ?? ""}`,
    flag: c.flag,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export function findCountryByCode(code: string): CountryOption | undefined {
  return COUNTRIES.find((c) => c.code === code);
}
