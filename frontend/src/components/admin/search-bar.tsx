// Plain GET form so filters live in the URL and survive refresh and sharing.
export default function SearchBar({
  action,
  placeholder,
  defaultQuery,
  status,
}: {
  action: string;
  placeholder: string;
  defaultQuery?: string;
  status?: { value?: string } | null;
}) {
  return (
    <form action={action} className="flex flex-wrap gap-3">
      <label className="min-w-60 flex-1">
        <span className="sr-only">Search</span>
        <input className="field-input" type="search" name="q" defaultValue={defaultQuery} placeholder={placeholder} />
      </label>
      {status && (
        <label>
          <span className="sr-only">Status</span>
          <select className="field-input w-auto pr-8" name="status" defaultValue={status.value ?? ""}>
            <option value="">All statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
      )}
      <button type="submit" className="btn btn-primary">
        Search
      </button>
    </form>
  );
}
