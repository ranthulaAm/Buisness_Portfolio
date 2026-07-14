import sys

content = open("pages/ClientDashboard.tsx").read()
if "import { handleSingleDownload, handleBulkDownload } from '../utils/downloadHelpers';" not in content:
    content = content.replace("import { listenToOrders, updateOrder } from '../services/storageService';", "import { listenToOrders, updateOrder } from '../services/storageService';\nimport { handleSingleDownload, handleBulkDownload } from '../utils/downloadHelpers';")
    open("pages/ClientDashboard.tsx", "w").write(content)
    print("Replaced download elements in ClientDashboard.tsx")
else:
    print("Already fixed")
