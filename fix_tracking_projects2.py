import re
with open('pages/Tracking.tsx', 'r') as f:
    content = f.read()

content = re.sub(
    r'<button[\s\S]*?<span>Back to Projects<\/span>\n          <\/button>',
    '',
    content
)

with open('pages/Tracking.tsx', 'w') as f:
    f.write(content)
