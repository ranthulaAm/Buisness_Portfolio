import re
with open('components/Navbar.tsx', 'r') as f:
    content = f.read()

new_logic = """          onClick={() => {
            const p = location.pathname;
            if (p === '/') {
              navigate('/', { state: { showIntro: true, skipAnimation: true } });
            } else if (p.startsWith('/dashboard') || p.startsWith('/admin')) {
              navigate('/');
            } else if (p.startsWith('/order') || p.startsWith('/upload') || p.startsWith('/tracking') || p.startsWith('/share')) {
              if (user) {
                navigate('/dashboard');
              } else {
                navigate('/');
              }
            } else {
              if (window.history.state && window.history.state.idx > 0) {
                navigate(-1);
              } else {
                navigate('/');
              }
            }
          }}"""

content = re.sub(
    r"          onClick=\{\(\) => \{\n            if \(location\.pathname === '/'\) \{\n              navigate\('/', \{ state: \{ showIntro: true, skipAnimation: true \} \}\);\n            \} else if \(window\.history\.state && window\.history\.state\.idx > 0\) \{\n              navigate\(-1\);\n            \} else \{\n              if \(location\.pathname\.startsWith\('/admin'\) \|\| location\.pathname\.startsWith\('/dashboard'\)\) \{\n                navigate\('/'\);\n              \} else if \(user\) \{\n                navigate\('/dashboard'\);\n              \} else \{\n                navigate\('/'\);\n              \}\n            \}\n          \}\}",
    new_logic,
    content
)

with open('components/Navbar.tsx', 'w') as f:
    f.write(content)
