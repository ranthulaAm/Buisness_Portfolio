import sys

with open("components/AdminClients.tsx", "r") as f:
    content = f.read()

# Change how editMobileValue is initialized
content = content.replace(
    "setEditMobileValue(client.mobiles.size > 0 ? Array.from(client.mobiles)[0] as string : '');",
    "setEditMobileValue(client.mobiles.size > 0 ? Array.from(client.mobiles).join(', ') : '');"
)

# Change placeholder
content = content.replace(
    'placeholder="New mobile number"',
    'placeholder="Multiple numbers? Separate by comma"'
)

# Render them nicely
content = content.replace(
"""                             {c.mobiles.size > 0 ? (
                               Array.from(c.mobiles).map((m: any, idx) => (
                                 <span key={idx}>{m}</span>
                               ))
                             ) : (""",
"""                             {c.mobiles.size > 0 ? (
                               Array.from(c.mobiles).flatMap((m: any) => m.split(',')).map(m => m.trim()).filter(Boolean).map((m: any, idx) => (
                                 <span key={idx} className="bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px] mb-1 mr-1 inline-block">{m}</span>
                               ))
                             ) : ("""
)

with open("components/AdminClients.tsx", "w") as f:
    f.write(content)
