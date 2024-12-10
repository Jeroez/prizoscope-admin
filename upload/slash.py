import json
import os

# Get the directory of the current script
script_directory = os.path.dirname(os.path.abspath(__file__))

# Construct the full file path using os.path.join
file_name = os.path.join(script_directory, "items.json")

# Load the JSON data
with open(file_name, "r", encoding="utf-8") as file:
    items = json.load(file)

# Process each item's name
for item in items:
    name = item.get("name", "")
    # Remove all '/' characters from the name
    item["name"] = name.replace("w_", "with")

# Write the updated data back to the same file
with open(file_name, "w", encoding="utf-8") as file:
    json.dump(items, file, indent=4, ensure_ascii=False)

print("File updated successfully.")
