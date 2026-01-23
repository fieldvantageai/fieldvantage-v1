"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SaveAnimatedButton } from "@/components/ui/SaveAnimatedButton";
import { Select } from "@/components/ui/Select";
import { ToastBanner } from "@/components/ui/Toast";
import {
  newJobSchema,
  type NewJobFormValues
} from "@/features/jobs/forms/newJob/formSchema";
import type { Employee, Job } from "@/features/_shared/types";
import { useClientT } from "@/lib/i18n/useClientT";

type EditJobFormProps = {
  job: Job;
};

export default function EditJobForm({ job }: EditJobFormProps) {
  const router = useRouter();
  const { t } = useClientT("jobs");
  const { t: tCommon } = useClientT("common");
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error" | "info";
  } | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filter, setFilter] = useState("");
  const [showSelector, setShowSelector] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<NewJobFormValues>({
    resolver: yupResolver(newJobSchema),
    defaultValues: {
      title: job.title ?? "",
      customerName: job.customer_name ?? "",
      customerId: job.customer_id ?? "",
      scheduledFor: job.scheduled_for,
      expectedCompletion: job.expected_completion ?? "",
      status: job.status,
      assignedEmployeeIds: job.assigned_employee_ids ?? []
    }
  });

  useEffect(() => {
    register("assignedEmployeeIds");
    register("customerId");
  }, [register]);

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const response = await fetch("/api/employees");
        if (!response.ok) {
          throw new Error("Falha ao carregar colaboradores.");
        }
        const payload = (await response.json()) as { data?: Employee[] };
        setEmployees(payload.data ?? []);
      } catch {
        setEmployees([]);
      }
    };
    loadEmployees();
  }, []);

  const assignedEmployeeIds = watch("assignedEmployeeIds");

  const assignedEmployees = useMemo(
    () =>
      employees.filter((employee) =>
        assignedEmployeeIds?.includes(employee.id)
      ),
    [employees, assignedEmployeeIds]
  );

  const filteredEmployees = useMemo(() => {
    const search = filter.trim().toLowerCase();
    if (!search) {
      return employees;
    }
    return employees.filter((employee) =>
      employee.full_name.toLowerCase().includes(search)
    );
  }, [employees, filter]);

  const handleAddEmployee = (employeeId: string) => {
    const current = assignedEmployeeIds ?? [];
    if (current.includes(employeeId)) {
      return;
    }
    setValue("assignedEmployeeIds", [...current, employeeId], {
      shouldDirty: true
    });
  };

  const handleRemoveEmployee = (employeeId: string) => {
    const current = assignedEmployeeIds ?? [];
    setValue(
      "assignedEmployeeIds",
      current.filter((id) => id !== employeeId),
      { shouldDirty: true }
    );
  };

  const onSubmit = async (values: NewJobFormValues) => {
    setToast(null);
    try {
      const response = await fetch(`/api/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data?.error ?? t("messages.updateError"));
      }

      setToast({ message: t("messages.updated"), variant: "success" });
      router.refresh();
    } catch (error) {
      setToast({
        message:
          error instanceof Error ? error.message : t("messages.updateFallback"),
        variant: "error"
      });
    }
  };

  const onDelete = async () => {
    const confirmed = window.confirm(t("messages.deleteConfirm"));
    if (!confirmed) {
      return;
    }

    setToast(null);
    try {
      const response = await fetch(`/api/jobs/${job.id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data?.error ?? t("messages.deleteError"));
      }

      router.push("/jobs");
    } catch (error) {
      setToast({
        message:
          error instanceof Error ? error.message : t("messages.deleteFallback"),
        variant: "error"
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {toast ? (
        <ToastBanner
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
          closeLabel={tCommon("actions.close")}
        />
      ) : null}
      <Input
        label={t("fields.title")}
        error={errors.title?.message}
        {...register("title")}
      />
      <Input
        label={t("fields.customer")}
        error={errors.customerName?.message}
        {...register("customerName")}
      />
      <input type="hidden" {...register("customerId")} />
      <Input
        label={t("fields.scheduledFor")}
        type="datetime-local"
        error={errors.scheduledFor?.message}
        {...register("scheduledFor")}
      />
      <Input
        label={t("fields.expectedCompletion")}
        type="date"
        error={errors.expectedCompletion?.message}
        {...register("expectedCompletion")}
      />
      <Select
        label={t("fields.status")}
        error={errors.status?.message}
        options={[
          { value: "scheduled", label: t("status.scheduled") },
          { value: "in_progress", label: t("status.in_progress") },
          { value: "done", label: t("status.done") },
          { value: "canceled", label: t("status.canceled") }
        ]}
        {...register("status")}
      />

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {t("assignment.title")}
            </p>
            <p className="text-xs text-slate-500">{t("assignment.subtitle")}</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowSelector((value) => !value)}
          >
            {showSelector
              ? t("assignment.hideSelector")
              : t("assignment.add")}
          </Button>
        </div>

        {assignedEmployees.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200/70 bg-white/90 p-4 text-sm text-slate-500">
            {t("assignment.empty")}
          </div>
        ) : (
          <div className="space-y-2">
            {assignedEmployees.map((employee) => (
              <div
                key={employee.id}
                className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-3 text-sm text-slate-700"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {employee.full_name}
                  </p>
                  <p className="text-xs text-slate-500">{employee.email}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => handleRemoveEmployee(employee.id)}
                >
                  {tCommon("actions.remove")}
                </Button>
              </div>
            ))}
          </div>
        )}

        {showSelector ? (
          <div className="space-y-3 rounded-2xl border border-slate-200/70 bg-slate-50/60 p-4">
            <Input
              label={t("assignment.filterLabel")}
              placeholder={t("assignment.filterPlaceholder")}
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            />
            {filteredEmployees.length === 0 ? (
              <div className="text-sm text-slate-500">
                {t("assignment.filterEmpty")}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredEmployees.map((employee) => {
                  const isSelected = assignedEmployeeIds?.includes(employee.id);
                  return (
                    <button
                      key={employee.id}
                      type="button"
                      onClick={() => handleAddEmployee(employee.id)}
                      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition ${
                        isSelected
                          ? "border-brand-200 bg-brand-50 text-brand-700"
                          : "border-slate-200/70 bg-white/90 text-slate-700 hover:bg-slate-50/60"
                      }`}
                    >
                      <div>
                        <p className="font-semibold text-slate-900">
                          {employee.full_name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {employee.email}
                        </p>
                      </div>
                      <span className="text-xs font-semibold">
                        {isSelected
                          ? t("assignment.selected")
                          : t("assignment.add")}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button type="button" variant="ghost" onClick={() => router.push("/jobs")}>
          {tCommon("actions.back")}
        </Button>
        <div className="flex items-center gap-2 sm:ml-auto">
          <Button type="button" variant="secondary" onClick={onDelete}>
            {tCommon("actions.remove")}
          </Button>
          <SaveAnimatedButton
            type="submit"
            isLoading={isSubmitting}
            label={tCommon("actions.save")}
            loadingLabel={tCommon("actions.saving")}
          />
        </div>
      </div>
    </form>
  );
}
