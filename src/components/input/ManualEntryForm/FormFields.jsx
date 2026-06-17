import { MONTHS, YEARS, FACILITY_SUGGESTIONS } from './constants';

const inputClass =
  'w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-emerald-950 ' +
  'placeholder:text-emerald-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 ' +
  'disabled:cursor-not-allowed disabled:bg-emerald-50';

export function FieldWrapper({ label, error, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-emerald-900">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-emerald-600/70">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-rose-600">{error}</span>}
    </label>
  );
}

export function TextField({ label, name, value, onChange, error, hint, placeholder, list }) {
  return (
    <FieldWrapper label={label} error={error} hint={hint}>
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        list={list}
        className={inputClass}
      />
    </FieldWrapper>
  );
}

export function NumberField({ label, name, value, onChange, error, hint, placeholder, min = 0, step = 'any' }) {
  return (
    <FieldWrapper label={label} error={error} hint={hint}>
      <input
        type="number"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        step={step}
        className={inputClass}
      />
    </FieldWrapper>
  );
}

export function SelectField({ label, name, value, onChange, error, options, placeholder = 'Select…' }) {
  return (
    <FieldWrapper label={label} error={error}>
      <select name={name} value={value} onChange={onChange} className={inputClass}>
        <option value="" disabled>{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </FieldWrapper>
  );
}

/** Facility + Year + Month — the three fields every Stream C category shares. */
export function FacilityYearMonthFields({ data, errors, onChange }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField
          label="Facility / Location"
          name="facility"
          value={data.facility}
          onChange={onChange}
          error={errors.facility}
          placeholder="e.g., Home"
          list="facility-suggestions"
        />
        <SelectField
          label="Year"
          name="year"
          value={data.year}
          onChange={onChange}
          error={errors.year}
          options={YEARS}
        />
        <SelectField
          label="Month"
          name="month"
          value={data.month}
          onChange={onChange}
          error={errors.month}
          options={MONTHS}
        />
      </div>
      <datalist id="facility-suggestions">
        {FACILITY_SUGGESTIONS.map((f) => <option key={f} value={f} />)}
      </datalist>
    </>
  );
}

export function SubmitBar({ submitting, success, label = 'Save Entry' }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'Saving…' : label}
      </button>
      {success && <span className="text-sm font-medium text-emerald-700">Saved.</span>}
    </div>
  );
}