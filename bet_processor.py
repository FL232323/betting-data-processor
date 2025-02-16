import pandas as pd
import re
from datetime import datetime

class BetProcessor:
    def __init__(self):
        self.headers = None
        self.single_bets_df = pd.DataFrame()
        self.parlay_headers_df = pd.DataFrame()
        self.parlay_legs_df = pd.DataFrame()
        self.team_stats_df = pd.DataFrame()
        self.player_stats_df = pd.DataFrame()
        self.prop_stats_df = pd.DataFrame()

    def is_date(self, value):
        """Check if a value matches the date format: D MMM YYYY @ H:MMam/pm"""
        date_pattern = r'\d{1,2}\s+[A-Za-z]{3}\s+\d{4}\s+@\s+\d{1,2}:\d{2}(?:am|pm)'
        return bool(re.match(date_pattern, str(value)))

    def is_bet_id(self, value):
        """Check if a value is a 19-digit bet ID"""
        return bool(re.match(r'^\d{19}$', str(value).strip()))

    def extract_teams(self, match_str):
        """Extract teams from match string"""
        if not isinstance(match_str, str):
            return []
        
        match_str = match_str.strip()
        if ' vs ' in match_str:
            teams = [team.strip() for team in match_str.split(' vs ')]
            return teams
        return []

    def extract_player_and_prop(self, market_str):
        """Extract player name and prop type from market string"""
        if not isinstance(market_str, str):
            return None, None
        
        if ' - ' in market_str:
            parts = market_str.split(' - ', 1)
            player = parts[0].strip()
            prop_type = parts[1].strip() if len(parts) > 1 else None
            return player, prop_type
        return None, None

    def process_csv(self, filepath):
        """Process the CSV file"""
        print("Reading CSV file...")
        df = pd.read_csv(filepath, header=None, names=['Data'])
        data = df['Data'].tolist()

        self.headers = data[:13]
        current_position = 13

        while current_position < len(data):
            curr_value = data[current_position]
            if self.is_date(curr_value):
                bet_info = data[current_position:current_position + 13]
                current_position += 13

                if current_position >= len(data):
                    break

                if "MULTIPLE" in bet_info:
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
            self.single_bets_df = pd.concat([
                self.single_bets_df,
                pd.DataFrame([bet_dict])
            ], ignore_index=True)

    def _process_parlay(self, bet_info, bet_id, data, current_position):
        """Process a parlay bet and its legs"""
        bet_dict = dict(zip(self.headers, bet_info))
        bet_dict['Bet Slip ID'] = bet_id
        
        self.parlay_headers_df = pd.concat([
            self.parlay_headers_df,
            pd.DataFrame([bet_dict])
        ], ignore_index=True)

        num_legs = bet_dict.get('Match', '').count(',') + 1 if isinstance(bet_dict.get('Match'), str) else 0
        leg_num = 1

        while leg_num <= num_legs and current_position + 7 <= len(data):
            leg_data = data[current_position:current_position + 7]
            
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

    def generate_team_stats(self):
        """Generate team-based statistics"""
        team_data = []
        
        # Process parlay legs
        for _, leg in self.parlay_legs_df.iterrows():
            if pd.notna(leg['Match']):
                teams = self.extract_teams(leg['Match'])
                if teams:
                    for team in teams:
                        team_data.append({
                            'Team': team,
                            'League': leg['League'],
                            'Result': leg['Status'],
                            'Source': 'parlay'
                        })
        
        # Process singles
        for _, bet in self.single_bets_df.iterrows():
            if pd.notna(bet.get('Match')):
                teams = self.extract_teams(bet['Match'])
                if teams:
                    for team in teams:
                        team_data.append({
                            'Team': team,
                            'League': bet['League'],
                            'Result': bet['Result'],
                            'Source': 'single'
                        })
        
        if team_data:
            team_df = pd.DataFrame(team_data)
            # Convert to absolute counts
            team_stats = team_df.groupby('Team').agg({
                'Result': lambda x: {
                    'Total_Bets': int(len(x)),
                    'Wins': int(len(x[x.isin(['Won', 'Win'])])),
                    'Losses': int(len(x[x.isin(['Lost', 'Lose'])]))
                }
            }).reset_index()
            
            # Expand the results to columns
            self.team_stats_df = pd.concat([
                team_stats['Team'],
                pd.DataFrame(team_stats['Result'].tolist())
            ], axis=1)

    def generate_player_stats(self):
        """Generate player-based statistics"""
        player_data = []
        
        # Process parlay legs
        for _, leg in self.parlay_legs_df.iterrows():
            player, prop_type = self.extract_player_and_prop(leg.get('Market', ''))
            if player:
                player_data.append({
                    'Player': player,
                    'PropType': prop_type,
                    'Result': leg['Status'],
                    'Market': leg['Market'],
                    'Selection': leg['Selection'],
                    'Price': leg['Price']
                })
        
        # Process singles
        for _, bet in self.single_bets_df.iterrows():
            player, prop_type = self.extract_player_and_prop(bet.get('Market', ''))
            if player:
                player_data.append({
                    'Player': player,
                    'PropType': prop_type,
                    'Result': bet['Result'],
                    'Market': bet['Market'],
                    'Selection': bet['Selection'],
                    'Price': bet['Price']
                })
        
        if player_data:
            player_df = pd.DataFrame(player_data)
            # Convert to absolute counts
            player_stats = player_df.groupby('Player').agg({
                'Result': lambda x: {
                    'Total_Bets': int(len(x)),
                    'Wins': int(len(x[x.isin(['Won', 'Win'])])),
                    'Losses': int(len(x[x.isin(['Lost', 'Lose'])]))
                },
                'PropType': lambda x: list(set(filter(None, x)))
            }).reset_index()
            
            # Expand the results to columns
            self.player_stats_df = pd.concat([
                player_stats['Player'],
                pd.DataFrame(player_stats['Result'].tolist()),
                player_stats['PropType'].rename('Prop_Types')
            ], axis=1)

    def generate_prop_stats(self):
        """Generate prop type statistics"""
        prop_data = []
        
        # Process parlay legs
        for _, leg in self.parlay_legs_df.iterrows():
            _, prop_type = self.extract_player_and_prop(leg.get('Market', ''))
            if prop_type:
                prop_data.append({
                    'PropType': prop_type,
                    'Result': leg['Status']
                })
        
        # Process singles
        for _, bet in self.single_bets_df.iterrows():
            _, prop_type = self.extract_player_and_prop(bet.get('Market', ''))
            if prop_type:
                prop_data.append({
                    'PropType': prop_type,
                    'Result': bet['Result']
                })
        
        if prop_data:
            prop_df = pd.DataFrame(prop_data)
            # Convert to absolute counts
            prop_stats = prop_df.groupby('PropType').agg({
                'Result': lambda x: {
                    'Total_Bets': int(len(x)),
                    'Wins': int(len(x[x.isin(['Won', 'Win'])])),
                    'Losses': int(len(x[x.isin(['Lost', 'Lose'])]))
                }
            }).reset_index()
            
            # Expand the results to columns
            self.prop_stats_df = pd.concat([
                prop_stats['PropType'],
                pd.DataFrame(prop_stats['Result'].tolist())
            ], axis=1)

    def save_to_csv(self, output_directory="."):
        """Save all DataFrames to separate CSV files"""
        print("\nGenerating statistics...")
        self.generate_team_stats()
        self.generate_player_stats()
        self.generate_prop_stats()

        # Save files
        file_paths = {
            'single_bets': f"{output_directory}/single_bets.csv",
            'parlay_headers': f"{output_directory}/parlay_headers.csv",
            'parlay_legs': f"{output_directory}/parlay_legs.csv",
            'team_stats': f"{output_directory}/team_stats.csv",
            'player_stats': f"{output_directory}/player_stats.csv",
            'prop_stats': f"{output_directory}/prop_stats.csv"
        }

        # Save each DataFrame if it's not empty
        if not self.single_bets_df.empty:
            self.single_bets_df.to_csv(file_paths['single_bets'], index=False)
            print(f"Saved {len(self.single_bets_df)} single bets")
        
        if not self.parlay_headers_df.empty:
            self.parlay_headers_df.to_csv(file_paths['parlay_headers'], index=False)
            print(f"Saved {len(self.parlay_headers_df)} parlay headers")
        
        if not self.parlay_legs_df.empty:
            self.parlay_legs_df.to_csv(file_paths['parlay_legs'], index=False)
            print(f"Saved {len(self.parlay_legs_df)} parlay legs")
        
        if not self.team_stats_df.empty:
            self.team_stats_df.to_csv(file_paths['team_stats'], index=False)
            print(f"Saved {len(self.team_stats_df)} team statistics")
        
        if not self.player_stats_df.empty:
            self.player_stats_df.to_csv(file_paths['player_stats'], index=False)
            print(f"Saved {len(self.player_stats_df)} player statistics")
        
        if not self.prop_stats_df.empty:
            self.prop_stats_df.to_csv(file_paths['prop_stats'], index=False)
            print(f"Saved {len(self.prop_stats_df)} prop type statistics")
        
        return file_paths

def process_betting_data(input_csv, output_directory="."):
    """Process betting data file and generate statistics"""
    print(f"\nProcessing {input_csv}...")
    processor = BetProcessor()
    processor.process_csv(input_csv)
    file_paths = processor.save_to_csv(output_directory)
    print("\nProcessing complete!")
    return processor

if __name__ == "__main__":
    input_file = "converted_dates.csv"
    output_dir = "."
    processor = process_betting_data(input_file, output_dir)