import re

with open('pages/ClientDashboard.tsx', 'r') as f:
    content = f.read()

# Update the badge logic
new_badge = """          <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border self-start ${
            order.status === OrderStatus.COMPLETED 
              ? 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' 
              : order.status === OrderStatus.CANCELLED 
                ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' 
                : isRevision 
                  ? 'bg-orange-50 text-orange-600 border-orange-200 animate-pulse dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800' 
                  : 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800'
          }`}>"""

content = re.sub(
    r"<div className=\{`px-4 py-2 rounded-full text-\[10px\] font-black uppercase tracking-widest border self-start \$\{isCompleted \? 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' : isRevision \? 'bg-orange-50 text-orange-600 border-orange-200 animate-pulse dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800' : 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800'\}`\}>",
    new_badge,
    content
)

with open('pages/ClientDashboard.tsx', 'w') as f:
    f.write(content)

