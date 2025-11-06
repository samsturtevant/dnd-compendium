# This file is an example of processing you might want to do to
# your vault to make it a bit more presentable / user friendly
# This one in particular cleans up dataviews to look better

import re
import glob


# Process Dataview queries into Markdown tables
def process_dataview(file_path):
    with open(file_path, "r") as file:
        content = file.read()

    # Replace `dataview` blocks with a placeholder (customize as needed)
    content = re.sub(r"```dataview([\s\S]*?)```", "Dataview Query: \\1", content)
    
    # Remove #wiki tags (they're used for filtering but shouldn't be displayed)
    # Match #wiki on its own line or at the end of a line
    content = re.sub(r"^\s*#wiki\s*$|\s+#wiki\s*$", "", content, flags=re.MULTILINE)

    with open(file_path, "w") as file:
        file.write(content)


# Find and process all Markdown files
for md_file in glob.glob(".site_content/**/*.md", recursive=True):
    process_dataview(md_file)
