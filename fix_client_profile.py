import sys

with open("components/ClientProfile.tsx", "r") as f:
    content = f.read()

# Add state
content = content.replace(
    "const [emailNotifications, setEmailNotifications] = useState(user.emailNotifications !== false);",
    "const [emailNotifications, setEmailNotifications] = useState(user.emailNotifications !== false);\n  const [mobiles, setMobiles] = useState<string>(user.mobiles ? user.mobiles.join(', ') : '');"
)

# Handle save
content = content.replace(
    "avatar,",
    "avatar,\n        mobiles: mobiles.split(',').map(m => m.trim()).filter(Boolean),"
)

# Add UI
old_ui = """          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2 uppercase tracking-widest text-xs">Email Address</label>
            <input 
              type="text" 
              value={user.email} 
              disabled
              className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-gray-100 dark:bg-slate-800 font-medium text-gray-500 dark:text-slate-400 cursor-not-allowed"
            />
          </div>"""
new_ui = old_ui + """
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2 uppercase tracking-widest text-xs">Phone Numbers (comma separated)</label>
            <input 
              type="text" 
              value={mobiles} 
              onChange={(e) => setMobiles(e.target.value.replace(/[^0-9+, -]/g, ''))} 
              placeholder="+94 77 123 4567, +1 234 567 8900"
              className="w-full border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3 outline-none focus:border-purple-500 bg-white dark:bg-slate-900 font-medium text-gray-900 dark:text-slate-100 transition-colors"
            />
          </div>"""
content = content.replace(old_ui, new_ui)

with open("components/ClientProfile.tsx", "w") as f:
    f.write(content)
