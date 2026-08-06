import re
with open('components/Navbar.tsx', 'r') as f:
    content = f.read()

content = re.sub(
    r'else if \(window\.history\.length > 2\) \{',
    'else if (window.history.state && window.history.state.idx > 0) {',
    content
)

with open('components/Navbar.tsx', 'w') as f:
    f.write(content)
