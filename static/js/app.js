// This should continue the toggleParlayLegs function right where we left off...

    const legColumns = ['Leg Number', 'Status', 'League', 'Match', 'Market', 'Selection', 'Price', 'Game Date', 'Navigation'];
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
        
        // Add regular columns
        legColumns.slice(0, -1).forEach(col => {
            const td = document.createElement('td');
            const key = col.replace(/ /g, '_');
            td.textContent = formatValue(leg[key], key, 'legsTable');
            legRow.appendChild(td);
        });

        // Add navigation links
        const navTd = document.createElement('td');
        
        // Check if it's a player prop
        const market = leg.Market || '';
        if (market.includes(' - ')) {
            const [playerName] = market.split(' - ');
            const navLink = createNavLink('Go to Player', () => navigateToPlayer(playerName.trim()));
            navTd.appendChild(navLink);
        }

        // Check if it's a team bet
        const match = leg.Match || '';
        if (match.includes(' vs ')) {
            const teams = match.split(' vs ').map(team => team.trim());
            teams.forEach((team, index) => {
                if (index > 0) {
                    navTd.appendChild(document.createTextNode(' | '));
                }
                const navLink = createNavLink(`Go to ${team}`, () => navigateToTeam(team));
                navTd.appendChild(navLink);
            });
        }

        legRow.appendChild(navTd);
        legsBody.appendChild(legRow);
    });
    legsTable.appendChild(legsBody);
    
    legsCell.appendChild(legsTable);
    legsRow.appendChild(legsCell);
    parlayRow.parentNode.insertBefore(legsRow, parlayRow.nextSibling);
}

// Function to toggle team bets display
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

// Chart creation function
function createCharts() {
    // We'll implement charts later
    console.log("Charts will be implemented later");
}