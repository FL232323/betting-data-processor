import fs from 'fs';
import XLSX from 'xlsx';

const processXLSFile = () => {
    try {
        console.log("Reading XLS file...");
        // Read the XLS file with full options for better data handling
        const workbook = XLSX.readFile('All_Bets_Export.xls', {
            cellDates: true,
            cellNF: true,
            cellText: true,
            dateNF: 'dd mmm yyyy @ hh:mm',
            raw: true,
            cellStyles: true
        });

        console.log("Converting to CSV format...");
        // Get first sheet
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // Convert to array of arrays for more control
        const data = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            raw: false,
            defval: ''
        });

        console.log("Processing rows...");
        const cleanedRows = [];
        let currentRow = [];
        
        // Process each non-empty row
        data.forEach(row => {
            // Get the first non-empty cell
            const firstCell = row.find(cell => cell && cell.toString().trim() !== '');
            if (firstCell) {
                // Clean the cell value
                const cleanedValue = firstCell.toString()
                    .replace(/^["]+|["]+$/g, '')  // Remove extra quotes
                    .trim();
                
                if (cleanedValue) {
                    currentRow.push(cleanedValue);
                    
                    // If we've collected 13 items, this is a complete bet entry
                    if (currentRow.length === 13) {
                        cleanedRows.push(currentRow);
                        currentRow = [];
                    }
                }
            }
        });

        // Convert to CSV format
        const headers = [
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

        // Create CSV content
        const csvContent = [
            headers.join(','),
            ...cleanedRows.map(row => {
                return row.map(cell => {
                    // Handle cells that contain commas
                    if (cell.includes(',')) {
                        return `"${cell}"`;
                    }
                    return cell;
                }).join(',');
            })
        ].join('\n');

        console.log(`Processed ${cleanedRows.length} rows`);
        
        // Write the CSV file
        fs.writeFileSync('converted_dates.csv', csvContent);
        console.log("CSV file created successfully");
        
        // Debug output
        console.log("\nFirst few rows of output:");
        console.log(csvContent.split('\n').slice(0, 3).join('\n'));
        
    } catch (error) {
        console.error('Error processing file:', error);
        throw error;
    }
};

processXLSFile();