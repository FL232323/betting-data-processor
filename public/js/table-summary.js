// Table summary calculation functions
function calculateTableSummary(tableRows) {
    const summary = {
        totalBets: tableRows.length,
        averagePrice: 0,
        totalWager: 0,
        totalWinnings: 0,
        totalPayout: 0
    };

    // Skip header row and process only data rows
    const dataRows = Array.from(tableRows).filter(row => !row.classList.contains('header-row'));
    
    if (dataRows.length === 0) return summary;

    let priceSum = 0;
    dataRows.forEach(row => {
        const cells = row.cells;
        const price = parseFloat(cells[getColumnIndex('Price')].textContent) || 0;
        const wager = parseFloat(cells[getColumnIndex('Wager')].textContent.replace('$', '')) || 0;
        const winnings = parseFloat(cells[getColumnIndex('Winnings')].textContent.replace('$', '')) || 0;
        const payout = parseFloat(cells[getColumnIndex('Payout')].textContent.replace('$', '')) || 0;

        priceSum += price;
        summary.totalWager += wager;
        summary.totalWinnings += winnings;
        summary.totalPayout += payout;
    });

    summary.averagePrice = (priceSum / dataRows.length).toFixed(2);
    
    return summary;
}

function getColumnIndex(columnName) {
    const headerRow = document.querySelector('tr.header-row');
    if (!headerRow) return -1;
    
    const headers = Array.from(headerRow.cells);
    return headers.findIndex(cell => cell.textContent.trim() === columnName);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(amount);
}

function createSummaryRow(summary) {
    const row = document.createElement('tr');
    row.className = 'table-summary-row';
    
    row.innerHTML = `
        <td colspan="3" class="table-summary-label">Totals & Averages (${summary.totalBets} bets)</td>
        <td></td>
        <td>${summary.averagePrice}</td>
        <td>${formatCurrency(summary.totalWager)}</td>
        <td>${formatCurrency(summary.totalWinnings)}</td>
        <td>${formatCurrency(summary.totalPayout)}</td>
        <td colspan="3"></td>
    `;
    
    return row;
}

function updateTableSummary(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;

    // Remove existing summary row if present
    const existingSummary = table.querySelector('.table-summary-row');
    if (existingSummary) {
        existingSummary.remove();
    }

    const dataRows = table.getElementsByTagName('tr');
    const summary = calculateTableSummary(dataRows);
    const summaryRow = createSummaryRow(summary);
    
    table.appendChild(summaryRow);
}

// Export functions for use in main app.js
window.tableSummary = {
    update: updateTableSummary,
    calculate: calculateTableSummary,
    createRow: createSummaryRow
};