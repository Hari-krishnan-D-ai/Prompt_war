import { useState } from 'react';
import { TreePine } from 'lucide-react';
import { FacilityYearMonthFields, NumberField, SubmitBar } from './FormFields';

const initialState = {
  facility: '',
  year: new Date().getFullYear(),
  month: '',
  trees: '',
  soilArea: '',
  grassArea: '',
  waterArea: '',
};

/**
 * Stream C manual entry — Offset / sequestration category.
 * Feeds core/sequestrationMath.js, kept separate from the emissions math in
 * carbonMath.js so the net-negative contribution stays auditable on its own.
 * @param {(entry: object) => void | Promise<void>} onSubmit
 */
export default function OffsetForm({ onSubmit }) {
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
    const hasAnyValue = [data.trees, data.soilArea, data.grassArea, data.waterArea].some(
      (v) => v !== '' && Number(v) > 0
    );
    if (!hasAnyValue) next.trees = 'Enter at least one offset value';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit?.({
        category: 'Offset',
        facility: data.facility.trim(),
        year: Number(data.year),
        month: data.month,
        trees: Number(data.trees) || 0,
        soilArea: Number(data.soilArea) || 0,
        grassArea: Number(data.grassArea) || 0,
        waterArea: Number(data.waterArea) || 0,
      });
      setSuccess(true);
      setData((prev) => ({ ...initialState, facility: prev.facility, year: prev.year }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-emerald-300 bg-emerald-50/80 p-5">
      <h3 className="flex items-center gap-2 text-base font-semibold text-emerald-900">
        <TreePine className="h-4 w-4 text-emerald-600" />
        Offset / Sequestration
      </h3>
      <FacilityYearMonthFields data={data} errors={errors} onChange={handleChange} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <NumberField
          label="Number of Trees"
          name="trees"
          value={data.trees}
          onChange={handleChange}
          error={errors.trees}
          placeholder="0"
          step="1"
        />
        <NumberField
          label="Soil Area (m²)"
          name="soilArea"
          value={data.soilArea}
          onChange={handleChange}
          placeholder="0"
        />
        <NumberField
          label="Grass Area (m²)"
          name="grassArea"
          value={data.grassArea}
          onChange={handleChange}
          placeholder="0"
        />
        <NumberField
          label="Water Area (m²)"
          name="waterArea"
          value={data.waterArea}
          onChange={handleChange}
          placeholder="0"
        />
      </div>
      <SubmitBar submitting={submitting} success={success} label="Save Offset Entry" />
    </form>
  );
}