export default function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2.5 text-sm text-slate" role="status">
      <span
        className="size-4 animate-spin rounded-full border-2 border-line border-t-forest motion-reduce:animate-none"
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
