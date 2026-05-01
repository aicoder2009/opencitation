import re

with open("src/app/projects/[id]/page.tsx", "r") as f:
    content = f.read()

if "fetchProjectAndLists" not in content:
    print("Function not found")
else:
    print("Function found")
