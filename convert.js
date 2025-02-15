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
        
        // Read the XLS file
        const workbook = XLSX.readFile('All_Bets_Export.xls', {
            cellDates: true,
            cellNF: true,
            cellText: true,
            raw: true
        });

        // Get first sheet
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // Convert to array format first
        const rawData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            raw: false,
            defval: ''
        });

        console.log("Cleaning XML formatting...");
        // First, write the headers
        const cleanedData = [...EXPECTED_HEADERS];

        // Then process each row
        let currentValue = '';
        
        for (let row of rawData) {
            if (!row || row.length === 0) continue;
            
            // Get first non-empty cell from each row
            const cellValue = row.find(cell => cell && cell.toString().trim() !== '');
            if (!cellValue) continue;

            // Clean the value
            const cleanValue = cellValue.toString()
                .replace(/<[^>]*>/g, '')  // Remove XML tags
                .replace(/^"(.*)"$/, '$1') // Remove outer quotes
                .trim();

            if (cleanValue && !cleanValue.includes('xml') && !cleanValue.includes('Workbook') && 
                !cleanValue.includes('Worksheet') && !cleanValue.includes('Table')) {
                cleanedData.push(cleanValue);
            }
        }

        console.log("Writing to CSV...");
        // Write to CSV
        fs.writeFileSync('converted_dates.csv', cleanedData.join('\n'));
        
        // Debug output
        console.log("\nFirst few rows:");
        console.log(cleanedData.slice(0, 15).join('\n'));
        console.log(`\nTotal rows: ${cleanedData.length}`);

    } catch (error) {
        console.error('Error processing file:', error);
        throw error;
    }
};

processXLSFile();