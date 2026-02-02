# AI Exposure Visualization Tool

## Overview

This interactive tool visualizes how different occupations may be impacted by AI technologies. Users can select occupations and see their AI exposure levels displayed on a tiered visualization (Very High to Very Low exposure).

## Features

- Select up to 6 preferred occupations from a searchable list of 674 occupations (6-digit SOC codes)
- Visual tiered display showing AI exposure levels (red-yellow-green scale)
- Detailed information panel for each occupation, including:
  - AI exposure level
  - Three most similar occupations (by relatedness score) with their exposure levels
  - Relevant areas of study: whether the majority of workers hold at least a bachelor's degree, and if so, the top 3 degree fields
- Top 3 most and least exposed occupations across all occupations
- Free-form search page to explore any occupation
- Qualtrics integration for embedding in surveys

## Data

All data is loaded from a single CSV file (`public/aei_exposure_6digit.csv`) with the following key fields per occupation:

| Field | Description |
|-------|-------------|
| `soc_code` | 6-digit SOC code |
| `occupation` | Occupation name |
| `ranking` | AI exposure ranking (1 = most exposed, 100 = least exposed) |
| `educationcode` | Most common education level among workers |
| `degfield_1`, `degfield_2`, `degfield_3` | Top 3 degree fields (when bachelor's or higher) |
| `related_soc_code_1`, `related_soc_code_2`, `related_soc_code_3` | Three most related occupations by SOC code |

Additional fields (e.g., `pct_tasks_automation`, `pct_tasks_augmentation`, `median_wage`, `total_employment`) are included in the CSV but not currently displayed.

## Technical Details

Built with React. Key implementation details:

- Single CSV data source parsed on load with a custom quoted-field parser
- SOC code lookup map for resolving related occupations
- Education display logic: binary (bachelor's or higher vs. less than bachelor's), with degree fields shown only for bachelor's+
- PostMessage API for Qualtrics integration (tracks time spent, occupations viewed, search terms)

## Installation

```bash
git clone https://github.com/germanr/occ_exposure.git
cd occ_exposure
npm install
npm start
```

## Deployment

```bash
npm run deploy
```

The app will be available at: https://germanr.github.io/occ_exposure/
