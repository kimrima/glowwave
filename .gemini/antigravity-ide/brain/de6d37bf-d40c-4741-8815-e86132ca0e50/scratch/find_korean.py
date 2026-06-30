import re
import os
import sys

KOREAN_REGEX = re.compile('[\\uac00-\\ud7a3]+')

files_to_scan = [
    r"src/app/local/page.tsx",
    r"src/app/host/setup/page.tsx",
    r"src/app/host/dashboard/[room_id]/page.tsx",
    r"src/app/room/[room_id]/page.tsx",
    r"src/lib/translations.ts"
]

project_dir = r"c:\Users\김강산\Desktop\전광판"
output_file = r"C:\Users\김강산\Desktop\전광판\.gemini\antigravity-ide\brain\de6d37bf-d40c-4741-8815-e86132ca0e50\scratch\korean_matches.txt"

with open(output_file, 'w', encoding='utf-8') as out:
    out.write("Scanning for Korean characters in non-localized form...\n")
    
    for rel_path in files_to_scan:
        abs_path = os.path.join(project_dir, rel_path)
        if not os.path.exists(abs_path):
            out.write(f"\nFile not found: {abs_path}\n")
            continue
            
        out.write(f"\n--- {rel_path} ---\n")
        with open(abs_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            
        for i, line in enumerate(lines, 1):
            if "ko:" in line or "ko : " in line:
                continue
            if rel_path.endswith("translations.ts") and (i > 6 and i < 268):
                continue
                
            matches = KOREAN_REGEX.findall(line)
            if matches:
                clean_line = line.strip()
                if clean_line.startswith("//") or clean_line.startswith("/*") or clean_line.startswith("*"):
                    continue
                out.write(f"Line {i}: {clean_line}\n")

print("Done. Output written to scratch/korean_matches.txt")
