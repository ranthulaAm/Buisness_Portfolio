import sys

with open("pages/AdminDashboard.tsx", "r") as f:
    content = f.read()

# Fix whatsapp message sending
content = content.replace(
    "const url = `https://api.whatsapp.com/send?phone=${order.mobile.replace(/[^0-9]/g, '')}&text=${encodeURIComponent(messageText)}`;",
    "const firstMobile = Array.isArray(order.mobile) ? (order.mobile[0] || '') : (order.mobile || '');\n      const url = `https://api.whatsapp.com/send?phone=${firstMobile.replace(/[^0-9]/g, '')}&text=${encodeURIComponent(messageText)}`;"
)

# Fix existing.mobiles.add(o.mobile) 
old_add = "if (o.mobile) existing.mobiles.add(o.mobile);"
new_add = """if (o.mobile) {
                                 if (Array.isArray(o.mobile)) {
                                    o.mobile.forEach((m: string) => existing.mobiles.add(m));
                                 } else {
                                    existing.mobiles.add(o.mobile as string);
                                 }
                              }"""
content = content.replace(old_add, new_add)

with open("pages/AdminDashboard.tsx", "w") as f:
    f.write(content)
