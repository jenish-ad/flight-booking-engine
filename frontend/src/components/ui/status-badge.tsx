const styles: Record<string, string> = {
  confirmed: "bg-ok-soft text-forest-dark",
  cancelled: "bg-danger-soft text-danger",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${styles[status] ?? "bg-mist text-slate"}`}>
      {status}
    </span>
  );
}
