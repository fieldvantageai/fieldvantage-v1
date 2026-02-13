"use client";

import type { FieldErrors, UseFormRegister } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import type { NewCustomerFormValues } from "@/features/customers/forms/newCustomer/formSchema";
import { useClientT } from "@/lib/i18n/useClientT";

type AddressCardProps = {
  index: number;
  register: UseFormRegister<NewCustomerFormValues>;
  errors: FieldErrors<NewCustomerFormValues>;
  isPrimary: boolean;
  onSetPrimary: () => void;
  onRemove: () => void;
};

export default function AddressCard({
  index,
  register,
  errors,
  isPrimary,
  onSetPrimary,
  onRemove
}: AddressCardProps) {
  const { t } = useClientT("customers");
  const base = `addresses.${index}` as const;
  const addressErrors = errors.addresses?.[index];

  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white/95 p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {t("addresses.card.title")}
          </p>
          <p className="text-xs text-slate-500">
            {isPrimary ? t("addresses.card.primary") : t("addresses.card.optional")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" onClick={onSetPrimary}>
            {isPrimary ? t("addresses.card.primaryLabel") : t("addresses.card.setPrimary")}
          </Button>
          <Button type="button" variant="secondary" onClick={onRemove}>
            {t("addresses.card.remove")}
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Select
          label={t("addresses.fields.type")}
          options={[
            { value: "", label: t("addresses.placeholders.type") },
            { value: "residential", label: t("addresses.options.residential") },
            { value: "business", label: t("addresses.options.business") }
          ]}
          error={addressErrors?.type?.message as string | undefined}
          {...register(`${base}.type`)}
        />
        <Input
          label={t("addresses.fields.label")}
          placeholder={t("addresses.placeholders.label")}
          error={addressErrors?.label?.message as string | undefined}
          {...register(`${base}.label`)}
        />
        <Input
          label={t("addresses.fields.addressLine1")}
          placeholder={t("addresses.placeholders.addressLine1")}
          error={addressErrors?.address_line1?.message as string | undefined}
          {...register(`${base}.address_line1`)}
        />
        <Input
          label={t("addresses.fields.addressLine2")}
          placeholder={t("addresses.placeholders.addressLine2")}
          error={addressErrors?.address_line2?.message as string | undefined}
          {...register(`${base}.address_line2`)}
        />
        <Input
          label={t("addresses.fields.city")}
          placeholder={t("addresses.placeholders.city")}
          error={addressErrors?.city?.message as string | undefined}
          {...register(`${base}.city`)}
        />
        <Input
          label={t("addresses.fields.state")}
          placeholder={t("addresses.placeholders.state")}
          error={addressErrors?.state?.message as string | undefined}
          {...register(`${base}.state`)}
        />
        <Input
          label={t("addresses.fields.zip")}
          placeholder={t("addresses.placeholders.zip")}
          error={addressErrors?.zip_code?.message as string | undefined}
          {...register(`${base}.zip_code`)}
        />
        <Input
          label={t("addresses.fields.country")}
          placeholder={t("addresses.placeholders.country")}
          error={addressErrors?.country?.message as string | undefined}
          {...register(`${base}.country`)}
        />
        <Textarea
          label={t("addresses.fields.notes")}
          placeholder={t("addresses.placeholders.notes")}
          className="sm:col-span-2"
          rows={3}
          error={addressErrors?.note?.message as string | undefined}
          {...register(`${base}.note`)}
        />
      </div>
      <input type="hidden" {...register(`${base}.is_primary`)} />
    </div>
  );
}
