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
        
        // Convert to array format first
        const rawData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            raw: false,
            defval: ''
        });

        console.log("Cleaning XML formatting...");
        // Clean each cell of XML tags and whitespace
        const cleanedData = rawData
            .map(row => {
                if (!row || row.length === 0) return null;
                
                // Get first non-empty cell from each row
                const cellValue = row.find(cell => cell && cell.toString().trim() !== '');
                if (!cellValue) return null;

                // Remove XML tags and clean whitespace
                return cellValue.toString()
                    .replace(/<[^>]*>/g, '')  // Remove XML tags
                    .replace(/^"(.*)"$/, '$1') // Remove outer quotes
                    .trim();
            })
            .filter(row => row !== null && row !== '');

        console.log("Processed rows:", cleanedData.length);

        // Write to CSV
        fs.writeFileSync('converted_dates.csv', cleanedData.join('\n'));
        
        // Debug: Show first few rows
        console.log("\nFirst few rows of output:");
        console.log(cleanedData.slice(0, 15).join('\n'));

    } catch (error) {
        console.error('Error processing file:', error);
        throw error;
    }
};

processXLSFile();