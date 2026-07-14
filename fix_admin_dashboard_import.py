import sys

content = open("pages/AdminDashboard.tsx").read()
if "import { handleSingleDownload, handleBulkDownload } from '../utils/downloadHelpers';" not in content:
    content = content.replace("import { Package, Search, Plus", "import { handleSingleDownload, handleBulkDownload } from '../utils/downloadHelpers';\nimport { Package, Search, Plus")
    open("pages/AdminDashboard.tsx", "w").write(content)
    print("Replaced import in AdminDashboard.tsx")
else:
    print("Already fixed")
