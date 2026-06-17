import { useState } from 'react';
import { FacilityYearMonthFields, SelectField, NumberField, SubmitBar } from './FormFields';
import { FUGITIVE_APPLICATION_TYPES } from './constants';

const initialState = {
  facility: '',
  year: new Date().getFullYear(),
  month: '',
  applicationType: '',
  units: '',
};

/**
 * Stream C manual entry — Fugitive emissions category.
 * @param {(entry: object) => void | Promise<void>} onSubmit
 */
export default function FugitiveForm({ onSubmit }) {
  const [data, setData] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setSuccess(false);
  };

  const validate = () => {
    const next = {};
    if (!data.facility.trim()) next.facility = 'Required';
    if (!data.month) next.month = 'Required';
    if (!data.applicationType) next.applicationType = 'Required';
    if (!data.units || Number(data.units) <= 0) next.units = 'Enter a positive number';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit?.({
        category: 'Fugitive',
        facility: data.facility.trim(),
        year: Number(data.year),
        month: data.month,
        applicationType: data.applicationType,
        units: Number(data.units),
      });
      setSuccess(true);
      setData((prev) => ({ ...initialState, facility: prev.facility, year: prev.year }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-emerald-100 bg-white/60 p-5">
      <h3 className="text-base font-semibold text-emerald-900">Fugitive Emissions</h3>
      <FacilityYearMonthFields data={data} errors={errors} onChange={handleChange} />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Application Type"
          name="applicationType"
          value={data.applicationType}
          onChange={handleChange}
          error={errors.applicationType}
          options={FUGITIVE_APPLICATION_TYPES}
        />
        <NumberField
          label="Number of Units"
          name="units"
          value={data.units}
          onChange={handleChange}
          error={errors.units}
          placeholder="0"
          step="1"
        />
      </div>
      <SubmitBar submitting={submitting} success={success} />
    </form>
  );
}