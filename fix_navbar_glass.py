import re
with open('components/Navbar.tsx', 'r') as f:
    content = f.read()

content = re.sub(
    r'backdrop-blur-xl',
    'backdrop-blur-2xl',
    content
)

with open('components/Navbar.tsx', 'w') as f:
    f.write(content)
