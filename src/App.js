/* Use the following code to upload the code to GitHub
git init
git add .
git commit -m "Initial commit"
git remote remove origin
git remote add origin https://github.com/cboyette01/degree-exposure-new.git
git push -u origin master

npm install
npm start

npm install --save gh-pages
npm run deploy

npm install
npm start
*/

import React, { useState, useEffect, useRef } from 'react';

// CSV URL
const CSV_URL = process.env.PUBLIC_URL + '/aei_exposure_6digit.csv';
const EMPLOYMENT_DATA_URL = process.env.PUBLIC_URL + '/headcount_data.json';
const CHATGPT_RELEASE_DATE = '2022-11-01';
const QUINTILE_ORDER = [1, 3, 4, 5]; // 1 = least exposed, 5 = most exposed

const QUINTILE_META = {
    1: {
        title: 'Lowest',
        textLabel: 'lowest',
        explanation: 'These occupations rely on tasks AI currently struggles with, for example physical, hands-on, or highly context-specific work.',
    },
    3: {
        title: 'Moderate',
        textLabel: 'moderate',
        explanation: 'These occupations combine tasks AI can support with tasks where workers still need to verify, adapt, and make final decisions.',
    },
    4: {
        title: 'High',
        textLabel: 'high',
        explanation: 'Workers in these occupations often use AI for writing, analysis, and decision support. This reflects task exposure and augmentation, not automatic replacement.',
    },
    5: {
        title: 'Very High',
        textLabel: 'very high',
        explanation: '',
    },
};

function getExposureQuintile(ranking) {
    if (ranking <= 20) return 5;
    if (ranking <= 40) return 4;
    if (ranking <= 60) return 3;
    return 1;
}

function formatSignedPercent(value, digits = 1) {
    if (!Number.isFinite(value)) return 'N/A';
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(digits)}%`;
}

function formatAbsPercent(value, digits = 1) {
    if (!Number.isFinite(value)) return 'N/A';
    return `${Math.abs(value).toFixed(digits)}%`;
}

function formatAxisPercent(value) {
    if (!Number.isFinite(value)) return 'N/A';
    const rounded = Math.abs(value - Math.round(value)) < 1e-8 ? Math.round(value) : Number(value.toFixed(1));
    const sign = rounded > 0 ? '+' : '';
    return `${sign}${rounded}%`;
}

function getEmploymentColor(value) {
    if (!Number.isFinite(value)) return '#94a3b8';
    if (value >= 8) return '#15803d';
    if (value > 0) return '#22c55e';
    if (value <= -8) return '#b91c1c';
    if (value < 0) return '#ef4444';
    return '#94a3b8';
}

function getEmploymentBadgeStyle(value) {
    if (!Number.isFinite(value)) {
        return {
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: '999px',
            fontWeight: '600',
            fontSize: '12px',
            backgroundColor: '#f1f5f9',
            color: '#475569',
            border: '1px solid #cbd5e1',
        };
    }
    const positive = value >= 0;
    return {
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '999px',
        fontWeight: '600',
        fontSize: '12px',
        backgroundColor: positive ? '#dcfce7' : '#fee2e2',
        color: positive ? '#166534' : '#991b1b',
        border: `1px solid ${positive ? '#86efac' : '#fca5a5'}`,
    };
}

function getExposureBadgeStyle(ranking) {
    const styles = {
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '999px',
        fontWeight: '600',
        fontSize: '12px',
    };
    if (ranking <= 20) return { ...styles, backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' };
    if (ranking <= 40) return { ...styles, backgroundColor: '#ffedd5', color: '#9a3412', border: '1px solid #fdba74' };
    if (ranking <= 60) return { ...styles, backgroundColor: '#fef9c3', color: '#854d0e', border: '1px solid #fde047' };
    return { ...styles, backgroundColor: '#bbf7d0', color: '#14532d', border: '1px solid #4ade80' };
}

function computeEmploymentChangeByQuintile(headcountData) {
    const overall = headcountData?.overall_usage;
    if (!overall?.dates || !overall?.quintiles) return null;

    const startMonthPrefix = CHATGPT_RELEASE_DATE.slice(0, 7);
    const startIndex = overall.dates.findIndex((d) => d.startsWith(startMonthPrefix));
    const endIndex = overall.dates.length - 1;
    if (startIndex < 0 || endIndex < 0) return null;

    const changes = {};
    QUINTILE_ORDER.forEach((q) => {
        const series = overall.quintiles[String(q)] || overall.quintiles[q];
        if (!series || series[startIndex] == null || series[endIndex] == null) return;
        const startValue = Number(series[startIndex]);
        const endValue = Number(series[endIndex]);
        if (!Number.isFinite(startValue) || !Number.isFinite(endValue) || startValue === 0) return;
        changes[q] = ((endValue / startValue) - 1) * 100;
    });

    return changes;
}
  
/* Stores data for each occupation. The data is the two digit SOC code, the name of the occupation, 
   the 2024 median salary, the number of times a user has viewed the detailed information, 
   the time each user has spent viewing the detailed information, the top majors that individuals 
   in the occupation have, and the top related occupations from O*NET
*/
const mockData = {
    occupations: [
        { id: 0, two_digit_soc_code: 11, name: "Management", median_salary: "122,090", count: 0, time: 0, major: ["Business", "Engineering", "Social Sciences"], occupation: [16, 1, 3] },
        { id: 1, two_digit_soc_code: 13, name: "Business and Financial", median_salary: "80,920", count: 0, time: 0, major: ["Business", "Social Sciences", "Engineering"], occupation: [16, 0, 2] },
        { id: 2, two_digit_soc_code: 15, name: "Computer and Mathematical", median_salary: "105,850", count: 0, time: 0, major: ["Computer and Information Sciences", "Business", "Engineering"], occupation: [3, 16, 19] },
        { id: 3, two_digit_soc_code: 17, name: "Architecture and Engineering", median_salary: "97,310", count: 0, time: 0, major: ["Engineering", "Business", "Architecture"], occupation: [20, 19, 18] },
        { id: 4, two_digit_soc_code: 19, name: "Life, Physical, and Social Science", median_salary: "78,980", count: 0, time: 0, major: ["Biology and Life Sciences", "Physical Sciences", "Psychology"], occupation: [9, 3, 7] },
        { id: 5, two_digit_soc_code: 21, name: "Community and Social Service", median_salary: "57,530", count: 0, time: 0, major: ["Psychology", "Public Affairs, Policy, and Social Work", "Education Administration and Teaching"], occupation: [9, 7, 10] },
        { id: 6, two_digit_soc_code: 23, name: "Legal", median_salary: "99,990", count: 0, time: 0, major: ["Social Sciences", "Business", "History"], occupation: [1, 16, 0] },
        { id: 7, two_digit_soc_code: 25, name: "Educational Instruction and Library", median_salary: "59,220", count: 0, time: 0, major: ["Education Administration and Teaching", "Business", "Social Sciences"], occupation: [9, 5] },
        { id: 8, two_digit_soc_code: 27, name: "Arts, Design, Entertainment, Sports, and Media", median_salary: "60,140", count: 0, time: 0, major: ["Fine Arts", "Communications", "Business"], occupation: [] },
        { id: 9, two_digit_soc_code: 29, name: "Healthcare Practitioners and Technical", median_salary: "83,090", count: 0, time: 0, major: ["Medical and Health Sciences and Services", "Biology and Life Sciences", "Psychology"], occupation: [10, 5, 7] },
        { id: 10, two_digit_soc_code: 31, name: "Healthcare Support", median_salary: "37,180", count: 0, time: 0, major: ["BioScience", "Patient Care Technician Training", "Medical Assistant Training", "Sports Medicine & Rehabilitation"], occupation: [9, 7, 5] },
        { id: 11, two_digit_soc_code: 33, name: "Protective Service", median_salary: "50,580", count: 0, time: 0, major: ["Criminal Justice"], occupation: [21, 16] },
        { id: 12, two_digit_soc_code: 35, name: "Food Preparation and Serving Related", median_salary: "34,130", count: 0, time: 0, major: ["Culinary Arts"], occupation: [20] },
        { id: 13, two_digit_soc_code: 37, name: "Building and Grounds Cleaning and Maintenance", median_salary: "36,790", count: 0, time: 0, major: ["None"], occupation: [20, 18, 19] },
        { id: 14, two_digit_soc_code: 39, name: "Personal Care and Service", median_salary: "35,110", count: 0, time: 0, major: ["Cosmetology", "Manicurist Training"], occupation: [9] },
        { id: 15, two_digit_soc_code: 41, name: "Sales and Related", median_salary: "37,460", count: 0, time: 0, major: ["Business & Risk Management"], occupation: [16, 1, 0] },
        { id: 16, two_digit_soc_code: 43, name: "Office and Administrative Support", median_salary: "46,320", count: 0, time: 0, major: ["Business & Risk Management"], occupation: [1, 0, 15] },
        { id: 17, two_digit_soc_code: 45, name: "Farming, Fishing, and Forestry", median_salary: "36,750", count: 0, time: 0, major: ["BioScience"], occupation: [20, 18, 19] },
        { id: 18, two_digit_soc_code: 47, name: "Construction and Extraction", median_salary: "58,360", count: 0, time: 0, major: ["Construction Technology"], occupation: [20, 19, 21] },
        { id: 19, two_digit_soc_code: 49, name: "Installation, Maintenance, and Repair", median_salary: "58,230", count: 0, time: 0, major: ["Automotive Technology", "Engineering Technologies"], occupation: [20, 18, 21] },
        { id: 20, two_digit_soc_code: 51, name: "Production", median_salary: "45,960", count: 0, time: 0, major: ["Precision Machining", "Welding Technology"], occupation: [18, 19, 3] },
        { id: 21, two_digit_soc_code: 53, name: "Transportation and Material Moving", median_salary: "42,740", count: 0, time: 0, major: ["Automotive Technology"], occupation: [20, 19, 18] },
    ]
};

// TieredSteps Component - Shows where ALL occupations rank on the exposure scale
// Now accepts occupations array, getRankingFn, onOccupationClick, and selectedItem
function TieredSteps({ occupations, getRankingFn, onOccupationClick, selectedItem }) {
    // 5 tiers with red-yellow-green color scale (no blue)
    const tiers = [
        { label: '1-20', displayLabel: 'Very High', range: [1, 20], color: '#dc2626' },    // Red
        { label: '21-40', displayLabel: 'High', range: [21, 40], color: '#f97316' },       // Orange
        { label: '41-60', displayLabel: 'Moderate', range: [41, 60], color: '#eab308' },   // Yellow
        { label: '61-100', displayLabel: 'Lowest', range: [61, 100], color: '#16a34a' },   // Dark Green
    ];

    // Determine which tier (0-3) based on ranking (1-100)
    const getTierIndex = (rank) => {
        if (rank <= 20) return 0;
        if (rank <= 40) return 1;
        if (rank <= 60) return 2;
        return 3;
    };

    // Group occupations by their tier
    const occupationsByTier = {};
    occupations.forEach(occ => {
        const ranking = getRankingFn(occ.name);
        const tierIndex = getTierIndex(ranking);
        if (!occupationsByTier[tierIndex]) {
            occupationsByTier[tierIndex] = [];
        }
        occupationsByTier[tierIndex].push({ ...occ, ranking });
    });

    // Calculate dynamic padding based on max stack height
    const maxOccupationsInTier = Math.max(...Object.values(occupationsByTier).map(arr => arr.length), 1);
    // Each occupation box is ~40px tall (with padding and gap)
    const dynamicPaddingBottom = Math.max(20, maxOccupationsInTier * 40);

    return (
        <div style={{ textAlign: 'center', marginBottom: '24px', width: '100%' }}>
            <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                gap: '16px',
                marginBottom: '16px',
                paddingBottom: `${dynamicPaddingBottom}px`,
                minHeight: `${dynamicPaddingBottom + 180}px`
            }}>
                {tiers.map((tier, index) => {
                    const occupationsInTier = occupationsByTier[index] || [];
                    const hasOccupations = occupationsInTier.length > 0;
                    const height = 160 - index * 20; // Descending heights (deeper for more exposed)

                    return (
                        <div key={tier.label} style={{ position: 'relative' }}>
                            {/* The tier bar */}
                            <div style={{
                                width: '100px',
                                height: `${height}px`,
                                backgroundColor: hasOccupations ? tier.color : `${tier.color}15`,
                                border: `3px solid ${tier.color}`,
                                borderRadius: '0 0 12px 12px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'background-color 0.3s'
                            }}>
                                <span style={{
                                    fontSize: '14px',
                                    fontWeight: '700',
                                    color: hasOccupations ? '#fff' : tier.color,
                                }}>
                                    {tier.displayLabel}
                                </span>
                                <span style={{
                                    fontSize: '11px',
                                    fontWeight: '500',
                                    color: hasOccupations ? 'rgba(255,255,255,0.8)' : tier.color,
                                    marginTop: '2px'
                                }}>
                                    {tier.label}
                                </span>
                            </div>
                            {/* Individual arrows for each occupation in this tier - BELOW the bar */}
                            {hasOccupations && (
                                <div style={{
                                    position: 'absolute',
                                    top: `${height + 12}px`,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}>
                                    {occupationsInTier.map((occ, i) => {
                                        const isSelected = selectedItem?.name === occ.name;
                                        return (
                                            <div
                                                key={occ.name}
                                                onClick={() => onOccupationClick && onOccupationClick(occ)}
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    cursor: 'pointer',
                                                    transition: 'transform 0.2s'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                            >
                                                {/* Arrow pointing up (only on first item) */}
                                                {i === 0 && (
                                                    <div style={{
                                                        width: 0,
                                                        height: 0,
                                                        borderLeft: '8px solid transparent',
                                                        borderRight: '8px solid transparent',
                                                        borderBottom: `10px solid ${tier.color}`
                                                    }} />
                                                )}
                                                {/* Individual occupation box */}
                                                <div style={{
                                                    backgroundColor: tier.color,
                                                    color: '#fff',
                                                    padding: '8px 12px',
                                                    borderRadius: '6px',
                                                    fontSize: '11px',
                                                    fontWeight: '600',
                                                    boxShadow: isSelected
                                                        ? `0 0 0 3px white, 0 0 0 5px ${tier.color}`
                                                        : '0 2px 8px rgba(0,0,0,0.2)',
                                                    textAlign: 'center',
                                                    whiteSpace: 'normal',
                                                    maxWidth: '160px',
                                                    lineHeight: '1.3'
                                                }}>
                                                    {occ.name}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                maxWidth: '580px',
                margin: '0 auto',
                fontSize: '13px',
                color: '#64748b',
                fontWeight: '500'
            }}>
                <span>← Most Exposed</span>
                <span>Least Exposed →</span>
            </div>
        </div>
    );
}

function EmploymentChangeChart({
    occupationName,
    ranking,
    employmentChangeByQuintile,
    showExposureGuide = true,
    annotations = [],
    selectedOccupationName = null,
    occupationDescriptor = 'top-choice',
}) {
    if (!employmentChangeByQuintile) {
        return (
            <div style={{
                marginTop: '15px',
                padding: '15px',
                backgroundColor: '#f8fafc',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                color: '#334155',
            }}>
                Loading employment trend data...
            </div>
        );
    }

    const participantQuintile = getExposureQuintile(ranking);
    const participantMeta = QUINTILE_META[participantQuintile];
    const participantValue = employmentChangeByQuintile[participantQuintile];

    const normalizeAnnotation = (entry) => {
        const name = (entry?.name || '').trim();
        const rank = Number(entry?.ranking);
        if (!name || !Number.isFinite(rank)) return null;
        return {
            name,
            ranking: rank,
            quintile: getExposureQuintile(rank),
        };
    };

    const wrapMarkerText = (text, maxCharsPerLine = 24) => {
        if (!text) return [''];
        const words = text.split(/\s+/).filter(Boolean);
        const lines = [];
        let currentLine = '';

        words.forEach((word) => {
            if (word.length > maxCharsPerLine) {
                if (currentLine) {
                    lines.push(currentLine);
                    currentLine = '';
                }
                for (let i = 0; i < word.length; i += maxCharsPerLine) {
                    lines.push(word.slice(i, i + maxCharsPerLine));
                }
                return;
            }

            if (!currentLine) {
                currentLine = word;
                return;
            }

            const candidate = `${currentLine} ${word}`;
            if (candidate.length <= maxCharsPerLine) {
                currentLine = candidate;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        });

        if (currentLine) lines.push(currentLine);
        return lines.length ? lines : [''];
    };

    const chartData = QUINTILE_ORDER.map((q) => ({
        quintile: q,
        labelTop: QUINTILE_META[q].title,
        labelBottom: 'AI Exposure',
        value: employmentChangeByQuintile[q],
    })).filter((d) => Number.isFinite(d.value));

    const markerAnnotations = annotations
        .map(normalizeAnnotation)
        .filter(Boolean);

    if (markerAnnotations.length === 0 && occupationName && Number.isFinite(ranking)) {
        markerAnnotations.push({
            name: occupationName,
            ranking: Number(ranking),
            quintile: participantQuintile,
        });
    }

    if (!chartData.length || !Number.isFinite(participantValue)) {
        return (
            <div style={{
                marginTop: '15px',
                padding: '15px',
                backgroundColor: '#f8fafc',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                color: '#334155',
            }}>
                Employment trend data is not available for this occupation group.
            </div>
        );
    }

    const values = chartData.map((d) => d.value);
    const minValue = Math.min(...values, 0);
    const maxValue = Math.max(...values, 0);

    // Build a rounded y-axis scale with "nice" tick intervals (1/2/5 * 10^n).
    const niceStep = (rawStep) => {
        if (!Number.isFinite(rawStep) || rawStep <= 0) return 1;
        const exponent = Math.floor(Math.log10(rawStep));
        const magnitude = 10 ** exponent;
        const normalized = rawStep / magnitude;
        let niceNormalized = 10;
        if (normalized <= 1) niceNormalized = 1;
        else if (normalized <= 2) niceNormalized = 2;
        else if (normalized <= 5) niceNormalized = 5;
        return niceNormalized * magnitude;
    };

    const targetTickCount = 6;
    const rawRange = Math.max(1, maxValue - minValue);
    const tickStep = niceStep(rawRange / (targetTickCount - 1));

    let yMin = Math.floor(minValue / tickStep) * tickStep;
    let yMax = Math.ceil(maxValue / tickStep) * tickStep;
    if (yMin > 0) yMin = 0;
    if (yMax < 0) yMax = 0;
    if (Math.abs(yMax - yMin) < 1e-8) {
        yMin -= tickStep;
        yMax += tickStep;
    }

    const chartLeft = 64;
    const chartTop = 24;
    const chartWidth = 620;
    const chartHeight = 240;
    const slotWidth = chartWidth / chartData.length;
    const barWidth = Math.min(78, slotWidth * 0.58);
    const xAxisLabelY = chartTop + chartHeight + 20;
    const xAxisLabelBottomY = xAxisLabelY + 13;

    const markersByQuintile = {};
    chartData.forEach((d) => {
        markersByQuintile[d.quintile] = [];
    });
    markerAnnotations.forEach((marker) => {
        if (markersByQuintile[marker.quintile]) {
            markersByQuintile[marker.quintile].push(marker);
        }
    });

    const markerStartY = xAxisLabelBottomY + 12;
    const markerGapY = 8;
    const markerCollisionX = 0;
    const markerCollisionY = 8;
    const markerLayoutsByQuintile = {};
    const nextTipYByQuintile = {};
    const quintileCenters = {};
    const quintileColumnBounds = {};
    const placedBoxes = [];
    let maxMarkerBottomY = 340;

    chartData.forEach((d, idx) => {
        markerLayoutsByQuintile[d.quintile] = [];
        nextTipYByQuintile[d.quintile] = markerStartY;
        quintileCenters[d.quintile] = chartLeft + idx * slotWidth + (slotWidth / 2);
        const columnLeft = chartLeft + idx * slotWidth;
        const innerPadding = 6;
        quintileColumnBounds[d.quintile] = {
            left: columnLeft + innerPadding,
            right: columnLeft + slotWidth - innerPadding,
            width: Math.max(80, slotWidth - (innerPadding * 2)),
        };
    });

    const hasCollision = (candidate) => {
        return placedBoxes.some((placed) =>
            candidate.left < placed.right + markerCollisionX &&
            candidate.right > placed.left - markerCollisionX &&
            candidate.top < placed.bottom + markerCollisionY &&
            candidate.bottom > placed.top - markerCollisionY
        );
    };

    chartData.forEach((d) => {
        const markers = markersByQuintile[d.quintile] || [];
        const column = quintileColumnBounds[d.quintile];

        markers.forEach((marker) => {
            const boxWidth = Math.floor(column.width);
            const maxCharsPerLine = Math.max(12, Math.floor((boxWidth - 24) / 6.2));
            const lines = wrapMarkerText(marker.name, maxCharsPerLine);
            const lineHeight = 13;
            const textBlockHeight = lines.length * lineHeight;
            const boxHeight = Math.max(30, textBlockHeight + 12);
            const boxX = column.left + ((column.width - boxWidth) / 2);

            let tipY = nextTipYByQuintile[d.quintile];
            let attempts = 0;
            let boxY = tipY + 8;
            let candidate = {
                left: boxX,
                right: boxX + boxWidth,
                top: boxY,
                bottom: boxY + boxHeight,
            };

            while (hasCollision(candidate) && attempts < 200) {
                tipY = candidate.bottom + markerGapY;
                boxY = tipY + 8;
                candidate = {
                    left: boxX,
                    right: boxX + boxWidth,
                    top: boxY,
                    bottom: boxY + boxHeight,
                };
                attempts += 1;
            }

            const previousLayouts = markerLayoutsByQuintile[d.quintile];
            const connectorStartY = previousLayouts.length > 0
                ? (previousLayouts[previousLayouts.length - 1].boxY + previousLayouts[previousLayouts.length - 1].boxHeight + 4)
                : (xAxisLabelBottomY + 6);

            const layout = {
                marker,
                lines,
                lineHeight,
                boxWidth,
                boxHeight,
                tipY,
                boxY,
                boxX,
                connectorStartY,
            };

            markerLayoutsByQuintile[d.quintile].push(layout);
            nextTipYByQuintile[d.quintile] = candidate.bottom + markerGapY;
            placedBoxes.push(candidate);
            maxMarkerBottomY = Math.max(maxMarkerBottomY, candidate.bottom);
        });
    });

    const svgHeight = maxMarkerBottomY + 18;
    const selectedMarkerName = selectedOccupationName || occupationName;

    const yScale = (v) => chartTop + ((yMax - v) / (yMax - yMin)) * chartHeight;
    const zeroY = yScale(0);
    const tickValues = [];
    for (let tick = yMax; tick >= yMin - (tickStep * 0.5); tick -= tickStep) {
        tickValues.push(Number(tick.toFixed(10)));
    }
    if (!tickValues.some((v) => Math.abs(v) < 1e-8)) {
        tickValues.push(0);
        tickValues.sort((a, b) => b - a);
    }

    const direction = participantValue >= 0 ? 'growth' : 'decline';
    const participantBarColor = getEmploymentColor(participantValue);
    const participantWorkers = Math.round(Math.abs(participantValue));
    const plainLanguageText = participantValue >= 0
        ? `What does this mean? For your group, the change is ${formatSignedPercent(participantValue)}. That means roughly ${participantWorkers} jobs were added for every 100 workers.`
        : `What does this mean? For your group, the change is ${formatSignedPercent(participantValue)}. That means roughly ${participantWorkers} out of every 100 workers in this group lost their jobs.`;

    return (
        <div style={{
            marginTop: '15px',
            padding: '15px',
            backgroundColor: '#f8fafc',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
        }}>
            <ul style={{ marginTop: '8px', marginBottom: '10px', paddingLeft: '20px', lineHeight: '1.5', color: '#334155' }}>
                <li>The chart shows how employment for young workers has changed since the release of ChatGPT.</li>
            </ul>

            <svg viewBox={`0 0 760 ${svgHeight}`} style={{ width: '100%', height: 'auto' }}>
                {tickValues.map((tick) => {
                    const y = yScale(tick);
                    return (
                        <g key={`tick-${tick}`}>
                            <line
                                x1={chartLeft}
                                y1={y}
                                x2={chartLeft + chartWidth}
                                y2={y}
                                stroke="#e2e8f0"
                                strokeWidth={1}
                            />
                            <text
                                x={chartLeft - 10}
                                y={y + 4}
                                textAnchor="end"
                                fill="#64748b"
                                fontSize="12"
                            >
                                {formatAxisPercent(tick)}
                            </text>
                        </g>
                    );
                })}

                <line
                    x1={chartLeft}
                    y1={zeroY}
                    x2={chartLeft + chartWidth}
                    y2={zeroY}
                    stroke="#475569"
                    strokeWidth={1.5}
                />

                {chartData.map((d, idx) => {
                    const x = chartLeft + idx * slotWidth + (slotWidth - barWidth) / 2;
                    const y = d.value >= 0 ? yScale(d.value) : zeroY;
                    const height = Math.max(2, Math.abs(yScale(d.value) - zeroY));
                    const fill = getEmploymentColor(d.value);
                    const stroke = '#33415522';
                    const valueLabelY = d.value >= 0 ? y - 8 : y + height + 16;

                    return (
                        <g key={`${d.labelTop}-${d.labelBottom}`}>
                            <rect
                                x={x}
                                y={y}
                                width={barWidth}
                                height={height}
                                fill={fill}
                                stroke={stroke}
                                strokeWidth={1}
                                rx={4}
                            />
                            <text
                                x={x + barWidth / 2}
                                y={valueLabelY}
                                textAnchor="middle"
                                fill="#334155"
                                fontSize="12"
                                fontWeight="600"
                            >
                                {formatSignedPercent(d.value)}
                            </text>
                            <text
                                x={x + barWidth / 2}
                                y={xAxisLabelY}
                                textAnchor="middle"
                                fill="#334155"
                                fontSize="11"
                                fontWeight="600"
                            >
                                <tspan x={x + barWidth / 2} y={xAxisLabelY}>
                                    {d.labelTop}
                                </tspan>
                                <tspan x={x + barWidth / 2} y={xAxisLabelBottomY}>
                                    {d.labelBottom}
                                </tspan>
                            </text>
                        </g>
                    );
                })}

                {chartData.map((d, idx) => {
                    const xCenter = chartLeft + idx * slotWidth + (slotWidth / 2);
                    const layouts = markerLayoutsByQuintile[d.quintile] || [];

                    return layouts.map((layout, markerIdx) => {
                        const { marker, lines, lineHeight, boxWidth, boxHeight, tipY, boxY, boxX, connectorStartY } = layout;
                        const isSelectedMarker = marker.name === selectedMarkerName;
                        const markerTextColor = '#1f3552';
                        const markerBorderColor = '#b4c1d2';
                        const markerArrowColor = '#7a8da6';
                        const markerStemColor = '#94a3b8';
                        const textStartY = boxY + ((boxHeight - (lines.length * lineHeight)) / 2) + 10;

                        return (
                            <g key={`marker-${d.quintile}-${marker.name}-${markerIdx}`}>
                                <line
                                    x1={xCenter}
                                    y1={connectorStartY}
                                    x2={xCenter}
                                    y2={tipY}
                                    stroke={markerStemColor}
                                    strokeWidth={1}
                                />
                                <polygon
                                    points={`${xCenter},${tipY} ${xCenter - 6},${tipY + 8} ${xCenter + 6},${tipY + 8}`}
                                    fill={markerArrowColor}
                                />
                                <rect
                                    x={boxX}
                                    y={boxY}
                                    width={boxWidth}
                                    height={boxHeight}
                                    rx={5}
                                    fill="#ffffff"
                                    stroke={markerBorderColor}
                                    strokeWidth={isSelectedMarker ? 2 : 1}
                                />
                                <text
                                    x={boxX + boxWidth / 2}
                                    y={textStartY}
                                    textAnchor="middle"
                                    fill={markerTextColor}
                                    fontSize="11"
                                    fontWeight={isSelectedMarker ? '700' : '600'}
                                >
                                    {lines.map((line, lineIdx) => (
                                        <tspan
                                            key={`marker-line-${lineIdx}`}
                                            x={boxX + boxWidth / 2}
                                            y={textStartY + (lineIdx * lineHeight)}
                                        >
                                            {line}
                                        </tspan>
                                    ))}
                                </text>
                            </g>
                        );
                    });
                })}

                <text
                    x={18}
                    y={chartTop + (chartHeight / 2)}
                    transform={`rotate(-90 18 ${chartTop + (chartHeight / 2)})`}
                    textAnchor="middle"
                    fill="#334155"
                    fontSize="12"
                    fontWeight="600"
                >
                    Employment Change
                </text>
            </svg>

            {showExposureGuide && (
                <div style={{
                    marginTop: '10px',
                    padding: '10px',
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                }}>
                    <p style={{ marginTop: 0, marginBottom: '8px', fontWeight: '600', color: '#334155' }}>
                        How to read the exposure groups
                    </p>
                    <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px', lineHeight: '1.5', color: '#334155' }}>
                        <li>Jobs range from Very High to Lowest exposure.</li>
                        <li>More exposure means more tasks in that job can be done or helped by AI.</li>
                        <li>Less exposure means fewer tasks can currently be done by AI.</li>
                        <li>Similar-sounding occupations may have different exposure levels due to differences in tasks.</li>
                        <li>You will have a chance to ask questions about these results to an AI agent later in this survey.</li>
                    </ul>
                </div>
            )}
        </div>
    );
}

// Helper function to get exposure level description based on ranking
function getExposureLevel(ranking) {
    if (ranking <= 20) return { level: 'Very High', color: '#dc2626' };  // Red
    if (ranking <= 40) return { level: 'High', color: '#f97316' };       // Orange
    if (ranking <= 60) return { level: 'Moderate', color: '#eab308' };   // Yellow
    return { level: 'Lowest', color: '#16a34a' };                        // Dark Green
}

// Helper function to get button background color based on ranking
function getButtonColor(ranking) {
    if (ranking <= 20) return '#fee2e2'; // Light red for very high exposure
    if (ranking <= 40) return '#ffedd5'; // Light orange for high exposure
    if (ranking <= 60) return '#fef9c3'; // Light yellow for moderate exposure
    return '#bbf7d0'; // Light green for lowest exposure
}

// Helper: format education code into display text and whether it's bachelor's+
function formatEducation(educationcode) {
    if (!educationcode) return { text: 'unknown', hasBachelors: false };
    const lower = educationcode.toLowerCase().trim();
    if (lower.includes('doctoral') || lower.includes('professional'))
        return { text: 'a doctoral or professional degree', hasBachelors: true };
    if (lower.includes('master'))
        return { text: "a master's degree", hasBachelors: true };
    if (lower.includes('bachelor'))
        return { text: "a bachelor's degree", hasBachelors: true };
    if (lower.includes('associate'))
        return { text: "an associate's degree", hasBachelors: false };
    if (lower.includes('postsecondary'))
        return { text: 'a postsecondary nondegree award', hasBachelors: false };
    if (lower.includes('some college'))
        return { text: 'some college (no degree)', hasBachelors: false };
    if (lower.includes('hs') || lower.includes('high school'))
        return { text: 'a high school diploma or equivalent', hasBachelors: false };
    if (lower.includes('no formal'))
        return { text: 'no formal educational credential', hasBachelors: false };
    return { text: educationcode, hasBachelors: false };
}

// Helper: capitalize degree field names (title case, lowercase small words)
function capitalizeField(field) {
    if (!field) return '';
    const smallWords = new Set(['and', 'of', 'the', 'in', 'for', 'or', 'a', 'an']);
    return field.split(' ').map((word, i) => {
        if (i > 0 && smallWords.has(word.toLowerCase())) return word.toLowerCase();
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
}

// Main function that creates the visualization
function AIExposureVisualization() {
    // State for CSV data (ranking lookup and occupation list)
    const [rankingData, setRankingData] = useState({});
    const [occupationList, setOccupationList] = useState([]);
    const [csvLoading, setCsvLoading] = useState(true);
    const [csvError, setCsvError] = useState(null);
    const [socCodeMap, setSocCodeMap] = useState({});
    const [employmentChangeByQuintile, setEmploymentChangeByQuintile] = useState(null);

    // Used to store the current user-inputted search term
    const [searchTerm, setSearchTerm] = useState('');
    // Used to store the list of user-inputted search terms
    const [searchTerms, setSearchTerms] = useState('');
    // Used to store the sorted list of preferred occupations
    const [ranked, setRanked] = useState(null);
    // Used to track which occupation is being clicked on the second and third pages
    const [selectedItem, setSelectedItem] = useState(null);
    // Used to track which occupation is being clicked on the fourth page
    const [selectedItemEnd, setSelectedItemEnd] = useState(null);
    // Used to store the list of preferred occupations
    const [list, setList] = useState([]);
    // Used to determine whether to display the first page
    const [showSearch, setShowSearch] = useState(true);
    // Used to determine whether to display the third page
    const [showTop, setShowTop] = useState(false);
    // Used to determine whether to display the transition screen before page 4
    const [showTransition, setShowTransition] = useState(false);
    // Used to determine whether to display the final page
    const [showEnd, setShowEnd] = useState(false);
    // Used to track the time spent on the current page
    const [timeSpent, setTimeSpent] = useState(0);
    // Used to track the time spent on each page
    const [timeSpentPages, setTimeSpentPages] = useState([0, 0, 0, 0]);
    // Used to track the start time for viewing an occupation's detailed information
    const [timeSpentDetailStart, setTimeSpentDetailStart] = useState(0);
    // Used to track the time spent on each occupation's detailed information
    const [timeSpentDetail, setTimeSpentDetail] = useState(mockData.occupations);

    // Tracking for final search screen (4th page)
    const [searchScreenOccupationsViewed, setSearchScreenOccupationsViewed] = useState([]);
    const [searchScreenTimeStart, setSearchScreenTimeStart] = useState(null);
    const [searchScreenTotalTime, setSearchScreenTotalTime] = useState(0);

    // Comprehensive event-level tracking for page 4
    const searchScreenEvents = useRef([]);
    const searchScreenStartTime = useRef(null);
    const detailOpenTimeRef = useRef(null);
    const searchDebounceRef = useRef(null);
    const maxScrollRef = useRef(0);
    const containerRef = useRef(null);

    // Exposure-level filter buttons for page 4
    const [exposureFilters, setExposureFilters] = useState(new Set());
    // Occupation group filter (2-digit SOC)
    const [occGroupFilter, setOccGroupFilter] = useState('');
    // Education filter: 'college' (bachelor's+) or 'nocollege'
    const [educationFilter, setEducationFilter] = useState('');
    // Field of study filter
    const [fieldOfStudyFilter, setFieldOfStudyFilter] = useState('');

    // Get correct listing of elements. Ex. X, Y, and Z
    const listFormatter = new Intl.ListFormat('en-US', { style: 'long', type: 'conjunction' });

    // 2-digit SOC code to group name mapping
    const socGroupMap = {};
    mockData.occupations.forEach(o => { socGroupMap[String(o.two_digit_soc_code)] = o.name; });

    // Unique degree fields derived from CSV data
    const allDegreeFields = React.useMemo(() => {
        const fieldSet = new Set();
        occupationList.forEach(occ => {
            [occ.degfield_1, occ.degfield_2, occ.degfield_3].forEach(f => {
                if (f && f.trim()) fieldSet.add(f.trim().toLowerCase());
            });
        });
        return [...fieldSet].sort().map(f => capitalizeField(f));
    }, [occupationList]);

    // Fetch CSV data on component mount
    useEffect(() => {
        async function fetchCSV() {
            try {
                const response = await fetch(CSV_URL);
                if (!response.ok) throw new Error('Failed to fetch CSV');
                const text = await response.text();

                // Parse CSV
                const lines = text.trim().split('\n');
                const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));

                const rankingIndex = headers.indexOf('ranking');
                const occupationIndex = headers.indexOf('occupation');
                const socCodeIndex = headers.indexOf('soc_code');
                const educationcodeIndex = headers.indexOf('educationcode');
                const degfield1Index = headers.indexOf('degfield_1');
                const degfield2Index = headers.indexOf('degfield_2');
                const degfield3Index = headers.indexOf('degfield_3');
                const relatedSoc1Index = headers.indexOf('related_soc_code_1');
                const relatedSoc2Index = headers.indexOf('related_soc_code_2');
                const relatedSoc3Index = headers.indexOf('related_soc_code_3');
                const altTitlesIndex = headers.indexOf('alt_titles');

                if (rankingIndex === -1 || occupationIndex === -1) {
                    throw new Error('CSV must have "ranking" and "occupation" columns');
                }

                const data = {};
                const occList = [];
                const socMap = {};
                for (let i = 1; i < lines.length; i++) {
                    // Handle CSV with quoted fields containing commas
                    const line = lines[i];
                    let values = [];
                    let current = '';
                    let inQuotes = false;
                    for (let j = 0; j < line.length; j++) {
                        const char = line[j];
                        if (char === '"') {
                            inQuotes = !inQuotes;
                        } else if (char === ',' && !inQuotes) {
                            values.push(current.trim());
                            current = '';
                        } else {
                            current += char;
                        }
                    }
                    values.push(current.trim());

                    const ranking = parseInt(values[rankingIndex], 10);
                    const occupation = values[occupationIndex]?.trim().replace(/^"|"$/g, '');
                    const soc_code = socCodeIndex !== -1 ? (values[socCodeIndex]?.trim().replace(/^"|"$/g, '') || '') : '';
                    const educationcode = educationcodeIndex !== -1 ? (values[educationcodeIndex]?.trim().replace(/^"|"$/g, '') || '') : '';
                    const degfield_1 = degfield1Index !== -1 ? (values[degfield1Index]?.trim().replace(/^"|"$/g, '') || '') : '';
                    const degfield_2 = degfield2Index !== -1 ? (values[degfield2Index]?.trim().replace(/^"|"$/g, '') || '') : '';
                    const degfield_3 = degfield3Index !== -1 ? (values[degfield3Index]?.trim().replace(/^"|"$/g, '') || '') : '';
                    const related_soc_code_1 = relatedSoc1Index !== -1 ? (values[relatedSoc1Index]?.trim().replace(/^"|"$/g, '') || '') : '';
                    const related_soc_code_2 = relatedSoc2Index !== -1 ? (values[relatedSoc2Index]?.trim().replace(/^"|"$/g, '') || '') : '';
                    const related_soc_code_3 = relatedSoc3Index !== -1 ? (values[relatedSoc3Index]?.trim().replace(/^"|"$/g, '') || '') : '';

                    // Parse alt_titles (pipe-delimited string)
                    const altTitlesRaw = altTitlesIndex !== -1 ? (values[altTitlesIndex]?.trim().replace(/^"|"$/g, '') || '') : '';
                    const alt_titles = altTitlesRaw ? altTitlesRaw.split(' | ').map(t => t.trim()).filter(Boolean) : [];

                    if (occupation && !isNaN(ranking)) {
                        const occObj = {
                            id: i - 1,
                            name: occupation,
                            ranking: ranking,
                            soc_code: soc_code,
                            educationcode: educationcode,
                            degfield_1: degfield_1,
                            degfield_2: degfield_2,
                            degfield_3: degfield_3,
                            related_soc_code_1: related_soc_code_1,
                            related_soc_code_2: related_soc_code_2,
                            related_soc_code_3: related_soc_code_3,
                            alt_titles: alt_titles,
                        };
                        data[occupation.toLowerCase()] = ranking;
                        occList.push(occObj);
                        if (soc_code) socMap[soc_code] = occObj;
                    }
                }

                // Sort by occupation name alphabetically
                occList.sort((a, b) => a.name.localeCompare(b.name));

                setRankingData(data);
                setOccupationList(occList);
                setSocCodeMap(socMap);
                setCsvLoading(false);
            } catch (err) {
                console.error('CSV fetch error:', err);
                setCsvError(err.message);
                setCsvLoading(false);
            }
        }

        fetchCSV();
    }, []);

    useEffect(() => {
        let cancelled = false;

        async function fetchEmploymentData() {
            try {
                const response = await fetch(EMPLOYMENT_DATA_URL);
                if (!response.ok) throw new Error('Failed to fetch employment data');
                const payload = await response.json();
                if (!cancelled) {
                    setEmploymentChangeByQuintile(computeEmploymentChangeByQuintile(payload));
                }
            } catch (err) {
                console.error('Employment data fetch error:', err);
                if (!cancelled) setEmploymentChangeByQuintile(null);
            }
        }

        fetchEmploymentData();
        return () => { cancelled = true; };
    }, []);

    // Helper to get ranking for an occupation (fallback to 50 if not found)
    const getRanking = (occupationName) => {
        const key = occupationName.toLowerCase();
        return rankingData[key] ?? 50; // Default to middle ranking if not found
    };

    // Log an event for the search screen (page 4)
    const logSearchEvent = (eventType, details) => {
        if (!searchScreenStartTime.current) return;
        searchScreenEvents.current.push({
            type: eventType,
            time: parseFloat(((Date.now() - searchScreenStartTime.current) / 1000).toFixed(1)),
            ...details
        });
    };

    // Debounced search input handler for page 4
    const handleSearchInputChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        clearTimeout(searchDebounceRef.current);
        if (value.trim()) {
            searchDebounceRef.current = setTimeout(() => {
                const lv = value.toLowerCase();
                const resultCount = occupationList.filter(item =>
                    item.name.toLowerCase().includes(lv) ||
                    (item.alt_titles && item.alt_titles.some(alt => alt.toLowerCase().includes(lv)))
                ).length;
                logSearchEvent('search', { term: value.trim(), resultCount });
            }, 500);
        }
    };

    // Filter toggle handler for page 4
    const handleFilterToggle = (level) => {
        setExposureFilters(prev => {
            const next = new Set(prev);
            if (next.has(level)) {
                next.delete(level);
                logSearchEvent('filter_off', { filter: level });
            } else {
                next.add(level);
                logSearchEvent('filter_on', { filter: level });
            }
            return next;
        });
    };

    // Scroll tracking for page 4 occupation list
    const handleSearchListScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollHeight - clientHeight > 0) {
            const pct = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
            if (pct > maxScrollRef.current) maxScrollRef.current = pct;
        }
    };

    // Define top 3 positive and negative occupations based on rankings from CSV
    // Uses actual occupation data from CSV (6-digit SOC codes)
    const getTopOccupations = () => {
        if (occupationList.length === 0) {
            return {
                mostExposed: [],
                leastExposed: []
            };
        }

        // Sort by ranking (lower = more exposed)
        const sortedByRanking = [...occupationList].sort((a, b) => a.ranking - b.ranking);

        return {
            mostExposed: sortedByRanking.slice(0, 3),  // Top 3 most exposed (lowest rankings)
            leastExposed: sortedByRanking.slice(-3).reverse()  // Top 3 least exposed (highest rankings)
        };
    };

    // Set timer to track how much time a user spends on each occupation and page
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeSpent(prev => prev + 1);
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Track time spent on search screen
    useEffect(() => {
        if (showEnd && searchScreenTimeStart) {
            const timer = setInterval(() => {
                setSearchScreenTotalTime(Math.floor((Date.now() - searchScreenTimeStart) / 1000));
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [showEnd, searchScreenTimeStart]);

    // Function to get search screen tracking data (can be called from parent via postMessage)
    const getSearchScreenTrackingData = () => {
        // Compute deduplicated occupations from event log
        const occMap = {};
        searchScreenEvents.current.forEach(evt => {
            if (evt.type === 'click_occupation') {
                if (!occMap[evt.occupation]) {
                    occMap[evt.occupation] = { name: evt.occupation, soc_code: evt.soc_code, ranking: evt.ranking, viewCount: 0, totalViewSeconds: 0 };
                }
                occMap[evt.occupation].viewCount++;
            } else if (evt.type === 'close_occupation' && evt.viewDurationSeconds != null && occMap[evt.occupation]) {
                occMap[evt.occupation].totalViewSeconds += evt.viewDurationSeconds;
            }
        });

        const totalTimeSeconds = searchScreenStartTime.current
            ? parseFloat(((Date.now() - searchScreenStartTime.current) / 1000).toFixed(1))
            : searchScreenTotalTime;

        return {
            totalTimeSeconds,
            occupationsViewed: searchScreenOccupationsViewed,
            searchTermsUsed: searchTerms,
            events: searchScreenEvents.current,
            occupationsViewedDetailed: Object.values(occMap),
            searchTerms: searchScreenEvents.current.filter(e => e.type === 'search').map(e => e.term),
            filtersUsed: searchScreenEvents.current.filter(e => e.type.startsWith('filter_')),
            maxScrollPercent: maxScrollRef.current
        };
    };

    // Expose tracking data to parent window (for Qualtrics integration)
    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data === 'getSearchScreenData') {
                window.parent.postMessage({
                    type: 'searchScreenData',
                    data: getSearchScreenTrackingData()
                }, '*');
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [searchScreenTotalTime, searchScreenOccupationsViewed, searchTerms]);

    // Filter and sort data
    // Use occupations from CSV file
    let data = [...occupationList];

    // Apply search filter (matches against main name and alt titles)
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        data = data.filter(item =>
            item.name.toLowerCase().includes(term) ||
            (item.alt_titles && item.alt_titles.some(alt => alt.toLowerCase().includes(term)))
        );
    }

    // Apply filters (only active on page 4: !showSearch && !ranked && !showTop)
    if (!showSearch && !ranked && !showTop) {
        if (exposureFilters.size > 0) {
            data = data.filter(item => {
                const r = item.ranking || getRanking(item.name);
                const level = getExposureLevel(r).level;
                return exposureFilters.has(level);
            });
        }
        if (occGroupFilter) {
            data = data.filter(item => item.soc_code && item.soc_code.startsWith(occGroupFilter + '-'));
        }
        if (educationFilter === 'college') {
            data = data.filter(item => {
                const edu = (item.educationcode || '').toLowerCase();
                return edu.includes('bachelor') || edu.includes('master') || edu.includes('doctoral') || edu.includes('professional');
            });
        } else if (educationFilter === 'nocollege') {
            data = data.filter(item => {
                const edu = (item.educationcode || '').toLowerCase();
                return !(edu.includes('bachelor') || edu.includes('master') || edu.includes('doctoral') || edu.includes('professional'));
            });
        }
        if (fieldOfStudyFilter) {
            const filterLower = fieldOfStudyFilter.toLowerCase();
            data = data.filter(item =>
                [item.degfield_1, item.degfield_2, item.degfield_3].some(f =>
                    f && f.trim().toLowerCase() === filterLower
                )
            );
        }
    }

    // Handles item selection
    const handleItemClick = (item) => {
        if (!list.find(i => i.name === item.name) && list.length < 6) {
            setList([...list, item]);
            if (searchTerms === '') {
                setSearchTerms(searchTerm);
            } else {
                setSearchTerms(searchTerms + ', ' + searchTerm);
            }
        }
    };

    // Updates the time spent looking at detailed information for each occupation
    const updateTimeSpentDetail = (indexToUpdate, newValue) => {
        setTimeSpentDetail(newtimeSpentDetail => newtimeSpentDetail.map(item =>
            item.id === indexToUpdate ? { ...item, time: item.time + newValue } : item
        ));
    };

    // Updates the time spent on each page of the visualization
    const updateTimeSpentPages = (indexToUpdate, newValue) => {
        setTimeSpentPages(timeSpentPages.map((item, index) => index === indexToUpdate ? newValue + item : item));
    };

    // Handles user trying to view the detailed information for an occupation
    const handleItemClickDetailed = (item) => {
        if (selectedItem) {
            updateTimeSpentDetail(selectedItem.id, timeSpent - timeSpentDetailStart);
        }
        if ((selectedItem && selectedItem !== item) || !selectedItem) {
            item.count++;
        }
        setSelectedItem(selectedItem?.name === item.name ? null : item);
        setTimeSpentDetailStart(timeSpent);
    };

    // Handles user clicking the even more detailed information
    const handleItemClickEnd = (item) => {
        if (selectedItemEnd) {
            updateTimeSpentDetail(selectedItemEnd.id, timeSpent - timeSpentDetailStart);
            // Log close event with duration
            if (detailOpenTimeRef.current) {
                logSearchEvent('close_occupation', {
                    occupation: selectedItemEnd.name,
                    viewDurationSeconds: parseFloat(((Date.now() - detailOpenTimeRef.current) / 1000).toFixed(1))
                });
                detailOpenTimeRef.current = null;
            }
        }
        if ((selectedItemEnd && selectedItemEnd !== item) || !selectedItemEnd) {
            item.count++;
        }
        if (searchTerms === '') {
            setSearchTerms(searchTerm);
        } else {
            if (selectedItemEnd) {
                setSearchTerms(searchTerms + ', ' + searchTerm);
            }
        }
        const isClosing = selectedItemEnd?.name === item.name;
        setSelectedItemEnd(isClosing ? null : item);
        setTimeSpentDetailStart(timeSpent);

        if (!isClosing) {
            // Log click event for opening a new occupation
            logSearchEvent('click_occupation', {
                occupation: item.name,
                soc_code: item.soc_code,
                ranking: item.ranking || getRanking(item.name)
            });
            detailOpenTimeRef.current = Date.now();
        }

        // Track occupation viewed on search screen (only add if not already tracked)
        if (!searchScreenOccupationsViewed.find(o => o.name === item.name)) {
            setSearchScreenOccupationsViewed(prev => [...prev, {
                name: item.name,
                ranking: item.ranking || getRanking(item.name),
                viewedAt: Date.now()
            }]);
        }
    };

    // Handler to clear all items from the list
    const handleClearItems = () => {
        if (window.confirm('Are you sure you want to clear the list?')) {
            setList([]);
        }
    };

    // Handles removing an item from the list of preferred occupations
    const handleRemove = (id) => {
        setList(list.filter((item) => item.name !== id));
    };

    // Handles user clicking the submit button at the beginning of the visualization
    const handleSubmit = () => {
        // Preserve user-entered preferred occupation order from the first screen
        setRanked([...list]);
        setShowSearch(false);
        updateTimeSpentPages(0, timeSpent);
        setTimeSpent(0);
        setSearchTerm('');
    };

    // Handles user clicking the next button
    const handleNext = (page_num, show_top) => {
        setShowTop(show_top);
        setRanked(null);
        if (selectedItem) {
            updateTimeSpentDetail(selectedItem.id, timeSpent - timeSpentDetailStart);
        }
        setSelectedItem(null);
        setSelectedItemEnd(null);
        updateTimeSpentPages(page_num, timeSpent);
        setTimeSpent(0);
        // Show transition screen before page 4
        if (!show_top) {
            setShowTransition(true);
        }
    };

    // Handles user clicking continue on the transition screen
    const handleTransitionContinue = () => {
        setShowTransition(false);
        searchScreenStartTime.current = Date.now();
        setSearchScreenTimeStart(Date.now());
        searchScreenEvents.current = [];
        maxScrollRef.current = 0;
        setExposureFilters(new Set());
        setOccGroupFilter('');
        setEducationFilter('');
        setFieldOfStudyFilter('');
    };

    // Handles user clicking back button
    const handleBack = (page_num, show_top, submit) => {
        setShowTop(show_top);
        if (submit) {
            // Preserve user-entered preferred occupation order from the first screen
            setRanked([...list]);
            setShowSearch(false);
        }
        if (selectedItem) {
            updateTimeSpentDetail(selectedItem.id, timeSpent - timeSpentDetailStart);
        }
        setSelectedItem(null);
        setSelectedItemEnd(null);
        updateTimeSpentPages(page_num, timeSpent);
        setTimeSpent(0);
        if (page_num === 3) {
            setSearchTerm('');
        }
    };

    // Handles user clicking the end button
    const handleEnd = () => {
        setShowTop(false);
        setShowEnd(true);
        if (selectedItemEnd) {
            updateTimeSpentDetail(selectedItemEnd.id, timeSpent - timeSpentDetailStart);
            // Close any open detail panel and log duration
            if (detailOpenTimeRef.current) {
                logSearchEvent('close_occupation', {
                    occupation: selectedItemEnd.name,
                    viewDurationSeconds: parseFloat(((Date.now() - detailOpenTimeRef.current) / 1000).toFixed(1))
                });
                detailOpenTimeRef.current = null;
            }
        }
        setSelectedItemEnd(null);
        updateTimeSpentPages(3, timeSpent);
        setTimeSpent(0);

        // Compute total time on search screen
        const totalTimeSeconds = searchScreenStartTime.current
            ? parseFloat(((Date.now() - searchScreenStartTime.current) / 1000).toFixed(1))
            : 0;

        // Log max scroll
        logSearchEvent('end', { maxScrollPercent: maxScrollRef.current });

        // Build deduplicated occupationsViewed with view counts and durations from events
        const occMap = {};
        const openTimes = {};
        searchScreenEvents.current.forEach(evt => {
            if (evt.type === 'click_occupation') {
                if (!occMap[evt.occupation]) {
                    occMap[evt.occupation] = { name: evt.occupation, soc_code: evt.soc_code, ranking: evt.ranking, viewCount: 0, totalViewSeconds: 0 };
                }
                occMap[evt.occupation].viewCount++;
                openTimes[evt.occupation] = evt.time;
            } else if (evt.type === 'close_occupation' && evt.viewDurationSeconds != null) {
                if (occMap[evt.occupation]) {
                    occMap[evt.occupation].totalViewSeconds += evt.viewDurationSeconds;
                }
            }
        });

        // Send comprehensive tracking data
        window.parent.postMessage({
            type: 'searchScreenTracking',
            data: {
                events: searchScreenEvents.current,
                totalTimeSeconds,
                occupationsViewed: Object.values(occMap),
                searchTerms: searchScreenEvents.current.filter(e => e.type === 'search').map(e => e.term),
                filtersUsed: searchScreenEvents.current.filter(e => e.type.startsWith('filter_')),
                maxScrollPercent: maxScrollRef.current
            }
        }, '*');

        window.parent.postMessage("showNextButton", "*");
    };

    // Post content height to parent iframe for dynamic resizing
    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver(entries => {
            for (const entry of entries) {
                const height = Math.ceil(entry.borderBoxSize?.[0]?.blockSize ?? entry.target.scrollHeight);
                window.parent.postMessage({ type: 'resizeIframe', height: height + 40 }, '*');
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // Show loading state while fetching CSV
    if (csvLoading) {
        return (
            <div style={{
                maxWidth: '800px',
                margin: '0 auto',
                padding: '20px',
                textAlign: 'center'
            }}>
                <p>Loading occupation data</p>
            </div>
        );
    }

    // Show error if CSV failed to load
    if (csvError) {
        return (
            <div style={{
                maxWidth: '800px',
                margin: '0 auto',
                padding: '20px',
                textAlign: 'center',
                color: '#dc2626'
            }}>
                <p>Error loading data: {csvError}</p>
                <p>Please refresh the page to try again.</p>
            </div>
        );
    }

    const topOccupations = getTopOccupations();

    return (
        <div ref={containerRef} style={{
            maxWidth: '800px',
            margin: '0 auto',
            padding: '20px',
            backgroundColor: '#f9f9f9',
            borderRadius: '10px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            fontFamily: 'Arial, sans-serif'
        }}>
            {/* Displays overall header for the visualization */}
            <h1 style={{
                fontSize: '28px',
                fontWeight: 'bold',
                textAlign: 'center',
                marginBottom: '20px',
                color: '#333'
            }}>Exploring the Impact of Artificial Intelligence (AI)</h1>

            {/* Displays additional header for the first page */}
            {showSearch && (
                <p style={{
                    textAlign: 'center',
                    marginBottom: '30px',
                    color: 'black',
                    lineHeight: '1.6'
                }}>
                    Please select the 6 occupations you previously entered. Use the search bar below to find and click on each occupation to add it to your list.
                    <br />
                    As a reminder, these are the top 6 occupations you would consider for your future career.
                </p>
            )}

            {/* Displays additional header for the second and third pages */}
            {(ranked || showTop) && (
                <p style={{
                    textAlign: 'center',
                    marginBottom: '30px',
                    color: 'black'
                }}>
                    Click on an occupation for detailed information. Scroll down to view the detailed information.
                </p>
            )}

            {/* Displays the first page */}
            {showSearch && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '15px',
                    marginBottom: '30px'
                }}>
                    {/* Search Section */}
                    <div style={{
                        backgroundColor: 'white',
                        padding: '15px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                placeholder='Search for occupations...'
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px 10px 10px 35px',
                                    borderRadius: '6px',
                                    border: '1px solid #d1d5db',
                                    outline: 'none',
                                    fontSize: '14px',
                                    boxSizing: 'border-box'
                                }}
                            />
                            <div style={{
                                position: 'absolute',
                                left: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#9ca3af'
                            }}>
                                🔍
                            </div>
                        </div>
                        <div style={{
                            height: '250px',
                            overflowY: 'scroll'
                        }}>
                            {data.map((item, index) => {
                                const term = searchTerm?.toLowerCase() || '';
                                const nameMatches = item.name.toLowerCase().includes(term);
                                const matchingAlt = !nameMatches && term && item.alt_titles
                                    ? item.alt_titles.find(alt => alt.toLowerCase().includes(term))
                                    : null;
                                return (
                                <div
                                    key={index}
                                    onClick={() => handleItemClick(item)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '8px',
                                        borderRadius: '6px',
                                        border: '2px solid transparent',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        backgroundColor: 'transparent'
                                    }}
                                >
                                    <span>
                                        {item.name}
                                        {matchingAlt && (
                                            <span style={{ color: '#6b7280', fontSize: '0.85em', marginLeft: '6px' }}>
                                                (also known as: {matchingAlt})
                                            </span>
                                        )}
                                    </span>
                                </div>
                                );
                            })}
                        </div>
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '15px',
                        marginBottom: '30px'
                    }}>
                        <div style={{
                            backgroundColor: 'white',
                            padding: '15px',
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}>
                            <label style={{
                                display: 'block',
                                fontSize: '18px',
                                fontWeight: '500',
                                marginBottom: '10px',
                                color: 'black'
                            }}>
                                Preferred Occupations
                            </label>
                            <div>
                                <ol id="preferred_occupations">
                                    {list.map(item => (
                                        <li key={item.name}>{item.name}
                                            <button
                                                onClick={() => handleRemove(item.name)}
                                                style={{
                                                    marginLeft: '16px',
                                                    backgroundColor: 'white',
                                                    color: 'red',
                                                    border: 'none',
                                                    fontSize: '1rem',
                                                    fontWeight: 'bold',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                &#x2715;
                                            </button>
                                        </li>
                                    ))}
                                </ol>
                                <button
                                    onClick={handleClearItems}
                                    disabled={list.length === 0}
                                    style={{ cursor: 'pointer' }}
                                >
                                    Clear List
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={list.length === 0}
                                    style={{
                                        marginLeft: '16px',
                                        cursor: 'pointer',
                                        float: 'right'
                                    }}
                                >
                                    Submit
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Displays the second page - with employment change visualization */}
            {ranked && (() => {
                const chartOccupation = selectedItem || ranked[0];
                const chartRanking = chartOccupation ? getRanking(chartOccupation.name) : null;
                const chartAnnotations = ranked.map((item) => ({
                    name: item.name,
                    ranking: getRanking(item.name),
                }));

                return (
                    <>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '15px',
                            marginBottom: '30px'
                        }}>
                            <div style={{
                                backgroundColor: 'white',
                                padding: '15px',
                                borderRadius: '8px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                            }}>
                                <p style={{
                                    textAlign: 'center',
                                    marginBottom: '10px',
                                    color: 'black'
                                }}>
                                    Here are the occupations you selected and their AI exposure categories.
                                </p>

                                {chartOccupation && Number.isFinite(chartRanking) && (
                                    <EmploymentChangeChart
                                        occupationName={chartOccupation.name}
                                        ranking={chartRanking}
                                        employmentChangeByQuintile={employmentChangeByQuintile}
                                        annotations={chartAnnotations}
                                        selectedOccupationName={chartOccupation.name}
                                        occupationDescriptor="top-choice"
                                        showExposureGuide={true}
                                    />
                                )}

                                {/* List of occupations with click-to-expand details */}
                                <p style={{ marginTop: '20px', marginBottom: '15px', color: 'black', fontWeight: '500' }}>
                                    Click on an occupation below for more details. Scroll down to view the detailed information.
                                </p>
                                <div>
                                    {ranked.map((item, index) => {
                                        const ranking = getRanking(item.name);
                                        const quintile = getExposureQuintile(ranking);
                                        const quintileMeta = QUINTILE_META[quintile];
                                        const quintileEmploymentChange = employmentChangeByQuintile?.[quintile];
                                        return (
                                            <div key={item.name} style={{ marginBottom: '10px' }}>
                                                <button
                                                    onClick={() => handleItemClickDetailed(item)}
                                                    style={{
                                                        backgroundColor: getButtonColor(ranking),
                                                        border: '1px solid #ccc',
                                                        borderRadius: '6px',
                                                        padding: '12px 16px',
                                                        cursor: 'pointer',
                                                        color: '#222',
                                                        fontWeight: 'bold',
                                                        fontSize: '0.95rem',
                                                        width: '100%',
                                                        textAlign: 'left',
                                                        transition: 'background 0.2s',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center'
                                                    }}
                                                >
                                                    <span>
                                                        {index + 1}. {item.name}
                                                    </span>
                                                    <span style={getExposureBadgeStyle(ranking)}>
                                                        {quintileMeta.title} exposure
                                                    </span>
                                                </button>

                                                {/* Expanded details section */}
                                                {selectedItem?.name === item.name && (
                                                    <div style={{
                                                        marginTop: '10px',
                                                        padding: '15px',
                                                        backgroundColor: '#f0f9ff',
                                                        borderRadius: '6px',
                                                        border: '1px solid #bfdbfe'
                                                    }}>
                                                        <h4 style={{ marginBottom: '10px', fontWeight: 'bold', color: '#1e40af' }}>
                                                            Detailed Information
                                                        </h4>

                                                        {(() => {
                                                            const selectedQuintile = getExposureQuintile(ranking);
                                                            const selectedMeta = QUINTILE_META[selectedQuintile];
                                                            const selectedChange = employmentChangeByQuintile?.[selectedQuintile];
                                                            const quintileExplanation =
                                                                selectedMeta.textLabel === 'very high' ? 'This means most of the tasks in this occupation can be done or helped by AI.'
                                                                : selectedMeta.textLabel === 'high' ? 'This means many of the tasks in this occupation can be done or helped by AI.'
                                                                : selectedMeta.textLabel === 'moderate' ? 'This means some of the tasks in this occupation can be done or helped by AI.'
                                                                : 'This means very few of the tasks in this occupation can currently be done by AI.';
                                                            const direction = selectedChange >= 0 ? 'growth' : 'decline';
                                                            const workers = Math.round(Math.abs(selectedChange));
                                                            const workersText = selectedChange >= 0
                                                                ? `That means roughly ${workers} jobs were added for every 100 workers.`
                                                                : `That means roughly ${workers} out of every 100 workers in this group lost their jobs.`;

                                                            return (
                                                                <>
                                                                    <p style={{ marginBottom: '4px', lineHeight: '1.5', color: 'black' }}>
                                                                        The <strong>{selectedItem.name}</strong> occupation has{' '}
                                                                        <strong style={{ color: getEmploymentColor(selectedChange) }}>
                                                                            {selectedMeta.textLabel}
                                                                        </strong> AI exposure.{' '}
                                                                        {quintileExplanation}
                                                                    </p>
                                                                    {Number.isFinite(selectedChange) && (
                                                                        <p style={{ marginBottom: '4px', lineHeight: '1.5', color: 'black' }}>
                                                                            Occupations with {selectedMeta.textLabel} AI exposure have experienced{' '}
                                                                            <strong style={{ color: getEmploymentColor(selectedChange) }}>
                                                                                {formatAbsPercent(selectedChange)}
                                                                            </strong>{' '}
                                                                            {direction} in employment since the release of ChatGPT in November 2022.
                                                                        </p>
                                                                    )}
                                                                    {Number.isFinite(selectedChange) && (
                                                                        <p style={{ marginBottom: '10px', lineHeight: '1.5', color: '#334155' }}>
                                                                            {workersText}
                                                                        </p>
                                                                    )}
                                                                </>
                                                            );
                                                        })()}

                                                        {(() => {
                                                            const relatedOccs = [selectedItem.related_soc_code_1, selectedItem.related_soc_code_2, selectedItem.related_soc_code_3]
                                                                .filter(Boolean)
                                                                .map(code => socCodeMap[code])
                                                                .filter(Boolean);
                                                            return relatedOccs.length > 0 ? (
                                                                <>
                                                                    <p style={{ lineHeight: '1.5', color: 'black', marginTop: '15px' }}>
                                                                        <strong>Occupations similar to {selectedItem.name} are shown below.</strong>
                                                                    </p>
                                                                    <ol style={{ paddingLeft: '20px', marginBottom: '15px', lineHeight: '1.8', color: 'black' }}>
                                                                        {relatedOccs.map(occ => {
                                                                            const similarQuintile = getExposureQuintile(occ.ranking);
                                                                            const similarMeta = QUINTILE_META[similarQuintile];
                                                                            return (
                                                                                <li key={occ.soc_code}>
                                                                                    <strong>{occ.name}</strong>:{' '}
                                                                                    <span style={getExposureBadgeStyle(occ.ranking)}>
                                                                                        {similarMeta.title} exposure
                                                                                    </span>
                                                                                </li>
                                                                            );
                                                                        })}
                                                                    </ol>
                                                                </>
                                                            ) : null;
                                                        })()}

                                                        {(() => {
                                                            const relatedOccs = [selectedItem.related_soc_code_1, selectedItem.related_soc_code_2, selectedItem.related_soc_code_3]
                                                                .filter(Boolean)
                                                                .map(code => socCodeMap[code])
                                                                .filter(Boolean);
                                                            const allOccs = [selectedItem, ...relatedOccs];
                                                            return (
                                                                <>
                                                                    <p style={{ lineHeight: '1.5', color: 'black', marginTop: '15px' }}>
                                                                        <strong>Relevant areas of study</strong>
                                                                    </p>
                                                                    <ul style={{ paddingLeft: '20px', marginBottom: '10px', lineHeight: '1.8', color: 'black' }}>
                                                                        {allOccs.map(occ => {
                                                                            const edu = formatEducation(occ.educationcode);
                                                                            const degFields = [occ.degfield_1, occ.degfield_2, occ.degfield_3]
                                                                                .filter(Boolean)
                                                                                .map(capitalizeField);
                                                                            return (
                                                                                <li key={occ.soc_code || occ.name}>
                                                                                    {occ.name}: {edu.hasBachelors
                                                                                        ? 'The majority of workers in this occupation hold at least a college (bachelor\'s) degree.'
                                                                                        : 'The majority of workers in this occupation have less than a college (bachelor\'s) degree.'}
                                                                                    {edu.hasBachelors && degFields.length > 0 && (
                                                                                        <> Workers typically study <strong>{listFormatter.format(degFields)}</strong>.</>
                                                                                    )}
                                                                                </li>
                                                                            );
                                                                        })}
                                                                    </ul>
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </>
                );
            })()}

            {/* Displays the third page - Top 3 most and least exposed */}
            {/* TEMPORARILY DISABLED - to re-enable, remove "false &&" below and in navigation buttons */}
            {false && showTop && (
                <>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                        marginBottom: '30px'
                    }}>
                        <p style={{
                            textAlign: 'center',
                            marginBottom: '20px',
                            color: 'black',
                            fontSize: '1.1rem'
                        }}>Of all occupations, including occupations you did not select...</p>

                        {/* TieredSteps visualization for top 3 most and least exposed */}
                        {topOccupations.mostExposed.length > 0 && topOccupations.leastExposed.length > 0 && (
                            <div style={{
                                marginBottom: '30px',
                                padding: '20px',
                                backgroundColor: '#f8fafc',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0'
                            }}>
                                <TieredSteps
                                    occupations={[...topOccupations.mostExposed, ...topOccupations.leastExposed]}
                                    getRankingFn={getRanking}
                                    onOccupationClick={handleItemClickDetailed}
                                    selectedItem={selectedItem}
                                />
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                            {/* Most exposed column */}
                            <div>
                                <p style={{ marginBottom: '15px', color: 'black', fontWeight: '500' }}>
                                    Top 3 occupations with <strong style={{ color: '#dc2626' }}>highest</strong> AI exposure:
                                </p>
                                <div>
                                    {topOccupations.mostExposed.map((occ, idx) => {
                                        const ranking = occ.ranking;
                                        const exposure = getExposureLevel(ranking);
                                        return (
                                            <div key={occ.name} style={{ marginBottom: '12px' }}>
                                                <button
                                                    onClick={() => handleItemClickDetailed(occ)}
                                                    style={{
                                                        backgroundColor: getButtonColor(ranking),
                                                        border: '1px solid #ccc',
                                                        borderRadius: '6px',
                                                        padding: '10px 16px',
                                                        cursor: 'pointer',
                                                        color: '#222',
                                                        fontWeight: 'bold',
                                                        fontSize: '0.95rem',
                                                        width: '100%',
                                                        textAlign: 'left',
                                                        transition: 'background 0.2s, color 0.2s'
                                                    }}
                                                >
                                                    {idx + 1}. {occ.name}:{' '}
                                                    <span style={{ color: exposure.color }}>{exposure.level}</span>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Least exposed column */}
                            <div>
                                <p style={{ marginBottom: '15px', color: 'black', fontWeight: '500' }}>
                                    Top 3 occupations with <strong style={{ color: '#16a34a' }}>lowest</strong> AI exposure:
                                </p>
                                <div>
                                    {topOccupations.leastExposed.map((occ, idx) => {
                                        const ranking = occ.ranking;
                                        const exposure = getExposureLevel(ranking);
                                        return (
                                            <div key={occ.name} style={{ marginBottom: '12px' }}>
                                                <button
                                                    onClick={() => handleItemClickDetailed(occ)}
                                                    style={{
                                                        backgroundColor: getButtonColor(ranking),
                                                        border: '1px solid #ccc',
                                                        borderRadius: '6px',
                                                        padding: '10px 16px',
                                                        cursor: 'pointer',
                                                        color: '#222',
                                                        fontWeight: 'bold',
                                                        fontSize: '0.95rem',
                                                        width: '100%',
                                                        textAlign: 'left',
                                                        transition: 'background 0.2s, color 0.2s'
                                                    }}
                                                >
                                                    {idx + 1}. {occ.name}:{' '}
                                                    <span style={{ color: exposure.color }}>{exposure.level}</span>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Detail view for third page */}
                    {selectedItem && (
                        <div style={{
                            backgroundColor: 'white',
                            padding: '20px',
                            borderRadius: '10px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            marginBottom: '20px'
                        }}>
                            <div style={{
                                padding: '15px',
                                backgroundColor: '#f0f9ff',
                                borderRadius: '6px',
                                border: '1px solid #bfdbfe'
                            }}>
                                <h4 style={{ marginBottom: '10px', fontWeight: 'bold', color: '#1e40af' }}>
                                    Detailed Information
                                </h4>
                                {(() => {
                                    const ranking = getRanking(selectedItem.name);
                                    const selectedQuintile = getExposureQuintile(ranking);
                                    const selectedMeta = QUINTILE_META[selectedQuintile];
                                    const selectedChange = employmentChangeByQuintile?.[selectedQuintile];
                                    const quintileExplanation =
                                        selectedMeta.textLabel === 'very high' ? 'This means most of the tasks in this occupation can be done or helped by AI.'
                                        : selectedMeta.textLabel === 'high' ? 'This means many of the tasks in this occupation can be done or helped by AI.'
                                        : selectedMeta.textLabel === 'moderate' ? 'This means some of the tasks in this occupation can be done or helped by AI.'
                                        : 'This means very few of the tasks in this occupation can currently be done by AI.';
                                    const direction = selectedChange >= 0 ? 'growth' : 'decline';
                                    const workers = Math.round(Math.abs(selectedChange));
                                    const workersText = selectedChange >= 0
                                        ? `That means roughly ${workers} jobs were added for every 100 workers.`
                                        : `That means roughly ${workers} out of every 100 workers in this group lost their jobs.`;
                                    return (
                                        <>
                                            <p style={{ marginBottom: '4px', lineHeight: '1.5', color: 'black' }}>
                                                The <strong>{selectedItem.name}</strong> occupation has{' '}
                                                <strong style={{ color: getEmploymentColor(selectedChange) }}>{selectedMeta.textLabel}</strong> AI exposure.{' '}
                                                {quintileExplanation}
                                            </p>
                                            {Number.isFinite(selectedChange) && (
                                                <p style={{ marginBottom: '4px', lineHeight: '1.5', color: 'black' }}>
                                                    Occupations with {selectedMeta.textLabel} AI exposure have experienced{' '}
                                                    <strong style={{ color: getEmploymentColor(selectedChange) }}>
                                                        {formatAbsPercent(selectedChange)}
                                                    </strong>{' '}
                                                    {direction} in employment since the release of ChatGPT in November 2022.
                                                </p>
                                            )}
                                            {Number.isFinite(selectedChange) && (
                                                <p style={{ marginBottom: '10px', lineHeight: '1.5', color: '#334155' }}>
                                                    {workersText}
                                                </p>
                                            )}

                                            {(() => {
                                                const relatedOccs = [selectedItem.related_soc_code_1, selectedItem.related_soc_code_2, selectedItem.related_soc_code_3]
                                                    .filter(Boolean)
                                                    .map(code => socCodeMap[code])
                                                    .filter(Boolean);
                                                return relatedOccs.length > 0 ? (
                                                    <>
                                                        <p style={{ lineHeight: '1.5', color: 'black', marginTop: '15px' }}>
                                                            <strong>Occupations similar to {selectedItem.name} are shown below.</strong>
                                                        </p>
                                                        <ol style={{ paddingLeft: '20px', marginBottom: '15px', lineHeight: '1.8', color: 'black' }}>
                                                            {relatedOccs.map(occ => {
                                                                const similarQuintile = getExposureQuintile(occ.ranking);
                                                                const similarMeta = QUINTILE_META[similarQuintile];
                                                                return (
                                                                    <li key={occ.soc_code}>
                                                                        <strong>{occ.name}</strong>:{' '}
                                                                        <span style={getExposureBadgeStyle(occ.ranking)}>
                                                                            {similarMeta.title} exposure
                                                                        </span>
                                                                    </li>
                                                                );
                                                            })}
                                                        </ol>
                                                    </>
                                                ) : null;
                                            })()}

                                            {(() => {
                                                const relatedOccs = [selectedItem.related_soc_code_1, selectedItem.related_soc_code_2, selectedItem.related_soc_code_3]
                                                    .filter(Boolean)
                                                    .map(code => socCodeMap[code])
                                                    .filter(Boolean);
                                                const allOccs = [selectedItem, ...relatedOccs];
                                                return (
                                                    <>
                                                        <p style={{ lineHeight: '1.5', color: 'black', marginTop: '15px' }}>
                                                            <strong>Relevant areas of study</strong>
                                                        </p>
                                                        <ul style={{ paddingLeft: '20px', marginBottom: '10px', lineHeight: '1.8', color: 'black' }}>
                                                            {allOccs.map(occ => {
                                                                const edu = formatEducation(occ.educationcode);
                                                                const degFields = [occ.degfield_1, occ.degfield_2, occ.degfield_3]
                                                                    .filter(Boolean)
                                                                    .map(capitalizeField);
                                                                return (
                                                                    <li key={occ.soc_code || occ.name}>
                                                                        {occ.name}: {edu.hasBachelors
                                                                                    ? 'The majority of workers in this occupation hold at least a college (bachelor\'s) degree.'
                                                                                    : 'The majority of workers in this occupation have less than a college (bachelor\'s) degree.'}
                                                                        {edu.hasBachelors && degFields.length > 0 && (
                                                                            <> Workers typically study <strong>{listFormatter.format(degFields)}</strong>.</>
                                                                        )}
                                                                    </li>
                                                                );
                                                            })}
                                                        </ul>
                                                    </>
                                                );
                                            })()}
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Transition screen before page 4 */}
            {showTransition && !showSearch && !ranked && !showTop && !showEnd && (
                <div style={{
                    backgroundColor: 'white',
                    padding: '30px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    marginBottom: '30px',
                    textAlign: 'center'
                }}>
                    <p style={{
                        fontSize: '1.1rem',
                        lineHeight: '1.6',
                        color: '#334155',
                        marginBottom: '24px'
                    }}>
                        Next, you will be able to explore and learn more about any occupation you are interested in. This can include occupations that are not among the top 6 you previously listed.
                    </p>
                    <button
                        onClick={handleTransitionContinue}
                        style={{
                            cursor: 'pointer',
                            padding: '10px 24px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            backgroundColor: '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px'
                        }}
                    >
                        Continue
                    </button>
                </div>
            )}

            {/* Displays the fourth page */}
            {!showTransition && !showTop && !ranked && !showSearch && !showEnd && (
                <>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '15px',
                        marginBottom: '30px'
                    }}>
                        <div style={{
                            backgroundColor: 'white',
                            padding: '15px',
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}>
                            <p>You can search for specific occupations by name, or use filters to narrow the list by AI exposure level, field of study, education level, or occupation group.</p>
                        </div>
                    </div>

                    {/* Search Section */}
                    <div style={{
                        backgroundColor: 'white',
                        padding: '15px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                        marginBottom: '30px'
                    }}>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '500',
                            marginBottom: '10px',
                            color: 'black'
                        }}>
                            Please click on an occupation to view more information about it.
                        </label>

                        {/* Exposure-level filter buttons */}
                        <div style={{
                            display: 'flex',
                            gap: '8px',
                            marginBottom: '10px',
                            flexWrap: 'wrap'
                        }}>
                            {[
                                { level: 'Very High', color: '#dc2626' },
                                { level: 'High', color: '#f97316' },
                                { level: 'Moderate', color: '#eab308' },
                                { level: 'Lowest', color: '#16a34a' }
                            ].map(({ level, color }) => {
                                const isActive = exposureFilters.has(level);
                                return (
                                    <button
                                        key={level}
                                        onClick={() => handleFilterToggle(level)}
                                        style={{
                                            padding: '5px 12px',
                                            borderRadius: '16px',
                                            border: `2px solid ${color}`,
                                            backgroundColor: isActive ? color : 'white',
                                            color: isActive ? 'white' : color,
                                            fontWeight: '600',
                                            fontSize: '12px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        {level}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Additional filters row */}
                        <div style={{
                            display: 'flex',
                            gap: '12px',
                            marginBottom: '10px',
                            flexWrap: 'wrap',
                            alignItems: 'center'
                        }}>
                            {/* Field of study dropdown */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}>
                                    Field of study:
                                </label>
                                <select
                                    value={fieldOfStudyFilter}
                                    onChange={(e) => setFieldOfStudyFilter(e.target.value)}
                                    style={{
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        border: '1px solid #d1d5db',
                                        fontSize: '12px',
                                        color: '#334155',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="">All fields</option>
                                    {allDegreeFields.map(f => (
                                        <option key={f} value={f.toLowerCase()}>{f}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Education filter */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}>
                                    Typical education:
                                </label>
                                <select
                                    value={educationFilter}
                                    onChange={(e) => setEducationFilter(e.target.value)}
                                    style={{
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        border: '1px solid #d1d5db',
                                        fontSize: '12px',
                                        color: '#334155',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="">All education levels</option>
                                    <option value="college">College degree (bachelor's or higher)</option>
                                    <option value="nocollege">Less than a bachelor's degree</option>
                                </select>
                            </div>

                            {/* Occupation group dropdown */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}>
                                    Occupation group:
                                </label>
                                <select
                                    value={occGroupFilter}
                                    onChange={(e) => setOccGroupFilter(e.target.value)}
                                    style={{
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        border: '1px solid #d1d5db',
                                        fontSize: '12px',
                                        color: '#334155',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="">All groups</option>
                                    {mockData.occupations.map(o => (
                                        <option key={o.two_digit_soc_code} value={String(o.two_digit_soc_code)}>
                                            {o.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                placeholder='Search for occupations'
                                onChange={handleSearchInputChange}
                                style={{
                                    width: '100%',
                                    padding: '10px 10px 10px 35px',
                                    borderRadius: '6px',
                                    border: '1px solid #d1d5db',
                                    outline: 'none',
                                    fontSize: '14px',
                                    boxSizing: 'border-box'
                                }}
                            />
                            <div style={{
                                position: 'absolute',
                                left: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#9ca3af'
                            }}>
                                🔍
                            </div>
                        </div>
                        <div
                            onScroll={handleSearchListScroll}
                            style={{
                                height: '250px',
                                overflowY: 'scroll'
                            }}
                        >
                            {data.map((item, index) => {
                                const term = searchTerm?.toLowerCase() || '';
                                const nameMatches = item.name.toLowerCase().includes(term);
                                const matchingAlt = !nameMatches && term && item.alt_titles
                                    ? item.alt_titles.find(alt => alt.toLowerCase().includes(term))
                                    : null;
                                return (
                                <div
                                    key={index}
                                    onClick={() => handleItemClickEnd(item)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '8px',
                                        borderRadius: '6px',
                                        border: '2px solid transparent',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        backgroundColor: 'transparent'
                                    }}
                                >
                                    <span>
                                        {item.name}
                                        {matchingAlt && (
                                            <span style={{ color: '#6b7280', fontSize: '0.85em', marginLeft: '6px' }}>
                                                (also known as: {matchingAlt})
                                            </span>
                                        )}
                                    </span>
                                </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Detail view for fourth page */}
                    {selectedItemEnd && (() => {
                        const ranking = getRanking(selectedItemEnd.name);
                        const selectedQuintile = getExposureQuintile(ranking);
                        const selectedMeta = QUINTILE_META[selectedQuintile];
                        const selectedChange = employmentChangeByQuintile?.[selectedQuintile];

                        return (
                            <div style={{
                                backgroundColor: 'white',
                                padding: '20px',
                                borderRadius: '10px',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                marginBottom: '20px'
                            }}>
                                <EmploymentChangeChart
                                    occupationName={selectedItemEnd.name}
                                    ranking={ranking}
                                    employmentChangeByQuintile={employmentChangeByQuintile}
                                    annotations={[{ name: selectedItemEnd.name, ranking }]}
                                    selectedOccupationName={selectedItemEnd.name}
                                    occupationDescriptor="selected"
                                    showExposureGuide={false}
                                />
                                <div style={{
                                    marginTop: '20px',
                                    padding: '15px',
                                    backgroundColor: '#f0f9ff',
                                    borderRadius: '6px',
                                    border: '1px solid #bfdbfe'
                                }}>
                                    <h4 style={{ marginBottom: '10px', fontWeight: 'bold', color: '#1e40af' }}>
                                        Detailed Information
                                    </h4>
                                    {(() => {
                                        const quintileExplanation =
                                            selectedMeta.textLabel === 'very high' ? 'This means most of the tasks in this occupation can be done or helped by AI.'
                                            : selectedMeta.textLabel === 'high' ? 'This means many of the tasks in this occupation can be done or helped by AI.'
                                            : selectedMeta.textLabel === 'moderate' ? 'This means some of the tasks in this occupation can be done or helped by AI.'
                                            : 'This means very few of the tasks in this occupation can currently be done by AI.';
                                        const direction = selectedChange >= 0 ? 'growth' : 'decline';
                                        const workers = Math.round(Math.abs(selectedChange));
                                        const workersText = selectedChange >= 0
                                            ? `That means roughly ${workers} jobs were added for every 100 workers.`
                                            : `That means roughly ${workers} out of every 100 workers in this group lost their jobs.`;
                                        return (
                                            <>
                                                <p style={{ marginBottom: '4px', lineHeight: '1.5', color: 'black' }}>
                                                    The <strong>{selectedItemEnd.name}</strong> occupation has{' '}
                                                    <strong style={{ color: getEmploymentColor(selectedChange) }}>{selectedMeta.textLabel}</strong> AI exposure.{' '}
                                                    {quintileExplanation}
                                                </p>
                                                {Number.isFinite(selectedChange) && (
                                                    <p style={{ marginBottom: '4px', lineHeight: '1.5', color: 'black' }}>
                                                        Occupations with {selectedMeta.textLabel} AI exposure have experienced{' '}
                                                        <strong style={{ color: getEmploymentColor(selectedChange) }}>
                                                            {formatAbsPercent(selectedChange)}
                                                        </strong>{' '}
                                                        {direction} in employment since the release of ChatGPT in November 2022.
                                                    </p>
                                                )}
                                                {Number.isFinite(selectedChange) && (
                                                    <p style={{ marginBottom: '10px', lineHeight: '1.5', color: '#334155' }}>
                                                        {workersText}
                                                    </p>
                                                )}

                                                {(() => {
                                                    const relatedOccs = [selectedItemEnd.related_soc_code_1, selectedItemEnd.related_soc_code_2, selectedItemEnd.related_soc_code_3]
                                                        .filter(Boolean)
                                                        .map(code => socCodeMap[code])
                                                        .filter(Boolean);
                                                    return relatedOccs.length > 0 ? (
                                                        <>
                                                            <p style={{ lineHeight: '1.5', color: 'black', marginTop: '15px' }}>
                                                                <strong>Occupations similar to {selectedItemEnd.name} are shown below.</strong>
                                                            </p>
                                                            <ol style={{ paddingLeft: '20px', marginBottom: '15px', lineHeight: '1.8', color: 'black' }}>
                                                                {relatedOccs.map(occ => {
                                                                    const similarQuintile = getExposureQuintile(occ.ranking);
                                                                    const similarMeta = QUINTILE_META[similarQuintile];
                                                                    return (
                                                                        <li key={occ.soc_code}>
                                                                            <strong>{occ.name}</strong>:{' '}
                                                                            <span style={getExposureBadgeStyle(occ.ranking)}>
                                                                                {similarMeta.title} exposure
                                                                            </span>
                                                                        </li>
                                                                    );
                                                                })}
                                                            </ol>
                                                        </>
                                                    ) : null;
                                                })()}

                                                {(() => {
                                                    const relatedOccs = [selectedItemEnd.related_soc_code_1, selectedItemEnd.related_soc_code_2, selectedItemEnd.related_soc_code_3]
                                                        .filter(Boolean)
                                                        .map(code => socCodeMap[code])
                                                        .filter(Boolean);
                                                    const allOccs = [selectedItemEnd, ...relatedOccs];
                                                    return (
                                                        <>
                                                            <p style={{ lineHeight: '1.5', color: 'black', marginTop: '15px' }}>
                                                                <strong>Relevant areas of study</strong>
                                                            </p>
                                                            <ul style={{ paddingLeft: '20px', marginBottom: '10px', lineHeight: '1.8', color: 'black' }}>
                                                                {allOccs.map(occ => {
                                                                    const edu = formatEducation(occ.educationcode);
                                                                    const degFields = [occ.degfield_1, occ.degfield_2, occ.degfield_3]
                                                                        .filter(Boolean)
                                                                        .map(capitalizeField);
                                                                    return (
                                                                        <li key={occ.soc_code || occ.name}>
                                                                            {occ.name}: {edu.hasBachelors
                                                                                        ? 'The majority of workers in this occupation hold at least a college (bachelor\'s) degree.'
                                                                                        : 'The majority of workers in this occupation have less than a college (bachelor\'s) degree.'}
                                                                            {edu.hasBachelors && degFields.length > 0 && (
                                                                                <> Workers typically study <strong>{listFormatter.format(degFields)}</strong>.</>
                                                                            )}
                                                                        </li>
                                                                    );
                                                                })}
                                                            </ul>
                                                        </>
                                                    );
                                                })()}
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        );
                    })()}
                </>
            )}

            {/* Shows the final page */}
            {!showTop && !ranked && !showSearch && showEnd && (
                <>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: '300px',
                    }}>
                        <div style={{
                            backgroundColor: 'white',
                            padding: '30px 40px',
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                            maxWidth: '600px',
                            textAlign: 'center'
                        }}>
                            <p style={{ fontSize: '16px', lineHeight: '1.6' }}>Thank you for completing this portion of the survey. Please click the <strong>&rarr;</strong> button at the bottom right of the page to continue the survey. You may need to scroll down to see it.</p>
                        </div>
                    </div>
                </>
            )}

            {/* Displays a next button */}
            {ranked && (
                <div style={{ paddingBottom: '20px' }}>
                    <button
                        onClick={() => handleNext(1, false)}
                        style={{
                            cursor: 'pointer',
                            float: 'right',
                            marginBottom: '10px'
                        }}
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Displays back and next buttons */}
            {/* TEMPORARILY DISABLED */}
            {false && showTop && (
                <div style={{ paddingBottom: '20px' }}>
                    <div>
                        <button
                            onClick={() => handleBack(2, false, true)}
                            style={{
                                cursor: 'pointer',
                                float: 'left'
                            }}
                        >
                            Back
                        </button>
                    </div>
                    <div>
                        <button
                            onClick={() => handleNext(2, false)}
                            style={{
                                cursor: 'pointer',
                                float: 'right'
                            }}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Displays back and end buttons */}
            {!showTransition && !showTop && !ranked && !showSearch && !showEnd && (
                <div style={{ paddingBottom: '20px' }}>
                    <div>
                        <button
                            onClick={() => handleBack(3, false, true)}
                            style={{
                                cursor: 'pointer',
                                float: 'left'
                            }}
                        >
                            Back
                        </button>
                    </div>
                    <button
                        onClick={handleEnd}
                        style={{
                            cursor: 'pointer',
                            float: 'right'
                        }}
                    >
                        End
                    </button>
                </div>
            )}
        </div>
    );
}

export default AIExposureVisualization;
