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

interface Notice {
  _id: string;
  title: string;
  description: string;
  category: string;
  targetAudience: string;
  priority: string;
  status: string;
  department?: string;
  dormBlock?: string;
  expiryDate?: string;
  createdAt: string;
}

const emptyForm = {
  title: "",
  description: "",
  category: "general",
  targetAudience: "all_students",
  priority: "normal",
  department: "",
  dormBlock: "",
  expiryDate: "",
};

export function Notices() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const body = {
      ...form,
      department: form.department || undefined,
      dormBlock: form.dormBlock || undefined,
      expiryDate: form.expiryDate || undefined,
    };

    try {
      if (editingId) {
        await apiRequest(`/notices/${editingId}`, { method: "PATCH", body });
      } else {
        await apiRequest("/notices", { method: "POST", body });
      }
      resetForm();
      await loadNotices();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const editNotice = (notice: Notice) => {
    setEditingId(notice._id);
    setForm({
      title: notice.title,
      description: notice.description,
      category: notice.category,
      targetAudience: notice.targetAudience,
      priority: notice.priority,
      department: notice.department ?? "",
      dormBlock: notice.dormBlock ?? "",
      expiryDate: notice.expiryDate ? notice.expiryDate.slice(0, 10) : "",
    });
  };

  const updateStatus = async (notice: Notice) => {
    try {
      const status = notice.status === "active" ? "expired" : "active";
      await apiRequest(`/notices/${notice._id}/status`, { method: "PATCH", body: { status } });
      await loadNotices();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const deleteNotice = async (id: string) => {
    try {
      await apiRequest(`/notices/${id}`, { method: "DELETE" });
      if (editingId === id) resetForm();
      await loadNotices();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notices"
        description="Publish campus-wide notices and control their lifecycle from the admin communications workspace."
        actions={
          <ActionButton type="button" variant="primary" onClick={loadNotices} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </ActionButton>
        }
      />

      {error ? <EmptyState title="Notice actions need attention" description={error} /> : null}

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.25fr]">
        <Panel title={editingId ? "Edit Notice" : "Create Notice"} description="Use department or dorm block when the target audience requires it.">
          <form className="space-y-4" onSubmit={submit}>
            <Field label="Title">
              <TextInput value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required />
            </Field>
            <Field label="Description">
              <TextArea value={form.description} rows={5} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} required />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Category">
                <Select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}>
                  {["general", "department", "club", "security", "academic", "event"].map((value) => (
                    <option key={value} value={value}>
                      {titleCase(value)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Audience">
                <Select value={form.targetAudience} onChange={(event) => setForm((current) => ({ ...current, targetAudience: event.target.value }))}>
                  {["all_students", "department_students", "dorm_students"].map((value) => (
                    <option key={value} value={value}>
                      {titleCase(value)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Priority">
                <Select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}>
                  {["low", "normal", "high", "urgent"].map((value) => (
                    <option key={value} value={value}>
                      {titleCase(value)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Expiry Date">
                <TextInput type="date" value={form.expiryDate} onChange={(event) => setForm((current) => ({ ...current, expiryDate: event.target.value }))} />
              </Field>
              <Field label="Department">
                <TextInput value={form.department} onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))} />
              </Field>
              <Field label="Dorm Block">
                <TextInput value={form.dormBlock} onChange={(event) => setForm((current) => ({ ...current, dormBlock: event.target.value }))} />
              </Field>
            </div>
            <div className="flex gap-3">
              <ActionButton type="submit" variant="primary" disabled={submitting}>
                {submitting ? "Saving..." : editingId ? "Update notice" : "Create notice"}
              </ActionButton>
              {editingId ? (
                <ActionButton type="button" onClick={resetForm}>
                  Cancel edit
                </ActionButton>
              ) : null}
            </div>
          </form>
        </Panel>

        <Panel title="Published Notices" description="Admin sessions receive the full notice list from the backend for central communications management.">
          {notices.length ? (
            <div className="space-y-4">
              {notices.map((notice) => (
                <div key={notice._id} className="rounded-2xl border border-white/5 bg-[#141415] p-4">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-base font-medium text-white">{notice.title}</p>
                        <StatusBadge>{titleCase(notice.status)}</StatusBadge>
                        <StatusBadge tone="info">{titleCase(notice.priority)}</StatusBadge>
                      </div>
                      <p className="mt-2 text-sm text-zinc-300">{notice.description}</p>
                      <p className="mt-3 text-xs text-zinc-500">
                        {titleCase(notice.category)} • {titleCase(notice.targetAudience)} • Created {formatDate(notice.createdAt)}
                      </p>
                      {notice.department ? <p className="mt-1 text-xs text-zinc-500">Department: {notice.department}</p> : null}
                      {notice.dormBlock ? <p className="mt-1 text-xs text-zinc-500">Dorm Block: {notice.dormBlock}</p> : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <ActionButton type="button" onClick={() => editNotice(notice)}>
                        Edit
                      </ActionButton>
                      <ActionButton type="button" onClick={() => void updateStatus(notice)}>
                        {notice.status === "active" ? "Expire" : "Activate"}
                      </ActionButton>
                      <ActionButton type="button" variant="danger" onClick={() => void deleteNotice(notice._id)}>
                        Delete
                      </ActionButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No notices found" description="Create a notice to populate this workspace." />
          )}
        </Panel>
      </div>
    </div>
  );
}
