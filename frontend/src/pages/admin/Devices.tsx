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
  TextInput,
  formatDate,
  getErrorMessage,
  titleCase,
} from "../../components/admin/adminShared";

interface Device {
  _id: string;
  studentId: string;
  phoneNumber: string;
  deviceType: string;
  brand: string;
  model: string;
  serialNumber: string;
  macAddress: string;
  ssid?: string;
  deviceRegistrationId: string;
  status: string;
  registeredAt: string;
  remarks?: string;
}

const emptyForm = {
  studentId: "",
  phoneNumber: "",
  deviceType: "laptop",
  brand: "",
  model: "",
  serialNumber: "",
  macAddress: "",
  ssid: "",
};

export function Devices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [blockRemarks, setBlockRemarks] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadDevices = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiRequest<ApiResponse<{ devices: Device[] }>>("/devices");
      setDevices(response.data.devices);
    } catch (err) {
      setDevices([]);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDevices();
  }, []);

  const registerDevice = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await apiRequest("/devices/register", {
        method: "POST",
        body: { ...form, ssid: form.ssid || undefined },
      });
      setForm(emptyForm);
      await loadDevices();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const blockDevice = async (deviceId: string) => {
    try {
      await apiRequest(`/devices/${deviceId}/block`, {
        method: "PATCH",
        body: { remarks: blockRemarks[deviceId] || undefined },
      });
      await loadDevices();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const deleteDevice = async (deviceId: string) => {
    try {
      await apiRequest(`/devices/${deviceId}`, { method: "DELETE" });
      await loadDevices();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Devices"
        description="Register student devices, block them with remarks, and remove device records when necessary."
        actions={
          <ActionButton type="button" variant="primary" onClick={loadDevices} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </ActionButton>
        }
      />

      {error ? <EmptyState title="Device actions need attention" description={error} /> : null}

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.18fr]">
        <Panel title="Register Device" description="The form mirrors the required backend registration payload.">
          <form className="space-y-4" onSubmit={registerDevice}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Student ID">
                <TextInput value={form.studentId} onChange={(event) => setForm((current) => ({ ...current, studentId: event.target.value }))} required />
              </Field>
              <Field label="Phone Number">
                <TextInput value={form.phoneNumber} onChange={(event) => setForm((current) => ({ ...current, phoneNumber: event.target.value }))} required />
              </Field>
              <Field label="Device Type">
                <Select value={form.deviceType} onChange={(event) => setForm((current) => ({ ...current, deviceType: event.target.value }))}>
                  {["laptop", "tablet", "other"].map((value) => (
                    <option key={value} value={value}>
                      {titleCase(value)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Brand">
                <TextInput value={form.brand} onChange={(event) => setForm((current) => ({ ...current, brand: event.target.value }))} required />
              </Field>
              <Field label="Model">
                <TextInput value={form.model} onChange={(event) => setForm((current) => ({ ...current, model: event.target.value }))} required />
              </Field>
              <Field label="SSID">
                <TextInput value={form.ssid} onChange={(event) => setForm((current) => ({ ...current, ssid: event.target.value }))} />
              </Field>
              <Field label="Serial Number">
                <TextInput value={form.serialNumber} onChange={(event) => setForm((current) => ({ ...current, serialNumber: event.target.value }))} required />
              </Field>
              <Field label="MAC Address">
                <TextInput value={form.macAddress} onChange={(event) => setForm((current) => ({ ...current, macAddress: event.target.value }))} required />
              </Field>
            </div>
            <ActionButton type="submit" variant="primary" disabled={submitting}>
              {submitting ? "Registering..." : "Register device"}
            </ActionButton>
          </form>
        </Panel>

        <Panel title="Registered Devices" description="Blocked devices remain visible with their block remarks and registration ids.">
          {devices.length ? (
            <div className="space-y-4">
              {devices.map((device) => (
                <div key={device._id} className="rounded-2xl border border-white/5 bg-[#141415] p-4">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-base font-medium text-white">
                          {device.brand} {device.model}
                        </p>
                        <StatusBadge>{titleCase(device.status)}</StatusBadge>
                        <StatusBadge tone="info">{titleCase(device.deviceType)}</StatusBadge>
                      </div>
                      <p className="mt-2 text-sm text-zinc-300">
                        {device.studentId} • {device.phoneNumber}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        Registration ID: {device.deviceRegistrationId} • Registered {formatDate(device.registeredAt)}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        Serial: {device.serialNumber} • MAC: {device.macAddress}
                      </p>
                      {device.remarks ? <p className="mt-2 text-sm text-zinc-400">Remarks: {device.remarks}</p> : null}
                    </div>
                    <div className="w-full max-w-md space-y-3">
                      <TextInput
                        value={blockRemarks[device._id] ?? ""}
                        onChange={(event) => setBlockRemarks((current) => ({ ...current, [device._id]: event.target.value }))}
                        placeholder="Block remarks"
                      />
                      <div className="flex gap-2">
                        <ActionButton type="button" onClick={() => void blockDevice(device._id)} disabled={device.status === "blocked"}>
                          Block
                        </ActionButton>
                        <ActionButton type="button" variant="danger" onClick={() => void deleteDevice(device._id)}>
                          Delete
                        </ActionButton>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No devices found" description="Registered devices will appear here." />
          )}
        </Panel>
      </div>
    </div>
  );
}
