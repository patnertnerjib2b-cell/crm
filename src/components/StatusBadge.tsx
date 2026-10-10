import { STATUS_CONFIG, type ContactStatus } from "@/types/contact";

export default function StatusBadge({ status }: { status: ContactStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${cfg.badgeClass}`}
    >
      <span>{cfg.icon}</span>
      {cfg.shortLabel}
    </span>
  );
}
