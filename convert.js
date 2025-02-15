import fs from 'fs';
import XLSX from 'xlsx';

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
        
        // Initialize arrays for collecting data
        let rows = [];
        let currentRow = [];
        
        // Get the range of the sheet
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        
        // Process each row
        for(let R = range.s.r; R <= range.e.r; R++) {
            let firstCellValue = '';
            
            // Get all cells in this row
            let rowData = [];
            for(let C = 0; C <= 12; C++) {  // We want 13 columns (0-12)
                const cellAddress = XLSX.utils.encode_cell({r: R, c: C});
                const cell = worksheet[cellAddress];
                
                if(!cell || !cell.v) {
                    rowData.push('');
                    continue;
                }
                
                // Clean the cell value
                let value = cell.v.toString()
                    .replace(/<[^>]*>/g, '')   // Remove XML tags
                    .trim();
                
                // Store first non-empty cell value
                if(C === 0 && value) {
                    firstCellValue = value;
                }
                
                // If the cell contains commas and it's the Match column (index 3)
                // wrap it in quotes to preserve the commas
                if(C === 3 && value.includes(',')) {
                    value = `"${value}"`;
                }
                
                rowData.push(value);
            }
            
            // Skip rows with XML-related content
            if(firstCellValue && 
               !firstCellValue.includes('<?xml') && 
               !firstCellValue.includes('Workbook') && 
               !firstCellValue.includes('Worksheet') && 
               !firstCellValue.includes('Table')) {
                rows.push(rowData);
            }
        }

        // Headers for the CSV
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
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        // Write to file
        fs.writeFileSync('converted_dates.csv', csvContent);
        
        console.log("Conversion complete");
        console.log(`Processed ${rows.length} rows`);
        console.log("\nFirst few rows:");
        console.log(csvContent.split('\n').slice(0, 5).join('\n'));
        
    } catch (error) {
        console.error('Error processing file:', error);
        throw error;
    }
};

processXLSFile();