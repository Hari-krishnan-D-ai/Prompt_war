import { useState } from 'react';
import { FacilityYearMonthFields, SelectField, NumberField, SubmitBar } from './FormFields';
import { TRANSPORT_MODES } from './constants';

const initialState = {
  facility: '',
  year: new Date().getFullYear(),
  month: '',
  mode: '',
  distance: '',
};

/**
 * Stream C manual entry — Travel category.
 * @param {(entry: object) => void | Promise<void>} onSubmit
 */
export default function TravelForm({ onSubmit }) {
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
    if (!data.mode) next.mode = 'Required';
    if (!data.distance || Number(data.distance) <= 0) next.distance = 'Enter a positive distance';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit?.({
        category: 'Travel',
        facility: data.facility.trim(),
        year: Number(data.year),
        month: data.month,
        mode: data.mode,
        distanceKm: Number(data.distance),
      });
      setSuccess(true);
      setData((prev) => ({ ...initialState, facility: prev.facility, year: prev.year }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-emerald-100 bg-white/60 p-5">
      <h3 className="text-base font-semibold text-emerald-900">Travel</h3>
      <FacilityYearMonthFields data={data} errors={errors} onChange={handleChange} />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Mode of Transport"
          name="mode"
          value={data.mode}
          onChange={handleChange}
          error={errors.mode}
          options={TRANSPORT_MODES}
        />
        <NumberField
          label="Distance Travelled (km)"
          name="distance"
          value={data.distance}
          onChange={handleChange}
          error={errors.distance}
          placeholder="0.0"
        />
      </div>
      <SubmitBar submitting={submitting} success={success} />
    </form>
  );
}