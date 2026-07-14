import sys

with open("types.ts", "r") as f:
    content = f.read()

content = content.replace("emailNotifications?: boolean;", "emailNotifications?: boolean;\n  mobiles?: string[];")

with open("types.ts", "w") as f:
    f.write(content)
