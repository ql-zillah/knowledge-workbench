import type { ForkStatus } from '../types/reading-fork';
import { STATUS_LABELS, STATUS_COLORS } from '../types/reading-fork';

interface Props {
  status: ForkStatus;
}

export default function ForkStatusBadge({ status }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
