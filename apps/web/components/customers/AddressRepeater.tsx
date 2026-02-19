"use client";

import { MapPin, PlusCircle } from "lucide-react";
import type {
  FieldErrors,
  FieldArrayWithId,
  UseFormRegister
} from "react-hook-form";

import type { NewCustomerFormValues } from "@/features/customers/forms/newCustomer/formSchema";
import { useClientT } from "@/lib/i18n/useClientT";

import AddressCard from "./AddressCard";

type AddressRepeaterProps = {
  fields: FieldArrayWithId<NewCustomerFormValues, "addresses", "id">[];
  register: UseFormRegister<NewCustomerFormValues>;
  errors: FieldErrors<NewCustomerFormValues>;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onSetPrimary: (index: number) => void;
  primaryIndex: number | null;
};

export default function AddressRepeater({
  fields,
  register,
  errors,
  onAdd,
  onRemove,
  onSetPrimary,
  primaryIndex
}: AddressRepeaterProps) {
  const { t } = useClientT("customers");

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/95 shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <MapPin className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {t("addresses.title")}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {t("addresses.subtitle")}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          {t("addresses.add")}
        </button>
      </div>

      <div className="p-5">
        {fields.length === 0 ? (
          <button
            type="button"
            onClick={onAdd}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 py-6 text-sm text-slate-400 transition hover:border-brand-300 hover:bg-brand-50/40 hover:text-brand-600"
          >
            <PlusCircle className="h-4 w-4" />
            {t("addresses.empty")}
          </button>
        ) : (
          <div className="space-y-3">
            {fields.map((field, index) => (
              <AddressCard
                key={field.id}
                index={index}
                register={register}
                errors={errors}
                isPrimary={primaryIndex === index}
                onSetPrimary={() => onSetPrimary(index)}
                onRemove={() => onRemove(index)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
