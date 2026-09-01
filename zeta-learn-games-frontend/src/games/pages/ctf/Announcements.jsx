import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import ctfService from "../../../services/ctfService";
import Modal from "../../../components/Modal";
import LoadingSpinner from "../../../components/LoadingSpinner";
import ErrorState from "../../../components/ErrorState";
import EmptyState from "../../../components/EmptyState";

const emptyForm = { title: "", message: "" };

export default function CtfAnnouncements() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await ctfService.listAnnouncements();
      setRows(Array.isArray(data) ? data : []);
    } catch (errorValue) {
      setError(ctfService.withApiError(errorValue, "Unable to load announcements"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      toast.error("Title and message are required");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title: form.title.trim(),
        message: form.message.trim(),
      };

      if (editingId) {
        await ctfService.updateAnnouncement(editingId, payload);
        toast.success("Announcement updated");
      } else {
        await ctfService.createAnnouncement(payload);
        toast.success("Announcement created");
      }

      resetForm();
      load();
    } catch (errorValue) {
      toast.error(
        ctfService.withApiError(errorValue, "Unable to save announcement")
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deletingItem) return;
    try {
      await ctfService.deleteAnnouncement(deletingItem.id);
      toast.success("Announcement deleted");
      setDeletingItem(null);
      load();
    } catch (errorValue) {
      toast.error(
        ctfService.withApiError(errorValue, "Unable to delete announcement")
      );
    }
  };

  if (loading && rows.length === 0) {
    return <LoadingSpinner label="Loading announcements..." />;
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          CTF Announcements
        </h1>
        <p className="text-sm text-slate-500">
          Create, edit, and remove admin announcements.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="space-y-3 rounded-2xl border border-slate-200 bg-white/95 p-4"
      >
        <label className="space-y-1">
          <span className="text-sm text-slate-700">Title</span>
          <input
            value={form.title}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, title: event.target.value }))
            }
            required
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm text-slate-700">Message</span>
          <textarea
            rows={4}
            value={form.message}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, message: event.target.value }))
            }
            required
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </label>

        <div className="flex justify-end gap-2">
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-900 hover:bg-slate-50"
            >
              Cancel
            </button>
          ) : null}
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
          >
            {saving
              ? "Saving..."
              : editingId
              ? "Update Announcement"
              : "Add Announcement"}
          </button>
        </div>
      </form>

      {error ? <ErrorState message={error} onRetry={load} /> : null}

      {!loading && rows.length === 0 ? (
        <EmptyState
          title="No announcements"
          description="Create your first admin announcement."
        />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {rows.map((row) => (
          <article
            key={row.id}
            className="rounded-2xl border border-slate-200 bg-white/95 p-4"
          >
            <h2 className="text-lg font-semibold text-slate-900">{row.title}</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
              {row.message}
            </p>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingId(row.id);
                  setForm({
                    title: row.title || "",
                    message: row.message || "",
                  });
                }}
                className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs text-blue-700 hover:bg-blue-100"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setDeletingItem(row)}
                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-100"
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>

      <Modal
        isOpen={Boolean(deletingItem)}
        title="Delete Announcement"
        description={`Delete "${deletingItem?.title || ""}"?`}
        confirmText="Delete"
        onCancel={() => setDeletingItem(null)}
        onConfirm={remove}
      />
    </section>
  );
}

