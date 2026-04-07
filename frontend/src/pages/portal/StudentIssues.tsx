import { FormEvent, useEffect, useState } from "react";
import { apiRequest } from "../../api/client";
import {
  ActionButton,
  ApiResponse,
  EmptyState,
  Field,
  PageHeader,
  Panel,
  Select,
  StatusBadge,
  TextArea,
  formatDate,
  getErrorMessage,
  titleCase,
} from "../../components/admin/adminShared";

interface Issue {
  _id: string;
  issueType: string;
  description: string;
  status: string;
  block?: string;
  roomNumber?: number;
  reportedAt: string;
  remarks?: string;
}

export function StudentIssues() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [issueType, setIssueType] = useState("power");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadIssues = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiRequest<ApiResponse<{ issues: Issue[] }>>("/issues/my-issues");
      setIssues(response.data.issues);
    } catch (err) {
      setIssues([]);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadIssues();
  }, []);

  const reportIssue = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");
    try {
      const response = await apiRequest<ApiResponse<{ issue: Issue }>>("/issues/report", {
        method: "POST",
        body: { issueType, description },
      });
      setMessage(response.message);
      setDescription("");
      await loadIssues();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="My Maintenance Issues" description="Report a maintenance issue and monitor its progress." />

      {message ? <EmptyState title="Issue reported" description={message} /> : null}
      {error ? <EmptyState title="Issue reporting needs attention" description={error} /> : null}

      <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
        <Panel title="Report Issue" description="Your current dorm assignment is used automatically when available.">
          <form className="space-y-4" onSubmit={reportIssue}>
            <Field label="Issue Type">
              <Select value={issueType} onChange={(event) => setIssueType(event.target.value)}>
                {["power", "water", "furniture", "electrical", "internet", "plumbing", "other"].map((value) => (
                  <option key={value} value={value}>{titleCase(value)}</option>
                ))}
              </Select>
            </Field>
            <Field label="Description">
              <TextArea rows={5} value={description} onChange={(event) => setDescription(event.target.value)} required />
            </Field>
            <ActionButton type="submit" variant="primary" disabled={submitting}>
              {submitting ? "Submitting..." : "Report issue"}
            </ActionButton>
          </form>
        </Panel>

        <Panel title="My Issue History" description="Proctor staff will update status after assignment and inspection.">
          {loading ? (
            <p className="text-sm text-zinc-500">Loading issues...</p>
          ) : issues.length ? (
            <div className="space-y-4">
              {issues.map((issue) => (
                <div key={issue._id} className="rounded-2xl border border-white/5 bg-[#141415] p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-medium text-white">{titleCase(issue.issueType)}</p>
                    <StatusBadge>{titleCase(issue.status)}</StatusBadge>
                    <span className="text-xs text-zinc-500">{formatDate(issue.reportedAt)}</span>
                  </div>
                  <p className="mt-3 text-sm text-zinc-300">{issue.description}</p>
                  {issue.block ? <p className="mt-2 text-xs text-zinc-500">Location: Block {issue.block} Room {issue.roomNumber ?? "—"}</p> : null}
                  {issue.remarks ? <p className="mt-2 text-xs text-zinc-500">Remarks: {issue.remarks}</p> : null}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No issues reported yet" description="Submit a maintenance issue to start tracking it here." />
          )}
        </Panel>
      </div>
    </div>
  );
}
