// All initial DOM Elements and event handlers remain the same...
[previous code until toggleParlayLegs function]

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

        // Check if it's a team bet (using Match field)
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

// Helper function to create navigation links
function createNavLink(text, onClick) {
    const link = document.createElement('a');
    link.href = '#';
    link.className = 'btn btn-sm btn-link';
    link.textContent = text;
    link.onclick = (e) => {
        e.preventDefault();
        onClick();
    };
    return link;
}

// Navigation functions
function navigateToPlayer(playerName) {
    // Switch to Players tab
    const playersTab = document.querySelector('#players-tab');
    const tabInstance = new bootstrap.Tab(playersTab);
    tabInstance.show();

    // Find and highlight the player row
    setTimeout(() => {
        const playersTable = document.getElementById('playersTable');
        const rows = playersTable.getElementsByTagName('tr');
        for (const row of rows) {
            const cells = row.getElementsByTagName('td');
            if (cells.length && cells[0].textContent === playerName) {
                row.classList.add('highlight');
                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(() => row.classList.remove('highlight'), 2000);
                break;
            }
        }
    }, 100);
}

function navigateToTeam(teamName) {
    // Switch to Teams tab
    const teamsTab = document.querySelector('#teams-tab');
    const tabInstance = new bootstrap.Tab(teamsTab);
    tabInstance.show();

    // Find and highlight the team row
    setTimeout(() => {
        const teamsTable = document.getElementById('teamsTable');
        const rows = teamsTable.getElementsByTagName('tr');
        for (const row of rows) {
            const cells = row.getElementsByTagName('td');
            if (cells.length && cells[0].textContent === teamName) {
                row.classList.add('highlight');
                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(() => row.classList.remove('highlight'), 2000);
                break;
            }
        }
    }, 100);
}

// Rest of the code remains the same...
