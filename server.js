import express from 'express';
import multer from 'multer';
import { exec, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import util from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
    fs.writeFileSync('uploads/.gitkeep', '');
}

const upload = multer({ dest: 'uploads/' });

app.use(express.static('.'));

app.post('/process', upload.single('file'), async (req, res) => {
    try {
        // Copy uploaded file to All_Bets_Export.xls
        fs.copyFileSync(req.file.path, 'All_Bets_Export.xls');
        console.log('File copied to All_Bets_Export.xls');

        // Run convert.js
        console.log('\n=== Running convert.js ===');
        execSync('node convert.js');
        console.log('Conversion complete');

        // Run Python script
        console.log('\n=== Running bet_processor.py ===');
        execSync('python bet_processor.py');
        console.log('Python processing complete');

        try {
            // Read and verify CSV structure
            const singles = await fs.promises.readFile('single_bets.csv', 'utf8');
            const parlays = await fs.promises.readFile('parlay_headers.csv', 'utf8');
            const legs = await fs.promises.readFile('parlay_legs.csv', 'utf8');

            console.log("\n=== CSV Structure Verification ===");
            console.log("Singles first line:", singles.split('\n')[0]);
            console.log("Parlays first line:", parlays.split('\n')[0]);
            console.log("Legs first line:", legs.split('\n')[0]);

            // Parse CSVs and calculate statistics
            const data = {
                singles: parseCSV(singles),
                parlays: parseCSV(parlays),
                legs: parseCSV(legs),
                stats: calculateStats(parseCSV(singles), parseCSV(parlays))
            };

            console.log("\n=== Data Structure Summary ===");
            console.log("Singles count:", data.singles.length);
            console.log("Parlays count:", data.parlays.length);
            console.log("Legs count:", data.legs.length);
            
            // Sample check first record of each
            console.log("First single bet:", util.inspect(data.singles[0], {depth: null, colors: true}));
            console.log("First parlay:", util.inspect(data.parlays[0], {depth: null, colors: true}));

            // Clean up temporary files
            fs.unlinkSync(req.file.path);
            fs.unlinkSync('All_Bets_Export.xls');
            fs.unlinkSync('converted_dates.csv');

            res.json({
                message: 'Processing complete! Data displayed below.',
                data: data
            });
        } catch (error) {
            console.error('Error reading or parsing files:', error);
            res.json({ message: 'Error reading or parsing files: ' + error });
        }
    } catch (error) {
        console.error('Processing error:', error);
        res.json({ message: 'Error processing: ' + error });
    }
});

// Helper function to parse CSV
function parseCSV(csvString) {
    console.log("\n=== CSV Parsing Debug ===");
    console.log("First 200 chars of CSV:", csvString.substring(0, 200));
    
    const lines = csvString.trim().split('\n');
    console.log("Number of lines:", lines.length);
    console.log("Headers:", lines[0]);
    
    const headers = lines[0].split(',');
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index];
        });
        data.push(row);
        
        // Log first and last row for debugging
        if (i === 1 || i === lines.length - 1) {
            console.log(`Row ${i} data:`, util.inspect(row, {depth: null, colors: true}));
        }
    }

    return data;
}

// Helper function to calculate statistics
function calculateStats(singles, parlays) {
    console.log("\n=== Calculating Statistics ===");
    console.log("Singles count:", singles.length);
    console.log("Parlays count:", parlays.length);

    const stats = {
        wins: singles.filter(bet => bet.Result === 'Won').length + 
              parlays.filter(bet => bet.Result === 'Won').length,
        losses: singles.filter(bet => bet.Result === 'Lost').length + 
                parlays.filter(bet => bet.Result === 'Lost').length,
        sportsDist: {},
        profitTimeline: {
            dates: [],
            profits: []
        }
    };

    console.log("Wins:", stats.wins);
    console.log("Losses:", stats.losses);

    // Calculate sports distribution
    singles.concat(parlays).forEach(bet => {
        if (bet.League) {
            stats.sportsDist[bet.League] = (stats.sportsDist[bet.League] || 0) + 1;
        }
    });

    console.log("Sports distribution:", stats.sportsDist);

    // Calculate profit timeline
    const allBets = [...singles, ...parlays]
        .sort((a, b) => new Date(a['Date Placed']) - new Date(b['Date Placed']));
    
    let cumulativeProfit = 0;
    allBets.forEach(bet => {
        const profit = parseFloat(bet.Winnings) - parseFloat(bet.Wager);
        cumulativeProfit += profit;
        stats.profitTimeline.dates.push(bet['Date Placed']);
        stats.profitTimeline.profits.push(cumulativeProfit);
    });

    return stats;
}

app.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
});