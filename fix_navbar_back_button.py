import re
with open('components/Navbar.tsx', 'r') as f:
    content = f.read()

new_logic = """          onClick={() => {
            if (location.pathname === '/') {
              navigate('/', { state: { showIntro: true, skipAnimation: true } });
            } else if (window.history.state && window.history.state.idx > 0) {
              navigate(-1);
            } else {
              if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/dashboard')) {
                navigate('/');
              } else if (user) {
                navigate('/dashboard');
              } else {
                navigate('/');
              }
            }
          }}"""

content = re.sub(
    r"          onClick=\{\(\) => \{\n            if \(location\.pathname === '/'\) \{\n              navigate\('/', \{ state: \{ showIntro: true, skipAnimation: true \} \}\);\n            \} else if \(window\.history\.state && window\.history\.state\.idx > 0\) \{\n              navigate\(-1\);\n            \} else \{\n              navigate\('/'\);\n            \}\n          \}\}",
    new_logic,
    content
)

with open('components/Navbar.tsx', 'w') as f:
    f.write(content)
