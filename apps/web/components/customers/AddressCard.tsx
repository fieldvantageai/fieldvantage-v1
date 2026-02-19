"use client";

import { MapPin, Star, Trash2 } from "lucide-react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";

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
    <div className="rounded-xl border border-slate-200/70 bg-slate-50/50">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-700">
            {t("addresses.card.title")} {index + 1}
          </span>
          {isPrimary ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
              <Star className="h-2.5 w-2.5 fill-brand-600" />
              {t("addresses.card.primary")}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          {!isPrimary ? (
            <button
              type="button"
              onClick={onSetPrimary}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-white hover:text-brand-600 hover:shadow-sm"
            >
              <Star className="h-3 w-3" />
              {t("addresses.card.setPrimary")}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onRemove}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-3 w-3" />
            {t("addresses.card.remove")}
          </button>
        </div>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2">
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
          rows={2}
          error={addressErrors?.note?.message as string | undefined}
          {...register(`${base}.note`)}
        />
      </div>
      <input type="hidden" {...register(`${base}.is_primary`)} />
    </div>
  );
}
