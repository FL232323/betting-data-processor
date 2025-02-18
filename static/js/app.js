// DOM Elements
const dropZone = document.getElementById('dropZone');
const status = document.getElementById('status');

// Store parlay legs for quick access
const parlayLegsMap = new Map();

// Initialize tooltips and popovers
document.addEventListener('DOMContentLoaded', () => {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
});

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

function displayData(data) {
    if (!data) return;

    // Store parlay legs for quick access
    parlayLegsMap.clear();
    if (data.legs) {
        data.legs.forEach(leg => {
            if (!parlayLegsMap.has(leg.Parlay_ID)) {
                parlayLegsMap.set(leg.Parlay_ID, []);
            }
            parlayLegsMap.get(leg.Parlay_ID).push(leg);
        });
    }

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
            if (key === 'parlays') {
                populateParlaysTable(tableId, data[key]);
            } else {
                populateTable(tableId, data[key]);
            }
        }
    }
}

function populateTable(tableId, data) {
    const table = document.getElementById(tableId);
    if (!table || !data || !data.length) return;

    table.innerHTML = '';
    
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

function populateParlaysTable(tableId, data) {
    const table = document.getElementById(tableId);
    if (!table || !data || !data.length) return;

    table.innerHTML = '';
    
    // Create header row
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const columns = Object.keys(data[0]);
    columns.forEach(key => {
        const th = document.createElement('th');
        th.textContent = key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim();
        headerRow.appendChild(th);
    });
    
    // Add action column header
    const actionTh = document.createElement('th');
    actionTh.textContent = 'Actions';
    headerRow.appendChild(actionTh);
    
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create table body
    const tbody = document.createElement('tbody');
    data.forEach(row => {
        // Main parlay row
        const tr = document.createElement('tr');
        tr.dataset.parlayId = row['Bet Slip ID'];
        
        columns.forEach(column => {
            const td = document.createElement('td');
            td.textContent = formatValue(row[column], column, tableId);
            tr.appendChild(td);
        });

        // Add expand/collapse button
        const actionTd = document.createElement('td');
        const expandBtn = document.createElement('button');
        expandBtn.className = 'btn btn-sm btn-outline-primary';
        expandBtn.textContent = 'Show Legs';
        expandBtn.onclick = () => toggleParlayLegs(tr, row['Bet Slip ID']);
        actionTd.appendChild(expandBtn);
        tr.appendChild(actionTd);

        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
}

function toggleParlayLegs(parlayRow, parlayId) {
    const existingLegsRow = parlayRow.nextElementSibling;
    const expandBtn = parlayRow.querySelector('button');
    
    if (existingLegsRow && existingLegsRow.classList.contains('parlay-legs')) {
        existingLegsRow.remove();
        expandBtn.textContent = 'Show Legs';
        return;
    }

    expandBtn.textContent = 'Hide Legs';
    const legs = parlayLegsMap.get(parlayId);
    
    if (!legs || !legs.length) return;

    const legsRow = document.createElement('tr');
    legsRow.className = 'parlay-legs';
    const legsCell = document.createElement('td');
    legsCell.colSpan = parlayRow.cells.length;
    
    // Create nested table for legs
    const legsTable = document.createElement('table');
    legsTable.className = 'table table-sm table-bordered ms-4 mb-0';
    
    // Add legs header
    const legsHeader = document.createElement('thead');
    const legsHeaderRow = document.createElement('tr');
    const legColumns = ['Leg Number', 'Status', 'League', 'Match', 'Market', 'Selection', 'Price', 'Game Date'];
    legColumns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col;
        legsHeaderRow.appendChild(th);
    });
    legsHeader.appendChild(legsHeaderRow);
    legsTable.appendChild(legsHeader);
    
    // Add legs body
    const legsBody = document.createElement('tbody');
    legs.forEach(leg => {
        const legRow = document.createElement('tr');
        legColumns.forEach(col => {
            const td = document.createElement('td');
            const key = col.replace(/ /g, '_');
            td.textContent = formatValue(leg[key], key, 'legsTable');
            legRow.appendChild(td);
        });
        legsBody.appendChild(legRow);
    });
    legsTable.appendChild(legsBody);
    
    legsCell.appendChild(legsTable);
    legsRow.appendChild(legsCell);
    parlayRow.parentNode.insertBefore(legsRow, parlayRow.nextSibling);
}

function formatValue(value, columnName, tableId) {
    if (value === null || value === undefined) return '-';
    
    if (columnName === 'Price') {
        const bettingTables = ['singlesTable', 'parlaysTable', 'legsTable'];
        if (bettingTables.includes(tableId)) {
            const americanOdds = decimalToAmerican(value);
            return americanOdds > 0 ? `+${americanOdds}` : americanOdds.toString();
        }
        return (value * 100).toFixed(1) + '%';
    }

    const moneyColumns = ['Wager', 'Winnings', 'Payout', 'Potential Payout', 'Potential_Payout'];
    if (moneyColumns.includes(columnName)) {
        return value ? `$${parseFloat(value).toFixed(2)}` : '$0.00';
    }
    
    const statsColumns = ['Total_Bets', 'Wins', 'Losses', 'Total Bets'];
    if (statsColumns.includes(columnName) && typeof value === 'number') {
        return Math.round(value).toString();
    }
    
    if (Array.isArray(value)) {
        return value.join(', ');
    }
    
    if (typeof value === 'number') {
        return value.toString();
    }
    if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
    }
    return value.toString();
}

function decimalToAmerican(decimal) {
    if (decimal >= 2.0) {
        return Math.round((decimal - 1) * 100);
    } else {
        return Math.round(-100 / (decimal - 1));
    }
}

// The rest of the file (chart creation functions etc.) remains unchanged