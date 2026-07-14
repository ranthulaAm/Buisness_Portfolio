import sys

content = open("pages/Tracking.tsx").read()
if "import { handleSingleDownload, handleBulkDownload } from '../utils/downloadHelpers';" not in content:
    content = content.replace("import { Order, OrderStatus, User } from '../types';", "import { Order, OrderStatus, User } from '../types';\nimport { handleSingleDownload, handleBulkDownload } from '../utils/downloadHelpers';")
    open("pages/Tracking.tsx", "w").write(content)
    print("Replaced download elements in Tracking.tsx")
else:
    print("Already fixed")
