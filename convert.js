import fs from 'fs';
import XLSX from 'xlsx';

const processXLSFile = () => {
    try {
        console.log("Reading XLS file...");
        
        // Get the data as a single column like the original script
        const workbook = XLSX.readFile('All_Bets_Export.xls', {
            cellDates: true,
            cellNF: true,
            cellText: true,
            raw: true
        });

        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        
        // Extract just column A (like your original script)
        let columnA = [];
        
        for(let R = range.s.r; R <= range.e.r; R++) {
            const cellAddress = XLSX.utils.encode_cell({r: R, c: 0});
            const cell = worksheet[cellAddress];
            
            if(cell && cell.v) {
                let value = cell.v.toString()
                    .replace(/<[^>]*>/g, '')   // Remove XML tags
                    .replace(/^"(.*)"$/, '$1')  // Remove quotes
                    .trim();
                
                // Skip XML-related content
                if(!value.includes('<?xml') && 
                   !value.includes('Workbook') && 
                   !value.includes('Worksheet') && 
                   !value.includes('Table')) {
                    columnA.push(value);
                }
            } else {
                columnA.push('');  // Keep empty cells to maintain structure
            }
        }

        // Write to CSV exactly like your script expected
        fs.writeFileSync('converted_dates.csv', 'Date Placed\n' + columnA.join('\n'));
        
        console.log("Conversion complete");
        console.log(`Processed ${columnA.length} rows`);
        console.log("\nFirst few entries:");
        console.log(columnA.slice(0, 15).join('\n'));
        
    } catch (error) {
        console.error('Error processing file:', error);
        throw error;
    }
};

processXLSFile();