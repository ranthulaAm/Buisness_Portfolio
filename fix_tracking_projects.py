import re
with open('pages/Tracking.tsx', 'r') as f:
    content = f.read()

content = re.sub(
    r'<button \n            onClick=\{[^\}]+\}\n            className="fixed z-50 inline-flex items-center gap-1\.5 [^>]+>\n             <ChevronLeft[^>]+ \/>\n             <span>Back to Projects<\/span>\n          <\/button>',
    '',
    content
)

with open('pages/Tracking.tsx', 'w') as f:
    f.write(content)
