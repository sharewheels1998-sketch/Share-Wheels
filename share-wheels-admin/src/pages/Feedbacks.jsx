import { useEffect, useState } from "react";
import { getFeedbacks, updateFeedback } from "../api/client";
import PageHeader from "../components/ui/PageHeader";
import Loading from "../components/ui/Loading";

const STATUS_OPTIONS = ["all", "new", "reviewed", "resolved"];

export default function Feedbacks() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    const params = statusFilter !== "all" ? { status: statusFilter } : {};
    getFeedbacks(params)
      .then((res) => setFeedbacks(res.feedbacks || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [statusFilter]);

  const setStatus = async (id, status) => {
    try {
      await updateFeedback(id, { status });
      load();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div>
      <PageHeader
        title="User feedback"
        subtitle="Messages submitted from the mobile app profile screen"
      />

      <div className="toolbar" style={{ marginBottom: 20 }}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ maxWidth: 200 }}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All statuses" : s}
            </option>
          ))}
        </select>
        <button type="button" className="btn btn-primary" onClick={load}>
          Refresh
        </button>
      </div>

      {error ? <div className="alert alert-error">{error}</div> : null}

      {loading ? (
        <Loading message="Loading feedback…" />
      ) : feedbacks.length === 0 ? (
        <p className="page-subtitle">No feedback yet.</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Category</th>
                <th>Message</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {feedbacks.map((f) => (
                <tr key={f._id}>
                  <td>
                    <div>{f.userId?.name || "—"}</div>
                    <div style={{ fontSize: 12, color: "#64748B" }}>
                      {f.userId?.email || f.userId?.mobile || ""}
                    </div>
                  </td>
                  <td>{f.category}</td>
                  <td style={{ maxWidth: 320, whiteSpace: "pre-wrap" }}>{f.message}</td>
                  <td>
                    <span className={`badge badge-${f.status}`}>{f.status}</span>
                  </td>
                  <td>{new Date(f.createdAt).toLocaleString()}</td>
                  <td className="table-actions">
                    {f.status !== "reviewed" ? (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setStatus(f._id, "reviewed")}
                      >
                        Reviewed
                      </button>
                    ) : null}
                    {f.status !== "resolved" ? (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => setStatus(f._id, "resolved")}
                      >
                        Resolved
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
