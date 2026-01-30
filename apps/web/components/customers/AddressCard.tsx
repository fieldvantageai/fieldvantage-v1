"use client";

import type { FieldErrors, UseFormRegister } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import type { NewCustomerFormValues } from "@/features/customers/forms/newCustomer/formSchema";

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
  const base = `addresses.${index}` as const;
  const addressErrors = errors.addresses?.[index];

  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white/95 p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Endereco</p>
          <p className="text-xs text-slate-500">
            {isPrimary ? "Endereco principal" : "Opcional"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" onClick={onSetPrimary}>
            {isPrimary ? "Principal" : "Definir como principal"}
          </Button>
          <Button type="button" variant="secondary" onClick={onRemove}>
            Remover
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Select
          label="Tipo"
          options={[
            { value: "residential", label: "Residencial" },
            { value: "business", label: "Comercial" }
          ]}
          error={addressErrors?.type?.message as string | undefined}
          {...register(`${base}.type`)}
        />
        <Input
          label="Etiqueta (opcional)"
          placeholder="Casa, Escritorio"
          error={addressErrors?.label?.message as string | undefined}
          {...register(`${base}.label`)}
        />
        <Input
          label="Endereco"
          placeholder="Rua e numero"
          error={addressErrors?.address_line1?.message as string | undefined}
          {...register(`${base}.address_line1`)}
        />
        <Input
          label="Complemento"
          placeholder="Apartamento, sala"
          error={addressErrors?.address_line2?.message as string | undefined}
          {...register(`${base}.address_line2`)}
        />
        <Input
          label="Cidade"
          error={addressErrors?.city?.message as string | undefined}
          {...register(`${base}.city`)}
        />
        <Input
          label="Estado"
          error={addressErrors?.state?.message as string | undefined}
          {...register(`${base}.state`)}
        />
        <Input
          label="CEP"
          error={addressErrors?.zip_code?.message as string | undefined}
          {...register(`${base}.zip_code`)}
        />
        <Input
          label="Pais"
          error={addressErrors?.country?.message as string | undefined}
          {...register(`${base}.country`)}
        />
        <Textarea
          label="Notas (opcional)"
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
