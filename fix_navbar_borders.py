import re
with open('components/Navbar.tsx', 'r') as f:
    content = f.read()

content = re.sub(
    r'dark:border-slate-600/80',
    'dark:border-slate-500',
    content
)

content = re.sub(
    r'dark:border-slate-600',
    'dark:border-slate-500',
    content
)

content = re.sub(
    r'dark:border-slate-700',
    'dark:border-slate-500',
    content
)

with open('components/Navbar.tsx', 'w') as f:
    f.write(content)
