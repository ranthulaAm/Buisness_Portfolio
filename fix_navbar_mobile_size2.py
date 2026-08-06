import re
with open('components/Navbar.tsx', 'r') as f:
    content = f.read()

# Make profile image slightly bigger on mobile
content = re.sub(
    r'className="w-6 h-6 md:w-8 md:h-8 rounded-full',
    'className="w-8 h-8 md:w-8 md:h-8 rounded-full',
    content
)

# And for user dropdown / sign out
content = re.sub(
    r'<LogOut size=\{16\} className="md:w-\[18px\] md:h-\[18px\]" />',
    '<LogOut size={18} className="w-[18px] h-[18px]" />',
    content
)

with open('components/Navbar.tsx', 'w') as f:
    f.write(content)
