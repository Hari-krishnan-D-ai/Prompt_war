// Shared lookup lists for Stream C manual entry forms.
// These are UI option lists only — actual emission factors / GWP values
// must live in /src/data/emissionFactors.*.json per GEMINI.md, never here.

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const currentYear = new Date().getFullYear();
export const YEARS = Array.from({ length: 6 }, (_, i) => currentYear - i);

export const FACILITY_SUGGESTIONS = ['Home', 'Office', 'Vehicle', 'Workplace'];

export const FUEL_TYPES = [
  'Petrol', 'Diesel', 'LPG', 'CNG', 'Kerosene', 'Coal', 'Furnace Oil', 'Other',
];
export const FOSSIL_UNITS = ['litres', 'kg', 'kWh', 'm3'];

export const FUGITIVE_APPLICATION_TYPES = [
  'Domestic Refrigeration',
  'Commercial Refrigeration',
  'Mobile Air Conditioning',
  'Stationary Air Conditioning',
  'Fire Suppression System',
  'Other',
];

export const ELECTRICITY_TYPES = [
  'Grid Supply', 'Renewable - Solar', 'Renewable - Wind', 'Diesel Generator Backup', 'Other',
];
export const ELECTRICITY_SOURCES = ['State Grid', 'Solar Rooftop', 'Wind Power', 'DG Set', 'Other'];
export const ELECTRICITY_UNITS = ['kWh', 'MWh'];

export const WATER_TYPES = [
  'Municipal Supply', 'Borewell / Groundwater', 'Tanker Supply',
  'Rainwater Harvested', 'Recycled / Treated', 'Other',
];
export const DISCHARGE_SITES = ['Municipal Sewage', 'Septic Tank', 'Open Drain', 'Reused On-site', 'Other'];
export const WATER_UNITS = ['litres', 'm3', 'kilolitres'];

export const WASTE_TYPES = [
  'Organic / Wet Waste', 'Plastic', 'Paper / Cardboard', 'E-Waste', 'Mixed / Dry Waste', 'Hazardous', 'Other',
];
export const TREATMENT_TYPES = [
  'Landfill', 'Composting', 'Recycling', 'Incineration', 'Biogas / Anaerobic Digestion', 'Other',
];
export const WASTE_UNITS = ['kg', 'tonnes'];

export const TRANSPORT_MODES = [
  'Petrol Car', 'Diesel Car', 'CNG Car', 'Electric Vehicle', 'Two-Wheeler',
  'Bus', 'Metro / Rail', 'Auto-rickshaw', 'Domestic Flight', 'International Flight',
  'Bicycle', 'Walking',
];