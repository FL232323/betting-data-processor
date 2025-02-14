import pandas as pd
import re

def transform_betting_data(file_path):
    print("Reading CSV file...")
    df = pd.read_csv(file_path)
    
    # Get the column names from the first 13 rows
    column_names = ['Date Placed', 'Status', 'League', 'Match', 'Bet Type', 'Market', 
                   'Price', 'Wager', 'Winnings', 'Payout', 'Potential Payout', 'Result', 'Bet Slip ID']
    print(f"Found {len(column_names)} column names")
    
    transformed_rows = []
    i = 13  # Start after the header rows
    
    while i < len(df):
        curr_value = df['Data'].iloc[i]
        
        # Check if this is a parent bet (contains @)
        if isinstance(curr_value, str) and '@' in curr_value:
            print(f"Processing bet starting at row {i}")
            
            # Count expected legs from the Match row (3 rows after parent start)
            match_row = df['Data'].iloc[i+3]  # Row with repeated games
            expected_legs = match_row.count('vs') if isinstance(match_row, str) else 0
            print(f"Expecting {expected_legs} legs based on game count")
            
            # Collect parent bet values (13 rows)
            parent_values = []
            for j in range(13):
                if i + j < len(df):
                    parent_values.append(df['Data'].iloc[i + j])
                else:
                    parent_values.append('')
            
            transformed_rows.append(parent_values)
            i += 13  # Move past parent bet
            
            # Process each leg (8 rows per leg)
            for leg in range(expected_legs):
                leg_values = []
                if leg == 0:  # First leg starts at Status
                    leg_values = ['']  # Empty Date Placed
                    for j in range(7):  # Get next 7 values
                        if i + j < len(df):
                            leg_values.append(df['Data'].iloc[i + j])
                else:  # Subsequent legs include Date Placed
                    for j in range(8):  # Get all 8 values
                        if i + j < len(df):
                            leg_values.append(df['Data'].iloc[i + j])
                
                # Pad to 13 columns if needed
                while len(leg_values) < 13:
                    leg_values.append('')
                
                transformed_rows.append(leg_values)
                i += 8  # Move to next leg
            
            print(f"Processed {expected_legs} legs for this parlay")
        else:
            i += 1
    
    print(f"Creating final DataFrame with {len(transformed_rows)} rows")
    result_df = pd.DataFrame(transformed_rows, columns=column_names)
    
    # Split into single bets and parlays
    is_parlay = result_df['Bet Type'].str.contains('MULTIPLE', na=False)
    singles_df = result_df[~is_parlay].copy()
    parlays_df = result_df[is_parlay].copy()
    
    # Create parlay legs dataframe
    legs_df = result_df[result_df['Date Placed'].isna()].copy()
    
    return singles_df, parlays_df, legs_df

def process_betting_data(input_csv, output_directory="."):
    try:
        print("Starting transformation...")
        singles_df, parlays_df, legs_df = transform_betting_data(input_csv)
        
        print("Saving to CSV files...")
        singles_df.to_csv(f"{output_directory}/single_bets.csv", index=False)
        parlays_df.to_csv(f"{output_directory}/parlay_headers.csv", index=False)
        legs_df.to_csv(f"{output_directory}/parlay_legs.csv", index=False)
        
        print(f"Processed {len(singles_df)} single bets")
        print(f"Processed {len(parlays_df)} parlays")
        print(f"Processed {len(legs_df)} parlay legs")
        
        return {
            'single_bets': f"{output_directory}/single_bets.csv",
            'parlay_headers': f"{output_directory}/parlay_headers.csv",
            'parlay_legs': f"{output_directory}/parlay_legs.csv"
        }
    except Exception as e:
        print(f"Error: {str(e)}")
        raise

if __name__ == "__main__":
    input_file = "converted_dates.csv"
    output_dir = "."
    process_betting_data(input_file, output_dir)