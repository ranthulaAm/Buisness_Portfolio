import re
with open('components/Navbar.tsx', 'r') as f:
    content = f.read()

content = re.sub(
    r'bg-white/80 dark:bg-slate-900/80',
    'bg-white dark:bg-slate-800',
    content
)

content = re.sub(
    r'bg-gray-100 dark:bg-slate-800',
    'bg-white dark:bg-slate-800',
    content
)

with open('components/Navbar.tsx', 'w') as f:
    f.write(content)
