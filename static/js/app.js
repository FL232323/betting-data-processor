// Keeping all existing code exactly as is until the displayData function
[Previous code remains exactly the same until displayData function]

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

    // Create a map to store team bets for quick access
    const teamBetsMap = new Map();
    
    // Process single bets for teams
    if (data.singles) {
        data.singles.forEach(bet => {
            const match = bet.Match || '';
            if (match.includes(' vs ')) {
                const teams = match.split(' vs ').map(team => team.trim());
                teams.forEach(team => {
                    if (!teamBetsMap.has(team)) {
                        teamBetsMap.set(team, { singles: [], parlayLegs: [] });
                    }
                    teamBetsMap.get(team).singles.push(bet);
                });
            }
        });
    }

    // Process parlay legs for teams
    if (data.legs) {
        data.legs.forEach(leg => {
            const match = leg.Match || '';
            if (match.includes(' vs ')) {
                const teams = match.split(' vs ').map(team => team.trim());
                teams.forEach(team => {
                    if (!teamBetsMap.has(team)) {
                        teamBetsMap.set(team, { singles: [], parlayLegs: [] });
                    }
                    teamBetsMap.get(team).parlayLegs.push(leg);
                });
            }
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
            } else if (key === 'teamStats') {
                populateTeamsTable(tableId, data[key], teamBetsMap);
            } else {
                populateTable(tableId, data[key]);
            }
        }
    }
}

function populateTeamsTable(tableId, data, teamBetsMap) {
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
    
    // Add action column
    const actionTh = document.createElement('th');
    actionTh.textContent = 'Actions';
    headerRow.appendChild(actionTh);
    
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create body
    const tbody = document.createElement('tbody');
    data.forEach(row => {
        // Main team row
        const tr = document.createElement('tr');
        columns.forEach(column => {
            const td = document.createElement('td');
            td.textContent = formatValue(row[column], column, tableId);
            tr.appendChild(td);
        });

        // Add expand/collapse button if team has bets
        const actionTd = document.createElement('td');
        const teamName = row.Team;
        const teamBets = teamBetsMap.get(teamName);
        
        if (teamBets && (teamBets.singles.length > 0 || teamBets.parlayLegs.length > 0)) {
            const expandBtn = document.createElement('button');
            expandBtn.className = 'btn btn-sm btn-outline-primary';
            expandBtn.textContent = 'Show Bets';
            expandBtn.onclick = () => toggleTeamBets(tr, teamName, teamBets);
            actionTd.appendChild(expandBtn);
        }
        
        tr.appendChild(actionTd);
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
}

function toggleTeamBets(teamRow, teamName, teamBets) {
    const existingBetsRow = teamRow.nextElementSibling;
    const expandBtn = teamRow.querySelector('button');
    
    if (existingBetsRow && existingBetsRow.classList.contains('team-bets')) {
        existingBetsRow.remove();
        expandBtn.textContent = 'Show Bets';
        return;
    }

    expandBtn.textContent = 'Hide Bets';
    
    const betsRow = document.createElement('tr');
    betsRow.className = 'team-bets';
    const betsCell = document.createElement('td');
    betsCell.colSpan = teamRow.cells.length;
    
    // Create container for bet tables
    const betsContainer = document.createElement('div');
    betsContainer.className = 'ms-4 mb-0';

    // Add singles if any exist
    if (teamBets.singles.length > 0) {
        const singlesTitle = document.createElement('h6');
        singlesTitle.className = 'mt-3 mb-2';
        singlesTitle.textContent = 'Single Bets';
        betsContainer.appendChild(singlesTitle);

        const singlesTable = document.createElement('table');
        singlesTable.className = 'table table-sm table-bordered';
        
        // Add headers
        const headers = ['Date Placed', 'Market', 'Selection', 'Price', 'Wager', 'Result'];
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        singlesTable.appendChild(thead);

        // Add single bets
        const tbody = document.createElement('tbody');
        teamBets.singles.forEach(bet => {
            const tr = document.createElement('tr');
            headers.forEach(header => {
                const td = document.createElement('td');
                const key = header.replace(/ /g, '_');
                td.textContent = formatValue(bet[key], key, 'singlesTable');
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        singlesTable.appendChild(tbody);
        betsContainer.appendChild(singlesTable);
    }

    // Add parlay legs if any exist
    if (teamBets.parlayLegs.length > 0) {
        const parlayTitle = document.createElement('h6');
        parlayTitle.className = 'mt-3 mb-2';
        parlayTitle.textContent = 'Parlay Legs';
        betsContainer.appendChild(parlayTitle);

        const parlayTable = document.createElement('table');
        parlayTable.className = 'table table-sm table-bordered';
        
        // Add headers
        const headers = ['Market', 'Selection', 'Price', 'Status', 'Game Date', 'Parlay ID'];
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        parlayTable.appendChild(thead);

        // Add parlay legs
        const tbody = document.createElement('tbody');
        teamBets.parlayLegs.forEach(leg => {
            const tr = document.createElement('tr');
            headers.forEach(header => {
                const td = document.createElement('td');
                const key = header === 'Parlay ID' ? 'Parlay_ID' : header.replace(/ /g, '_');
                td.textContent = formatValue(leg[key], key, 'legsTable');
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        parlayTable.appendChild(tbody);
        betsContainer.appendChild(parlayTable);
    }

    betsCell.appendChild(betsContainer);
    betsRow.appendChild(betsCell);
    teamRow.parentNode.insertBefore(betsRow, teamRow.nextSibling);
}

[Rest of the existing code remains exactly the same, including all event handlers, navigation functions, and formatting functions]