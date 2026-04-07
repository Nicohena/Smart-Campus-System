import { useEffect, useState } from "react";
import { apiRequest } from "../../api/client";
import {
  ActionButton,
  ApiResponse,
  EmptyState,
  PageHeader,
  Panel,
  StatusBadge,
  formatDate,
  getErrorMessage,
  titleCase,
} from "../../components/admin/adminShared";

interface Notice {
  _id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  createdAt: string;
  expiryDate?: string;
}

export function StudentNotices() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotices = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiRequest<ApiResponse<{ notices: Notice[] }>>("/notices");
      setNotices(response.data.notices);
    } catch (err) {
      setNotices([]);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNotices();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campus Notices"
        description="Read published notices targeted to students."
        actions={<ActionButton type="button" variant="primary" onClick={loadNotices} disabled={loading}>{loading ? "Refreshing..." : "Refresh"}</ActionButton>}
      />

      {error ? <EmptyState title="Notices unavailable" description={error} /> : null}

      <Panel title="Notice Feed" description="Only active student-visible notices appear here.">
        {notices.length ? (
          <div className="space-y-4">
            {notices.map((notice) => (
              <div key={notice._id} className="rounded-2xl border border-white/5 bg-[#141415] p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-medium text-white">{notice.title}</p>
                  <StatusBadge>{titleCase(notice.category)}</StatusBadge>
                  <StatusBadge tone="info">{titleCase(notice.priority)}</StatusBadge>
                </div>
                <p className="mt-3 text-sm text-zinc-300">{notice.description}</p>
                <p className="mt-3 text-xs text-zinc-500">
                  Posted {formatDate(notice.createdAt)}
                  {notice.expiryDate ? ` • Expires ${formatDate(notice.expiryDate)}` : ""}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No notices available" description="Published notices will appear here." />
        )}
      </Panel>
    </div>
  );
}
