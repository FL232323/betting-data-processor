import pandas as pd

def transform_betting_data(file_path):
    print("Reading CSV file...")
    df = pd.read_csv(file_path)
    
    # Get the column names from the first 13 rows
    column_names = ['Date Placed'] + df['Date Placed'].iloc[0:12].tolist()
    print(f"Found {len(column_names)} column names")
    
    transformed_rows = []
    i = 13  # Start after the header rows
    
    while i < len(df):
        curr_value = df['Date Placed'].iloc[i]
        
        # Check if this is a parent bet (contains @)
        if isinstance(curr_value, str) and '@' in curr_value:
            print(f"Processing parlay starting at row {i}")
            
            # Count expected legs from the Match row (3 rows after parent start)
            match_row = df['Date Placed'].iloc[i+3]  # Row with repeated games
            expected_legs = match_row.count('vs') if isinstance(match_row, str) else 0
            print(f"Expecting {expected_legs} legs based on game count")
            
            # Collect parent bet values (13 rows)
            parent_values = []
            for j in range(13):
                if i + j < len(df):
                    parent_values.append(df['Date Placed'].iloc[i + j])
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
                            leg_values.append(df['Date Placed'].iloc[i + j])
                else:  # Subsequent legs include Date Placed
                    for j in range(8):  # Get all 8 values
                        if i + j < len(df):
                            leg_values.append(df['Date Placed'].iloc[i + j])
                
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
    return result_df

if __name__ == "__main__":
    try:
        print("Starting transformation...")
        df = transform_betting_data('converted_dates.csv')
        print("Saving to CSV...")
        df.to_csv('transformed_betting_data.csv', index=False)
        
        # Split into the three files
        singles = []
        parlays = []
        legs = []
        
        for i, row in df.iterrows():
            if pd.isna(row['Date Placed']):
                # This is a leg
                legs.append(row)
            elif 'MULTIPLE' in str(row['Bet Type']):
                # This is a parlay header
                parlays.append(row)
            else:
                # This is a single bet
                singles.append(row)
        
        # Save to separate CSV files
        pd.DataFrame(singles).to_csv('single_bets.csv', index=False)
        pd.DataFrame(parlays).to_csv('parlay_headers.csv', index=False)
        pd.DataFrame(legs).to_csv('parlay_legs.csv', index=False)
        
        print(f"Saved {len(singles)} single bets")
        print(f"Saved {len(parlays)} parlay headers")
        print(f"Saved {len(legs)} parlay legs")
        print("Transformation complete!")
    except Exception as e:
        print(f"Error: {str(e)}")
