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

import React, { useState, useEffect } from 'react';

// CSV URL - update this when you change the GitHub location
const CSV_URL = process.env.PUBLIC_URL + '/occupations.csv';
  
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
        { label: '61-80', displayLabel: 'Low', range: [61, 80], color: '#22c55e' },        // Green
        { label: '81-100', displayLabel: 'Very Low', range: [81, 100], color: '#16a34a' }, // Dark Green
    ];

    // Determine which tier (0-4) based on ranking (1-100)
    const getTierIndex = (rank) => {
        if (rank <= 20) return 0;
        if (rank <= 40) return 1;
        if (rank <= 60) return 2;
        if (rank <= 80) return 3;
        return 4;
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
    // Each occupation box is ~20px tall (with padding and gap)
    const dynamicPaddingTop = Math.max(20, maxOccupationsInTier * 40);

    return (
        <div style={{ textAlign: 'center', marginBottom: '24px', width: '100%' }}>
            <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                gap: '16px',
                marginBottom: '16px',
                paddingTop: `${dynamicPaddingTop}px`,
                minHeight: `${dynamicPaddingTop + 180}px`
            }}>
                {tiers.map((tier, index) => {
                    const occupationsInTier = occupationsByTier[index] || [];
                    const hasOccupations = occupationsInTier.length > 0;
                    const height = 160 - index * 20; // Descending heights

                    return (
                        <div key={tier.label} style={{ position: 'relative' }}>
                            {/* Individual arrows for each occupation in this tier */}
                            {hasOccupations && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: `${height + 12}px`,
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
                                                {/* Arrow pointing down (only on last item) */}
                                                {i === occupationsInTier.length - 1 && (
                                                    <div style={{
                                                        width: 0,
                                                        height: 0,
                                                        borderLeft: '8px solid transparent',
                                                        borderRight: '8px solid transparent',
                                                        borderTop: `10px solid ${tier.color}`
                                                    }} />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            {/* The tier bar */}
                            <div style={{
                                width: '100px',
                                height: `${height}px`,
                                backgroundColor: hasOccupations ? tier.color : `${tier.color}15`,
                                border: `3px solid ${tier.color}`,
                                borderRadius: '12px 12px 0 0',
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

// Single occupation TieredSteps (for the fourth page)
function SingleTieredSteps({ ranking, occupation }) {
    // 5 tiers with red-yellow-green color scale (no blue)
    const tiers = [
        { label: '1-20', displayLabel: 'Very High', color: '#dc2626' },    // Red
        { label: '21-40', displayLabel: 'High', color: '#f97316' },        // Orange
        { label: '41-60', displayLabel: 'Moderate', color: '#eab308' },    // Yellow
        { label: '61-80', displayLabel: 'Low', color: '#22c55e' },         // Green
        { label: '81-100', displayLabel: 'Very Low', color: '#16a34a' },   // Dark Green
    ];

    const getTierIndex = (rank) => {
        if (rank <= 20) return 0;
        if (rank <= 40) return 1;
        if (rank <= 60) return 2;
        if (rank <= 80) return 3;
        return 4;
    };
    const activeTier = getTierIndex(ranking);

    return (
        <div style={{ textAlign: 'center', marginBottom: '24px', width: '100%' }}>
            <div style={{ marginBottom: '16px', color: '#334155', fontSize: '18px' }}>
                <strong>{occupation}</strong>
            </div>

            <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                gap: '12px',
                marginBottom: '16px',
                paddingTop: '80px'
            }}>
                {tiers.map((tier, index) => {
                    const isActive = index === activeTier;
                    const height = 160 - index * 20;

                    return (
                        <div key={tier.label} style={{ position: 'relative' }}>
                            {isActive && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: `${height + 12}px`,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0px'
                                }}>
                                    <div style={{
                                        backgroundColor: tier.color,
                                        color: '#fff',
                                        padding: '8px 14px',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        whiteSpace: 'normal',
                                        maxWidth: '160px',
                                        lineHeight: '1.3',
                                        textAlign: 'center',
                                        boxShadow: '0 3px 10px rgba(0,0,0,0.2)'
                                    }}>
                                        {occupation}
                                    </div>
                                    <div style={{
                                        width: 0,
                                        height: 0,
                                        borderLeft: '10px solid transparent',
                                        borderRight: '10px solid transparent',
                                        borderTop: `12px solid ${tier.color}`
                                    }} />
                                </div>
                            )}
                            <div style={{
                                width: '100px',
                                height: `${height}px`,
                                backgroundColor: isActive ? tier.color : `${tier.color}15`,
                                border: `3px solid ${tier.color}`,
                                borderRadius: '12px 12px 0 0',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'background-color 0.3s'
                            }}>
                                <span style={{
                                    fontSize: '14px',
                                    fontWeight: '700',
                                    color: isActive ? '#fff' : tier.color,
                                }}>
                                    {tier.displayLabel}
                                </span>
                                <span style={{
                                    fontSize: '11px',
                                    fontWeight: '500',
                                    color: isActive ? 'rgba(255,255,255,0.8)' : tier.color,
                                    marginTop: '2px'
                                }}>
                                    {tier.label}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                maxWidth: '420px',
                margin: '0 auto',
                fontSize: '10px',
                color: '#64748b'
            }}>
                <span>← Most Exposed</span>
                <span>Least Exposed →</span>
            </div>
        </div>
    );
}

// Helper function to get exposure level description based on ranking
function getExposureLevel(ranking) {
    if (ranking <= 20) return { level: 'Very High', color: '#dc2626' };  // Red
    if (ranking <= 40) return { level: 'High', color: '#f97316' };       // Orange
    if (ranking <= 60) return { level: 'Moderate', color: '#eab308' };   // Yellow
    if (ranking <= 80) return { level: 'Low', color: '#22c55e' };        // Green
    return { level: 'Very Low', color: '#16a34a' };                      // Dark Green
}

// Helper function to get button background color based on ranking
function getButtonColor(ranking) {
    if (ranking <= 20) return '#fee2e2'; // Light red for very high exposure
    if (ranking <= 40) return '#ffedd5'; // Light orange for high exposure
    if (ranking <= 60) return '#fef9c3'; // Light yellow for moderate exposure
    if (ranking <= 80) return '#dcfce7'; // Light green for low exposure
    return '#bbf7d0'; // Lighter green for very low exposure
}

// Main function that creates the visualization
function AIExposureVisualization() {
    // State for CSV data (ranking lookup and occupation list)
    const [rankingData, setRankingData] = useState({});
    const [occupationList, setOccupationList] = useState([]);
    const [csvLoading, setCsvLoading] = useState(true);
    const [csvError, setCsvError] = useState(null);

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

    // Get correct listing of elements. Ex. X, Y, and Z
    const listFormatter = new Intl.ListFormat('en-US', { style: 'long', type: 'conjunction' });

    // Fetch CSV data on component mount
    useEffect(() => {
        async function fetchCSV() {
            try {
                const response = await fetch(CSV_URL);
                if (!response.ok) throw new Error('Failed to fetch CSV');
                const text = await response.text();

                // Parse CSV
                const lines = text.trim().split('\n');
                const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

                const rankingIndex = headers.indexOf('ranking');
                const occupationIndex = headers.indexOf('occupation');

                if (rankingIndex === -1 || occupationIndex === -1) {
                    throw new Error('CSV must have "ranking" and "occupation" columns');
                }

                const data = {};
                const occList = [];
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
                    if (occupation && !isNaN(ranking)) {
                        data[occupation.toLowerCase()] = ranking;
                        occList.push({ id: i - 1, name: occupation, ranking: ranking });
                    }
                }

                // Sort by occupation name alphabetically
                occList.sort((a, b) => a.name.localeCompare(b.name));

                setRankingData(data);
                setOccupationList(occList);
                setCsvLoading(false);
            } catch (err) {
                console.error('CSV fetch error:', err);
                setCsvError(err.message);
                setCsvLoading(false);
            }
        }

        fetchCSV();
    }, []);

    // Helper to get ranking for an occupation (fallback to 50 if not found)
    const getRanking = (occupationName) => {
        const key = occupationName.toLowerCase();
        return rankingData[key] ?? 50; // Default to middle ranking if not found
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
        return {
            totalTimeSeconds: searchScreenTotalTime,
            occupationsViewed: searchScreenOccupationsViewed,
            searchTermsUsed: searchTerms
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

    // Apply search filter
    if (searchTerm) {
        data = data.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
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
        setSelectedItemEnd(selectedItemEnd?.name === item.name ? null : item);
        setTimeSpentDetailStart(timeSpent);

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
        // Sort by ranking (most exposed first = lowest ranking number)
        const sortedList = [...list].sort((a, b) => getRanking(a.name) - getRanking(b.name));
        setRanked(sortedList);
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
    };

    // Handles user clicking back button
    const handleBack = (page_num, show_top, submit) => {
        setShowTop(show_top);
        if (submit) {
            const sortedList = [...list].sort((a, b) => getRanking(a.name) - getRanking(b.name));
            setRanked(sortedList);
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
        }
        setSelectedItemEnd(null);
        updateTimeSpentPages(3, timeSpent);
        // Start tracking time for search screen
        setSearchScreenTimeStart(Date.now());
        setTimeSpent(0);
        window.parent.postMessage("showNextButton", "*");
    };

    // Show loading state while fetching CSV
    if (csvLoading) {
        return (
            <div style={{
                maxWidth: '800px',
                margin: '0 auto',
                padding: '20px',
                textAlign: 'center'
            }}>
                <p>Loading occupation data...</p>
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
        <div style={{
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
                    Click on an occupation for detailed information.
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
                            {data.map((item, index) => (
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
                                    {item.name}
                                </div>
                            ))}
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

            {/* Displays the second page - with TieredSteps visualization */}
            {ranked && (
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
                                Here are the occupations you selected and their AI exposure levels.
                            </p>
                            <p style={{ textAlign: 'center', marginBottom: '20px', color: '#666', fontSize: '14px' }}>
                                Ranking goes from 1 (most exposed to AI) to 100 (least exposed to AI).
                            </p>

                            {/* Single TieredSteps visualization showing all occupations */}
                            <div style={{
                                marginBottom: '30px',
                                padding: '20px',
                                backgroundColor: '#f8fafc',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                overflowX: 'auto'
                            }}>
                                <TieredSteps
                                    occupations={ranked}
                                    getRankingFn={getRanking}
                                    onOccupationClick={handleItemClickDetailed}
                                    selectedItem={selectedItem}
                                />
                            </div>

                            {/* List of occupations with click-to-expand details */}
                            <p style={{ marginBottom: '15px', color: 'black', fontWeight: '500' }}>
                                Click on an occupation below for more details:
                            </p>
                            <div>
                                {ranked.map((item, index) => {
                                    const ranking = getRanking(item.name);
                                    const exposure = getExposureLevel(ranking);
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
                                                <span style={{ 
                                                    color: exposure.color, 
                                                    fontSize: '0.85rem',
                                                    fontWeight: '600'
                                                }}>
                                                    {exposure.level}
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

                                                    <p style={{ marginBottom: '10px', lineHeight: '1.5', color: 'black' }}>
                                                        Workers in <strong>{selectedItem.name}</strong> have{' '}
                                                        <strong style={{ color: exposure.color }}>
                                                            {exposure.level}
                                                        </strong> AI exposure.
                                                    </p>

                                                    {selectedItem.occupation && selectedItem.occupation.length > 0 && (
                                                        <>
                                                            <p style={{ lineHeight: '1.5', color: 'black', marginTop: '15px' }}>
                                                                <strong>Similar occupations:</strong>
                                                            </p>
                                                            <ul style={{ paddingLeft: '20px', marginBottom: '15px', lineHeight: '1.8', color: 'black' }}>
                                                                {selectedItem.occupation.map(occupation_number => {
                                                                    const similarOcc = mockData.occupations[occupation_number];
                                                                    const similarRanking = getRanking(similarOcc.name);
                                                                    const similarExposure = getExposureLevel(similarRanking);
                                                                    return (
                                                                        <li key={similarOcc.name}>
                                                                            <strong>{similarOcc.name}</strong>:{' '}
                                                                            <span style={{ color: similarExposure.color, fontWeight: '600' }}>
                                                                                {similarExposure.level}
                                                                            </span> exposure (#{similarRanking})
                                                                        </li>
                                                                    );
                                                                })}
                                                            </ul>
                                                        </>
                                                    )}

                                                    <p style={{ lineHeight: '1.5', color: 'black', marginTop: '15px' }}>
                                                        <strong>Relevant areas of study:</strong>
                                                    </p>
                                                    <ul style={{ paddingLeft: '20px', marginBottom: '10px', lineHeight: '1.8', color: 'black' }}>
                                                        <li>
                                                            <strong>{selectedItem.name}</strong>:
                                                            {selectedItem.two_digit_soc_code <= 27 ?
                                                                ' Most workers hold at least a bachelor\'s degree.' :
                                                                selectedItem.two_digit_soc_code >= 31 ?
                                                                    ' Most workers have less than a bachelor\'s degree.' :
                                                                    ' A bachelor\'s degree is common but not required.'}
                                                            {' '}Typical fields: <strong>{listFormatter.format(selectedItem.major)}</strong>.
                                                        </li>
                                                        {selectedItem.occupation && selectedItem.occupation.map(occupation_number => {
                                                            const relatedOcc = mockData.occupations[occupation_number];
                                                            return (
                                                                <li key={relatedOcc.name}>
                                                                    <strong>{relatedOcc.name}</strong>:
                                                                    {relatedOcc.two_digit_soc_code <= 27 ?
                                                                        ' Most workers hold at least a bachelor\'s degree.' :
                                                                        relatedOcc.two_digit_soc_code >= 31 ?
                                                                            ' Most workers have less than a bachelor\'s degree.' :
                                                                            ' A bachelor\'s degree is common but not required.'}
                                                                    {' '}Typical fields: <strong>{listFormatter.format(relatedOcc.major)}</strong>.
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Displays the third page - Top 3 most and least exposed */}
            {showTop && (
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
                                    const exposure = getExposureLevel(ranking);
                                    return (
                                        <>
                                            <p style={{ marginBottom: '10px', lineHeight: '1.5', color: 'black' }}>
                                                Workers in <strong>{selectedItem.name}</strong> have{' '}
                                                <strong style={{ color: exposure.color }}>{exposure.level}</strong> AI exposure.
                                            </p>

                                            {selectedItem.occupation && selectedItem.occupation.length > 0 && (
                                                <>
                                                    <p style={{ lineHeight: '1.5', color: 'black', marginTop: '15px' }}>
                                                        <strong>Similar occupations:</strong>
                                                    </p>
                                                    <ul style={{ paddingLeft: '20px', marginBottom: '15px', lineHeight: '1.8', color: 'black' }}>
                                                        {selectedItem.occupation.map(occupation_number => {
                                                            const similarOcc = mockData.occupations[occupation_number];
                                                            const similarRanking = getRanking(similarOcc.name);
                                                            const similarExposure = getExposureLevel(similarRanking);
                                                            return (
                                                                <li key={similarOcc.name}>
                                                                    <strong>{similarOcc.name}</strong>:{' '}
                                                                    <span style={{ color: similarExposure.color, fontWeight: '600' }}>
                                                                        {similarExposure.level}
                                                                    </span> exposure (#{similarRanking})
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                </>
                                            )}

                                            <p style={{ lineHeight: '1.5', color: 'black', marginTop: '15px' }}>
                                                <strong>Relevant areas of study:</strong>
                                            </p>
                                            <ul style={{ paddingLeft: '20px', marginBottom: '10px', lineHeight: '1.8', color: 'black' }}>
                                                <li>
                                                    <strong>{selectedItem.name}</strong>:
                                                    {selectedItem.two_digit_soc_code <= 27 ?
                                                        ' Most workers hold at least a bachelor\'s degree.' :
                                                        selectedItem.two_digit_soc_code >= 31 ?
                                                            ' Most workers have less than a bachelor\'s degree.' :
                                                            ' A bachelor\'s degree is common but not required.'}
                                                    {' '}Typical fields: <strong>{listFormatter.format(selectedItem.major)}</strong>.
                                                </li>
                                                {selectedItem.occupation && selectedItem.occupation.map(occupation_number => {
                                                    const relatedOcc = mockData.occupations[occupation_number];
                                                    return (
                                                        <li key={relatedOcc.name}>
                                                            <strong>{relatedOcc.name}</strong>:
                                                            {relatedOcc.two_digit_soc_code <= 27 ?
                                                                ' Most workers hold at least a bachelor\'s degree.' :
                                                                relatedOcc.two_digit_soc_code >= 31 ?
                                                                    ' Most workers have less than a bachelor\'s degree.' :
                                                                    ' A bachelor\'s degree is common but not required.'}
                                                            {' '}Typical fields: <strong>{listFormatter.format(relatedOcc.major)}</strong>.
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Displays the fourth page */}
            {!showTop && !ranked && !showSearch && !showEnd && (
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
                            <p>In the search bar below, enter occupations you would like
                                to find out more information about.
                            </p>
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
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                placeholder='Search for occupations'
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
                            {data.map((item, index) => (
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
                                    {item.name}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Detail view for fourth page */}
                    {selectedItemEnd && (
                        <div style={{
                            backgroundColor: 'white',
                            padding: '20px',
                            borderRadius: '10px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            marginBottom: '20px'
                        }}>
                            <SingleTieredSteps
                                ranking={getRanking(selectedItemEnd.name)}
                                occupation={selectedItemEnd.name}
                            />
                            <div style={{
                                marginTop: '20px',
                                padding: '15px',
                                backgroundColor: '#f0f9ff',
                                borderRadius: '6px',
                                border: '1px solid #bfdbfe'
                            }}>
                                <h4 style={{ marginBottom: '10px', fontWeight: 'bold', color: '#1e40af' }}>
                                    More Detailed Information
                                </h4>
                                {(() => {
                                    const ranking = getRanking(selectedItemEnd.name);
                                    const exposure = getExposureLevel(ranking);
                                    return (
                                        <p style={{ marginBottom: '10px', lineHeight: '1.5', color: 'black' }}>
                                            Workers in <strong>{selectedItemEnd.name}</strong> have{' '}
                                            <strong style={{ color: exposure.color }}>{exposure.level}</strong> AI exposure.
                                        </p>
                                    );
                                })()}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Shows the final page */}
            {!showTop && !ranked && !showSearch && showEnd && (
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
                            <p>Thank you for completing this portion of the survey. Please click Next at the bottom right of the page to continue the survey.</p>
                        </div>
                    </div>
                </>
            )}

            {/* Displays a next button */}
            {ranked && (
                <div style={{ paddingBottom: '20px' }}>
                    <button
                        onClick={() => handleNext(1, true)}
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
            {showTop && (
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
            {!showTop && !ranked && !showSearch && !showEnd && (
                <div style={{ paddingBottom: '20px' }}>
                    <div>
                        <button
                            onClick={() => handleBack(3, true, false)}
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
