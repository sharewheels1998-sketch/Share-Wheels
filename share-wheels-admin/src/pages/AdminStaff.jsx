import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getAdminStaff,
  getAdminStaffMeta,
  createAdminStaff,
  updateAdminStaff,
  deleteAdminStaff,
} from "../api/client";
import PageHeader from "../components/ui/PageHeader";
import Loading from "../components/ui/Loading";
import AdminPageShell, { AdminTablePanel } from "../components/ui/AdminPageShell";
import IconActionButton, { TableActions } from "../components/ui/IconActionButton";
import { IconEdit, IconTrash } from "../components/ui/icons";
import PermissionGate from "../components/PermissionGate";
import { useAdminAuth } from "../context/AdminAuthContext";
import { buildEmptyPermissions, buildAllPermissions } from "../constants/adminPermissions";
import {
  Alert,
  btnClass,
  inputClass,
  ModalBackdrop,
  Table,
  Th,
  Td,
} from "../components/ui/primitives";

const EMPTY_FORM = {
  name: "",
  email: "",
  mobile: "",
  password: "",
  isActive: true,
  permissions: buildEmptyPermissions(),
};

const ACTION_LABELS = {
  view: "View",
  create: "Create",
  edit: "Edit",
  delete: "Delete",
};

const PERMISSION_ACTIONS = ["view", "create", "edit", "delete"];

function PermissionMatrix({ modules, permissions, onChange, disabled = false }) {
  const toggle = (moduleKey, action) => {
    if (disabled) return;
    onChange({
      ...permissions,
      [moduleKey]: {
        ...permissions[moduleKey],
        [action]: !permissions?.[moduleKey]?.[action],
      },
    });
  };

  const toggleRow = (moduleKey, actions) => {
    if (disabled) return;
    const allOn = actions.every((action) => permissions?.[moduleKey]?.[action]);
    const next = { ...permissions, [moduleKey]: { ...permissions[moduleKey] } };
    for (const action of actions) next[moduleKey][action] = !allOn;
    onChange(next);
  };

  const toggleColumn = (action) => {
    if (disabled) return;
    const applicable = modules.filter((mod) => mod.actions.includes(action));
    const allOn = applicable.every((mod) => permissions?.[mod.key]?.[action]);
    const next = { ...permissions };
    for (const mod of applicable) {
      next[mod.key] = { ...next[mod.key], [action]: !allOn };
    }
    onChange(next);
  };

  const setAllPermissions = (value) => {
    if (disabled) return;
    onChange(buildAllPermissions(value));
  };

  const allSelected = useMemo(() => {
    if (!modules.length) return false;
    return modules.every((mod) =>
      mod.actions.every((action) => permissions?.[mod.key]?.[action])
    );
  }, [modules, permissions]);

  const columnAllSelected = (action) => {
    const applicable = modules.filter((mod) => mod.actions.includes(action));
    return applicable.length > 0 && applicable.every((mod) => permissions?.[mod.key]?.[action]);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/80">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Quick select:</span>
        <button
          type="button"
          className={btnClass("secondary", "sm")}
          onClick={() => setAllPermissions(true)}
          disabled={disabled || allSelected}
        >
          Select all permissions
        </button>
        <button
          type="button"
          className={btnClass("secondary", "sm")}
          onClick={() => setAllPermissions(false)}
          disabled={disabled}
        >
          Clear all
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/90">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Module
              </th>
              {PERMISSION_ACTIONS.map((action) => (
                <th
                  key={action}
                  className="px-2 py-2 text-center text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400"
                >
                  <label className="inline-flex cursor-pointer flex-col items-center gap-1">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800"
                      checked={columnAllSelected(action)}
                      onChange={() => toggleColumn(action)}
                      disabled={disabled}
                      title={`Select all ${ACTION_LABELS[action]} permissions`}
                    />
                    <span>{ACTION_LABELS[action]}</span>
                  </label>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modules.map((mod) => (
              <tr key={mod.key} className="border-t border-slate-100 dark:border-slate-800">
                <td className="px-3 py-2">
                  <button
                    type="button"
                    className="text-left font-semibold text-slate-800 hover:text-brand-700 disabled:cursor-default dark:text-slate-200 dark:hover:text-brand-400"
                    onClick={() => toggleRow(mod.key, mod.actions)}
                    disabled={disabled}
                    title="Toggle all permissions for this module"
                  >
                    {mod.label}
                  </button>
                </td>
                {PERMISSION_ACTIONS.map((action) => (
                  <td key={action} className="px-2 py-2 text-center">
                    {mod.actions.includes(action) ? (
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800"
                        checked={!!permissions?.[mod.key]?.[action]}
                        onChange={() => toggle(mod.key, action)}
                        disabled={disabled}
                      />
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600">—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminStaff() {
  const { admin: currentAdmin } = useAdminAuth();
  const [staff, setStaff] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    Promise.all([getAdminStaff(), getAdminStaffMeta()])
      .then(([staffRes, metaRes]) => {
        setStaff(staffRes.staff || []);
        setModules(metaRes.modules || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, permissions: buildEmptyPermissions() });
    setModalOpen(true);
  };

  const openEdit = (member) => {
    setEditing(member);
    setForm({
      name: member.name || "",
      email: member.email || "",
      mobile: member.mobile || "",
      password: "",
      isActive: member.isActive !== false,
      permissions: member.permissions || buildEmptyPermissions(),
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        mobile: form.mobile.trim(),
        isActive: form.isActive,
        permissions: form.permissions,
      };
      if (form.password.trim()) payload.password = form.password.trim();

      if (editing) {
        await updateAdminStaff(editing.id, payload);
      } else {
        if (!form.password.trim()) throw new Error("Password is required for new staff");
        await createAdminStaff({ ...payload, password: form.password.trim() });
      }
      closeModal();
      load();
    } catch (err) {
      setError(err.message || "Could not save staff member");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (member) => {
    if (!window.confirm(`Delete staff account for ${member.name}?`)) return;
    try {
      await deleteAdminStaff(member.id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const stats = useMemo(() => {
    const active = staff.filter((s) => s.isActive !== false).length;
    const superAdmins = staff.filter((s) => s.isSuperAdmin).length;
    return { total: staff.length, active, superAdmins };
  }, [staff]);

  return (
    <AdminPageShell>
      <PageHeader
        compact
        title="Admin staff"
        subtitle="Create staff accounts and control module permissions — view, create, edit, delete."
      >
        <PermissionGate module="admin_staff" action="create">
          <button type="button" className={btnClass("primary", "sm")} onClick={openCreate}>
            + Add staff
          </button>
        </PermissionGate>
        <button type="button" className={btnClass("secondary", "sm")} onClick={load}>
          Refresh
        </button>
      </PageHeader>

      {error && !modalOpen ? <Alert variant="error">{error}</Alert> : null}

      <div className="mb-4 grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-brand-200/60 bg-gradient-to-br from-brand-500/10 to-accent-violet/5 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total staff</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats.active}</p>
        </div>
        <div className="rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Super admins</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats.superAdmins}</p>
        </div>
      </div>

      <AdminTablePanel>
        {loading ? (
          <Loading />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {staff.map((member) => (
                <tr key={member.id}>
                  <Td>
                    <div className="font-semibold text-slate-900">{member.name}</div>
                    <div className="text-xs text-slate-500">{member.mobile}</div>
                  </Td>
                  <Td>{member.email}</Td>
                  <Td>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${
                        member.isSuperAdmin
                          ? "bg-violet-100 text-violet-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {member.isSuperAdmin ? "Super admin" : "Staff"}
                    </span>
                  </Td>
                  <Td>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${
                        member.isActive !== false
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {member.isActive !== false ? "Active" : "Inactive"}
                    </span>
                  </Td>
                  <Td className="text-right">
                    <TableActions>
                      <PermissionGate module="admin_staff" action="edit">
                        <IconActionButton
                          label="Edit"
                          icon={IconEdit}
                          onClick={() => openEdit(member)}
                          disabled={member.isSuperAdmin && !currentAdmin?.isSuperAdmin}
                        />
                      </PermissionGate>
                      <PermissionGate module="admin_staff" action="delete">
                        {!member.isSuperAdmin ? (
                          <IconActionButton
                            label="Delete"
                            icon={IconTrash}
                            variant="danger"
                            onClick={() => handleDelete(member)}
                            disabled={String(member.id) === String(currentAdmin?.id)}
                          />
                        ) : null}
                      </PermissionGate>
                    </TableActions>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </AdminTablePanel>

      {modalOpen ? (
        <ModalBackdrop onClose={() => !saving && closeModal()} size="3xl">
          <form onSubmit={handleSubmit}>
            <h2 className="mb-1 text-xl font-bold text-slate-900 dark:text-slate-100">
              {editing ? "Edit staff member" : "New staff member"}
            </h2>
            <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
              Assign module permissions for view, create, edit, and delete actions.
            </p>

            {error ? <Alert variant="error" className="mb-4">{error}</Alert> : null}

            <div className="mb-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Name</span>
                <input
                  className={inputClass}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Mobile</span>
                <input
                  className={inputClass}
                  value={form.mobile}
                  onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))}
                  required
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Email</span>
                <input
                  type="email"
                  className={inputClass}
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                  {editing ? "New password (optional)" : "Password"}
                </span>
                <input
                  type="password"
                  className={inputClass}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  required={!editing}
                  minLength={6}
                />
              </label>
            </div>

            <label className="mb-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/80">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-brand-600 dark:border-slate-600 dark:bg-slate-800"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                disabled={editing?.isSuperAdmin}
              />
              <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Active account</span>
            </label>

            <div className="mb-5">
              <p className="mb-2 text-sm font-bold text-slate-900 dark:text-slate-100">Module permissions</p>
              <PermissionMatrix
                modules={modules}
                permissions={form.permissions}
                onChange={(permissions) => setForm((f) => ({ ...f, permissions }))}
                disabled={editing?.isSuperAdmin}
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              <button type="button" className={btnClass("secondary")} onClick={closeModal} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className={btnClass("primary")} disabled={saving || editing?.isSuperAdmin}>
                {saving ? "Saving…" : editing ? "Save changes" : "Create staff"}
              </button>
            </div>
          </form>
        </ModalBackdrop>
      ) : null}
    </AdminPageShell>
  );
}
