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
  getErrorMessage,
  titleCase,
} from "../../components/admin/adminShared";

interface Location {
  _id: string;
  name: string;
  description: string;
  category: string;
  building: string;
  floor?: number;
  roomNumber?: string;
  latitude: number;
  longitude: number;
  contactPerson?: string;
  contactPhone?: string;
  openHours?: string;
}

const emptyForm = {
  name: "",
  description: "",
  category: "office",
  building: "",
  floor: "",
  roomNumber: "",
  latitude: "",
  longitude: "",
  contactPerson: "",
  contactPhone: "",
  openHours: "",
};

export function Locations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLocations = async (query = "") => {
    setLoading(true);
    setError("");
    try {
      const endpoint = query ? `/navigation/search${query}` : "/navigation";
      const response = await apiRequest<ApiResponse<{ locations: Location[] }>>(endpoint);
      setLocations(response.data.locations);
    } catch (err) {
      setLocations([]);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLocations();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    const body = {
      ...form,
      floor: form.floor ? Number(form.floor) : undefined,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
    };

    try {
      if (editingId) {
        await apiRequest(`/navigation/${editingId}`, { method: "PATCH", body });
      } else {
        await apiRequest("/navigation", { method: "POST", body });
      }
      resetForm();
      await loadLocations();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const editLocation = (location: Location) => {
    setEditingId(location._id);
    setForm({
      name: location.name,
      description: location.description,
      category: location.category,
      building: location.building,
      floor: location.floor?.toString() ?? "",
      roomNumber: location.roomNumber ?? "",
      latitude: String(location.latitude),
      longitude: String(location.longitude),
      contactPerson: location.contactPerson ?? "",
      contactPhone: location.contactPhone ?? "",
      openHours: location.openHours ?? "",
    });
  };

  const deleteLocation = async (id: string) => {
    try {
      await apiRequest(`/navigation/${id}`, { method: "DELETE" });
      if (editingId === id) resetForm();
      await loadLocations();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Locations"
        description="Manage campus navigation records and use the server search endpoint for quick filtering."
        actions={
          <>
            <TextInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or building" />
            <ActionButton type="button" onClick={() => void loadLocations(search.trim() ? `?q=${encodeURIComponent(search.trim())}` : "")}>
              Search
            </ActionButton>
            <ActionButton type="button" variant="primary" onClick={() => void loadLocations()} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </ActionButton>
          </>
        }
      />

      {error ? <EmptyState title="Location actions need attention" description={error} /> : null}

      <div className="grid gap-6 xl:grid-cols-[0.96fr_1.14fr]">
        <Panel title={editingId ? "Edit Location" : "Create Location"} description="The admin surface covers create, update, delete, list, and search.">
          <form className="space-y-4" onSubmit={submit}>
            <Field label="Name">
              <TextInput value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
            </Field>
            <Field label="Description">
              <TextArea value={form.description} rows={4} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} required />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Category">
                <Select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}>
                  {["dorm", "office", "academic", "service", "recreation"].map((value) => (
                    <option key={value} value={value}>
                      {titleCase(value)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Building">
                <TextInput value={form.building} onChange={(event) => setForm((current) => ({ ...current, building: event.target.value }))} required />
              </Field>
              <Field label="Floor">
                <TextInput value={form.floor} onChange={(event) => setForm((current) => ({ ...current, floor: event.target.value }))} />
              </Field>
              <Field label="Room Number">
                <TextInput value={form.roomNumber} onChange={(event) => setForm((current) => ({ ...current, roomNumber: event.target.value }))} />
              </Field>
              <Field label="Latitude">
                <TextInput value={form.latitude} onChange={(event) => setForm((current) => ({ ...current, latitude: event.target.value }))} required />
              </Field>
              <Field label="Longitude">
                <TextInput value={form.longitude} onChange={(event) => setForm((current) => ({ ...current, longitude: event.target.value }))} required />
              </Field>
              <Field label="Contact Person">
                <TextInput value={form.contactPerson} onChange={(event) => setForm((current) => ({ ...current, contactPerson: event.target.value }))} />
              </Field>
              <Field label="Contact Phone">
                <TextInput value={form.contactPhone} onChange={(event) => setForm((current) => ({ ...current, contactPhone: event.target.value }))} />
              </Field>
            </div>
            <Field label="Open Hours">
              <TextInput value={form.openHours} onChange={(event) => setForm((current) => ({ ...current, openHours: event.target.value }))} />
            </Field>
            <div className="flex gap-3">
              <ActionButton type="submit" variant="primary">
                {editingId ? "Update location" : "Create location"}
              </ActionButton>
              {editingId ? (
                <ActionButton type="button" onClick={resetForm}>
                  Cancel edit
                </ActionButton>
              ) : null}
            </div>
          </form>
        </Panel>

        <Panel title="Campus Locations" description="Search uses `/navigation/search`; full listing uses `/navigation`.">
          {locations.length ? (
            <div className="space-y-4">
              {locations.map((location) => (
                <div key={location._id} className="rounded-2xl border border-white/5 bg-[#141415] p-4">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-base font-medium text-white">{location.name}</p>
                        <StatusBadge>{titleCase(location.category)}</StatusBadge>
                      </div>
                      <p className="mt-2 text-sm text-zinc-300">{location.description}</p>
                      <p className="mt-3 text-xs text-zinc-500">
                        {location.building}
                        {location.floor != null ? ` • Floor ${location.floor}` : ""}
                        {location.roomNumber ? ` • Room ${location.roomNumber}` : ""}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {location.latitude}, {location.longitude}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <ActionButton type="button" onClick={() => editLocation(location)}>
                        Edit
                      </ActionButton>
                      <ActionButton type="button" variant="danger" onClick={() => void deleteLocation(location._id)}>
                        Delete
                      </ActionButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No locations found" description="Create or search locations to populate this list." />
          )}
        </Panel>
      </div>
    </div>
  );
}
