import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { departmentApi, type StudentProfile } from "../services/departmentApi";
import { ActionButton, EmptyState, PageHeader, Panel, StatusBadge } from "../../../components/admin/adminShared";

export function StudentList() {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadStudents = async () => {
    setLoading(true);
    try {
      const { data } = await departmentApi.getStudents();
      setStudents(data.users || []);
    } catch {
      // Error handled implicitly right now
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStudents();
  }, []);

  const filtered = students.filter(s => 
    (s.name || "").toLowerCase().includes(search.toLowerCase()) || 
    (s.studentId || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Registry"
        description="Manage all students enrolled in your department."
        actions={
          <Link to="/portal/department/register">
            <ActionButton variant="primary">Add New Student</ActionButton>
          </Link>
        }
      />

      <Panel title="Enrolled Students">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm bg-[#141415] border border-white/5 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50"
          />
        </div>

        {loading ? (
          <div className="text-center text-zinc-500 py-10">Loading student records...</div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No students found" description="Adjust your search filters or add a new student." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="bg-[#141415] text-xs uppercase text-zinc-500 border-b border-white/5">
                <tr>
                  <th className="px-4 py-3 font-medium">Student Name</th>
                  <th className="px-4 py-3 font-medium">ID Number</th>
                  <th className="px-4 py-3 font-medium">Year</th>
                  <th className="px-4 py-3 font-medium">Section</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((s) => (
                  <tr key={s._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{s.name}</td>
                    <td className="px-4 py-3">{s.studentId}</td>
                    <td className="px-4 py-3">{s.year || "—"}</td>
                    <td className="px-4 py-3">{s.section || "—"}</td>
                    <td className="px-4 py-3">
                      {s.isActive !== false ? <StatusBadge tone="success">Active</StatusBadge> : <StatusBadge tone="danger">Inactive</StatusBadge>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/portal/department/student/${s._id}`} className="text-purple-400 hover:text-purple-300 mr-4 transition-colors">Profile</Link>
                      <Link to={`/portal/department/student/${s._id}/edit`} className="text-zinc-400 hover:text-white transition-colors">Edit</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
