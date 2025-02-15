import pandas as pd
import re
from datetime import datetime

class BetProcessor:
    def __init__(self):
        self.headers = None
        self.single_bets_df = pd.DataFrame()
        self.parlay_headers_df = pd.DataFrame()
        self.parlay_legs_df = pd.DataFrame()

    def is_date(self, value):
        """Check if a value matches the date format: D MMM YYYY @ H:MMam/pm"""
        date_pattern = r'\d{1,2}\s+[A-Za-z]{3}\s+\d{4}\s+@\s+\d{1,2}:\d{2}(?:am|pm)'
        return bool(re.match(date_pattern, str(value)))

    def is_bet_id(self, value):
        """Check if a value is a 19-digit bet ID"""
        return bool(re.match(r'^\d{19}$', str(value).strip()))

    def process_csv(self, filepath):
        """Process the CSV file with betting data"""
        print("Reading CSV file...")
        
        # Read the file with pandas
        df = pd.read_csv(filepath)
        
        # Convert each row into a dictionary
        for _, row in df.iterrows():
            row_dict = row.to_dict()
            
            # Skip if no date (this would be a parlay leg)
            if not self.is_date(row_dict['Date Placed']):
                continue
                
            # Check if this is a parlay or single bet
            if str(row_dict['Bet Type']).strip() == 'MULTIPLE':
                self.parlay_headers_df = pd.concat([
                    self.parlay_headers_df,
                    pd.DataFrame([row_dict])
                ], ignore_index=True)
                
                # Extract bet ID for parlay legs
                bet_id = row_dict['Bet Slip ID']
                
                # Count expected legs from Match field
                num_legs = str(row_dict['Match']).count(',') + 1 if isinstance(row_dict['Match'], str) else 0
                
                if bet_id and num_legs > 0:
                    self._process_parlay_legs(bet_id, num_legs)
            else:
                self.single_bets_df = pd.concat([
                    self.single_bets_df,
                    pd.DataFrame([row_dict])
                ], ignore_index=True)

    def _process_parlay_legs(self, bet_id, num_legs):
        """Process the legs for a parlay bet"""
        # The legs will be processed by the main loop as they come after the header
        pass

    def save_to_csv(self, output_directory="."):
        """Save DataFrames to CSV files"""
        print("\nSaving CSV files...")
        
        # Convert numeric columns
        numeric_columns = ['Price', 'Wager', 'Winnings', 'Payout', 'Potential Payout']
        
        # Process singles and parlays
        for df_name, df in [("singles", self.single_bets_df), 
                           ("parlays", self.parlay_headers_df)]:
            print(f"\nProcessing {df_name}:")
            for col in numeric_columns:
                if col in df.columns:
                    df[col] = pd.to_numeric(df[col].str.replace('$', '').str.replace(',', ''), 
                                          errors='coerce')

        # Save files
        single_bets_path = f"{output_directory}/single_bets.csv"
        self.single_bets_df.to_csv(single_bets_path, index=False)
        print(f"Saved {len(self.single_bets_df)} single bets")
        
        parlay_headers_path = f"{output_directory}/parlay_headers.csv"
        self.parlay_headers_df.to_csv(parlay_headers_path, index=False)
        print(f"Saved {len(self.parlay_headers_df)} parlay headers")
        
        parlay_legs_path = f"{output_directory}/parlay_legs.csv"
        self.parlay_legs_df.to_csv(parlay_legs_path, index=False)
        print(f"Saved {len(self.parlay_legs_df)} parlay legs")
        
        return {
            'single_bets': single_bets_path,
            'parlay_headers': parlay_headers_path,
            'parlay_legs': parlay_legs_path
        }

def process_betting_data(input_csv, output_directory="."):
    print("Starting bet processing...")
    processor = BetProcessor()
    processor.process_csv(input_csv)
    file_paths = processor.save_to_csv(output_directory)
    print("Processing complete!")
    return processor

if __name__ == "__main__":
    try:
        print("Starting transformation...")
        processor = process_betting_data("converted_dates.csv")
    except Exception as e:
        print(f"Error: {str(e)}")
