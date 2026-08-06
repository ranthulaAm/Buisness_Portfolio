import re
with open('components/Navbar.tsx', 'r') as f:
    content = f.read()

content = re.sub(
    r'          onClick=\{\(\) => \{\n            if \(location\.pathname === \'\/\'\) \{\n              navigate\(\'\/\', \{ state: \{ showIntro: true, skipAnimation: true \} \}\);\n            \} else \{\n              navigate\(-1\);\n            \}\n          \}\}',
    '''          onClick={() => {
            if (location.pathname === '/') {
              navigate('/', { state: { showIntro: true, skipAnimation: true } });
            } else if (window.history.length > 2) {
              navigate(-1);
            } else {
              navigate('/');
            }
          }}''',
    content
)

with open('components/Navbar.tsx', 'w') as f:
    f.write(content)
