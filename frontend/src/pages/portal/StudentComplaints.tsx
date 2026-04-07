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
  TextInput,
  formatDate,
  getErrorMessage,
  titleCase,
} from "../../components/admin/adminShared";

interface Complaint {
  _id: string;
  category: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  submittedAt: string;
  remarks?: string;
}

export function StudentComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [category, setCategory] = useState("dorm");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadComplaints = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiRequest<ApiResponse<{ complaints: Complaint[] }>>("/complaints/my");
      setComplaints(response.data.complaints);
    } catch (err) {
      setComplaints([]);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadComplaints();
  }, []);

  const submitComplaint = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");
    try {
      const response = await apiRequest<ApiResponse<{ complaint: Complaint }>>("/complaints", {
        method: "POST",
        body: { category, title, description },
      });
      setMessage(response.message);
      setTitle("");
      setDescription("");
      await loadComplaints();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="My Complaints" description="Submit complaints to the student union and follow their progress." />

      {message ? <EmptyState title="Complaint submitted" description={message} /> : null}
      {error ? <EmptyState title="Complaint submission needs attention" description={error} /> : null}

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Panel title="Submit Complaint" description="Student union staff manage the response after submission.">
          <form className="space-y-4" onSubmit={submitComplaint}>
            <Field label="Category">
              <Select value={category} onChange={(event) => setCategory(event.target.value)}>
                {["dorm", "cafeteria", "library", "security", "academic", "harassment", "other"].map((value) => (
                  <option key={value} value={value}>{titleCase(value)}</option>
                ))}
              </Select>
            </Field>
            <Field label="Title">
              <TextInput value={title} onChange={(event) => setTitle(event.target.value)} required />
            </Field>
            <Field label="Description">
              <TextArea rows={5} value={description} onChange={(event) => setDescription(event.target.value)} required />
            </Field>
            <ActionButton type="submit" variant="primary" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit complaint"}
            </ActionButton>
          </form>
        </Panel>

        <Panel title="My Complaint History" description="Status, priority, and remarks are updated by student union staff.">
          {loading ? (
            <p className="text-sm text-zinc-500">Loading complaints...</p>
          ) : complaints.length ? (
            <div className="space-y-4">
              {complaints.map((complaint) => (
                <div key={complaint._id} className="rounded-2xl border border-white/5 bg-[#141415] p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-medium text-white">{complaint.title}</p>
                    <StatusBadge>{titleCase(complaint.status)}</StatusBadge>
                    <StatusBadge tone="info">{titleCase(complaint.priority)}</StatusBadge>
                    <span className="text-xs text-zinc-500">{formatDate(complaint.submittedAt)}</span>
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">{titleCase(complaint.category)}</p>
                  <p className="mt-3 text-sm text-zinc-300">{complaint.description}</p>
                  {complaint.remarks ? <p className="mt-2 text-xs text-zinc-500">Remarks: {complaint.remarks}</p> : null}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No complaints submitted yet" description="Your submitted complaints will appear here." />
          )}
        </Panel>
      </div>
    </div>
  );
}
