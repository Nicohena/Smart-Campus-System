import { useEffect, useState } from "react";
import { apiRequest } from "../../api/client";
import {
  ActionButton,
  ApiResponse,
  EmptyState,
  PageHeader,
  Panel,
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
  contactPerson?: string;
  contactPhone?: string;
  openHours?: string;
}

export function StudentNavigation() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLocations = async (search = "") => {
    setLoading(true);
    setError("");
    try {
      const endpoint = search ? `/navigation/search?q=${encodeURIComponent(search)}` : "/navigation";
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campus Navigation"
        description="Search academic buildings, dorms, offices, and campus services."
        actions={
          <>
            <TextInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name or building" />
            <ActionButton type="button" onClick={() => void loadLocations(query.trim())}>Search</ActionButton>
            <ActionButton type="button" variant="primary" onClick={() => void loadLocations()} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </ActionButton>
          </>
        }
      />

      {error ? <EmptyState title="Navigation unavailable" description={error} /> : null}

      <Panel title="Locations" description="Results come from the authenticated navigation endpoints.">
        {locations.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {locations.map((location) => (
              <div key={location._id} className="rounded-2xl border border-white/5 bg-[#141415] p-4">
                <div className="flex items-center gap-3">
                  <p className="font-medium text-white">{location.name}</p>
                </div>
                <p className="mt-2 text-xs text-zinc-500">{titleCase(location.category)}</p>
                <p className="mt-3 text-sm text-zinc-300">{location.description}</p>
                <p className="mt-3 text-xs text-zinc-500">
                  {location.building}
                  {location.floor != null ? ` • Floor ${location.floor}` : ""}
                  {location.roomNumber ? ` • Room ${location.roomNumber}` : ""}
                </p>
                {location.openHours ? <p className="mt-1 text-xs text-zinc-500">Hours: {location.openHours}</p> : null}
                {location.contactPerson ? <p className="mt-1 text-xs text-zinc-500">Contact: {location.contactPerson}{location.contactPhone ? ` • ${location.contactPhone}` : ""}</p> : null}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No locations found" description="Try a broader search or refresh the full campus list." />
        )}
      </Panel>
    </div>
  );
}
