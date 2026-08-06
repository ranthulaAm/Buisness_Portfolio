import re
with open('components/Navbar.tsx', 'r') as f:
    content = f.read()

# Replace shadow-sm with the new shadow
content = re.sub(
    r'shadow-sm transition-colors',
    'shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] transition-all',
    content
)

# For dashboard button (hidden sm:block)
content = re.sub(
    r'transition-colors hidden sm:block',
    'shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] transition-all hidden sm:block',
    content
)

# For dashboard button (sm:hidden)
content = re.sub(
    r'transition-colors sm:hidden',
    'shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] transition-all sm:hidden',
    content
)

# For User profile container
content = re.sub(
    r'shadow-\[0_8px_32px_rgba\(0,0,0,0\.12\)\]',
    'shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]',
    content
)

# For Sign In button
content = re.sub(
    r'dark:border-slate-700 transition-colors">\n               Sign In',
    'dark:border-slate-700 shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] transition-all">\n               Sign In',
    content
)


with open('components/Navbar.tsx', 'w') as f:
    f.write(content)
