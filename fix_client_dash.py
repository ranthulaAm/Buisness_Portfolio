import re

with open('pages/ClientDashboard.tsx', 'r') as f:
    content = f.read()

# Update activeTab state
content = re.sub(
    r"const \[activeTab, setActiveTab\] = useState\<'projects' \| 'profile'\>\(",
    "const [activeTab, setActiveTab] = useState<'projects' | 'history' | 'profile'>(",
    content
)

# Update setActiveTab('orders') to setActiveTab('projects')
content = re.sub(
    r"setActiveTab\('orders'\);",
    "setActiveTab('projects');",
    content
)

# Update handleTabChange signature
content = re.sub(
    r"const handleTabChange = \(tab: 'projects' \| 'profile'\) => \{",
    "const handleTabChange = (tab: 'projects' | 'history' | 'profile') => {",
    content
)

# Add History tab button
history_tab = """            <button 
                onClick={() => handleTabChange('history')}
                className={`pb-4 px-2 font-bold uppercase tracking-widest text-xs transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'history' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100'}`}
            >
                <Clock size={14} /> Order History
            </button>"""

content = re.sub(
    r"            <button \n                onClick=\{\(\) => handleTabChange\('profile'\)\}",
    f"{history_tab}\n            <button \n                onClick={{() => handleTabChange('profile')}}",
    content
)

# Replace <Package size={14} /> My Projects if it doesn't have icon (it currently doesn't)
content = re.sub(
    r"            <button \n                onClick=\{\(\) => handleTabChange\('projects'\)\}\n                className=\{`pb-4 px-2 font-bold uppercase tracking-widest text-xs transition-colors border-b-2 \$\{activeTab === 'projects' \? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100'\}`\}\n            >\n                My Projects\n            <\/button>",
    """            <button 
                onClick={() => handleTabChange('projects')}
                className={`pb-4 px-2 font-bold uppercase tracking-widest text-xs transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'projects' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100'}`}
            >
                <Package size={14} /> My Projects
            </button>""",
    content
)

# Add logic for active/past orders rendering
# We have a block:
#         ) : orders.length === 0 ? (
# ...
#         ) : (
#           <div className="space-y-6">
#             {orders.map(order => (

# Let's replace the orders mapping logic
content = re.sub(
    r"\) : orders\.length === 0 \? \([\s\S]*?\) : \(\n          <div className=\"space-y-6\">\n            \{orders\.map\(order => \(\n              <ProjectCard key=\{order\.id\} order=\{order\} onRequestRevision=\{\(notes\) => requestRevision\(order\.id, notes\)\} \/>\n            \)\)\}\n          <\/div>\n        \)\}",
    """) : activeTab === 'projects' ? (
          orders.filter(o => o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.CANCELLED).length === 0 ? (
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-gray-300 dark:border-slate-600 rounded-3xl p-16 text-center shadow-[0_8px_32px_rgba(0,0,0,0.12)] flex flex-col items-center">
               <div className="w-24 h-24 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                  <Package size={40} className="text-gray-300 dark:text-slate-600" />
               </div>
               <h3 className="text-2xl font-bold mb-3 text-gray-800 dark:text-slate-200">No Active Projects</h3>
               <p className="text-gray-500 dark:text-slate-400 max-w-sm mb-8 text-lg">Looks like you don't have any active projects with us.</p>
               <InteractiveButton onClick={() => navigate('/order')}>Start a Project</InteractiveButton>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.filter(o => o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.CANCELLED).map(order => (
                <ProjectCard key={order.id} order={order} onRequestRevision={(notes) => requestRevision(order.id, notes)} />
              ))}
            </div>
          )
        ) : activeTab === 'history' ? (
          orders.filter(o => o.status === OrderStatus.COMPLETED || o.status === OrderStatus.CANCELLED).length === 0 ? (
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-gray-300 dark:border-slate-600 rounded-3xl p-16 text-center shadow-[0_8px_32px_rgba(0,0,0,0.12)] flex flex-col items-center">
               <div className="w-24 h-24 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                  <Clock size={40} className="text-gray-300 dark:text-slate-600" />
               </div>
               <h3 className="text-2xl font-bold mb-3 text-gray-800 dark:text-slate-200">No Past Projects</h3>
               <p className="text-gray-500 dark:text-slate-400 max-w-sm mb-8 text-lg">Your completed and cancelled projects will appear here.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.filter(o => o.status === OrderStatus.COMPLETED || o.status === OrderStatus.CANCELLED).map(order => (
                <ProjectCard key={order.id} order={order} onRequestRevision={(notes) => requestRevision(order.id, notes)} />
              ))}
            </div>
          )
        ) : null}""",
    content
)

with open('pages/ClientDashboard.tsx', 'w') as f:
    f.write(content)

