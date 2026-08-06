import re
with open('pages/ClientUpload.tsx', 'r') as f:
    content = f.read()

# Add User import
content = re.sub(
    r'import \{ db, storage \} from \'../services/firebase\';\nimport toast from \'react-hot-toast\';',
    'import { db, storage } from \'../services/firebase\';\nimport toast from \'react-hot-toast\';\nimport { User } from \'../types\';',
    content
)

# Modify ClientUpload signature and state initialization
content = re.sub(
    r'export const ClientUpload: React.FC = \(\) => \{\n  const \[formData, setFormData\] = useState\(\{\n    clientName: \'\',\n    email: \'\',\n    whatsapp: \'\',\n    eventName: \'\',\n  \}\);',
    'export const ClientUpload: React.FC<{ user?: User | null }> = ({ user }) => {\n  const [formData, setFormData] = useState({\n    clientName: user?.name || \'\',\n    email: user?.email || \'\',\n    whatsapp: user?.mobiles?.[0] || \'\',\n    eventName: \'\',\n  });\n\n  React.useEffect(() => {\n    if (user) {\n      setFormData(prev => ({\n        ...prev,\n        clientName: prev.clientName || user.name || \'\',\n        email: prev.email || user.email || \'\',\n        whatsapp: prev.whatsapp || (user.mobiles?.[0] || \'\'),\n      }));\n    }\n  }, [user]);',
    content
)

with open('pages/ClientUpload.tsx', 'w') as f:
    f.write(content)
