import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { apiRequest } from "../../api/client";
import {
  ActionButton,
  ApiResponse,
  EmptyState,
  PageHeader,
  Panel,
  StatusBadge,
  TextInput,
  formatDate,
  getErrorMessage,
  titleCase,
} from "../../components/admin/adminShared";

interface LostIdRequest {
  _id: string;
  studentId: string;
  status: string;
  stamps: Record<string, boolean>;
  temporaryIdIssued: boolean;
  remarks?: string;
  requestDate: string;
}

const stampKeys = ["security", "cafeteria", "library", "department", "proctor"];

export function LostIdRequests() {
  const [requests, setRequests] = useState<LostIdRequest[]>([]);
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");

  const loadRequests = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiRequest<ApiResponse<{ requests: LostIdRequest[] }>>("/lost-id");
      setRequests(response.data.requests);
    } catch (err) {
      setRequests([]);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests();
  }, []);

  const toggleStamp = async (requestId: string, stamp: string, value: boolean) => {
    setBusyKey(`${requestId}-${stamp}`);
    try {
      await apiRequest(`/lost-id/${requestId}/stamp`, { method: "PATCH", body: { stamp, value } });
      toast.success(`${titleCase(stamp)} stamp ${value ? "applied" : "removed"}`);
      await loadRequests();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyKey("");
    }
  };

  const approve = async (requestId: string) => {
    setBusyKey(requestId);
    try {
      await apiRequest(`/lost-id/${requestId}/approve`, { method: "PATCH" });
      toast.success("Request approved");
      await loadRequests();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyKey("");
    }
  };

  const reject = async (requestId: string) => {
    const reason = remarks[requestId]?.trim();
    if (!reason) {
      setError("Rejection remarks are required.");
      toast.error("Rejection remarks are required.");
      return;
    }

    setBusyKey(requestId);
    try {
      await apiRequest(`/lost-id/${requestId}/reject`, { method: "PATCH", body: { remarks: reason } });
      toast.success("Request rejected");
      setRemarks((current) => ({ ...current, [requestId]: "" }));
      await loadRequests();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyKey("");
    }
  };

  const issueTemporaryId = async (requestId: string) => {
    setBusyKey(`temp-${requestId}`);
    try {
      await apiRequest(`/lost-id/${requestId}/temporary-id`, { method: "PATCH" });
      toast.success("Temporary ID issued");
      await loadRequests();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyKey("");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lost ID Requests"
        description="Manage stamp completion, approval, rejection remarks, and temporary ID issuance."
        actions={
          <ActionButton type="button" variant="primary" onClick={loadRequests} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </ActionButton>
        }
      />

      {error ? <EmptyState title="Lost ID actions need attention" description={error} /> : null}

      <Panel title="Request Queue" description="Approval only succeeds after every stamp has been completed.">
        {requests.length ? (
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request._id} className="rounded-2xl border border-white/5 bg-[#141415] p-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-base font-medium text-white">{request.studentId}</p>
                      <StatusBadge>{titleCase(request.status)}</StatusBadge>
                      <StatusBadge tone={request.temporaryIdIssued ? "success" : "neutral"}>
                        {request.temporaryIdIssued ? "Temporary ID issued" : "Temporary ID pending"}
                      </StatusBadge>
                    </div>
                    <p className="text-sm text-zinc-400">Requested {formatDate(request.requestDate)}</p>
                    {request.remarks ? <p className="text-sm text-zinc-400">Remarks: {request.remarks}</p> : null}
                    <div className="flex flex-wrap gap-2">
                      {stampKeys.map((stamp) => (
                        <ActionButton
                          key={stamp}
                          type="button"
                          variant={request.stamps[stamp] ? "primary" : "secondary"}
                          disabled={busyKey === `${request._id}-${stamp}`}
                          onClick={() => void toggleStamp(request._id, stamp, !request.stamps[stamp])}
                        >
                          {titleCase(stamp)}
                        </ActionButton>
                      ))}
                    </div>
                  </div>

                  <div className="w-full max-w-xl space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <ActionButton type="button" onClick={() => void approve(request._id)} disabled={busyKey === request._id}>
                        Approve
                      </ActionButton>
                      <ActionButton type="button" onClick={() => void issueTemporaryId(request._id)} disabled={busyKey === `temp-${request._id}` || request.temporaryIdIssued}>
                        Issue temporary ID
                      </ActionButton>
                    </div>
                    <div className="flex gap-2">
                      <TextInput
                        value={remarks[request._id] ?? ""}
                        onChange={(event) => setRemarks((current) => ({ ...current, [request._id]: event.target.value }))}
                        placeholder="Rejection remarks"
                      />
                      <ActionButton type="button" variant="danger" onClick={() => void reject(request._id)} disabled={busyKey === request._id}>
                        Reject
                      </ActionButton>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No lost ID requests found" description="Lost ID requests will appear here when students submit them." />
        )}
      </Panel>
    </div>
  );
}
