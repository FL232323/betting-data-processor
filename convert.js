import fs from 'fs';
import Papa from 'papaparse';

async function convertXMLtoCSV(inputFile, outputFile) {
  try {
    const xmlContent = await fs.promises.readFile(inputFile, 'utf8');
    
    // Improved regex to handle quotes and commas in data
    const dateRegex = /<ss:Data ss:Type="String">(.*?)<\/ss:Data>/g;
    const matches = [];
    let match;
    
    while ((match = dateRegex.exec(xmlContent)) !== null) {
      // Handle special characters and escape quotes
      let value = match[1].trim();
      value = value.replace(/"/g, '""'); // Escape quotes
      if (value.includes(',')) {
        value = `"${value}"`; // Wrap in quotes if contains comma
      }
      if (value) {
        matches.push([value]);
      }
    }
    
    // Convert to CSV using Papa Parse with proper escaping
    const csv = Papa.unparse(matches, {
      delimiter: ",",
      newline: "\n",
      escapeFormulae: true,
      quotes: true
    });
    
    await fs.promises.writeFile(outputFile, csv);
    console.log(`Successfully converted ${matches.length} rows`);
    
  } catch (error) {
    console.error('Error processing file:', error);
  }
}

const inputFile = 'All_Bets_Export.xls';
const outputFile = 'converted_dates.csv';

convertXMLtoCSV(inputFile, outputFile);