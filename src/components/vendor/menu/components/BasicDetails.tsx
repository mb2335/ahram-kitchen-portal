import { UseFormRegister } from "react-hook-form";
import { MenuFormData } from "../types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface BasicDetailsProps {
  register: UseFormRegister<MenuFormData>;
  errors: Record<string, any>;
}

export function BasicDetails({ register, errors }: BasicDetailsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="name">Name (English)</Label>
        <Input id="name" {...register('name', { required: true })} />
        {errors.name && <p className="text-sm text-red-500">Name is required</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="name_ko">Name (Korean)</Label>
        <Input id="name_ko" {...register('name_ko', { required: true })} />
        {errors.name_ko && <p className="text-sm text-red-500">Korean name is required</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (English)</Label>
        <Textarea id="description" {...register('description')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description_ko">Description (Korean)</Label>
        <Textarea id="description_ko" {...register('description_ko')} />
      </div>
    </>
  );
}