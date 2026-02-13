"use client";

import type {
  FieldErrors,
  FieldArrayWithId,
  UseFormRegister
} from "react-hook-form";

import { Button } from "@/components/ui/Button";
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {t("addresses.title")}
          </p>
          <p className="text-xs text-slate-500">{t("addresses.subtitle")}</p>
        </div>
        <Button type="button" variant="secondary" onClick={onAdd}>
          {t("addresses.add")}
        </Button>
      </div>

      {fields.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200/70 bg-white/90 p-5 text-sm text-slate-500">
          {t("addresses.empty")}
        </div>
      ) : (
        <div className="space-y-4">
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
  );
}
