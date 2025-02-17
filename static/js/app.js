// DOM Elements
const dropZone = document.getElementById('dropZone');
const status = document.getElementById('status');

// Add global state for parlays and their legs
let parlayLegsMap = new Map();

// Initialize tooltips and tab handling
document.addEventListener('DOMContentLoaded', () => {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
});

// Direct event binding - this is crucial for file handling
dropZone.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xls,.xlsx';
    input.onchange = (e) => handleFileUpload(e.target.files[0]);
    input.click();
});

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.add('dragging');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragging');
});

dropZone.addEventListener('drop', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('dragging');
    const file = e.dataTransfer.files[0];
    await handleFileUpload(file);
});

// Rest of your existing file handling code
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

// Modified displayData function to handle parlay expansion
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

// Rest of the code for tables and charts remains the same
[... rest of the file remains unchanged ...]