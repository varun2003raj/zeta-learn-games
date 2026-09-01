import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import ctfService from "../../../services/ctfService";
import Table from "../../../components/Table";
import Modal from "../../../components/Modal";
import LoadingSpinner from "../../../components/LoadingSpinner";
import ErrorState from "../../../components/ErrorState";
import EmptyState from "../../../components/EmptyState";

export default function CtfCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const rows = await ctfService.listCategories();
      setCategories(rows);
    } catch (errorValue) {
      setError(ctfService.withApiError(errorValue, "Unable to load categories"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const resetForm = () => {
    setName("");
    setEditingId(null);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!name.trim()) return;

    try {
      setSaving(true);
      if (editingId) {
        await ctfService.updateCategory(editingId, { name: name.trim() });
        toast.success("Category updated");
      } else {
        await ctfService.createCategory({ name: name.trim() });
        toast.success("Category created");
      }
      resetForm();
      loadCategories();
    } catch (errorValue) {
      toast.error(ctfService.withApiError(errorValue, "Unable to save category"));
    } finally {
      setSaving(false);
    }
  };

  const ensureTieBreaker = async () => {
    const exists = categories.some(
      (category) => (category?.name || "").trim().toLowerCase() === "tie breaker"
    );

    if (exists) {
      toast("Tie Breaker category already exists");
      return;
    }

    try {
      await ctfService.ensureTieBreakerCategory();
      toast.success("Tie Breaker category created");
      loadCategories();
    } catch (errorValue) {
      toast.error(
        ctfService.withApiError(errorValue, "Unable to create Tie Breaker category")
      );
    }
  };

  const removeCategory = async () => {
    if (!deletingCategory) return;

    try {
      await ctfService.deleteCategory(deletingCategory.id);
      toast.success("Category deleted");
      setDeletingCategory(null);
      loadCategories();
    } catch (errorValue) {
      toast.error(ctfService.withApiError(errorValue, "Unable to delete category"));
    }
  };

  const columns = [
    {
      key: "name",
      title: "Category Name",
      render: (category) => (
        <span className="font-medium text-slate-900">{category.name}</span>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (category) => (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingId(category.id);
              setName(category.name);
            }}
            className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-700 hover:bg-blue-100"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setDeletingCategory(category)}
            className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700 hover:bg-rose-100"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  if (loading && categories.length === 0) {
    return <LoadingSpinner label="Loading CTF categories..." />;
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">CTF Categories</h1>
        <p className="text-sm text-slate-500">
          Manage all challenge categories used by CTF problems.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="grid gap-3 rounded-2xl border border-slate-200 bg-white/92 p-4 md:grid-cols-[1fr_auto_auto]"
      >
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Category name"
          required
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/40"
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
        >
          {saving ? "Saving..." : editingId ? "Update Category" : "Add Category"}
        </button>
        {editingId ? (
          <button
            type="button"
            onClick={resetForm}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-900 hover:bg-slate-50"
          >
            Cancel
          </button>
        ) : null}
      </form>

      <div>
        <button
          type="button"
          onClick={ensureTieBreaker}
          className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-500"
        >
          Create Tie Breaker Category
        </button>
      </div>

      {error ? <ErrorState message={error} onRetry={loadCategories} /> : null}

      <Table
        columns={columns}
        data={categories}
        loading={loading}
        emptyMessage="No categories found."
      />

      {!loading && categories.length === 0 && !error ? (
        <EmptyState
          title="No CTF categories"
          description="Create a category to start adding CTF challenges."
        />
      ) : null}

      <Modal
        isOpen={Boolean(deletingCategory)}
        title="Delete Category"
        description={`Delete category "${deletingCategory?.name || ""}"?`}
        confirmText="Delete"
        onCancel={() => setDeletingCategory(null)}
        onConfirm={removeCategory}
      />
    </section>
  );
}
