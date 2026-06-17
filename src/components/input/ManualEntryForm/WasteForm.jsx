import { useState } from 'react';
import { FacilityYearMonthFields, SelectField, NumberField, SubmitBar } from './FormFields';
import { WASTE_TYPES, TREATMENT_TYPES, WASTE_UNITS } from './constants';

const initialState = {
  facility: '',
  year: new Date().getFullYear(),
  month: '',
  wasteType: '',
  treatmentType: '',
  unit: '',
  amount: '',
};

/**
 * Stream C manual entry — Waste category.
 * @param {(entry: object) => void | Promise<void>} onSubmit
 */
export default function WasteForm({ onSubmit }) {
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
    if (!data.wasteType) next.wasteType = 'Required';
    if (!data.treatmentType) next.treatmentType = 'Required';
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
        category: 'Waste',
        facility: data.facility.trim(),
        year: Number(data.year),
        month: data.month,
        wasteType: data.wasteType,
        treatmentType: data.treatmentType,
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
      <h3 className="text-base font-semibold text-emerald-900">Waste</h3>
      <FacilityYearMonthFields data={data} errors={errors} onChange={handleChange} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SelectField
          label="Waste Type"
          name="wasteType"
          value={data.wasteType}
          onChange={handleChange}
          error={errors.wasteType}
          options={WASTE_TYPES}
        />
        <SelectField
          label="Treatment Type"
          name="treatmentType"
          value={data.treatmentType}
          onChange={handleChange}
          error={errors.treatmentType}
          options={TREATMENT_TYPES}
        />
        <SelectField
          label="Unit"
          name="unit"
          value={data.unit}
          onChange={handleChange}
          error={errors.unit}
          options={WASTE_UNITS}
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