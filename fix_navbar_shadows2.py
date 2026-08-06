import re
with open('components/Navbar.tsx', 'r') as f:
    content = f.read()

content = re.sub(
    r'dark:shadow-\[0_8px_30px_rgba\(0,0,0,0\.4\)\]',
    'dark:shadow-[0_8px_30px_rgba(0,0,0,0.8)]',
    content
)

content = re.sub(
    r'dark:shadow-\[0_8px_30px_rgba\(0,0,0,0\.5\)\]',
    'dark:shadow-[0_8px_30px_rgba(0,0,0,0.8)]',
    content
)

with open('components/Navbar.tsx', 'w') as f:
    f.write(content)
