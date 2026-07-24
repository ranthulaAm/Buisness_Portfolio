import re
with open('components/AdminSettings.tsx', 'r') as f:
    content = f.read()

content = re.sub(
    r'className="w-full border border-gray-300 dark:border-slate-600 rounded-xl p-3 outline-none focus:border-purple-500"',
    'className="w-full border border-gray-300 dark:border-slate-600 rounded-xl p-3 outline-none focus:border-purple-500 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500"',
    content
)

with open('components/AdminSettings.tsx', 'w') as f:
    f.write(content)
