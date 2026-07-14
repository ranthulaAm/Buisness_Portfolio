import sys

with open("components/AdminClients.tsx", "r") as f:
    content = f.read()

old_add = "if (o.mobile) existing.mobiles.add(o.mobile);"
new_add = """if (o.mobile) {
        if (Array.isArray(o.mobile)) {
          o.mobile.forEach((m: string) => existing.mobiles.add(m));
        } else {
          existing.mobiles.add(o.mobile as string);
        }
      }"""
content = content.replace(old_add, new_add)

with open("components/AdminClients.tsx", "w") as f:
    f.write(content)
