// DOM Elements
const dropZone = document.getElementById('dropZone');
const status = document.getElementById('status');

// Initialize tooltips and popovers
document.addEventListener('DOMContentLoaded', () => {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
    initializeFileHandling();
});

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
        e.stopPropagation();
        dropZone.classList.add('dragging');
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('dragging');
    });

    dropZone.addEventListener('drop', async (e) => {
        e.preventDefault();
        e.stopPropagation();
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
            window.appData = result.data; // Store data for parlay linking
            displayData(result.data);
            createCharts(result.data);
        }
    } catch (error) {
        console.error('Upload error:', error);
        status.textContent = `Error: ${error.message}`;
    }
}

[Rest of your existing app.js code for tables, charts, etc.]