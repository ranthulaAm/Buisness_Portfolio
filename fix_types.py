import sys

with open("types.ts", "r") as f:
    content = f.read()

content = content.replace("mobile: string;", "mobile: string | string[];")

with open("types.ts", "w") as f:
    f.write(content)
