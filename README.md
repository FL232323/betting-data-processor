# Betting Data Processor

A drag-and-drop interface for processing betting data with AI analysis capabilities.

## Setup

1. Clone the repository:
```bash
git clone https://github.com/FL232323/betting-data-processor.git
cd betting-data-processor
```

2. Install dependencies:
```bash
pnpm install
```

3. Create an uploads directory:
```bash
mkdir uploads
```

4. Run the server:
```bash
node server.js
```

5. Open http://localhost:3000 in your browser

## Usage

1. Drag and drop your All_Bets_Export.xls file onto the interface
2. The system will automatically:
   - Convert the XLS to CSV
   - Process the data into three separate CSV files
   - Display visualizations of your betting data

3. View the processed data in:
   - Table format (Singles, Parlays, Parlay Legs)
   - Charts (Win/Loss Distribution, Sports Distribution, Profit Timeline)

## Requirements

- Node.js
- Python 3
- pandas library (`pip install pandas`)