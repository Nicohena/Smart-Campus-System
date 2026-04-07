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
} from "../../components/admin/adminShared";

interface Inspection {
  _id: string;
  inspectionDate: string;
  cleanliness: boolean;
  approved: boolean;
  damages?: string;
  dorm?: { block: string; roomNumber: number };
  inspectedBy?: { name: string };
}

const initialInspection = {
  dormId: "",
  cleanliness: true,
  approved: true,
  damages: "",
  windows: true,
  bed: true,
  locker: true,
  table: true,
  chair: true,
  lightBulb: true,
  doorLock: true,
};

export function DormManagement() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [studentFilter, setStudentFilter] = useState("");
  const [dormFilter, setDormFilter] = useState("");
  const [allocation, setAllocation] = useState({ studentId: "", yearLevel: "freshman", isSpecialNeeds: false, department: "" });
  const [keyForm, setKeyForm] = useState({ dormId: "", issuedTo: "", keyNumber: "" });
  const [returnKeyId, setReturnKeyId] = useState("");
  const [inspectionForm, setInspectionForm] = useState(initialInspection);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadInspections = async (query = "") => {
    setLoading(true);
    setError("");
    try {
      const response = await apiRequest<ApiResponse<{ inspections: Inspection[] }>>(`/dorm/inspections${query}`);
      setInspections(response.data.inspections);
    } catch (err) {
      setInspections([]);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadInspections();
  }, []);

  const handleAllocation = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      const response = await apiRequest<ApiResponse<{ dorm: { block: string; roomNumber: number } }>>("/dorm/allocate", {
        method: "POST",
        body: allocation,
      });
      setMessage(`${response.message}: ${response.data.dorm.block} ${response.data.dorm.roomNumber}`);
      setAllocation({ studentId: "", yearLevel: "freshman", isSpecialNeeds: false, department: "" });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleIssueKey = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      await apiRequest("/dorm/issue-key", { method: "POST", body: keyForm });
      setMessage("Dorm key issued.");
      setKeyForm({ dormId: "", issuedTo: "", keyNumber: "" });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleReturnKey = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      await apiRequest("/dorm/return-key", { method: "PATCH", body: { keyId: returnKeyId } });
      setMessage("Dorm key returned.");
      setReturnKeyId("");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleInspection = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      await apiRequest("/dorm/inspect", {
        method: "POST",
        body: {
          dormId: inspectionForm.dormId,
          cleanliness: inspectionForm.cleanliness,
          approved: inspectionForm.approved,
          damages: inspectionForm.damages || undefined,
          conditions: {
            windows: inspectionForm.windows,
            bed: inspectionForm.bed,
            locker: inspectionForm.locker,
            table: inspectionForm.table,
            chair: inspectionForm.chair,
            lightBulb: inspectionForm.lightBulb,
            doorLock: inspectionForm.doorLock,
          },
        },
      });
      setMessage("Dorm inspection recorded.");
      setInspectionForm(initialInspection);
      await loadInspections();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const runFilter = async () => {
    const params = new URLSearchParams();
    if (studentFilter.trim()) params.set("studentId", studentFilter.trim());
    if (dormFilter.trim()) params.set("dormId", dormFilter.trim());
    const query = params.toString() ? `?${params.toString()}` : "";
    await loadInspections(query);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Proctor Dorm Management" description="Manage dorm allocation, key circulation, inspections, and damage follow-up from the proctor office." />

      {message ? <EmptyState title="Action completed" description={message} /> : null}
      {error ? <EmptyState title="Dorm action needs attention" description={error} /> : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Allocate Dorm" description="Year level must be one of freshman, remedial, or senior.">
          <form className="space-y-4" onSubmit={handleAllocation}>
            <Field label="Student ID">
              <TextInput value={allocation.studentId} onChange={(event) => setAllocation((current) => ({ ...current, studentId: event.target.value }))} required />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Year Level">
                <Select value={allocation.yearLevel} onChange={(event) => setAllocation((current) => ({ ...current, yearLevel: event.target.value }))}>
                  {["freshman", "remedial", "senior"].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Department">
                <TextInput value={allocation.department} onChange={(event) => setAllocation((current) => ({ ...current, department: event.target.value }))} />
              </Field>
            </div>
            <label className="flex items-center gap-3 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={allocation.isSpecialNeeds}
                onChange={(event) => setAllocation((current) => ({ ...current, isSpecialNeeds: event.target.checked }))}
              />
              Special needs accommodation
            </label>
            <ActionButton type="submit" variant="primary">Allocate dorm</ActionButton>
          </form>
        </Panel>

        <Panel title="Dorm Keys" description="Key issue requires dorm id, student user id, and key number.">
          <div className="grid gap-6 lg:grid-cols-2">
            <form className="space-y-4" onSubmit={handleIssueKey}>
              <Field label="Dorm ID">
                <TextInput value={keyForm.dormId} onChange={(event) => setKeyForm((current) => ({ ...current, dormId: event.target.value }))} required />
              </Field>
              <Field label="Issued To User ID">
                <TextInput value={keyForm.issuedTo} onChange={(event) => setKeyForm((current) => ({ ...current, issuedTo: event.target.value }))} required />
              </Field>
              <Field label="Key Number">
                <TextInput value={keyForm.keyNumber} onChange={(event) => setKeyForm((current) => ({ ...current, keyNumber: event.target.value }))} required />
              </Field>
              <ActionButton type="submit">Issue key</ActionButton>
            </form>
            <form className="space-y-4" onSubmit={handleReturnKey}>
              <Field label="Key ID">
                <TextInput value={returnKeyId} onChange={(event) => setReturnKeyId(event.target.value)} required />
              </Field>
              <ActionButton type="submit">Return key</ActionButton>
            </form>
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.15fr]">
        <Panel title="Record Inspection" description="Approved inspections cannot include damages.">
          <form className="space-y-4" onSubmit={handleInspection}>
            <Field label="Dorm ID">
              <TextInput value={inspectionForm.dormId} onChange={(event) => setInspectionForm((current) => ({ ...current, dormId: event.target.value }))} required />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Cleanliness">
                <Select value={inspectionForm.cleanliness ? "true" : "false"} onChange={(event) => setInspectionForm((current) => ({ ...current, cleanliness: event.target.value === "true" }))}>
                  <option value="true">Clean</option>
                  <option value="false">Unclean</option>
                </Select>
              </Field>
              <Field label="Approval">
                <Select value={inspectionForm.approved ? "true" : "false"} onChange={(event) => setInspectionForm((current) => ({ ...current, approved: event.target.value === "true" }))}>
                  <option value="true">Approve</option>
                  <option value="false">Reject</option>
                </Select>
              </Field>
            </div>
            <Field label="Damages">
              <TextArea value={inspectionForm.damages} rows={3} onChange={(event) => setInspectionForm((current) => ({ ...current, damages: event.target.value }))} />
            </Field>
            <div className="grid gap-3 md:grid-cols-2">
              {(["windows", "bed", "locker", "table", "chair", "lightBulb", "doorLock"] as const).map((key) => (
                <label key={key} className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-300">
                  <span>{key}</span>
                  <input
                    type="checkbox"
                    checked={inspectionForm[key]}
                    onChange={(event) => setInspectionForm((current) => ({ ...current, [key]: event.target.checked }))}
                  />
                </label>
              ))}
            </div>
            <ActionButton type="submit" variant="primary">Record inspection</ActionButton>
          </form>
        </Panel>

        <Panel
          title="Inspection History"
          description="Query inspection history by student id or dorm id."
          actions={
            <>
              <TextInput value={studentFilter} onChange={(event) => setStudentFilter(event.target.value)} placeholder="Student ID" />
              <TextInput value={dormFilter} onChange={(event) => setDormFilter(event.target.value)} placeholder="Dorm ID" />
              <ActionButton type="button" onClick={() => void runFilter()}>Filter</ActionButton>
              <ActionButton type="button" variant="primary" onClick={() => void loadInspections()} disabled={loading}>
                {loading ? "Refreshing..." : "Refresh"}
              </ActionButton>
            </>
          }
        >
          {inspections.length ? (
            <div className="space-y-3">
              {inspections.map((inspection) => (
                <div key={inspection._id} className="rounded-2xl border border-white/5 bg-[#141415] p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-medium text-white">
                      {inspection.dorm?.block ?? "Dorm"} {inspection.dorm?.roomNumber ?? ""}
                    </p>
                    <StatusBadge tone={inspection.approved ? "success" : "warning"}>
                      {inspection.approved ? "Approved" : "Needs follow-up"}
                    </StatusBadge>
                    <StatusBadge tone={inspection.cleanliness ? "success" : "danger"}>
                      {inspection.cleanliness ? "Clean" : "Unclean"}
                    </StatusBadge>
                  </div>
                  <p className="mt-2 text-sm text-zinc-400">
                    Inspected by {inspection.inspectedBy?.name ?? "Unknown"} on {formatDate(inspection.inspectionDate)}
                  </p>
                  {inspection.damages ? <p className="mt-2 text-sm text-zinc-300">Damages: {inspection.damages}</p> : null}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No inspections found" description="Recorded inspections will appear here." />
          )}
        </Panel>
      </div>
    </div>
  );
}
