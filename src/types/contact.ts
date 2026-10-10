// Statusi kontakta / klica. Shranjeni so kot navaden string (glej
// prisma/schema.prisma), ta datoteka pa je "vir resnice" za dovoljene
// vrednosti, oznake, barve in ikone po celotni aplikaciji.

export const CONTACT_STATUSES = [
  "NEW",
  "NO_ANSWER",
  "INTERESTED",
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
export const SUCCESS_STATUSES: ContactStatus[] = ["INTERESTED"];

export interface AgentDTO {
  id: string;
  firstName: string;
  lastName: string;
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
