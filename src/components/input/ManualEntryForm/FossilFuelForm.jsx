import { useState } from 'react';
import { FacilityYearMonthFields, SelectField, NumberField, SubmitBar } from './FormFields';
import { FUEL_TYPES, FOSSIL_UNITS } from './constants';

const initialState = {
  facility: '',
  year: new Date().getFullYear(),
  month: '',
  fuelType: '',
  unit: '',
  amount: '',
};

/**
 * Stream C manual entry — Fossil Fuel category.
 * @param {(entry: object) => void | Promise<void>} onSubmit
 *   Receives a normalized ActivityEvent-shaped object and should hand it to
 *   core/carbonMath.js (after validators.js) and then services/dbService.js.
 */
export default function FossilFuelForm({ onSubmit }) {
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
    if (!data.fuelType) next.fuelType = 'Required';
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
        category: 'Fossil',
        facility: data.facility.trim(),
        year: Number(data.year),
        month: data.month,
        fuelType: data.fuelType,
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
      <h3 className="text-base font-semibold text-emerald-900">Fossil Fuel</h3>
      <FacilityYearMonthFields data={data} errors={errors} onChange={handleChange} />
      <div className="grid gap-4 sm:grid-cols-3">
        <SelectField
          label="Fuel Type"
          name="fuelType"
          value={data.fuelType}
          onChange={handleChange}
          error={errors.fuelType}
          options={FUEL_TYPES}
        />
        <SelectField
          label="Unit"
          name="unit"
          value={data.unit}
          onChange={handleChange}
          error={errors.unit}
          options={FOSSIL_UNITS}
        />
        <NumberField
          label="Amount Consumed"
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