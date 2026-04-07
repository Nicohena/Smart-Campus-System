import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../../../api/client";
import { ActionButton, EmptyState, Field, PageHeader, Panel, TextInput, getErrorMessage } from "../../../components/admin/adminShared";

const emptyForm = {
  name: "",
  studentId: "",
  password: "",
  email: "",
  year: "",
  section: "",
};

export function StudentRegistration() {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const body = {
        ...form,
        role: "student",
      };
      // We use the general auth register endpoint configured to handle department inputs
      const response = await apiRequest<any>("/auth/register", { method: "POST", body });
      setMessage(`Successfully registered student: ${response.data.user.name}`);
      setForm(emptyForm);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Register New Student"
        description="Add a new profile to your department registry."
        actions={
          <Link to="/portal/department/students">
            <ActionButton>Back to Registry</ActionButton>
          </Link>
        }
      />

      {message ? <EmptyState title="Success" description={message} /> : null}
      {error ? <EmptyState title="Registration Failed" description={error} /> : null}

      <Panel title="Student Details" description="Fill out the initial demographic identifiers for this student.">
        <form className="space-y-4 max-w-2xl" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Full Name">
              <TextInput value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required />
            </Field>
            <Field label="University Email">
              <TextInput type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} />
            </Field>
            <Field label="Student ID">
              <TextInput value={form.studentId} onChange={(e) => setForm(f => ({ ...f, studentId: e.target.value }))} required />
            </Field>
            <Field label="Temporary Password">
              <TextInput type="password" minLength={8} value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} required />
            </Field>
            <Field label="Academic Year">
              <TextInput placeholder="e.g. 1st, 2nd, 3rd" value={form.year} onChange={(e) => setForm(f => ({ ...f, year: e.target.value }))} />
            </Field>
            <Field label="Section / Class">
              <TextInput placeholder="e.g. Section A" value={form.section} onChange={(e) => setForm(f => ({ ...f, section: e.target.value }))} />
            </Field>
          </div>
          <div className="pt-4">
            <ActionButton type="submit" variant="primary" disabled={submitting}>
              {submitting ? "Registering..." : "Complete Registration"}
            </ActionButton>
          </div>
        </form>
      </Panel>
    </div>
  );
}
