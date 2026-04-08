import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { departmentApi, type StudentProfile } from "../services/departmentApi";
import { ActionButton, EmptyState, Field, PageHeader, Panel, Select, TextInput, getErrorMessage } from "../../../components/admin/adminShared";

export function StudentEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<Partial<StudentProfile> | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    const loadProfile = async () => {
      setLoading(true);
      try {
        const { data } = await departmentApi.getStudent(id);
        const u = data.user;
        setForm({
          name: u.name,
          studentId: u.studentId,
          email: u.email || "",
          year: u.year || "",
          section: u.section || "",
          isActive: u.isActive !== false,
        });
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    void loadProfile();
  }, [id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || !form) return;
    setSubmitting(true);
    setError("");

    try {
      await departmentApi.updateStudent(id, form);
      toast.success("Student profile updated");
      navigate(`/portal/department/student/${id}`);
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  if (loading) return <EmptyState title="Loading Form" description="Loading existing records..." />;
  if (error || !form) return <EmptyState title="Cannot edit" description={error || "Profile not loaded"} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Student Record"
        description="Modify student demographics or modify their active campus status."
        actions={
          <div className="flex gap-3">
             <Link to={`/portal/department/student/${id}`}>
              <ActionButton>Cancel</ActionButton>
            </Link>
          </div>
        }
      />

      <Panel title="Update Details">
        <form className="space-y-4 max-w-2xl" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Full Name">
              <TextInput value={form.name} onChange={(e) => setForm(f => ({ ...f!, name: e.target.value }))} required />
            </Field>
            <Field label="University Email">
              <TextInput type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f!, email: e.target.value }))} />
            </Field>
            <Field label="Academic Year">
              <TextInput value={form.year} onChange={(e) => setForm(f => ({ ...f!, year: e.target.value }))} />
            </Field>
            <Field label="Section / Class">
              <TextInput value={form.section} onChange={(e) => setForm(f => ({ ...f!, section: e.target.value }))} />
            </Field>
            <Field label="Operational Status">
              <Select value={form.isActive ? "active" : "inactive"} onChange={(e) => setForm(f => ({ ...f!, isActive: e.target.value === "active" }))}>
                <option value="active">Active Status</option>
                <option value="inactive">Suspended / Inactive</option>
              </Select>
            </Field>
          </div>
          <div className="pt-4 flex gap-3">
            <ActionButton type="submit" variant="primary" disabled={submitting}>
              {submitting ? "Saving..." : "Save Changes"}
            </ActionButton>
          </div>
        </form>
      </Panel>
    </div>
  );
}
