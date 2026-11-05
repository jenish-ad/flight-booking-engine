import Notice from "@/components/ui/notice";
import { ApiError } from "@/lib/api/errors";

export default function AdminError({ error }: { error: unknown }) {
  const missing = error instanceof ApiError && error.status === 404;
  return (
    <Notice tone="error" title="Admin data couldn't be loaded">
      {missing
        ? "The backend returned 404. Apply the admin backend patch, or check this account has is_admin set."
        : error instanceof Error
          ? error.message
          : "Try again in a moment."}
    </Notice>
  );
}
