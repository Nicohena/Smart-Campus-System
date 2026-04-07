import { FormEvent, useEffect, useState } from "react";
import { authApi } from "../../api/auth";
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
  TextInput,
  getErrorMessage,
  getStoredUser,
} from "../../components/admin/adminShared";
import { STAFF_ROLES, titleCaseRole, type UserRole } from "../../lib/roles";

interface ProfileUser {
  _id: string;
  name: string;
  studentId: string;
  role: UserRole;
  department?: string;
}

const getEmptyForm = (role: string | undefined) => ({
  name: "",
  studentId: "",
  password: "",
  role: (role === "admin" ? STAFF_ROLES[0] : "student") as UserRole,
  department: "",
});

export function Users() {
  const sessionUser = getStoredUser();
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [form, setForm] = useState(() => getEmptyForm(sessionUser?.role));
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const response = (await authApi.getProfile()) as ApiResponse<{ user: ProfileUser }>;
      setProfile(response.data.user);
    } catch (err) {
      setProfile(null);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProfile();
  }, []);

  const registerUser = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    if (form.password.length < 8) {
      setSubmitting(false);
      setError("Password must be at least 8 characters.");
      return;
    }

    try {
      const body = {
        name: form.name,
        studentId: form.studentId,
        password: form.password,
        department: form.department || undefined,
        ...(sessionUser?.role === "admin" ? { role: form.role } : {}),
      };
      const response = await apiRequest<ApiResponse<{ user: ProfileUser }>>("/auth/register", { method: "POST", body });
      setMessage(`Created ${response.data.user.name} (${response.data.user.role}).`);
      setForm(getEmptyForm(sessionUser?.role));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const availableRoles: UserRole[] = sessionUser?.role === "admin" ? [...STAFF_ROLES] : ["student"];
  const panelTitle = sessionUser?.role === "admin" ? "Staff Management" : "Student Registration";
  const panelDescription =
    sessionUser?.role === "admin"
      ? "Admins can create and manage operational staff accounts for security, proctor, department, and student union offices."
      : "Department staff can register students and maintain department-owned student records.";
  const submitLabel = sessionUser?.role === "admin" ? "Create staff account" : "Register student";

  return (
    <div className="space-y-6">
      <PageHeader
        title={sessionUser?.role === "admin" ? "User Management" : "Student Registry"}
        description={
          sessionUser?.role === "admin"
            ? "Create and manage staff accounts without exposing operational tools to the admin workspace."
            : "Department staff register students, capture department data, and review the current session."
        }
        actions={
          <ActionButton type="button" variant="primary" onClick={loadProfile} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh profile"}
          </ActionButton>
        }
      />

      {message ? <EmptyState title="User created" description={message} /> : null}
      {error ? <EmptyState title="User actions need attention" description={error} /> : null}

      <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
        <Panel title="Current Session" description="This card reflects `/api/auth/profile` and the locally stored session role.">
          {profile ? (
            <div className="space-y-3 text-sm text-zinc-300">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-lg font-medium text-white">{profile.name}</p>
                <StatusBadge>{profile.role}</StatusBadge>
              </div>
              <p>{profile.studentId}</p>
              <p>{profile.department || "No department set"}</p>
              <p className="text-xs text-zinc-500">
                {sessionUser?.role === "admin"
                  ? "Admin accounts can create staff users only. Operational work stays inside each role dashboard."
                  : "Department accounts can create student users only. Students cannot self-register."}
              </p>
            </div>
          ) : (
            <EmptyState title="No profile loaded" description="Refresh the current session profile to verify auth state." />
          )}
        </Panel>

        <Panel title={panelTitle} description={panelDescription}>
          <form className="space-y-4" onSubmit={registerUser}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Name">
                <TextInput value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
              </Field>
              <Field label="Student ID">
                <TextInput value={form.studentId} onChange={(event) => setForm((current) => ({ ...current, studentId: event.target.value }))} required />
              </Field>
              <Field label="Password">
                <TextInput
                  type="password"
                  minLength={8}
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  required
                />
              </Field>
              <Field label="Department" hint="Optional for staff, recommended for student records.">
                <TextInput value={form.department} onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))} />
              </Field>
              {availableRoles.length > 1 ? (
                <Field label="Role">
                  <Select
                    value={form.role}
                    onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as UserRole }))}
                  >
                    {availableRoles.map((role) => (
                      <option key={role} value={role}>
                        {titleCaseRole(role)}
                      </option>
                    ))}
                  </Select>
                </Field>
              ) : (
                <Field label="Role">
                  <TextInput value="Student" readOnly />
                </Field>
              )}
            </div>
            <ActionButton type="submit" variant="primary" disabled={submitting}>
              {submitting ? "Saving..." : submitLabel}
            </ActionButton>
            <p className="text-xs text-zinc-500">Password must be at least 8 characters.</p>
          </form>
        </Panel>
      </div>
    </div>
  );
}
