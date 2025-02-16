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
        if isinstance(match_str, str) and ' vs ' in match_str:
            return match_str.split(' vs ')
        return [None, None]

    def extract_player(self, market_str):
        """Extract player name from market string"""
        if isinstance(market_str, str):
            # Common patterns for player names in markets
            player_patterns = [
                r'^([A-Za-z\s]+)\s+-\s+',  # Player Name - Rest of market
                r'^([A-Za-z\s]+)\s+Over',   # Player Name Over
                r'^([A-Za-z\s]+)\s+Under'   # Player Name Under
            ]
            for pattern in player_patterns:
                match = re.match(pattern, market_str)
                if match:
                    return match.group(1).strip()
        return None

    def classify_prop_type(self, market_str):
        """Classify the type of prop bet"""
        if not isinstance(market_str, str):
            return 'Unknown'
        
        market_lower = market_str.lower()
        if 'touchdown' in market_lower or 'td' in market_lower:
            return 'Touchdown'
        elif 'passing yards' in market_lower:
            return 'Passing Yards'
        elif 'rushing yards' in market_lower:
            return 'Rushing Yards'
        elif 'receiving yards' in market_lower:
            return 'Receiving Yards'
        elif 'points' in market_lower:
            return 'Points'
        elif 'rebounds' in market_lower:
            return 'Rebounds'
        elif 'assists' in market_lower:
            return 'Assists'
        elif 'spread' in market_lower:
            return 'Spread'
        elif 'moneyline' in market_lower:
            return 'Moneyline'
        elif 'over/under' in market_lower or 'total' in market_lower:
            return 'Total'
        return 'Other'

    def process_csv(self, filepath):
        """Process the single-column CSV file"""
        print("Reading CSV file...")
        df = pd.read_csv(filepath, header=None, names=['Data'])
        data = df['Data'].tolist()

        self.headers = data[:13]
        current_position = 13

        while current_position < len(data):
            if self.is_date(data[current_position]):
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
        """Process a single bet entry with enhanced categorization"""
        if len(bet_info) == 13:
            bet_dict = dict(zip(self.headers, bet_info))
            
            # Extract teams
            team1, team2 = self.extract_teams(bet_dict.get('Match', ''))
            bet_dict['Team1'] = team1
            bet_dict['Team2'] = team2
            
            # Extract player and prop type
            bet_dict['Player'] = self.extract_player(bet_dict.get('Market', ''))
            bet_dict['PropType'] = self.classify_prop_type(bet_dict.get('Market', ''))
            
            self.single_bets_df = pd.concat([
                self.single_bets_df,
                pd.DataFrame([bet_dict])
            ], ignore_index=True)

    def _process_parlay(self, bet_info, bet_id, data, current_position):
        """Process a parlay bet and its legs with enhanced categorization"""
        bet_dict = dict(zip(self.headers, bet_info))
        bet_dict['Bet Slip ID'] = bet_id
        
        # Add categorization to parlay header
        team1, team2 = self.extract_teams(bet_dict.get('Match', ''))
        bet_dict['Team1'] = team1
        bet_dict['Team2'] = team2
        
        self.parlay_headers_df = pd.concat([
            self.parlay_headers_df,
            pd.DataFrame([bet_dict])
        ], ignore_index=True)

        num_legs = bet_dict['Match'].count(',') + 1 if isinstance(bet_dict['Match'], str) else 0
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
            
            # Add categorization to leg
            team1, team2 = self.extract_teams(leg_dict['Match'])
            leg_dict['Team1'] = team1
            leg_dict['Team2'] = team2
            leg_dict['Player'] = self.extract_player(leg_dict['Market'])
            leg_dict['PropType'] = self.classify_prop_type(leg_dict['Market'])

            self.parlay_legs_df = pd.concat([
                self.parlay_legs_df,
                pd.DataFrame([leg_dict])
            ], ignore_index=True)

            current_position += 7
            leg_num += 1

        return current_position

    def generate_team_stats(self):
        """Generate team-based statistics"""
        all_bets = pd.concat([
            self.single_bets_df[['Team1', 'Team2', 'Result', 'Wager', 'Winnings']],
            self.parlay_legs_df[['Team1', 'Team2', 'Status', 'Price']]
        ])
        
        team_stats = []
        unique_teams = pd.unique(all_bets[['Team1', 'Team2']].values.ravel())
        
        for team in unique_teams:
            if pd.isna(team):
                continue
                
            team_bets = all_bets[(all_bets['Team1'] == team) | (all_bets['Team2'] == team)]
            stats = {
                'Team': team,
                'Total_Bets': len(team_bets),
                'Wins': len(team_bets[team_bets['Result'] == 'Won']),
                'Losses': len(team_bets[team_bets['Result'] == 'Lost'])
            }
            team_stats.append(stats)
        
        self.team_stats_df = pd.DataFrame(team_stats)

    def generate_player_stats(self):
        """Generate player-based statistics"""
        all_bets = pd.concat([
            self.single_bets_df[['Player', 'Result', 'Wager', 'Winnings', 'PropType']],
            self.parlay_legs_df[['Player', 'Status', 'Price', 'PropType']]
        ])
        
        player_stats = []
        unique_players = pd.unique(all_bets['Player'].dropna())
        
        for player in unique_players:
            player_bets = all_bets[all_bets['Player'] == player]
            stats = {
                'Player': player,
                'Total_Bets': len(player_bets),
                'Wins': len(player_bets[player_bets['Result'] == 'Won']),
                'Losses': len(player_bets[player_bets['Result'] == 'Lost']),
                'Most_Common_Prop': player_bets['PropType'].mode().iloc[0] if not player_bets['PropType'].empty else 'Unknown'
            }
            player_stats.append(stats)
        
        self.player_stats_df = pd.DataFrame(player_stats)

    def generate_prop_stats(self):
        """Generate prop type statistics"""
        all_bets = pd.concat([
            self.single_bets_df[['PropType', 'Result', 'Wager', 'Winnings']],
            self.parlay_legs_df[['PropType', 'Status', 'Price']]
        ])
        
        prop_stats = []
        unique_props = pd.unique(all_bets['PropType'].dropna())
        
        for prop in unique_props:
            prop_bets = all_bets[all_bets['PropType'] == prop]
            stats = {
                'PropType': prop,
                'Total_Bets': len(prop_bets),
                'Wins': len(prop_bets[prop_bets['Result'] == 'Won']),
                'Losses': len(prop_bets[prop_bets['Result'] == 'Lost'])
            }
            prop_stats.append(stats)
        
        self.prop_stats_df = pd.DataFrame(prop_stats)

    def save_to_csv(self, output_directory="."):
        """Save all DataFrames to separate CSV files"""
        # Convert numeric columns
        numeric_columns = ['Price', 'Wager', 'Winnings', 'Payout', 'Potential Payout']
        for col in numeric_columns:
            if col in self.parlay_headers_df.columns:
                self.parlay_headers_df[col] = pd.to_numeric(self.parlay_headers_df[col], errors='coerce')

        # Generate statistics
        self.generate_team_stats()
        self.generate_player_stats()
        self.generate_prop_stats()

        # Save all files
        file_paths = {
            'single_bets': f"{output_directory}/single_bets.csv",
            'parlay_headers': f"{output_directory}/parlay_headers.csv",
            'parlay_legs': f"{output_directory}/parlay_legs.csv",
            'team_stats': f"{output_directory}/team_stats.csv",
            'player_stats': f"{output_directory}/player_stats.csv",
            'prop_stats': f"{output_directory}/prop_stats.csv"
        }

        self.single_bets_df.to_csv(file_paths['single_bets'], index=False)
        self.parlay_headers_df.to_csv(file_paths['parlay_headers'], index=False)
        self.parlay_legs_df.to_csv(file_paths['parlay_legs'], index=False)
        self.team_stats_df.to_csv(file_paths['team_stats'], index=False)
        self.player_stats_df.to_csv(file_paths['player_stats'], index=False)
        self.prop_stats_df.to_csv(file_paths['prop_stats'], index=False)
        
        return file_paths

def process_betting_data(input_csv, output_directory="."):
    processor = BetProcessor()
    processor.process_csv(input_csv)
    file_paths = processor.save_to_csv(output_directory)
    
    print(f"Processed {len(processor.single_bets_df)} single bets")
    print(f"Processed {len(processor.parlay_headers_df)} parlays")
    print(f"Processed {len(processor.parlay_legs_df)} parlay legs")
    print(f"Generated {len(processor.team_stats_df)} team statistics")
    print(f"Generated {len(processor.player_stats_df)} player statistics")
    print(f"Generated {len(processor.prop_stats_df)} prop type statistics")
    print("\nFiles created:")
    for file_type, path in file_paths.items():
        print(f"- {file_type}: {path}")
    
    return processor

if __name__ == "__main__":
    input_file = "converted_dates.csv"
    output_dir = "."
    processor = process_betting_data(input_file, output_dir)