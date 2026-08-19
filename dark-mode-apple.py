import os

def migrate_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Replacing background colors
    content = content.replace('dark:bg-slate-900/50', 'dark:bg-black/50')
    content = content.replace('dark:bg-slate-900/90', 'dark:bg-black/90')
    content = content.replace('dark:bg-slate-900', 'dark:bg-black')
    content = content.replace('dark:bg-slate-800', 'dark:bg-zinc-900')
    content = content.replace('dark:bg-slate-850', 'dark:bg-zinc-800')
    content = content.replace('dark:bg-slate-700', 'dark:bg-zinc-800')
    content = content.replace('dark:bg-slate-600', 'dark:bg-zinc-700')
    
    # Replacing border colors
    content = content.replace('dark:border-slate-800', 'dark:border-zinc-800')
    content = content.replace('dark:border-slate-700', 'dark:border-zinc-800')
    content = content.replace('dark:border-slate-600', 'dark:border-zinc-700')
    
    # Replacing text colors
    content = content.replace('dark:text-slate-100', 'dark:text-white')
    content = content.replace('dark:text-slate-200', 'dark:text-gray-200')
    content = content.replace('dark:text-slate-300', 'dark:text-gray-300')
    content = content.replace('dark:text-slate-350', 'dark:text-gray-400')
    content = content.replace('dark:text-slate-400', 'dark:text-gray-400')
    content = content.replace('dark:text-slate-500', 'dark:text-gray-500')

    with open(filepath, 'w') as f:
        f.write(content)

for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or 'dist' in root or '.git' in root:
        continue
    for file in files:
        if file.endswith(('.tsx', '.ts', '.html', '.css')):
            migrate_file(os.path.join(root, file))

print("Done migrating to Apple Dark Mode")
