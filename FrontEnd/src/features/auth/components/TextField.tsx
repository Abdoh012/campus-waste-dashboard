import { Input } from "@/components/ui/input";

const LABEL =
  "block font-mono text-2xs uppercase tracking-widest text-label-strong";

export interface TextFieldProps {
  id: string;
  label: string;
  type: "email" | "text" | "password";
  name: string;
  autoComplete?: string;
  placeholder?: string;
  disabled?: boolean;
}

export default function TextField({
  id,
  label,
  type,
  name,
  autoComplete,
  placeholder,
  disabled,
}: TextFieldProps) {
  return (
    <div>
      <label className={LABEL} htmlFor={id}>
        {label}
      </label>

      <div className="relative mt-2">
        <Input
          className="w-full py-5"
          id={id}
          name={name}
          type={type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          disabled={disabled}
          required
        />
      </div>
    </div>
  );
}
