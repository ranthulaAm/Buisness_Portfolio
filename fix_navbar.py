import re
with open('components/Navbar.tsx', 'r') as f:
    content = f.read()

# Imports
content = re.sub(
    r'import \{ LogOut, Moon, Sun, Upload \} from \'lucide-react\';\nimport \{ useNavigate \} from \'react-router-dom\';',
    'import { LogOut, Moon, Sun, Upload, ArrowLeft } from \'lucide-react\';\nimport { useNavigate, useLocation } from \'react-router-dom\';',
    content
)

# Navbar component body
content = re.sub(
    r'  const navigate = useNavigate\(\);\n  const \[isDarkMode, setIsDarkMode\] = useState\(false\);',
    '  const navigate = useNavigate();\n  const location = useLocation();\n  const [isDarkMode, setIsDarkMode] = useState(false);',
    content
)

# Replace the logo with circular back button
content = re.sub(
    r'        \{\/\* Left Side: Logo -> Return to Intro \*\/\}[\s\S]*?<\/button>',
    '''        {/* Left Side: Back Button */}
        <button 
          onClick={() => {
            if (location.pathname === '/') {
              navigate('/', { state: { showIntro: true, skipAnimation: true } });
            } else {
              navigate(-1);
            }
          }}
          className="pointer-events-auto flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 shadow-[0_8px_32px_rgba(0,0,0,0.1)] hover:scale-105 active:scale-95 transition-all text-gray-900 dark:text-white"
          title="Go Back"
        >
             <ArrowLeft size={24} strokeWidth={2.5} />
        </button>''',
    content
)

with open('components/Navbar.tsx', 'w') as f:
    f.write(content)
