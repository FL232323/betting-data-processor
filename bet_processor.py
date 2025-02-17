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