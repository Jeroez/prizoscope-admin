import json
import os

def convert_int_to_string(file_path, output_file_path):
    """
    Convert 'id' and 'rating' fields from int to string in a JSON file.

    Args:
        file_path (str): Path to the input JSON file.
        output_file_path (str): Path to save the updated JSON file.

    """
    if not os.path.exists(file_path):
        print(f"Error: File not found at {file_path}")
        return
    
    # Read the JSON file with UTF-8 encoding
    with open(file_path, 'r', encoding='utf-8') as file:
        data = json.load(file)
    
    # Iterate over all items and convert 'id' and 'rating' to strings
    for item in data:
        if 'id' in item:
            item['id'] = str(item['id'])
        if 'rating' in item:
            item['rating'] = str(item['rating'])
    
    # Save the updated JSON data back to the file
    with open(output_file_path, 'w', encoding='utf-8') as file:
        json.dump(data, file, indent=4)

# Automatically determine the folder of this script
script_directory = os.path.dirname(os.path.abspath(__file__))
input_file_path = os.path.join(script_directory, "items.json")
output_file_path = os.path.join(script_directory, "updated_items.json")

convert_int_to_string(input_file_path, output_file_path)
