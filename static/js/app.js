// DOM Elements
const dropZone = document.getElementById('dropZone');
const status = document.getElementById('status');

// Initialize tooltips and popovers
document.addEventListener('DOMContentLoaded', () => {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
});

// Odds conversion function
function decimalToAmerican(decimal) {
    if (decimal >= 2.0) {
        return Math.round((decimal - 1) * 100);
    } else {
        return Math.round(-100 / (decimal - 1));
    }
}

// File handling functions
function initializeFileHandling() {
    dropZone.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xls,.xlsx';
        input.onchange = (e) => handleFileUpload(e.target.files[0]);
        input.click();
    });

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragging');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragging');
    });

    dropZone.addEventListener('drop', async (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragging');
        const file = e.dataTransfer.files[0];
        await handleFileUpload(file);
    });
}

async function handleFileUpload(file) {
    if (!file) return;
    
    if (!file.name.includes('All_Bets_Export')) {
        status.textContent = 'Please upload an All_Bets_Export file';
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
        status.textContent = 'Processing file...';
        const response = await fetch('/process', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        status.textContent = result.message;
        
        if (result.data) {
            displayData(result.data);
            createCharts(result.data);
        }
    } catch (error) {
        console.error('Upload error:', error);
        status.textContent = `Error: ${error.message}`;
    }
}

// Data display functions
function displayData(data) {
    if (!data) return;

    const tables = {
        singles: 'singlesTable',
        parlays: 'parlaysTable',
        legs: 'legsTable',
        teamStats: 'teamsTable',
        playerStats: 'playersTable',
        propStats: 'propsTable'
    };

    for (const [key, tableId] of Object.entries(tables)) {
        if (data[key] && Array.isArray(data[key]) && data[key].length > 0) {
            populateTable(tableId, data[key]);
        }
    }
}

function populateTable(tableId, data) {
    const table = document.getElementById(tableId);
    if (!table || !data || !data.length) return;

    table.innerHTML = '';
    
    // Create header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const columns = Object.keys(data[0]);
    columns.forEach(key => {
        const th = document.createElement('th');
        th.textContent = key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim();
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create body
    const tbody = document.createElement('tbody');
    data.forEach(row => {
        const tr = document.createElement('tr');
        columns.forEach(column => {
            const td = document.createElement('td');
            td.textContent = formatValue(row[column], column, tableId);
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
}

function formatValue(value, columnName, tableId) {
    if (value === null || value === undefined) return '-';
    
    // Handle Price column specifically for betting tables
    if (columnName === 'Price') {
        const bettingTables = ['singlesTable', 'parlaysTable', 'legsTable'];
        if (bettingTables.includes(tableId)) {
            const americanOdds = decimalToAmerican(value);
            return americanOdds > 0 ? `+${americanOdds}` : americanOdds.toString();
        }
        return (value * 100).toFixed(1) + '%';
    }

    // Money columns
    const moneyColumns = ['Wager', 'Winnings', 'Payout', 'Potential Payout', 'Potential_Payout'];
    if (moneyColumns.includes(columnName)) {
        return value ? `$${parseFloat(value).toFixed(2)}` : '$0.00';
    }
    
    // Stats columns (Teams, Players, Props)
    const statsColumns = ['Total_Bets', 'Wins', 'Losses', 'Total Bets'];
    if (statsColumns.includes(columnName) && typeof value === 'number') {
        return Math.round(value).toString();
    }
    
    // Handle arrays (like prop types)
    if (Array.isArray(value)) {
        return value.join(', ');
    }
    
    // Default handling
    if (typeof value === 'number') {
        return value.toString();
    }
    if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
    }
    return value.toString();
}

// Chart creation functions
function createCharts(data) {
    if (!data || !data.stats) return;

    const chartConfigs = [
        { id: 'winLossChart', fn: createWinLossChart },
        { id: 'sportsPieChart', fn: createSportsPieChart },
        { id: 'profitLineChart', fn: createProfitLineChart },
        { id: 'teamWinLossChart', fn: createTeamChart },
        { id: 'playerWinLossChart', fn: createPlayerChart },
        { id: 'propTypeChart', fn: createPropTypeChart }
    ];

    chartConfigs.forEach(config => {
        const canvas = document.getElementById(config.id);
        if (canvas) {
            // Clear any existing chart
            const existingChart = Chart.getChart(canvas);
            if (existingChart) {
                existingChart.destroy();
            }
            
            const ctx = canvas.getContext('2d');
            config.fn(data, ctx);
        }
    });
}

function createWinLossChart(data, ctx) {
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Won', 'Lost'],
            datasets: [{
                label: 'Number of Bets',
                data: [data.stats.wins, data.stats.losses],
                backgroundColor: ['#28a745', '#dc3545']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Overall Win/Loss Distribution'
                },
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function createSportsPieChart(data, ctx) {
    const sportsDist = data.stats.sportsDist;
    const colors = [
        '#007bff', '#28a745', '#ffc107', '#17a2b8', '#dc3545',
        '#6610f2', '#fd7e14', '#20c997', '#e83e8c', '#6f42c1'
    ];

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(sportsDist),
            datasets: [{
                data: Object.values(sportsDist),
                backgroundColor: colors.slice(0, Object.keys(sportsDist).length)
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Sports Distribution'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            return `${label}: ${value} bets`;
                        }
                    }
                }
            }
        }
    });
}

function createProfitLineChart(data, ctx) {
    const timeline = data.stats.profitTimeline;
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: timeline.dates,
            datasets: [{
                label: 'Cumulative Profit',
                data: timeline.profits,
                borderColor: timeline.profits[timeline.profits.length - 1] >= 0 ? '#28a745' : '#dc3545',
                fill: false,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Profit Timeline'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => '$' + value.toFixed(2)
                    }
                }
            }
        }
    });
}

function createTeamChart(data, ctx) {
    if (!data.stats.teamPerformance) return;

    const teams = Object.keys(data.stats.teamPerformance);
    const wins = teams.map(team => data.stats.teamPerformance[team].wins);
    const losses = teams.map(team => data.stats.teamPerformance[team].losses);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: teams,
            datasets: [
                {
                    label: 'Wins',
                    data: wins,
                    backgroundColor: '#28a745'
                },
                {
                    label: 'Losses',
                    data: losses,
                    backgroundColor: '#dc3545'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Team Performance'
                }
            },
            scales: {
                x: { stacked: true },
                y: { 
                    stacked: true,
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function createPlayerChart(data, ctx) {
    if (!data.stats.playerPerformance) return;

    const players = Object.keys(data.stats.playerPerformance);
    const wins = players.map(player => data.stats.playerPerformance[player].wins);
    const losses = players.map(player => data.stats.playerPerformance[player].losses);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: players,
            datasets: [
                {
                    label: 'Wins',
                    data: wins,
                    backgroundColor: '#28a745'
                },
                {
                    label: 'Losses',
                    data: losses,
                    backgroundColor: '#dc3545'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Player Performance'
                }
            },
            scales: {
                x: { stacked: true },
                y: { 
                    stacked: true,
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function createPropTypeChart(data, ctx) {
    if (!data.stats.propPerformance) return;

    const propTypes = Object.keys(data.stats.propPerformance);
    const wins = propTypes.map(prop => data.stats.propPerformance[prop].wins);
    const losses = propTypes.map(prop => data.stats.propPerformance[prop].losses);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: propTypes,
            datasets: [
                {
                    label: 'Wins',
                    data: wins,
                    backgroundColor: '#28a745'
                },
                {
                    label: 'Losses',
                    data: losses,
                    backgroundColor: '#dc3545'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Prop Type Performance'
                }
            },
            scales: {
                x: { stacked: true },
                y: { 
                    stacked: true,
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Initialize everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializeFileHandling);