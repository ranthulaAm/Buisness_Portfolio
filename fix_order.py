import re
with open('pages/Order.tsx', 'r') as f:
    content = f.read()

content = re.sub(
    r'<Link \n          to="\/" \n          className="fixed z-50 inline-flex items-center gap-1\.5 [^>]+>\n          <ChevronLeft[^>]+ \/>\n          <span>Back to Home<\/span>\n        <\/Link>',
    '',
    content
)

with open('pages/Order.tsx', 'w') as f:
    f.write(content)
