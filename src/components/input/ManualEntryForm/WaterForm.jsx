import { useState } from 'react';
import { FacilityYearMonthFields, SelectField, NumberField, SubmitBar } from './FormFields';
import { WATER_TYPES, DISCHARGE_SITES, WATER_UNITS } from './constants';

const initialState = {
  facility: '',
  year: new Date().getFullYear(),
  month: '',
  waterType: '',
  dischargeSite: '',
  unit: '',
  amount: '',
};

/**
 * Stream C manual entry — Water category.
 * @param {(entry: object) => void | Promise<void>} onSubmit
 */
export default function WaterForm({ onSubmit }) {
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
    if (!data.waterType) next.waterType = 'Required';
    if (!data.dischargeSite) next.dischargeSite = 'Required';
    if (!data.unit) next.unit = 'Required';
    if (!data.amount || Number(data.amount) <= 0) next.amount = 'Enter a positive amount';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit?.({
        category: 'Water',
        facility: data.facility.trim(),
        year: Number(data.year),
        month: data.month,
        waterType: data.waterType,
        dischargeSite: data.dischargeSite,
        unit: data.unit,
        amount: Number(data.amount),
      });
      setSuccess(true);
      setData((prev) => ({ ...initialState, facility: prev.facility, year: prev.year }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-emerald-100 bg-white/60 p-5">
      <h3 className="text-base font-semibold text-emerald-900">Water</h3>
      <FacilityYearMonthFields data={data} errors={errors} onChange={handleChange} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SelectField
          label="Water Type"
          name="waterType"
          value={data.waterType}
          onChange={handleChange}
          error={errors.waterType}
          options={WATER_TYPES}
        />
        <SelectField
          label="Discharge Site"
          name="dischargeSite"
          value={data.dischargeSite}
          onChange={handleChange}
          error={errors.dischargeSite}
          options={DISCHARGE_SITES}
        />
        <SelectField
          label="Unit"
          name="unit"
          value={data.unit}
          onChange={handleChange}
          error={errors.unit}
          options={WATER_UNITS}
        />
        <NumberField
          label="Amount"
          name="amount"
          value={data.amount}
          onChange={handleChange}
          error={errors.amount}
          placeholder="0.0"
        />
      </div>
      <SubmitBar submitting={submitting} success={success} />
    </form>
  );
}