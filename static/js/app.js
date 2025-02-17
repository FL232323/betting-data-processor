[Previous content up to the populateTable function...]

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
    
    // Special handling for parlays table
    if (tableId === 'parlaysTable') {
        data.forEach(parlay => {
            const mainRow = document.createElement('tr');
            mainRow.classList.add('parlay-row');
            mainRow.dataset.parlayId = parlay.Bet_Slip_ID;
            
            columns.forEach(column => {
                const td = document.createElement('td');
                td.textContent = formatValue(parlay[column], column, tableId);
                mainRow.appendChild(td);
            });
            
            // Add expand/collapse button
            const firstCell = mainRow.firstElementChild;
            const expandBtn = document.createElement('button');
            expandBtn.className = 'expand-btn';
            expandBtn.innerHTML = '+'
            expandBtn.onclick = () => toggleParlayLegs(parlay.Bet_Slip_ID);
            firstCell.prepend(expandBtn);
            
            tbody.appendChild(mainRow);
        });
    } else {
        // Normal table population for other tables
        data.forEach(row => {
            const tr = document.createElement('tr');
            
            // Add click handler for legs table to navigate to related view
            if (tableId === 'legsTable') {
                tr.classList.add('clickable');
                tr.onclick = () => navigateToRelatedView(row);
            }
            
            columns.forEach(column => {
                const td = document.createElement('td');
                td.textContent = formatValue(row[column], column, tableId);
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
    }
    
    table.appendChild(tbody);
}

// Function to toggle parlay legs visibility
function toggleParlayLegs(parlayId) {
    const parlayRow = document.querySelector(`tr[data-parlay-id="${parlayId}"]`);
    const expandBtn = parlayRow.querySelector('.expand-btn');
    const legsContainer = document.querySelector(`div[data-parlay-id="${parlayId}"]`);
    
    if (legsContainer) {
        // Legs are already shown, hide them
        legsContainer.remove();
        expandBtn.innerHTML = '+';
        parlayRow.classList.remove('expanded');
    } else {
        // Show legs
        const legs = window.appData.legs.filter(leg => leg.Parlay_ID === parlayId);
        const container = document.createElement('div');
        container.dataset.parlayId = parlayId;
        container.className = 'parlay-legs';
        
        legs.forEach(leg => {
            const legDiv = document.createElement('div');
            legDiv.className = 'parlay-leg clickable';
            legDiv.onclick = () => navigateToRelatedView(leg);
            
            // Format leg information
            const legInfo = `
                ${leg.League} - ${leg.Match}
                ${leg.Market}: ${leg.Selection}
                ${formatValue(leg.Price, 'Price', 'legsTable')}
            `;
            legDiv.textContent = legInfo;
            
            container.appendChild(legDiv);
        });
        
        parlayRow.after(container);
        expandBtn.innerHTML = '-';
        parlayRow.classList.add('expanded');
    }
}

// Function to navigate to related view based on bet type
function navigateToRelatedView(bet) {
    // Determine which tab to switch to based on bet category
    let targetTab;
    if (bet.BetCategory === 'Player Prop') {
        targetTab = 'players-tab';
        // Highlight the relevant player row
        highlightRow('playersTable', 'Player', bet.Player);
    } else if (bet.BetCategory === 'Team') {
        targetTab = 'teams-tab';
        // Highlight relevant team(s)
        bet.Teams.forEach(team => highlightRow('teamsTable', 'Team', team));
    } else if (bet.PropType) {
        targetTab = 'props-tab';
        // Highlight the relevant prop type
        highlightRow('propsTable', 'PropType', bet.PropType);
    }
    
    if (targetTab) {
        // Switch to the target tab
        const tab = document.querySelector(`#${targetTab}`);
        if (tab) {
            const bsTab = new bootstrap.Tab(tab);
            bsTab.show();
        }
    }
}

// Function to highlight a specific row in a table
function highlightRow(tableId, columnName, value) {
    const table = document.getElementById(tableId);
    if (!table) return;
    
    // Remove any existing highlights
    table.querySelectorAll('tr.highlighted').forEach(row => {
        row.classList.remove('highlighted');
    });
    
    // Find and highlight matching row(s)
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const cells = row.getElementsByTagName('td');
        for (let i = 0; i < cells.length; i++) {
            if (cells[i].textContent === value) {
                row.classList.add('highlighted');
                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                break;
            }
        }
    });
}

[Rest of the existing code...]