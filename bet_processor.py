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
    
    # Process singles (extract teams from Match field)
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
        team_stats = team_df.groupby('Team').agg({
            'Result': lambda x: {
                'Total_Bets': len(x),
                'Wins': len(x[x.isin(['Won', 'Win'])]),
                'Losses': len(x[x.isin(['Lost', 'Lose'])])
            }
        }).reset_index()
        
        # Expand the aggregated dictionary
        team_stats = pd.concat([
            team_stats['Team'],
            pd.DataFrame(team_stats['Result'].tolist())
        ], axis=1)
        
        self.team_stats_df = team_stats