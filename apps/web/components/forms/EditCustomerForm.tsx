"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SaveAnimatedButton } from "@/components/ui/SaveAnimatedButton";
import { ToastBanner } from "@/components/ui/Toast";
import {
  newCustomerSchema,
  type NewCustomerFormValues
} from "@/features/customers/forms/newCustomer/formSchema";
import type { Customer } from "@/features/_shared/types";
import { useClientT } from "@/lib/i18n/useClientT";

type EditCustomerFormProps = {
  customer: Customer;
};

export default function EditCustomerForm({ customer }: EditCustomerFormProps) {
  const router = useRouter();
  const { t } = useClientT("customers");
  const { t: tCommon } = useClientT("common");
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error" | "info";
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<NewCustomerFormValues>({
    resolver: yupResolver(newCustomerSchema),
    defaultValues: {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address
    }
  });

  const onSubmit = async (values: NewCustomerFormValues) => {
    setToast(null);
    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
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
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data?.error ?? t("messages.deleteError"));
      }

      router.push("/customers");
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
        label={t("fields.name")}
        error={errors.name?.message}
        {...register("name")}
      />
      <Input
        label={t("fields.email")}
        type="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <Input
        label={t("fields.phone")}
        error={errors.phone?.message}
        {...register("phone")}
      />
      <Input
        label={t("fields.address")}
        error={errors.address?.message}
        {...register("address")}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="ghost" onClick={() => router.push("/customers")}>
          {tCommon("actions.back")}
        </Button>
        <div className="flex items-center gap-2">
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
