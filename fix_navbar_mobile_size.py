import re
with open('components/Navbar.tsx', 'r') as f:
    content = f.read()

# Upload button padding
content = re.sub(
    r'px-3 py-2 md:px-4 md:py-2',
    'px-4 py-2.5 md:px-4 md:py-2',
    content
)

# Dash button mobile padding
content = re.sub(
    r'px-3 py-2 rounded-full text-\[10px\] font-bold uppercase tracking-widest backdrop-blur-md border border-gray-200 dark:border-slate-500 shadow-\[0_8px_30px_rgba\(0,0,0,0\.12\)\] dark:shadow-\[0_8px_30px_rgba\(0,0,0,0\.8\)\] transition-all sm:hidden',
    'px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-md border border-gray-200 dark:border-slate-500 shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.8)] transition-all sm:hidden',
    content
)

# Profile button padding
content = re.sub(
    r'px-2 py-1\.5 md:px-4 md:py-2',
    'px-3 py-2 md:px-4 md:py-2',
    content
)

# Sign In button padding
content = re.sub(
    r'hover:bg-gray-200 px-3 py-2 md:px-4 md:py-2 rounded-full text-\[10px\] md:text-xs',
    'hover:bg-gray-200 px-4 py-2.5 md:px-4 md:py-2 rounded-full text-xs md:text-xs',
    content
)


# Icons size
content = re.sub(r'<Upload size=\{14\}', '<Upload size={18}', content)
content = re.sub(r'<Sun size=\{14\}', '<Sun size={18}', content)
content = re.sub(r'<Moon size=\{14\}', '<Moon size={18}', content)

# Remove md:w-4 md:h-4 to let size control it, or change it to md:w-[18px] md:h-[18px]
content = re.sub(r'className="md:w-4 md:h-4"', 'className="w-[18px] h-[18px]"', content)

with open('components/Navbar.tsx', 'w') as f:
    f.write(content)
