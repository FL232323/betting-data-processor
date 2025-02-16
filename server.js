import express from 'express';
import multer from 'multer';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Papa from 'papaparse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
    fs.writeFileSync('uploads/.gitkeep', '');
}

const upload = multer({ dest: 'uploads/' });

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

// Serve static files from the static directory
app.use('/static', express.static(path.join(__dirname, 'static')));

app.post('/process', upload.single('file'), (req, res) => {
    // Copy uploaded file to All_Bets_Export.xls
    fs.copyFileSync(req.file.path, 'All_Bets_Export.xls');

    // Run convert.js
    exec('node convert.js', async (error, stdout, stderr) => {
        if (error) {
            res.json({ message: 'Error converting to CSV: ' + error });
            return;
        }
        
        // Run Python script
        exec('python bet_processor.py', async (error, stdout, stderr) => {
            if (error) {
                console.error('Python Error:', error);
                console.error('Python stderr:', stderr);
                res.json({ message: 'Error processing with Python: ' + error });
                return;
            }

            try {
                // Read the processed CSV files
                const singles = await fs.promises.readFile('single_bets.csv', 'utf8');
                const parlays = await fs.promises.readFile('parlay_headers.csv', 'utf8');
                const legs = await fs.promises.readFile('parlay_legs.csv', 'utf8');
                const teamStats = await fs.promises.readFile('team_stats.csv', 'utf8');
                const playerStats = await fs.promises.readFile('player_stats.csv', 'utf8');
                const propStats = await fs.promises.readFile('prop_stats.csv', 'utf8');

                // Parse CSVs using Papa Parse
                const data = {
                    singles: parseCSV(singles),
                    parlays: parseCSV(parlays),
                    legs: parseCSV(legs),
                    teamStats: parseCSV(teamStats),
                    playerStats: parseCSV(playerStats),
                    propStats: parseCSV(propStats),
                    stats: calculateStats(
                        parseCSV(singles), 
                        parseCSV(parlays),
                        parseCSV(teamStats),
                        parseCSV(playerStats),
                        parseCSV(propStats)
                    )
                };

                // Clean up temporary files
                const filesToDelete = [
                    req.file.path,
                    'All_Bets_Export.xls',
                    'converted_dates.csv',
                    'single_bets.csv',
                    'parlay_headers.csv',
                    'parlay_legs.csv',
                    'team_stats.csv',
                    'player_stats.csv',
                    'prop_stats.csv'
                ];

                await Promise.all(filesToDelete.map(file => fs.promises.unlink(file).catch(() => {})));

                res.json({
                    message: 'Processing complete! Data displayed below.',
                    data: data
                });
            } catch (error) {
                console.error('Error reading processed files:', error);
                res.json({ message: 'Error reading processed files: ' + error });
            }
        });
    });
});

// Helper function to parse CSV using Papa Parse
function parseCSV(csvString) {
    const results = Papa.parse(csvString, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        quotes: true,
        quoteChar: '"'
    });
    
    return results.data;
}

// Helper function to calculate statistics
function calculateStats(singles, parlays, teamStats, playerStats, propStats) {
    console.log("\n=== Calculating Statistics ===");
    
    const stats = {
        wins: singles.filter(bet => bet.Result === 'Won').length + 
              parlays.filter(bet => bet.Result === 'Won').length,
        losses: singles.filter(bet => bet.Result === 'Lost').length + 
                parlays.filter(bet => bet.Result === 'Lost').length,
        sportsDist: {},
        profitTimeline: {
            dates: [],
            profits: []
        },
        teamPerformance: {},
        playerPerformance: {},
        propPerformance: {}
    };

    // Add team performance
    teamStats.forEach(team => {
        stats.teamPerformance[team.Team] = {
            wins: team.Wins,
            losses: team.Losses,
            totalBets: team.Total_Bets
        };
    });

    // Add player performance
    playerStats.forEach(player => {
        stats.playerPerformance[player.Player] = {
            wins: player.Wins,
            losses: player.Losses,
            totalBets: player.Total_Bets,
            propTypes: player.Prop_Types
        };
    });

    // Add prop performance
    propStats.forEach(prop => {
        stats.propPerformance[prop.PropType] = {
            wins: prop.Wins,
            losses: prop.Losses,
            totalBets: prop.Total_Bets
        };
    });

    // Calculate sports distribution
    singles.concat(parlays).forEach(bet => {
        if (bet.League) {
            stats.sportsDist[bet.League] = (stats.sportsDist[bet.League] || 0) + 1;
        }
    });

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