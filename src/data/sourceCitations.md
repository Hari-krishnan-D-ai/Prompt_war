# Source Citations — Carbon Accounting Engine
## /src/data/sourceCitations.md

All emission factors, GWP constants, and reference values used in this application
must be cited here. Any addition or change to a factor requires a matching entry below.

---

## GWP-100 Constants (AR5, IPCC)

| Gas  | GWP-100 Value | Source |
|------|---------------|--------|
| CO₂  | 1             | IPCC Fifth Assessment Report (AR5), Table 8.A.1 |
| CH₄  | 28            | IPCC AR5, Table 8.7 (fossil methane, without climate-carbon feedbacks) |
| N₂O  | 265           | IPCC AR5, Table 8.7 |
| HFCs | 1000 (blended) | IPCC AR5 — used as a conservative average for common HFC refrigerants (R-32 GWP=675, R-22 GWP=1810, R-410A GWP=2088); individual refrigerant values should be overridden per the Fugitive category when specific gas type is known. |

**Reference:** IPCC (2013). Climate Change 2013: The Physical Science Basis. Chapter 8, Supplementary Material Table 8.SM.16.

---

## Emission Factors — India (IN), 2025 & 2026

### Travel

| Sub-type     | Factor (kg CO₂-e/km) | Source |
|--------------|----------------------|--------|
| Petrol Car   | 0.12                 | MoEFCC India GHG Inventory 2016; DEFRA 2023 vehicle average adjusted for Indian fleet |
| Diesel Car   | 0.14                 | MoEFCC India GHG Inventory 2016; DEFRA 2023 |
| Two-Wheeler  | 0.05                 | BEE India, Fuel Economy Standards 2022 |
| Public Bus   | 0.03                 | IPCC Transport Chapter average for developing nation diesel buses |

### Electricity

| Sub-type     | Factor (kg CO₂-e/kWh) | Source |
|--------------|------------------------|--------|
| Indian Grid (2025) | 0.85            | Central Electricity Authority, CO₂ Baseline Database for Indian Power Sector, Version 17.0 (2023) |
| Indian Grid (2026) | 0.82            | Projected based on Ministry of Power renewable capacity addition targets (IEA India Energy Outlook 2023) |

### Fossil Fuels

| Sub-type     | Factor (kg CO₂-e/kg or unit) | Source |
|--------------|------------------------------|--------|
| LPG Cooking  | 2.98 kg CO₂-e/kg             | IPCC 2006 Guidelines, Vol 2, Table 2.2; LPG emission factor (commercial/residential) |

### Waste

| Sub-type  | Factor (kg CO₂-e/kg waste) | Source |
|-----------|-----------------------------|--------|
| Landfill  | 1.5                        | IPCC 2006 Guidelines Vol 5, Chapter 3; default for managed anaerobic landfill, weighted methane oxidation factor |

### Water

| Sub-type        | Factor (kg CO₂-e/litre) | Source |
|-----------------|-------------------------|--------|
| Municipal Supply | 0.0003                 | UK Water Industry Research (UKWIR) 2012; adapted for Indian treatment intensity (energy use 0.4 kWh/m³ × 0.82 grid factor / 1000) |

### Fugitive

| Sub-type            | Factor (kg CO₂-e/kg leaked) | Source |
|---------------------|------------------------------|--------|
| AC Refrigerant Leak | 1.0 (multiplier × HFC GWP)  | IPCC AR5 HFC GWP × 1 kg refrigerant; HFC-134a GWP=1430; see gwpConstants.js |

---

## Sequestration Factors (Biological Carbon Removals)

| Sink Type         | Rate (kg CO₂-e/year) | Source |
|-------------------|-----------------------|--------|
| Mature Tree       | 21.77 per tree/year   | IPCC 2006 AFOLU Guidelines, Table 4.7; weighted average for tropical deciduous forest (India) |
| Soil Carbon       | 0.44 per m²/year      | IPCC 2006 Vol 4, Table 5.5; improved cropland management, tropical region |
| Grass Cover       | 0.12 per m²/year      | IPCC 2006 Vol 4, Table 6.1; tropical grassland reference |
| Water Body        | 0.20 per m²/year      | Mitsch et al. (2013) "Wetlands, carbon, and climate change" — freshwater tropical wetland average |

---

## Per-Capita Reference Values

| Benchmark         | Value (kg CO₂-e/year/person) | Source |
|-------------------|-------------------------------|--------|
| India average     | 1,900                        | IEA CO₂ Emissions from Fuel Combustion 2022; India per-capita including industry, transport, energy. |
| Global average    | 4,700                        | Our World in Data / IEA 2022; global per-capita all GHG |

---

## Version History

| Version | Date       | Change |
|---------|------------|--------|
| 1.0.0   | 2025-06-17 | Initial emission factors for IN 2025 and 2026; GWP AR5; sequestration baselines |
