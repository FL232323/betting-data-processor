import fs from 'fs';
import XLSX from 'xlsx';

const EXPECTED_HEADERS = [
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

const processXLSFile = () => {
    try {
        console.log("Reading XLS file...");
        
        // Read the XLS file with full options
        const workbook = XLSX.readFile('All_Bets_Export.xls', {
            cellDates: true,
            cellNF: true,
            cellText: true,
            raw: true
        });

        // Get the first sheet
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // Convert to array format
        const data = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            raw: false,
            defval: ''
        });

        let currentRow = [];
        const processedRows = [];

        // Process each row
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            if (!row || row.length === 0) continue;

            // Get first cell value
            let firstCell = '';
            for (let cell of row) {
                if (cell) {
                    firstCell = cell.toString()
                        .replace(/<[^>]*>/g, '')   // Remove XML tags
                        .replace(/^"(.*)"$/, '$1')  // Remove wrapping quotes
                        .trim();
                    break;
                }
            }

            if (!firstCell) continue;

            // Skip XML metadata
            if (firstCell.includes('<?xml') || 
                firstCell.includes('Workbook') || 
                firstCell.includes('Worksheet') || 
                firstCell.includes('Table')) {
                continue;
            }

            // Clean row data
            const cleanRow = row.map(cell => {
                if (!cell) return '';
                return cell.toString()
                    .replace(/<[^>]*>/g, '')
                    .replace(/^"(.*)"$/, '$1')
                    .trim();
            });

            // Get first non-empty value
            const firstValue = cleanRow.find(cell => cell) || '';

            // Add to current row collection
            currentRow.push(firstValue);

            // If we have 13 values, this is a complete row
            if (currentRow.length === 13) {
                processedRows.push(currentRow);
                currentRow = [];
            }
        }

        // Write headers and data
        const csvContent = [
            EXPECTED_HEADERS.join(','),
            ...processedRows.map(row => row.join(','))
        ].join('\n');

        fs.writeFileSync('converted_dates.csv', csvContent);
        
        console.log(`Processed ${processedRows.length} rows`);
        console.log("\nFirst few rows:");
        console.log(csvContent.split('\n').slice(0, 3).join('\n'));

    } catch (error) {
        console.error('Error processing file:', error);
        throw error;
    }
};

processXLSFile();