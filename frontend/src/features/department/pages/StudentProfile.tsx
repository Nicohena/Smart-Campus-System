import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { departmentApi, type StudentProfile } from "../services/departmentApi";
import { ActionButton, EmptyState, PageHeader, Panel, StatusBadge, getErrorMessage } from "../../../components/admin/adminShared";

export function StudentProfileView() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    const loadProfile = async () => {
      setLoading(true);
      try {
        const { data } = await departmentApi.getStudent(id);
        setProfile(data.user);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    void loadProfile();
  }, [id]);

  if (loading) return <EmptyState title="Loading Profile" description="Pulling student records..." />;
  if (error || !profile) return <EmptyState title="Profile not found" description={error || "Student does not exist."} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Profile"
        description="Detailed view of the student's academic and session records."
        actions={
          <div className="flex gap-3">
            <Link to="/portal/department/students">
              <ActionButton>Registry</ActionButton>
            </Link>
            <Link to={`/portal/department/student/${id}/edit`}>
              <ActionButton variant="primary">Edit Profile</ActionButton>
            </Link>
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Panel title="Personal Information">
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-zinc-500 uppercase tracking-widest text-xs mb-1">Full Name</p>
              <p className="text-white font-medium text-base">{profile.name}</p>
            </div>
            <div>
              <p className="text-zinc-500 uppercase tracking-widest text-xs mb-1">University Email</p>
              <p className="text-zinc-300">{profile.email || "Not provided"}</p>
            </div>
            <div>
              <p className="text-zinc-500 uppercase tracking-widest text-xs mb-1">Status</p>
              {profile.isActive !== false ? <StatusBadge tone="success">Active</StatusBadge> : <StatusBadge tone="danger">Inactive</StatusBadge>}
            </div>
          </div>
        </Panel>

        <Panel title="Academic Enrollment">
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-zinc-500 uppercase tracking-widest text-xs mb-1">Student ID</p>
              <p className="text-white font-medium">{profile.studentId}</p>
            </div>
            <div>
              <p className="text-zinc-500 uppercase tracking-widest text-xs mb-1">Year</p>
              <p className="text-zinc-300">{profile.year || "Unknown"}</p>
            </div>
            <div>
              <p className="text-zinc-500 uppercase tracking-widest text-xs mb-1">Section</p>
              <p className="text-zinc-300">{profile.section || "Unassigned"}</p>
            </div>
          </div>
        </Panel>

        {/* Read-only historical data could be injected here if available */}
      </div>
    </div>
  );
}
