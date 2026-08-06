import re
with open('components/Navbar.tsx', 'r') as f:
    content = f.read()

content = re.sub(
    r'className="pointer-events-auto flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/50 dark:border-slate-700/50 shadow-\[0_8px_32px_rgba\(0,0,0,0\.1\)\] hover:scale-105 active:scale-95 transition-all text-gray-900 dark:text-white"',
    'className="pointer-events-auto flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-gray-300/80 dark:border-slate-600/80 shadow-[0_8px_30px_rgba(0,0,0,0.2)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:scale-105 active:scale-95 transition-all text-gray-900 dark:text-white"',
    content
)

with open('components/Navbar.tsx', 'w') as f:
    f.write(content)
