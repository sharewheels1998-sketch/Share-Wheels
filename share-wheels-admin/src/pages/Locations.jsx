import { useEffect, useState } from "react";
import {
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  bulkUpsertLocations,
  clearAllLocations,
} from "../api/client";
import PageHeader from "../components/ui/PageHeader";
import Loading from "../components/ui/Loading";

export default function Locations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [newName, setNewName] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    getLocations()
      .then((res) => setLocations(res.locations || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const shown = locations.filter((loc) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (loc.name || "").toLowerCase().includes(q);
  });

  const handleAdd = async (e) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setSaving(true);
    setError("");
    try {
      await createLocation({ name, isActive: true });
      setNewName("");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (loc) => {
    setSaving(true);
    setError("");
    try {
      await updateLocation(loc._id, { isActive: !loc.isActive });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this location?")) return;
    setSaving(true);
    setError("");
    try {
      await deleteLocation(id);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleBulkImport = async () => {
    const names = bulkText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (!names.length) {
      setError("Paste at least one location name (one per line).");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await bulkUpsertLocations(names);
      setBulkText("");
      setError("");
      alert(res.message || "Locations imported.");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Remove all location suggestions from the app?")) return;
    setSaving(true);
    setError("");
    try {
      await clearAllLocations();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Locations"
        subtitle="Manage from/to city suggestions shown in the mobile app"
      />

      {error ? <div className="alert alert-error">{error}</div> : null}

      <div className="card card-padded" style={{ marginBottom: 24 }}>
        <h2 className="card-header">Add location</h2>
        <form onSubmit={handleAdd} className="toolbar" style={{ marginTop: 12 }}>
          <input
            placeholder="City name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{ maxWidth: 320 }}
          />
          <button type="submit" className="btn btn-primary" disabled={saving}>
            Add
          </button>
        </form>
      </div>

      <div className="card card-padded" style={{ marginBottom: 24 }}>
        <h2 className="card-header">Bulk add / update</h2>
        <p className="page-subtitle" style={{ marginBottom: 12 }}>
          Paste one city per line. New cities are added. If a city already exists,
          only that entry is updated (reactivated). Other locations stay unchanged.
        </p>
        <textarea
          rows={8}
          placeholder={"Hyderabad\nVijayawada\nVisakhapatnam"}
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          style={{ width: "100%", marginBottom: 12 }}
        />
        <div className="toolbar">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleBulkImport}
            disabled={saving}
          >
            Import locations
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleClearAll}
            disabled={saving}
          >
            Clear all
          </button>
        </div>
      </div>

      <div className="card card-padded">
        <div className="toolbar" style={{ marginBottom: 16 }}>
          <h2 className="card-header" style={{ margin: 0 }}>
            Location list ({locations.length})
          </h2>
          <input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 240 }}
          />
        </div>

        {loading ? (
          <Loading message="Loading locations..." />
        ) : shown.length === 0 ? (
          <p className="page-subtitle">No locations yet. Add cities above.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((loc) => (
                  <tr key={loc._id}>
                    <td>{loc.name}</td>
                    <td>{loc.isActive ? "Active" : "Hidden"}</td>
                    <td className="table-actions">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleToggle(loc)}
                        disabled={saving}
                      >
                        {loc.isActive ? "Hide" : "Show"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(loc._id)}
                        disabled={saving}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
