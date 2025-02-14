import fs from 'fs';
import Papa from 'papaparse';

// Function to convert XML export to CSV
async function convertXMLtoCSV(inputFile, outputFile) {
  try {
    // Read the input file
    const xmlContent = await fs.promises.readFile(inputFile, 'utf8');
    
    // Extract data between XML tags
    const dateRegex = /<ss:Data ss:Type="String">(.*?)<\/ss:Data>/g;
    const dates = [];
    let match;
    
    while ((match = dateRegex.exec(xmlContent)) !== null) {
      if (match[1].trim()) {  // Only add non-empty values
        dates.push([match[1].trim()]);
      }
    }
    
    // Convert to CSV using Papa Parse
    const csv = Papa.unparse(dates, {
      delimiter: ",",
      newline: "\n"
    });
    
    // Save to file
    await fs.promises.writeFile(outputFile, csv);
    
    console.log(`Successfully converted ${dates.length} rows`);
    console.log(`Output saved to ${outputFile}`);
    
  } catch (error) {
    console.error('Error processing file:', error);
  }
}

// Usage
const inputFile = 'All_Bets_Export.xls';
const outputFile = 'converted_dates.csv';

convertXMLtoCSV(inputFile, outputFile);