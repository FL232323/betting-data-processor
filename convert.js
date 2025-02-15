import fs from 'fs';
import XLSX from 'xlsx';

const processXLSFile = () => {
    try {
        console.log("Reading XLS file...");
        
        // Step 1: Read XLS (like opening in Numbers)
        const workbook = XLSX.readFile('All_Bets_Export.xls', {
            cellDates: true,
            cellNF: true,
            cellText: true
        });
        
        // Step 2: Get first sheet
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // Step 3: Convert to array (like copying to Google Sheets)
        const data = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: ''
        });
        
        // Step 4: Extract Column A (like your filter step)
        const columnA = [];
        
        console.log("Processing worksheet...");
        for (let row of data) {
            if (row && row[0]) {  // Only get Column A (first column)
                let value = row[0].toString().trim();
                
                // Clean XML tags
                value = value
                    .replace(/<ss:Row>/g, '')
                    .replace(/<\/ss:Row>/g, '')
                    .replace(/<ss:Cell>/g, '')
                    .replace(/<\/ss:Cell>/g, '')
                    .replace(/<ss:Data ss:Type="String">/g, '')
                    .replace(/<\/ss:Data>/g, '')
                    .replace(/^"(.*)"$/, '$1')
                    .trim();
                
                // Skip XML-related content
                if (!value.includes('<?xml') && 
                    !value.includes('Workbook') && 
                    !value.includes('Worksheet') && 
                    !value.includes('Table') &&
                    value.length > 0) {
                    columnA.push(value);
                }
            }
        }
        
        console.log(`Processed ${columnA.length} rows`);
        
        // Write clean CSV
        fs.writeFileSync('converted_dates.csv', columnA.join('\n'));
        
        // Debug: Show first few entries
        console.log("\nFirst few entries:");
        console.log(columnA.slice(0, 15).join('\n'));
        
    } catch (error) {
        console.error('Error processing file:', error);
        throw error;
    }
};

processXLSFile();