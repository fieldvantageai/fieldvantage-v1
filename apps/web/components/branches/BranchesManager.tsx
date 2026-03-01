"use client";

import { useState, useEffect, useCallback } from "react";

import { Button } from "@/components/ui/Button";
import type { Branch } from "@/features/branches/service";

type BranchFormData = {
  name: string;
  email: string;
  phone: string;
  address_line1: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  is_active: boolean;
};

const emptyForm: BranchFormData = {
  name: "",
  email: "",
  phone: "",
  address_line1: "",
  city: "",
  state: "",
  zip_code: "",
  country: "",
  is_active: true
};

type BranchFormProps = {
  initial?: BranchFormData;
  onSave: (data: BranchFormData) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
};

function BranchForm({ initial = emptyForm, onSave, onCancel, loading }: BranchFormProps) {
  const [form, setForm] = useState<BranchFormData>(initial);

  const set = (field: keyof BranchFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) =>
    setForm((prev) => ({
      ...prev,
      [field]: field === "is_active" ? (e.target as HTMLInputElement).checked : e.target.value
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(form);
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:opacity-50";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Nome <span className="text-red-500">*</span>
          </label>
          <input
            required
            value={form.name}
            onChange={set("name")}
            placeholder="Filial Centro"
            className={inputClass}
            disabled={loading}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">E-mail</label>
          <input
            type="email"
            value={form.email}
            onChange={set("email")}
            placeholder="filial@empresa.com"
            className={inputClass}
            disabled={loading}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Telefone</label>
          <input
            value={form.phone}
            onChange={set("phone")}
            placeholder="(11) 99999-9999"
            className={inputClass}
            disabled={loading}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">Endereço</label>
          <input
            value={form.address_line1}
            onChange={set("address_line1")}
            placeholder="Rua, número"
            className={inputClass}
            disabled={loading}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Cidade</label>
          <input
            value={form.city}
            onChange={set("city")}
            className={inputClass}
            disabled={loading}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Estado</label>
          <input
            value={form.state}
            onChange={set("state")}
            className={inputClass}
            disabled={loading}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">CEP</label>
          <input
            value={form.zip_code}
            onChange={set("zip_code")}
            className={inputClass}
            disabled={loading}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">País</label>
          <input
            value={form.country}
            onChange={set("country")}
            placeholder="Brasil"
            className={inputClass}
            disabled={loading}
          />
        </div>
        <div className="sm:col-span-2 flex items-center gap-2">
          <input
            id="is_active"
            type="checkbox"
            checked={form.is_active}
            onChange={set("is_active")}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400"
            disabled={loading}
          />
          <label htmlFor="is_active" className="text-sm font-medium text-slate-700">
            Filial ativa
          </label>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  );
}

type BranchCardProps = {
  branch: Branch;
  onEdit: (branch: Branch) => void;
  onDelete: (branch: Branch) => void;
};

function BranchCard({ branch, onEdit, onDelete }: BranchCardProps) {
  return (
    <div className="flex items-start justify-between rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-3 shadow-sm">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-900 truncate">{branch.name}</p>
          {!branch.is_active && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
              Inativa
            </span>
          )}
        </div>
        {branch.city || branch.state ? (
          <p className="text-xs text-slate-500 mt-0.5">
            {[branch.city, branch.state].filter(Boolean).join(", ")}
          </p>
        ) : null}
        {branch.email ? (
          <p className="text-xs text-slate-400 mt-0.5">{branch.email}</p>
        ) : null}
      </div>
      <div className="flex gap-1 ml-4 shrink-0">
        <button
          type="button"
          onClick={() => onEdit(branch)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          title="Editar"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => onDelete(branch)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
          title="Remover"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4h6v2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function BranchesManager() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [deletingBranch, setDeletingBranch] = useState<Branch | null>(null);

  const fetchBranches = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/branches", { cache: "no-store" });
      const payload = (await res.json()) as { data?: Branch[]; error?: string };
      if (!res.ok) {
        setError(payload.error ?? "Erro ao carregar filiais.");
      } else {
        setBranches(payload.data ?? []);
      }
    } catch {
      setError("Erro ao carregar filiais.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const handleCreate = async (data: BranchFormData) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const payload = (await res.json()) as { data?: Branch; error?: string };
      if (!res.ok) {
        setError(payload.error ?? "Erro ao criar filial.");
      } else {
        setShowForm(false);
        await fetchBranches();
      }
    } catch {
      setError("Erro ao criar filial.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (data: BranchFormData) => {
    if (!editingBranch) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/branches/${editingBranch.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const payload = (await res.json()) as { data?: Branch; error?: string };
      if (!res.ok) {
        setError(payload.error ?? "Erro ao atualizar filial.");
      } else {
        setEditingBranch(null);
        await fetchBranches();
      }
    } catch {
      setError("Erro ao atualizar filial.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingBranch) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/branches/${deletingBranch.id}`, {
        method: "DELETE"
      });
      if (!res.ok) {
        const payload = (await res.json()) as { error?: string };
        setError(payload.error ?? "Erro ao remover filial.");
      } else {
        setDeletingBranch(null);
        await fetchBranches();
      }
    } catch {
      setError("Erro ao remover filial.");
    } finally {
      setSaving(false);
    }
  };

  const editFormData = editingBranch
    ? {
        name: editingBranch.name,
        email: editingBranch.email ?? "",
        phone: editingBranch.phone ?? "",
        address_line1: editingBranch.address_line1 ?? "",
        city: editingBranch.city ?? "",
        state: editingBranch.state ?? "",
        zip_code: editingBranch.zip_code ?? "",
        country: editingBranch.country ?? "",
        is_active: editingBranch.is_active
      }
    : emptyForm;

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Lista de filiais */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : branches.length === 0 && !showForm ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
          <p className="text-sm font-medium text-slate-600">Nenhuma filial cadastrada</p>
          <p className="mt-1 text-xs text-slate-400">
            Adicione filiais para organizar ordens e equipes por unidade.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {branches.map((branch) =>
            editingBranch?.id === branch.id ? (
              <div
                key={branch.id}
                className="rounded-2xl border border-brand-200 bg-brand-50/30 p-4"
              >
                <p className="mb-3 text-sm font-semibold text-slate-700">Editar filial</p>
                <BranchForm
                  initial={editFormData}
                  onSave={handleUpdate}
                  onCancel={() => setEditingBranch(null)}
                  loading={saving}
                />
              </div>
            ) : (
              <BranchCard
                key={branch.id}
                branch={branch}
                onEdit={(b) => {
                  setShowForm(false);
                  setEditingBranch(b);
                }}
                onDelete={(b) => setDeletingBranch(b)}
              />
            )
          )}
        </div>
      )}

      {/* Formulário de nova filial */}
      {showForm && !editingBranch ? (
        <div className="rounded-2xl border border-brand-200 bg-brand-50/30 p-4">
          <p className="mb-3 text-sm font-semibold text-slate-700">Nova filial</p>
          <BranchForm
            onSave={handleCreate}
            onCancel={() => setShowForm(false)}
            loading={saving}
          />
        </div>
      ) : !editingBranch ? (
        <Button
          type="button"
          variant="secondary"
          onClick={() => setShowForm(true)}
        >
          + Adicionar filial
        </Button>
      ) : null}

      {/* Modal de confirmação de exclusão */}
      {deletingBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-slate-900">Remover filial?</h3>
            <p className="mt-2 text-sm text-slate-500">
              A filial <strong>{deletingBranch.name}</strong> será removida. Ordens e
              colaboradores vinculados perderão a associação, mas não serão excluídos.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setDeletingBranch(null)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {saving ? "Removendo..." : "Remover"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
