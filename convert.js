import fs from 'fs';
import XLSX from 'xlsx';

const processXLSFile = () => {
    try {
        // Read the XLS file
        const workbook = XLSX.readFile('All_Bets_Export.xls', {
            cellDates: true,
            cellNF: true,
            cellText: true
        });

        // Get first sheet
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // Convert to CSV string
        const csvString = XLSX.utils.sheet_to_csv(worksheet);
        
        // Split into lines and clean
        const lines = csvString.split(/\r?\n/)
            .map(line => line.split(',')[0].trim())
            .filter(line => line)
            .filter(line => line !== ",,,,,,"); // Remove empty comma lines
        
        const bets = [];
        let currentBet = null;
        let inHeader = true;
        
        // Process each line
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].replace(/^"(.*)"$/, '$1').trim();
            
            // Skip the header section
            if (inHeader && line === 'Bet Slip ID') {
                inHeader = false;
                continue;
            }
            
            // If we see a date, start a new bet
            if (line.match(/\d+\s+[A-Za-z]{3}\s+\d{4}\s+@\s+\d+:\d+[ap]m/i)) {
                if (currentBet) {
                    bets.push(currentBet);
                }
                currentBet = {
                    'Date Placed': line,
                    'Status': '',
                    'League': '',
                    'Match': '',
                    'Bet Type': '',
                    'Market': '',
                    'Price': '',
                    'Wager': '',
                    'Winnings': '',
                    'Payout': '',
                    'Potential Payout': '',
                    'Result': '',
                    'Bet Slip ID': ''
                };
                continue;
            }
            
            // If we have a current bet, add the next piece of information
            if (currentBet) {
                const emptyField = Object.entries(currentBet)
                    .find(([key, value]) => value === '');
                
                if (emptyField) {
                    currentBet[emptyField[0]] = line;
                }
            }
        }
        
        // Add the last bet
        if (currentBet) {
            bets.push(currentBet);
        }

        // Convert to CSV format
        const csvData = bets.map(bet => 
            Object.values(bet).map(value => 
                value.includes(',') ? `"${value}"` : value
            ).join(',')
        );

        // Add header
        csvData.unshift(Object.keys(bets[0]).join(','));

        // Write to file
        fs.writeFileSync('converted_dates.csv', csvData.join('\n'));
        
        console.log(`Processed ${bets.length} bets`);
        
    } catch (error) {
        console.error('Error processing file:', error);
        throw error;
    }
};

processXLSFile();