import re
with open('components/AdminGuard.tsx', 'r') as f:
    content = f.read()

content = re.sub(
    r'<button \n            type="button"\n            onClick=\{handleBack\}\n            className="absolute top-6 left-6 inline-flex items-center gap-1[^>]+>\n            <ChevronLeft[^>]+ \/>\n            <span>Back<\/span>\n          <\/button>',
    '',
    content
)

with open('components/AdminGuard.tsx', 'w') as f:
    f.write(content)
