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

    def clean_value(self, value):
        """Clean and standardize values"""
        if value is None or pd.isna(value):
            return ""
        value = str(value).strip()
        if value.lower() in ['null', 'nan', 'none']:
            return ""
        return value

    def process_csv(self, filepath):
        """Process the single-column CSV file"""
        # Read the file with a single column, properly handling quotes
        df = pd.read_csv(filepath, header=None, names=['Data'], quotechar='"', escapechar='\\')
        data = df['Data'].tolist()

        # First 13 rows are headers
        self.headers = [self.clean_value(h) for h in data[:13]]
        current_position = 13

        while current_position < len(data):
            if self.is_date(data[current_position]):
                bet_info = [self.clean_value(v) for v in data[current_position:current_position + 13]]
                current_position += 13

                if current_position >= len(data):
                    break

                # Check for MULTIPLE in bet type
                is_parlay = any("MULTIPLE" in str(v) for v in bet_info)
                
                if is_parlay:
                    if current_position < len(data) and self.is_bet_id(data[current_position]):
                        bet_id = data[current_position]
                        current_position += 1
                        current_position = self._process_parlay(bet_info, bet_id, data, current_position)
                    else:
                        current_position = self._process_parlay(bet_info, bet_info[-1], data, current_position)
                else:
                    self._process_single_bet(bet_info)
            else:
                current_position += 1

    def _process_single_bet(self, bet_info):
        """Process a single bet entry"""
        if len(bet_info) == 13:
            bet_dict = dict(zip(self.headers, bet_info))
            # Convert numeric fields
            for field in ['Price', 'Wager', 'Winnings', 'Payout', 'Potential Payout']:
                if field in bet_dict:
                    try:
                        bet_dict[field] = float(str(bet_dict[field]).replace(',', ''))
                    except (ValueError, TypeError):
                        bet_dict[field] = 0.0
            
            self.single_bets_df = pd.concat([
                self.single_bets_df,
                pd.DataFrame([bet_dict])
            ], ignore_index=True)

    def _process_parlay(self, bet_info, bet_id, data, current_position):
        """Process a parlay bet and its legs"""
        # Add parlay header with proper numeric conversion
        bet_dict = dict(zip(self.headers, bet_info))
        bet_dict['Bet Slip ID'] = bet_id
        
        # Convert numeric fields
        for field in ['Price', 'Wager', 'Winnings', 'Payout', 'Potential Payout']:
            if field in bet_dict:
                try:
                    bet_dict[field] = float(str(bet_dict[field]).replace(',', ''))
                except (ValueError, TypeError):
                    bet_dict[field] = 0.0

        self.parlay_headers_df = pd.concat([
            self.parlay_headers_df,
            pd.DataFrame([bet_dict])
        ], ignore_index=True)

        # Count expected legs from Match field
        match_str = str(bet_dict.get('Match', ''))
        num_legs = match_str.count(',') + 1 if match_str and match_str != 'MULTIPLE' else 0
        leg_num = 1

        while leg_num <= num_legs and current_position + 7 <= len(data):
            leg_data = [self.clean_value(v) for v in data[current_position:current_position + 7]]
            
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

            # Convert Price to float
            try:
                leg_dict['Price'] = float(str(leg_dict['Price']).replace(',', ''))
            except (ValueError, TypeError):
                leg_dict['Price'] = 0.0

            self.parlay_legs_df = pd.concat([
                self.parlay_legs_df,
                pd.DataFrame([leg_dict])
            ], ignore_index=True)

            current_position += 7
            leg_num += 1

        return current_position

    def save_to_csv(self, output_directory="."):
        """Save all DataFrames to separate CSV files"""
        # Ensure numeric columns are properly formatted
        numeric_columns = ['Price', 'Wager', 'Winnings', 'Payout', 'Potential Payout']
        
        for df in [self.single_bets_df, self.parlay_headers_df]:
            for col in numeric_columns:
                if col in df.columns:
                    df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

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