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
  DateField,
  FormSection,
  StatusCardField
} from "@/components/orders/OrderFormSection";
import {
  newJobSchema,
  type NewJobFormValues
} from "@/features/jobs/forms/newJob/formSchema";
import type { Customer, Employee, Job } from "@/features/_shared/types";
import type { CustomerAddress, JobRecurrence } from "@fieldvantage/shared";
import { useClientT } from "@/lib/i18n/useClientT";
import {
  Calendar,
  CalendarClock,
  ClipboardList,
  Clock,
  Plus,
  Save,
  StickyNote,
  Trash2,
  Users
} from "lucide-react";

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
      assignedMembershipIds: job.assigned_membership_ids ?? [],
      allowInactive: Boolean(job.allow_inactive_assignments),
      isRecurring: job.is_recurring ?? false,
      recurrence: job.recurrence ?? null,
      notes: job.notes ?? ""
    }
  });

  useEffect(() => {
    register("assignedMembershipIds");
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

  const assignedMembershipIds = watch("assignedMembershipIds");
  const selectedCustomerId = watch("customerId");
  const selectedCustomerAddressId = watch("customerAddressId");
  const selectedStatus = watch("status");
  const isRecurring = watch("isRecurring");

  const recurrenceSummary = (recurrence?: unknown) =>
    formatRecurrenceSummary(
      (recurrence ?? null) as JobRecurrence | null,
      t
    );
  const assignedEmployees = useMemo(
    () =>
      employees.filter((employee) =>
        assignedMembershipIds?.includes(employee.membership_id ?? "")
      ),
    [employees, assignedMembershipIds]
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

  const getInitials = (name?: string | null) => {
    if (!name) {
      return "--";
    }
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
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

  const handleAddEmployee = (membershipId: string) => {
    const current = assignedMembershipIds ?? [];
    if (current.includes(membershipId)) {
      return;
    }
    const selected = employees.find(
      (employee) => employee.membership_id === membershipId
    );
    if (selected?.status === "inactive" && !allowInactive) {
      setToast({ message: t("assignment.inactiveError"), variant: "error" });
      return;
    }
    setValue("assignedMembershipIds", [...current, membershipId], {
      shouldDirty: true
    });
  };

  const handleRemoveEmployee = (membershipId: string) => {
    const current = assignedMembershipIds ?? [];
    setValue(
      "assignedMembershipIds",
      current.filter((id) => id !== membershipId),
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-8">
      {toast ? (
        <ToastBanner
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
          closeLabel={tCommon("actions.close")}
        />
      ) : null}

      <FormSection
        icon={<ClipboardList className="h-5 w-5" />}
        title={t("form.sections.main.title")}
        subtitle={t("form.sections.main.subtitle")}
      >
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
          disabled={
            !selectedCustomerId || isLoadingAddresses || customerAddresses.length === 0
          }
        />
      </FormSection>

      <FormSection
        icon={<CalendarClock className="h-5 w-5" />}
        title={t("form.sections.planning.title")}
        subtitle={t("form.sections.planning.subtitle")}
        className="bg-muted/30"
      >
        <StatusCardField
          label={t("fields.status")}
          status={selectedStatus}
          error={errors.status?.message}
          actionLabel={t("form.status.changeLabel")}
          select={
            <select
              className="h-11 w-full rounded-xl border border-slate-300 bg-white/90 px-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
              {...register("status")}
            >
              <option value="scheduled">{t("status.scheduled")}</option>
              <option value="in_progress">{t("status.in_progress")}</option>
              <option value="done">{t("status.done")}</option>
              <option value="canceled">{t("status.canceled")}</option>
            </select>
          }
        />
        <div className="grid gap-4 md:grid-cols-2">
          <DateField
            label={t("fields.scheduledFor")}
            type="datetime-local"
            icon={<Calendar className="h-4 w-4 text-blue-500" />}
            error={errors.scheduledFor?.message}
            {...register("scheduledFor")}
          />
          <DateField
            label={t("fields.estimatedEndAt")}
            type="datetime-local"
            icon={<Clock className="h-4 w-4 text-amber-500" />}
            error={errors.estimatedEndAt?.message}
            {...register("estimatedEndAt")}
          />
        </div>

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
      </FormSection>

      <FormSection
        icon={<Users className="h-5 w-5" />}
        title={t("assignment.title")}
        subtitle={t("assignment.subtitle")}
        action={
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowSelector((value) => !value)}
            className="inline-flex items-center gap-2"
            disabled={isSubmitting}
          >
            <Plus className="h-4 w-4" />
            {showSelector ? t("assignment.hideSelector") : t("assignment.add")}
          </Button>
        }
      >
        <div className="text-xs text-slate-500">{t("assignment.helper")}</div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
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
          <div className="rounded-2xl border border-dashed border-slate-200/70 bg-white/90 p-5 text-sm text-slate-500 transition-all duration-200">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-slate-300" />
              <div>
                <p className="font-medium text-slate-600">{t("assignment.empty")}</p>
                <p className="text-xs text-slate-400">
                  {t("assignment.emptyHelper")}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {assignedEmployees.map((employee) => (
              <div
                key={employee.id}
                className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-3 text-sm text-slate-700 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-500">
                    {getInitials(employee.full_name)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900">
                        {employee.full_name}
                      </p>
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500">
                        {employee.status === "inactive"
                          ? t("assignment.inactiveBadge")
                          : t("assignment.assignedBadge")}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{employee.email}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50"
                  onClick={() =>
                    handleRemoveEmployee(employee.membership_id ?? "")
                  }
                  disabled={isSubmitting}
                >
                  <Trash2 className="h-4 w-4" />
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
                  const membershipId = employee.membership_id ?? "";
                  const isSelected = assignedMembershipIds?.includes(membershipId);
                  const isInactive = employee.status === "inactive";
                  const disabled = isInactive && !allowInactive;
                  return (
                    <button
                      key={employee.id}
                      type="button"
                      onClick={() => handleAddEmployee(membershipId)}
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
      </FormSection>

      <FormSection
        icon={<StickyNote className="h-5 w-5" />}
        title={t("form.sections.notes.title")}
        subtitle={t("form.sections.notes.subtitle")}
      >
        <Textarea
          label={t("notes.label")}
          placeholder={t("notes.placeholder")}
          error={errors.notes?.message}
          className="min-h-[140px] px-4 py-3 transition-all duration-200 focus:ring-2 focus:ring-brand-200/30 focus:shadow-md"
          {...register("notes")}
        />
      </FormSection>

      <div className="rounded-2xl border-t border-slate-200/70 bg-background/90 px-4 py-3 backdrop-blur-sm shadow-lg md:sticky md:bottom-0 md:z-20 md:rounded-none">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/jobs")}
            disabled={isSubmitting}
          >
            {tCommon("actions.back")}
          </Button>
          <div className="flex items-center gap-3 sm:ml-auto">
            <Button
              type="button"
              variant="ghost"
              className="inline-flex items-center gap-2 text-rose-600 hover:bg-rose-50"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isSubmitting}
            >
              <Trash2 className="h-4 w-4" />
              {t("actions.delete")}
            </Button>
            <SaveAnimatedButton
              type="submit"
              isLoading={isSubmitting}
              className="transition-all duration-200"
              label={
                <span className="inline-flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  {tCommon("actions.save")}
                </span>
              }
              loadingLabel={tCommon("actions.saving")}
            />
          </div>
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
