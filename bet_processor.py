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