import fs from 'fs';
import XLSX from 'xlsx';

const processXLSFile = () => {
    try {
        console.log("Reading XLS file...");
        
        // Read the XLS file with full options to preserve structure
        const workbook = XLSX.readFile('All_Bets_Export.xls', {
            cellDates: true,
            cellNF: true,
            cellText: true,
            dateNF: 'dd mmm yyyy @ hh:mm',
            raw: true,
            cellStyles: true,
            cellFormula: true
        });

        // Get the sheet metadata
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const range = XLSX.utils.decode_range(sheet['!ref']);
        
        // Get all column values for each row
        let processedData = [];
        let currentRow = [];
        let lastColumnValue = '';

        // Iterate through each cell
        for (let R = range.s.r; R <= range.e.r; R++) {
            let columnValue = '';
            
            // For each row, look at column A
            const cellAddress = XLSX.utils.encode_cell({r: R, c: 0});
            const cell = sheet[cellAddress];
            
            if (cell && cell.v) {
                columnValue = cell.v.toString().trim();
                
                // Clean any XML tags if they exist
                columnValue = columnValue
                    .replace(/<[^>]*>/g, '')
                    .replace(/^"(.*)"$/, '$1')
                    .trim();
                
                // If this is a date or the value has changed significantly
                if (columnValue !== lastColumnValue && columnValue.length > 0) {
                    if (currentRow.length > 0) {
                        processedData.push(currentRow.join(','));
                        currentRow = [];
                    }
                    currentRow.push(columnValue);
                }
                
                lastColumnValue = columnValue;
            }
        }
        
        // Add the last row if exists
        if (currentRow.length > 0) {
            processedData.push(currentRow.join(','));
        }

        // Start with headers
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

        // Combine headers and data
        const finalData = [headers.join(','), ...processedData];

        // Write to CSV
        fs.writeFileSync('converted_dates.csv', finalData.join('\n'));
        
        console.log("Conversion complete");
        console.log(`Total rows processed: ${processedData.length}`);
        console.log("\nFirst few rows:");
        console.log(finalData.slice(0, 5).join('\n'));

    } catch (error) {
        console.error('Error processing file:', error);
        throw error;
    }
};

processXLSFile();