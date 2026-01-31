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
import { Textarea } from "@/components/ui/Textarea";
import RecurrenceModal from "@/components/orders/RecurrenceModal";
import { formatRecurrenceSummary } from "@/components/orders/recurrenceSummary";
import {
  newJobSchema,
  type NewJobFormValues
} from "@/features/jobs/forms/newJob/formSchema";
import type { Customer, Employee, Job } from "@/features/_shared/types";
import type { CustomerAddress, JobRecurrence } from "@fieldvantage/shared";
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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerAddresses, setCustomerAddresses] = useState<CustomerAddress[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [filter, setFilter] = useState("");
  const [showSelector, setShowSelector] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRecurrence, setShowRecurrence] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [allowInactive, setAllowInactive] = useState(false);

  const toDateTimeLocalValue = (value?: string | null) => {
    if (!value) {
      return "";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    const pad = (num: number) => String(num).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

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
      customerAddressId: job.customer_address_id ?? "",
      scheduledFor: toDateTimeLocalValue(job.scheduled_for),
      estimatedEndAt: toDateTimeLocalValue(job.estimated_end_at),
      status: job.status,
      assignedEmployeeIds: job.assigned_employee_ids ?? [],
      allowInactive: false,
      isRecurring: job.is_recurring ?? false,
      recurrence: job.recurrence ?? null,
      notes: job.notes ?? ""
    }
  });

  useEffect(() => {
    register("assignedEmployeeIds");
    register("customerId");
    register("customerAddressId");
    register("isRecurring");
    register("recurrence");
    register("notes");
    register("allowInactive");
  }, [register]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [employeesResponse, customersResponse] = await Promise.all([
          fetch("/api/employees"),
          fetch("/api/customers")
        ]);
        if (employeesResponse.ok) {
          const payload = (await employeesResponse.json()) as {
            data?: Employee[];
          };
          setEmployees(payload.data ?? []);
        }
        if (customersResponse.ok) {
          const payload = (await customersResponse.json()) as {
            data?: Customer[];
          };
          setCustomers(payload.data ?? []);
        }
      } catch {
        setEmployees([]);
        setCustomers([]);
      }
    };
    loadData();
  }, []);

  const assignedEmployeeIds = watch("assignedEmployeeIds");
  const selectedCustomerId = watch("customerId");
  const selectedCustomerAddressId = watch("customerAddressId");
  const selectedStatus = watch("status");
  const isRecurring = watch("isRecurring");

  const statusClass =
    selectedStatus === "done"
      ? "text-emerald-700"
      : selectedStatus === "in_progress"
        ? "text-amber-700"
        : selectedStatus === "canceled"
          ? "text-rose-700"
          : "text-slate-700";

  const recurrenceSummary = (recurrence?: unknown) =>
    formatRecurrenceSummary(
      (recurrence ?? null) as JobRecurrence | null,
      t
    );
  const assignedEmployees = useMemo(
    () =>
      employees.filter((employee) =>
        assignedEmployeeIds?.includes(employee.id)
      ),
    [employees, assignedEmployeeIds]
  );

  const buildAddressLabel = (address: CustomerAddress) => {
    const parts = [
      address.label,
      address.address_line1,
      address.address_line2,
      `${address.city}, ${address.state} ${address.zip_code}`,
      address.country
    ].filter(Boolean);
    return parts.join(" · ");
  };

  useEffect(() => {
    const loadAddresses = async () => {
      if (!selectedCustomerId) {
        setCustomerAddresses([]);
        setValue("customerAddressId", "", { shouldDirty: true });
        return;
      }
      setIsLoadingAddresses(true);
      try {
        const response = await fetch(`/api/customers/${selectedCustomerId}`, {
          cache: "no-store"
        });
        if (!response.ok) {
          setCustomerAddresses([]);
          setValue("customerAddressId", "", { shouldDirty: true });
          return;
        }
        const payload = (await response.json()) as {
          data?: { addresses?: CustomerAddress[] };
        };
        const addresses = payload.data?.addresses ?? [];
        setCustomerAddresses(addresses);
        const preferred =
          addresses.find((address) => address.id === selectedCustomerAddressId)?.id ??
          addresses.find((address) => address.is_primary)?.id ??
          addresses[0]?.id ??
          "";
        setValue("customerAddressId", preferred, { shouldDirty: true });
      } catch {
        setCustomerAddresses([]);
        setValue("customerAddressId", "", { shouldDirty: true });
      } finally {
        setIsLoadingAddresses(false);
      }
    };

    loadAddresses();
  }, [selectedCustomerAddressId, selectedCustomerId, setValue]);

  const filteredEmployees = useMemo(() => {
    const search = filter.trim().toLowerCase();
    const baseEmployees = showInactive
      ? employees
      : employees.filter((employee) => employee.status === "active");
    if (!search) {
      return baseEmployees;
    }
    return baseEmployees.filter((employee) =>
      employee.full_name.toLowerCase().includes(search)
    );
  }, [employees, filter, showInactive]);

  const handleAddEmployee = (employeeId: string) => {
    const current = assignedEmployeeIds ?? [];
    if (current.includes(employeeId)) {
      return;
    }
    const selected = employees.find((employee) => employee.id === employeeId);
    if (selected?.status === "inactive" && !allowInactive) {
      setToast({ message: t("assignment.inactiveError"), variant: "error" });
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
        const data = (await response.json()) as { error?: string; message?: string };
        if (data?.error === "EMPLOYEE_INACTIVE") {
          throw new Error(t("assignment.inactiveError"));
        }
        throw new Error(data?.error ?? data?.message ?? t("messages.updateError"));
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
      <Select
        label={t("fields.customer")}
        error={errors.customerName?.message}
        value={selectedCustomerId}
        options={[
          { value: "", label: t("fields.customerPlaceholder") },
          ...customers.map((customer) => ({
            value: customer.id,
            label: customer.name
          }))
        ]}
        onChange={(event) => {
          const id = event.target.value;
          const selected = customers.find((customer) => customer.id === id);
          setValue("customerId", id, { shouldDirty: true });
          setValue("customerName", selected?.name ?? "", { shouldDirty: true });
          setValue("customerAddressId", "", { shouldDirty: true });
        }}
      />
      <input type="hidden" {...register("customerId")} />
      <input type="hidden" {...register("customerName")} />
      <Select
        label={t("fields.customerAddress")}
        value={selectedCustomerAddressId ?? ""}
        error={errors.customerAddressId?.message}
        options={[
          {
            value: "",
            label: isLoadingAddresses
              ? tCommon("status.loading")
              : t("fields.customerAddressPlaceholder")
          },
          ...customerAddresses.map((address) => ({
            value: address.id,
            label: buildAddressLabel(address)
          }))
        ]}
        onChange={(event) => {
          setValue("customerAddressId", event.target.value, {
            shouldDirty: true
          });
        }}
        disabled={!selectedCustomerId || isLoadingAddresses || customerAddresses.length === 0}
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
        className={statusClass}
        {...register("status")}
      />
      <Input
        label={t("fields.scheduledFor")}
        type="datetime-local"
        error={errors.scheduledFor?.message}
        {...register("scheduledFor")}
      />
      <Input
        label={t("fields.estimatedEndAt")}
        type="datetime-local"
        error={errors.estimatedEndAt?.message}
        {...register("estimatedEndAt")}
      />

      <label className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-3 text-sm text-slate-700">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400"
          checked={Boolean(isRecurring)}
          onChange={(event) => {
            setValue("isRecurring", event.target.checked, { shouldDirty: true });
            if (!event.target.checked) {
              setValue("recurrence", null, { shouldDirty: true });
            } else if (!watch("recurrence")) {
              setValue(
                "recurrence",
                { repeat: "daily", every: 1 },
                { shouldDirty: true }
              );
            }
          }}
        />
        <span>{t("recurrence.toggle")}</span>
      </label>

      {isRecurring ? (
        <button
          type="button"
          onClick={() => setShowRecurrence(true)}
          className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50/70"
        >
          <span className="font-semibold">{t("recurrence.custom")}</span>
          <span className="flex min-w-0 items-center gap-2">
            <span className="max-w-[220px] truncate text-xs text-slate-500">
              {recurrenceSummary(watch("recurrence") ?? null)}
            </span>
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path
                d="M9 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </span>
        </button>
      ) : null}

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
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400"
              checked={showInactive}
              onChange={(event) => {
                const next = event.target.checked;
                setShowInactive(next);
                if (!next) {
                  setAllowInactive(false);
                  setValue("allowInactive", false, { shouldDirty: true });
                }
              }}
            />
            <span>{t("assignment.showInactive")}</span>
          </label>
          {showInactive ? (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400"
                checked={allowInactive}
                onChange={(event) => {
                  setAllowInactive(event.target.checked);
                  setValue("allowInactive", event.target.checked, {
                    shouldDirty: true
                  });
                }}
              />
              <span>{t("assignment.allowInactive")}</span>
            </label>
          ) : null}
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
                <div className="flex items-center gap-2">
                  {employee.status === "inactive" ? (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                      {t("assignment.inactiveBadge")}
                    </span>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => handleRemoveEmployee(employee.id)}
                  >
                    {tCommon("actions.remove")}
                  </Button>
                </div>
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
                  const isInactive = employee.status === "inactive";
                  const disabled = isInactive && !allowInactive;
                  return (
                    <button
                      key={employee.id}
                      type="button"
                      onClick={() => handleAddEmployee(employee.id)}
                      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition ${
                        isSelected
                          ? "border-brand-200 bg-brand-50 text-brand-700"
                          : disabled
                            ? "border-slate-200/70 bg-white/90 text-slate-400 opacity-70"
                            : "border-slate-200/70 bg-white/90 text-slate-700 hover:bg-slate-50/60"
                      } ${disabled ? "cursor-not-allowed" : ""}`}
                    >
                      <div>
                        <p className="font-semibold text-slate-900">
                          {employee.full_name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {employee.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isInactive ? (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                            {t("assignment.inactiveBadge")}
                          </span>
                        ) : null}
                        <span className="text-xs font-semibold">
                          {isSelected
                            ? t("assignment.selected")
                            : t("assignment.add")}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}
      </div>

      <Textarea
        label={t("notes.label")}
        error={errors.notes?.message}
        {...register("notes")}
      />

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button type="button" variant="ghost" onClick={() => router.push("/jobs")}>
          {tCommon("actions.back")}
        </Button>
        <div className="flex items-center gap-2 sm:ml-auto">
          <Button
            type="button"
            className="bg-rose-50 text-rose-600 hover:bg-rose-100 focus-visible:ring-rose-200"
            onClick={() => setShowDeleteConfirm(true)}
          >
            {t("actions.delete")}
          </Button>
          <SaveAnimatedButton
            type="submit"
            isLoading={isSubmitting}
            label={tCommon("actions.save")}
            loadingLabel={tCommon("actions.saving")}
          />
        </div>
      </div>
      <RecurrenceModal
        open={showRecurrence}
        value={watch("recurrence") ?? null}
        onCancel={() => setShowRecurrence(false)}
        onSave={(value) => {
          setValue("recurrence", value, { shouldDirty: true });
          setValue("isRecurring", true, { shouldDirty: true });
          setShowRecurrence(false);
        }}
      />
      {showDeleteConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <p className="text-base font-semibold text-slate-900">
              {t("messages.deleteTitle")}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {t("messages.deleteConfirm")}
            </p>
            <div className="mt-6 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowDeleteConfirm(false)}
              >
                {tCommon("actions.cancel")}
              </Button>
              <Button
                type="button"
                className="bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-300"
                onClick={async () => {
                  setShowDeleteConfirm(false);
                  await onDelete();
                }}
              >
                {t("actions.delete")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
}
