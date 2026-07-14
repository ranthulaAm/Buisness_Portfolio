import sys
content = open("services/shareService.ts").read()

if "folder?: string" not in content:
    content = content.replace("  path: string;\n}", "  path: string;\n  folder?: string;\n}")

open("services/shareService.ts", "w").write(content)
