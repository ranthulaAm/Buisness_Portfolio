import os

def migrate_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Safely elevate backgrounds without collision
    content = content.replace('dark:bg-zinc-700', 'TEMP_BG_600')
    content = content.replace('dark:bg-zinc-800', 'TEMP_BG_700')
    content = content.replace('dark:bg-zinc-900', 'TEMP_BG_800')
    content = content.replace('dark:bg-black', 'TEMP_BG_900')

    # Safely elevate borders without collision
    content = content.replace('dark:border-zinc-700', 'TEMP_BORDER_600')
    content = content.replace('dark:border-zinc-800', 'TEMP_BORDER_700')

    # Restore placeholders to elevated zinc scale
    content = content.replace('TEMP_BG_600', 'dark:bg-zinc-600')
    content = content.replace('TEMP_BG_700', 'dark:bg-zinc-700')
    content = content.replace('TEMP_BG_800', 'dark:bg-zinc-800')
    content = content.replace('TEMP_BG_900', 'dark:bg-zinc-900')

    content = content.replace('TEMP_BORDER_600', 'dark:border-zinc-600')
    content = content.replace('TEMP_BORDER_700', 'dark:border-zinc-700')

    with open(filepath, 'w') as f:
        f.write(content)

for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or 'dist' in root or '.git' in root:
        continue
    for file in files:
        if file.endswith(('.tsx', '.ts', '.html', '.css')):
            migrate_file(os.path.join(root, file))

print("Done migrating to Elevated Black")
