"use client"

import { useMemo, useState } from "react"
import {
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

const regionNames =
  typeof Intl !== "undefined"
    ? new Intl.DisplayNames(["es"], { type: "region" })
    : null

function countryLabel(code: CountryCode): string {
  return regionNames?.of(code) ?? code
}

const COUNTRY_OPTIONS = getCountries()
  .map((code) => ({
    value: code,
    label: `${countryLabel(code)} (+${getCountryCallingCode(code)})`,
    name: countryLabel(code),
  }))
  .sort((a, b) => a.name.localeCompare(b.name, "es"))

type Props = {
  id?: string
  label?: string
  value: string
  onChange: (value: string) => void
  defaultCountry?: CountryCode
  required?: boolean
  optional?: boolean
  className?: string
  /** Si true, muestra error cuando hay texto pero no es válido */
  showError?: boolean
}

/**
 * Teléfono con país (default CO) y validación libphonenumber-js.
 * `value` / `onChange` usan E.164 cuando el número es válido; si no, el texto nacional.
 */
export function PhoneInput({
  id = "telefono",
  label = "Celular",
  value,
  onChange,
  defaultCountry = "CO",
  required = false,
  optional = false,
  className,
  showError = true,
}: Props) {
  const initial = useMemo(() => {
    if (value) {
      const parsed = parsePhoneNumberFromString(value)
      if (parsed?.country) {
        return {
          country: parsed.country,
          national: parsed.formatNational().replace(/^\+\d+\s*/, "").trim() ||
            parsed.nationalNumber,
        }
      }
    }
    return { country: defaultCountry, national: value.replace(/^\+57\s*/, "") }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- solo montaje

  const [country, setCountry] = useState<CountryCode>(initial.country)
  const [national, setNational] = useState(initial.national)

  const valid = national.trim() === ""
    ? !required
    : isValidPhoneNumber(national, country) || isValidPhoneNumber(value)

  function emit(nextCountry: CountryCode, nextNational: string) {
    const trimmed = nextNational.trim()
    if (!trimmed) {
      onChange("")
      return
    }
    const parsed = parsePhoneNumberFromString(trimmed, nextCountry)
    if (parsed?.isValid()) {
      onChange(parsed.format("E.164"))
    } else {
      onChange(trimmed)
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label ? (
        <Label htmlFor={id}>
          {label}
          {required && !optional ? (
            <span className="text-primary"> *</span>
          ) : optional ? (
            <span className="font-normal text-muted-foreground"> (opcional)</span>
          ) : null}
        </Label>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Select
          value={country}
          onValueChange={(v) => {
            const next = (v as CountryCode) || defaultCountry
            setCountry(next)
            emit(next, national)
          }}
          items={COUNTRY_OPTIONS.map((c) => ({
            value: c.value,
            label: c.label,
          }))}
        >
          <SelectTrigger
            id={`${id}-pais`}
            className="w-full sm:w-[min(100%,220px)]"
            aria-label="País del teléfono"
          >
            <SelectValue placeholder="País" />
          </SelectTrigger>
          <SelectContent>
            {COUNTRY_OPTIONS.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder={country === "CO" ? "300 000 0000" : "Número"}
          value={national}
          onChange={(e) => {
            const next = e.target.value
            setNational(next)
            emit(country, next)
          }}
          required={required}
          aria-invalid={showError && national.trim() !== "" && !valid}
          className="flex-1"
        />
      </div>
      {showError && national.trim() !== "" && !valid ? (
        <p className="text-xs text-destructive">
          Número no válido para {countryLabel(country)}.
        </p>
      ) : null}
    </div>
  )
}

/** Helper para botones: ¿el valor actual es un teléfono válido? */
export function isPhoneValid(value: string, required = false): boolean {
  const trimmed = value.trim()
  if (!trimmed) return !required
  return isValidPhoneNumber(trimmed)
}
