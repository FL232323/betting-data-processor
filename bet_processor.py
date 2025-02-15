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
        print("\n=== Starting CSV Processing ===")
        # Read the file with a single column
        df = pd.read_csv(filepath, header=None, names=['Data'])
        data = df['Data'].tolist()

        # First 13 rows are headers
        self.headers = data[:13]
        current_position = 13  # Start after headers
        print(f"Found {len(self.headers)} headers:")
        for idx, header in enumerate(self.headers):
            print(f"{idx}: {header}")

        while current_position < len(data):
            # Look for a date which starts a new bet
            if self.is_date(data[current_position]):
                print(f"\n=== Processing new bet at position {current_position} ===")
                print(f"Date found: {data[current_position]}")
                
                # Collect the next 13 values (main bet info)
                bet_info = data[current_position:current_position + 13]
                print("Bet info collected:", bet_info)
                current_position += 13

                if current_position >= len(data):
                    break

                # Check if this is a parlay by looking for "MULTIPLE"
                if "MULTIPLE" in str(bet_info):
                    print("Found parlay bet")
                    if current_position < len(data) and self.is_bet_id(data[current_position]):
                        bet_id = data[current_position]
                        current_position += 1
                        print(f"Found bet ID: {bet_id}")
                        current_position = self._process_parlay(bet_info, bet_id, data, current_position)
                    else:
                        print("Using last value as bet ID")
                        current_position = self._process_parlay(bet_info, bet_info[-1], data, current_position)
                else:
                    print("Processing as single bet")
                    self._process_single_bet(bet_info)
            else:
                current_position += 1

        print("\n=== Processing Summary ===")
        print(f"Processed {len(self.single_bets_df)} single bets")
        print(f"Processed {len(self.parlay_headers_df)} parlays")
        print(f"Processed {len(self.parlay_legs_df)} parlay legs")

    def _process_single_bet(self, bet_info):
        """Process a single bet entry"""
        print("\n=== Processing Single Bet ===")
        print("Input data:", bet_info)
        
        if len(bet_info) == 13:
            bet_dict = dict(zip(self.headers, bet_info))
            print("Processed bet:", bet_dict)
            self.single_bets_df = pd.concat([
                self.single_bets_df,
                pd.DataFrame([bet_dict])
            ], ignore_index=True)

    def _process_parlay(self, bet_info, bet_id, data, current_position):
        """Process a parlay bet and its legs"""
        print("\n=== Processing Parlay ===")
        print("Parlay header:", bet_info)
        print("Bet ID:", bet_id)

        # Add parlay header
        bet_dict = dict(zip(self.headers, bet_info))
        bet_dict['Bet Slip ID'] = bet_id
        print("Created parlay header:", bet_dict)
        
        self.parlay_headers_df = pd.concat([
            self.parlay_headers_df,
            pd.DataFrame([bet_dict])
        ], ignore_index=True)

        # Count expected legs from Match field (commas + 1)
        num_legs = bet_dict['Match'].count(',') + 1 if isinstance(bet_dict['Match'], str) else 0
        print(f"Expecting {num_legs} legs")
        
        leg_num = 1

        # Process legs
        while leg_num <= num_legs and current_position + 7 <= len(data):
            # Each leg has 7 pieces of information
            leg_data = data[current_position:current_position + 7]
            print(f"\nProcessing leg {leg_num}:")
            print("Leg data:", leg_data)
            
            # Check if we've hit the next bet (indicated by a date)
            if self.is_date(leg_data[0]):
                print("Found date in leg data, ending parlay processing")
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
            print("Created leg entry:", leg_dict)

            self.parlay_legs_df = pd.concat([
                self.parlay_legs_df,
                pd.DataFrame([leg_dict])
            ], ignore_index=True)

            current_position += 7
            leg_num += 1

        return current_position

    def save_to_csv(self, output_directory="."):
        """Save all DataFrames to separate CSV files"""
        print("\n=== Saving to CSV ===")
        
        # Convert numeric columns
        numeric_columns = ['Price', 'Wager', 'Winnings', 'Payout', 'Potential Payout']
        
        for df_name, df in [("singles", self.single_bets_df), 
                           ("parlays", self.parlay_headers_df)]:
            print(f"\nProcessing {df_name}:")
            for col in numeric_columns:
                if col in df.columns:
                    print(f"Converting {col} to numeric")
                    df[col] = pd.to_numeric(df[col].str.replace('$', '').str.replace(',', ''), 
                                          errors='coerce')

        if 'Price' in self.parlay_legs_df.columns:
            print("\nConverting parlay legs Price to numeric")
            self.parlay_legs_df['Price'] = pd.to_numeric(self.parlay_legs_df['Price'], 
                                                        errors='coerce')

        # Save files
        print("\nWriting files:")
        single_bets_path = f"{output_directory}/single_bets.csv"
        self.single_bets_df.to_csv(single_bets_path, index=False)
        print(f"Wrote {len(self.single_bets_df)} single bets")
        
        parlay_headers_path = f"{output_directory}/parlay_headers.csv"
        self.parlay_headers_df.to_csv(parlay_headers_path, index=False)
        print(f"Wrote {len(self.parlay_headers_df)} parlay headers")
        
        parlay_legs_path = f"{output_directory}/parlay_legs.csv"
        self.parlay_legs_df.to_csv(parlay_legs_path, index=False)
        print(f"Wrote {len(self.parlay_legs_df)} parlay legs")
        
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
