// Prepoznavanje stolpcev pri uvozu Excel/CSV datotek. Podpira slovenske in
// angleške različice naslovov stolpcev, ne glede na velike/male črke in
// šumnike (š, č, ž).

export interface ImportRow {
  firstName?: string;
  lastName?: string;
  company?: string;
  phone?: string;
  email?: string;
  notes?: string;
}

const ALIASES: Record<string, keyof ImportRow> = {
  ime: "firstName",
  name: "firstName",
  "first name": "firstName",
  firstname: "firstName",

  priimek: "lastName",
  surname: "lastName",
  "last name": "lastName",
  lastname: "lastName",

  podjetje: "company",
  company: "company",
  organizacija: "company",
  organization: "company",

  telefon: "phone",
  tel: "phone",
  phone: "phone",
  "phone number": "phone",
  "telefonska stevilka": "phone",

  email: "email",
  mail: "email",
  "e posta": "email",
  "e-posta": "email",
  "e mail": "email",
  "e-mail": "email",

  opombe: "notes",
  opomba: "notes",
  notes: "notes",
  note: "notes",
  komentar: "notes",
  comment: "notes",
};

function stripDiacritics(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function normalize(value: string): string {
  return stripDiacritics(value.toString().trim().toLowerCase());
}

const NORMALIZED_ALIASES: Record<string, keyof ImportRow> = Object.fromEntries(
  Object.entries(ALIASES).map(([k, v]) => [normalize(k), v])
);

export function mapHeader(header: string): keyof ImportRow | null {
  const n = normalize(header);
  return NORMALIZED_ALIASES[n] ?? null;
}

export const EXPECTED_COLUMNS_HINT =
  "Ime, Priimek, Podjetje, Telefon, E-pošta, Opombe";
