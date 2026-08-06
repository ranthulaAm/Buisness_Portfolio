import re

with open('App.tsx', 'r') as f:
    content = f.read()

# Fix Sync auth modal with URL
new_sync_logic = """  // Sync auth modal with URL
  useEffect(() => {
     const params = new URLSearchParams(location.search);
     if (params.get('auth') === 'login' && !isAuthModalOpen) {
         if (user) {
             params.delete('auth');
             const newSearch = params.toString();
             navigate(`${location.pathname}${newSearch ? `?${newSearch}` : ''}`, { replace: true });
         } else {
             setIsAuthModalOpen(true);
         }
     } else if (!params.get('auth') && isAuthModalOpen) {
         setIsAuthModalOpen(false);
     }
  }, [location.search, isAuthModalOpen, user, navigate, location.pathname]);"""

content = re.sub(
    r"  // Sync auth modal with URL\n  useEffect\(\(\) => \{\n     const params = new URLSearchParams\(location\.search\);\n     if \(params\.get\('auth'\) === 'login' && !isAuthModalOpen\) \{\n         setIsAuthModalOpen\(true\);\n     \} else if \(!params\.get\('auth'\) && isAuthModalOpen\) \{\n         setIsAuthModalOpen\(false\);\n     \}\n  \}, \[location\.search\]\);",
    new_sync_logic,
    content
)

new_close_logic = """  const closeAuthModal = () => {
      const params = new URLSearchParams(location.search);
      params.delete('auth');
      const newSearch = params.toString();
      navigate(`${location.pathname}${newSearch ? `?${newSearch}` : ''}`, { replace: true });
  };"""

content = re.sub(
    r"  const closeAuthModal = \(\) => \{\n      const params = new URLSearchParams\(location\.search\);\n      params\.delete\('auth'\);\n      navigate\(`\$\{location\.pathname\}\?\$\{params\.toString\(\)\}`, \{ replace: false \}\);\n  \};",
    new_close_logic,
    content
)

with open('App.tsx', 'w') as f:
    f.write(content)

