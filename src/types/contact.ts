// Statusi kontakta / klica. Shranjeni so kot navaden string (glej
// prisma/schema.prisma), ta datoteka pa je "vir resnice" za dovoljene
// vrednosti, oznake, barve in ikone po celotni aplikaciji.

export const CONTACT_STATUSES = [
  "NEW",
  "NO_ANSWER",
  "INTERESTED",
  "OFFER_SENT",
  "REJECTED",
] as const;

export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export function isContactStatus(value: string): value is ContactStatus {
  return (CONTACT_STATUSES as readonly string[]).includes(value);
}

interface StatusConfig {
  label: string;
  shortLabel: string;
  icon: string;
  dotClass: string; // barva pike/kroga
  badgeClass: string; // barva značke (bg + text)
  buttonClass: string; // barva gumba v vmesniku za klicanje
}

export const STATUS_CONFIG: Record<ContactStatus, StatusConfig> = {
  NEW: {
    label: "Nov",
    shortLabel: "Nov",
    icon: "⚪",
    dotClass: "bg-gray-300",
    badgeClass: "bg-gray-100 text-gray-700",
    buttonClass: "bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-300",
  },
  NO_ANSWER: {
    label: "Ni odgovora",
    shortLabel: "Ni odg.",
    icon: "🟡",
    dotClass: "bg-yellow-400",
    badgeClass: "bg-yellow-100 text-yellow-800",
    buttonClass:
      "bg-yellow-50 text-yellow-800 hover:bg-yellow-100 border-yellow-300",
  },
  INTERESTED: {
    label: "Zainteresiran / Sestanek",
    shortLabel: "Zainteresiran",
    icon: "🟢",
    dotClass: "bg-green-500",
    badgeClass: "bg-green-100 text-green-800",
    buttonClass:
      "bg-green-50 text-green-800 hover:bg-green-100 border-green-300",
  },
  OFFER_SENT: {
    label: "Poslana ponudba",
    shortLabel: "Ponudba",
    icon: "🔵",
    dotClass: "bg-blue-500",
    badgeClass: "bg-blue-100 text-blue-800",
    buttonClass: "bg-blue-50 text-blue-800 hover:bg-blue-100 border-blue-300",
  },
  REJECTED: {
    label: "Zavrnil",
    shortLabel: "Zavrnil",
    icon: "🔴",
    dotClass: "bg-red-500",
    badgeClass: "bg-red-100 text-red-800",
    buttonClass: "bg-red-50 text-red-800 hover:bg-red-100 border-red-300",
  },
};

// Kateri statusi na leaderboardu štejejo kot "uspešen klic"
export const SUCCESS_STATUSES: ContactStatus[] = ["INTERESTED", "OFFER_SENT"];

export interface AgentDTO {
  id: string;
  firstName: string;
  lastName: string;
  // Null pri starih zapisih, ustvarjenih pred uvedbo prijave z geslom -
  // taki agenti se ne morejo prijaviti, dokler jim admin ne nastavi obeh.
  username: string | null;
  isAdmin: boolean;
  active: boolean;
}

export interface ContactDTO {
  id: string;
  firstName: string;
  lastName: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  status: ContactStatus;
  createdAt: string;
  updatedAt: string;
  // Kateremu agentu je kontakt dodeljen (njegov osebni seznam za klicanje).
  // Null, dokler ga admin ne dodeli. Ime je tu zaradi admin pregleda vseh
  // kontaktov (ContactsTable) - navaden agent v svojem seznamu vedno vidi
  // samo svoje, zato mu polja ni treba prikazovati.
  assignedAgentId: string | null;
  assignedAgentName?: string | null;
  lastCall?: {
    agentName: string;
    status: ContactStatus;
    createdAt: string;
  } | null;
}

export interface LeaderboardRow {
  agentId: string;
  agentName: string;
  totalCalls: number;
  successfulCalls: number;
  rank: number;
}

export interface MeetingDTO {
  id: string;
  startAt: string;
  note: string | null;
  contact: {
    id: string;
    firstName: string;
    lastName: string;
    company: string | null;
    phone: string | null;
  };
  agent: {
    id: string;
    firstName: string;
    lastName: string;
  };
}
