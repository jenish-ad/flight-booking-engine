import Spinner from "@/components/ui/spinner";

export default function Loading() {
  return (
    <main className="page grid place-items-center">
      <Spinner label="Loading flights…" />
    </main>
  );
}
