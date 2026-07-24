import re
with open('components/AdminPortfolio.tsx', 'r') as f:
    content = f.read()

content = re.sub(
    r'className="font-bold text-lg text-gray-900 dark:text-slate-100 bg-transparent border-b border-transparent hover:border-gray-300 dark:border-slate-600 focus:border-blue-500 outline-none transition-colors w-full"',
    'className="font-bold text-lg text-gray-900 dark:text-slate-100 bg-transparent placeholder-gray-400 dark:placeholder-slate-500 border-b border-transparent hover:border-gray-300 dark:border-slate-600 focus:border-blue-500 outline-none transition-colors w-full"',
    content
)

content = re.sub(
    r'className="text-sm font-bold text-blue-600 dark:text-blue-400 bg-transparent border-b border-transparent hover:border-gray-300 dark:border-slate-600 focus:border-blue-500 outline-none transition-colors flex-1"',
    'className="text-sm font-bold text-blue-600 dark:text-blue-400 bg-transparent placeholder-gray-400 dark:placeholder-slate-500 border-b border-transparent hover:border-gray-300 dark:border-slate-600 focus:border-blue-500 outline-none transition-colors flex-1"',
    content
)

content = re.sub(
    r'className="text-sm font-bold text-green-600 dark:text-green-400 bg-transparent uppercase tracking-widest border-b border-transparent hover:border-gray-300 dark:border-slate-600 focus:border-blue-500 outline-none transition-colors w-full"',
    'className="text-sm font-bold text-green-600 dark:text-green-400 bg-transparent placeholder-gray-400 dark:placeholder-slate-500 uppercase tracking-widest border-b border-transparent hover:border-gray-300 dark:border-slate-600 focus:border-blue-500 outline-none transition-colors w-full"',
    content
)

content = re.sub(
    r'className="text-sm text-gray-600 dark:text-slate-400 flex-1 min-h-\[80px\] resize-none border border-transparent hover:border-gray-200 dark:border-slate-700 focus:border-blue-500 bg-transparent rounded p-1 outline-none transition-colors w-full"',
    'className="text-sm text-gray-600 dark:text-slate-400 flex-1 min-h-[80px] resize-none border border-transparent hover:border-gray-200 dark:border-slate-700 focus:border-blue-500 bg-transparent placeholder-gray-400 dark:placeholder-slate-500 rounded p-1 outline-none transition-colors w-full"',
    content
)

with open('components/AdminPortfolio.tsx', 'w') as f:
    f.write(content)
