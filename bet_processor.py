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
        """Process the single-column CSV file"""
        # Read the file with a single column
        df = pd.read_csv(filepath, header=None, names=['Data'])
        data = df['Data'].tolist()

        # First 13 rows are headers
        self.headers = data[:13]
        current_position = 13  # Start after headers

        while current_position < len(data):
            # Look for a date which starts a new bet
            if self.is_date(data[current_position]):
                # Collect the next 13 values (main bet info)
                bet_info = data[current_position:current_position + 13]
                current_position += 13

                if current_position >= len(data):
                    break

                # Check if this is a parlay by looking for "MULTIPLE"
                if "MULTIPLE" in bet_info:
                    # This is a parlay
                    if current_position < len(data) and self.is_bet_id(data[current_position]):
                        bet_id = data[current_position]
                        current_position += 1
                        current_position = self._process_parlay(bet_info, bet_id, data, current_position)
                    else:
                        current_position = self._process_parlay(bet_info, bet_info[-1], data, current_position)
                else:
                    # This is a single bet
                    self._process_single_bet(bet_info)
            else:
                current_position += 1

    def _process_single_bet(self, bet_info):
        """Process a single bet entry"""
        if len(bet_info) == 13:
            bet_dict = dict(zip(self.headers, bet_info))
            self.single_bets_df = pd.concat([
                self.single_bets_df,
                pd.DataFrame([bet_dict])
            ], ignore_index=True)

    def _process_parlay(self, bet_info, bet_id, data, current_position):
        """Process a parlay bet and its legs"""
        # Add parlay header
        bet_dict = dict(zip(self.headers, bet_info))
        bet_dict['Bet Slip ID'] = bet_id
        self.parlay_headers_df = pd.concat([
            self.parlay_headers_df,
            pd.DataFrame([bet_dict])
        ], ignore_index=True)

        # Count expected legs from Match field (commas + 1)
        num_legs = bet_dict['Match'].count(',') + 1 if isinstance(bet_dict['Match'], str) else 0
        leg_num = 1

        # Process legs
        while leg_num <= num_legs and current_position + 7 <= len(data):
            # Each leg has 7 pieces of information
            leg_data = data[current_position:current_position + 7]
            
            # Check if we've hit the next bet (indicated by a date)
            if self.is_date(leg_data[0]):
                break

            leg_dict = {
                'Parlay_ID': bet_id,
                'Leg_Number': leg_num,
                'Status': leg_data[0],
                'League': leg_data[1],
                'Match': leg_data[2],
                'Market': leg_data[3],
                'Selection': leg_data[4],
                'Price': leg_data[5],
                'Game_Date': leg_data[6]
            }

            self.parlay_legs_df = pd.concat([
                self.parlay_legs_df,
                pd.DataFrame([leg_dict])
            ], ignore_index=True)

            current_position += 7
            leg_num += 1

        return current_position

    def save_to_csv(self, output_directory="."):
        """Save all DataFrames to separate CSV files"""
        # Convert numeric columns in parlay_headers_df
        numeric_columns = ['Price', 'Wager', 'Winnings', 'Payout', 'Potential Payout']
        for col in numeric_columns:
            if col in self.parlay_headers_df.columns:
                self.parlay_headers_df[col] = pd.to_numeric(self.parlay_headers_df[col], errors='coerce')

        # Save files
        single_bets_path = f"{output_directory}/single_bets.csv"
        self.single_bets_df.to_csv(single_bets_path, index=False)
        
        parlay_headers_path = f"{output_directory}/parlay_headers.csv"
        self.parlay_headers_df.to_csv(parlay_headers_path, index=False)
        
        parlay_legs_path = f"{output_directory}/parlay_legs.csv"
        self.parlay_legs_df.to_csv(parlay_legs_path, index=False)
        
        return {
            'single_bets': single_bets_path,
            'parlay_headers': parlay_headers_path,
            'parlay_legs': parlay_legs_path
        }

def process_betting_data(input_csv, output_directory="."):
    processor = BetProcessor()
    processor.process_csv(input_csv)
    file_paths = processor.save_to_csv(output_directory)
    
    print(f"Processed {len(processor.single_bets_df)} single bets")
    print(f"Processed {len(processor.parlay_headers_df)} parlays")
    print(f"Processed {len(processor.parlay_legs_df)} parlay legs")
    print("\nFiles created:")
    for file_type, path in file_paths.items():
        print(f"- {file_type}: {path}")
    
    return processor

if __name__ == "__main__":
    input_file = "converted_dates.csv"
    output_dir = "."
    processor = process_betting_data(input_file, output_dir)