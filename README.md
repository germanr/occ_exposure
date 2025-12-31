# AI Exposure Visualization Tool

## Overview

This interactive tool visualizes how different occupations may be impacted by AI technologies. Users can select occupations and see their AI exposure levels displayed on a tiered visualization (Very High to Very Low exposure).

## Features

- Select up to 6 preferred occupations from a list of 974 occupations
- Visual tiered display showing AI exposure levels (red-yellow-green scale)
- Top 3 most and least exposed occupations from your selections
- Search functionality to explore additional occupations
- Qualtrics integration for embedding in surveys

## Technical Details

The tool is built with React and uses:

- React hooks for state management
- Dynamic CSS-in-JS styling for responsive design
- CSV data loading for occupation rankings
- PostMessage API for Qualtrics integration

## Data Sources

Occupation AI exposure rankings are based on research data (occupations.csv).

## Usage

This tool is designed for:
- Students making career decisions
- Career counselors and academic advisors
- Workforce development professionals
- Researchers studying AI's impact on labor markets

## Installation

```bash
# Clone the repository
git clone https://github.com/germanjreyes/occ_exposure.git

# Navigate to project directory
cd occ_exposure

# Install dependencies
npm install

# Run the development server
npm start
```

## Deployment

```bash
# Build and deploy to GitHub Pages
npm run deploy
```

The app will be available at: https://germanjreyes.github.io/occ_exposure/

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
