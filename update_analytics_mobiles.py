import sys

with open("pages/AdminDashboard.tsx", "r") as f:
    content = f.read()

old_code = "<td className=\"p-3 text-sm text-gray-500 dark:text-slate-400\">{c.mobiles.size > 0 ? Array.from(c.mobiles).join(', ') : '-'}</td>"
new_code = "<td className=\"p-3 text-sm text-gray-500 dark:text-slate-400\">{c.mobiles.size > 0 ? Array.from(c.mobiles).flatMap(m => (m as string).split(',')).map(m => m.trim()).filter(Boolean).join(', ') : '-'}</td>"

content = content.replace(old_code, new_code)

with open("pages/AdminDashboard.tsx", "w") as f:
    f.write(content)
