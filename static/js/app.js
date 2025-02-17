// Previous app.js content with modifications
// Keeping core file handling and data processing intact
// Adding expandable parlay functionality

// DOM Elements
const dropZone = document.getElementById('dropZone');
const status = document.getElementById('status');

// Initialize tooltips and popovers
document.addEventListener('DOMContentLoaded', () => {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
});

// Add global state for parlays and their legs
let parlayLegsMap = new Map();

// Modify the displayData function to store parlay legs
function displayData(data) {
    if (!data) return;

    // Store parlay legs in the map for quick access
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

// Add new function for parlay table population
function populateParlaysTable(tableId, data) {
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
    // Add extra column for expand/collapse
    const actionTh = document.createElement('th');
    actionTh.textContent = 'Actions';
    headerRow.appendChild(actionTh);
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create body
    const tbody = document.createElement('tbody');
    data.forEach(row => {
        // Create main parlay row
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

// Add function to toggle parlay legs
function toggleParlayLegs(parlayRow, parlayId) {
    const existingLegsRow = parlayRow.nextElementSibling;
    const expandBtn = parlayRow.querySelector('button');
    
    if (existingLegsRow && existingLegsRow.classList.contains('parlay-legs')) {
        // Collapse
        existingLegsRow.remove();
        expandBtn.textContent = 'Show Legs';
        return;
    }

    // Expand
    expandBtn.textContent = 'Hide Legs';
    const legs = parlayLegsMap.get(parlayId);
    
    if (!legs || !legs.length) return;

    const legsRow = document.createElement('tr');
    legsRow.className = 'parlay-legs';
    const legsCell = document.createElement('td');
    legsCell.colSpan = parlayRow.cells.length;
    
    // Create legs table
    const legsTable = document.createElement('table');
    legsTable.className = 'table table-sm table-bordered ms-4';
    
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

// Keep existing code below this point
// ... (rest of the file remains unchanged)