import fs from 'fs';
import XLSX from 'xlsx';

const processXLSFile = () => {
    try {
        console.log("Reading XLS file...");
        
        // Define expected headers
        const expectedHeaders = [
            'Date Placed',
            'Status',
            'League',
            'Match',
            'Bet Type',
            'Market',
            'Price',
            'Wager',
            'Winnings',
            'Payout',
            'Potential Payout',
            'Result',
            'Bet Slip ID'
        ];

        // Read the XLS file
        const workbook = XLSX.readFile('All_Bets_Export.xls', {
            cellDates: true,
            cellNF: true,
            cellText: true,
            raw: true
        });

        // Get the first sheet
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // Convert to array of arrays with specific options
        const rawData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: '',
            blankrows: false
        });

        console.log("Processing data...");
        const cleanedRows = [];
        let betData = [];

        // Process each row
        for (let i = 0; i < rawData.length; i++) {
            const row = rawData[i];
            const firstCell = row[0]?.toString().trim() || '';

            // Check if it's a date (indicating start of new bet)
            if (firstCell.match(/\d{1,2}\s+[A-Za-z]{3}\s+\d{4}\s+@\s+\d{1,2}:\d{2}(?:am|pm)/i)) {
                if (betData.length === expectedHeaders.length) {
                    cleanedRows.push(betData);
                }
                betData = [firstCell];
            } 
            // If we're collecting bet data and have a non-empty cell
            else if (betData.length < expectedHeaders.length && firstCell) {
                betData.push(firstCell);
            }
        }

        // Add the last bet if complete
        if (betData.length === expectedHeaders.length) {
            cleanedRows.push(betData);
        }

        console.log(`Processed ${cleanedRows.length} bets`);

        // Create CSV content
        const csvContent = [
            expectedHeaders.join(','),
            ...cleanedRows.map(row => {
                return row.map(cell => {
                    cell = cell.toString().trim();
                    // Handle cells that contain commas
                    if (cell.includes(',')) {
                        return `"${cell}"`;
                    }
                    return cell;
                }).join(',');
            })
        ].join('\n');

        // Write the CSV file
        fs.writeFileSync('converted_dates.csv', csvContent);
        console.log("CSV file created successfully");

        // Debug: Show first few rows
        console.log("\nFirst few rows:");
        console.log(csvContent.split('\n').slice(0, 3).join('\n'));

    } catch (error) {
        console.error('Error processing file:', error);
        throw error;
    }
};

processXLSFile();