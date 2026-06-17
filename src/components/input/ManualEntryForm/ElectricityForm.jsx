import { useState } from 'react';
import { FacilityYearMonthFields, SelectField, NumberField, SubmitBar } from './FormFields';
import { ELECTRICITY_TYPES, ELECTRICITY_SOURCES, ELECTRICITY_UNITS } from './constants';

const initialState = {
  facility: '',
  year: new Date().getFullYear(),
  month: '',
  electricityType: '',
  electricitySource: '',
  unit: '',
  amount: '',
};

/**
 * Stream C manual entry — Electricity category.
 * @param {(entry: object) => void | Promise<void>} onSubmit
 */
export default function ElectricityForm({ onSubmit }) {
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
    if (!data.electricityType) next.electricityType = 'Required';
    if (!data.electricitySource) next.electricitySource = 'Required';
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
        category: 'Electricity',
        facility: data.facility.trim(),
        year: Number(data.year),
        month: data.month,
        electricityType: data.electricityType,
        electricitySource: data.electricitySource,
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
      <h3 className="text-base font-semibold text-emerald-900">Electricity</h3>
      <FacilityYearMonthFields data={data} errors={errors} onChange={handleChange} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SelectField
          label="Electricity Type"
          name="electricityType"
          value={data.electricityType}
          onChange={handleChange}
          error={errors.electricityType}
          options={ELECTRICITY_TYPES}
        />
        <SelectField
          label="Electricity Source"
          name="electricitySource"
          value={data.electricitySource}
          onChange={handleChange}
          error={errors.electricitySource}
          options={ELECTRICITY_SOURCES}
        />
        <SelectField
          label="Unit"
          name="unit"
          value={data.unit}
          onChange={handleChange}
          error={errors.unit}
          options={ELECTRICITY_UNITS}
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