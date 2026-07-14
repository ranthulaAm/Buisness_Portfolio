import sys

with open("components/ClientProfile.tsx", "r") as f:
    content = f.read()

content = content.replace("const [avatar,\n        mobiles: mobiles.split(',').map(m => m.trim()).filter(Boolean), setAvatar] = useState(user.avatar);", "const [avatar, setAvatar] = useState(user.avatar);")

content = content.replace("""      await saveUserProfile({
        ...user,
        name,
        avatar,
        emailNotifications
      });""", """      await saveUserProfile({
        ...user,
        name,
        avatar,
        mobiles: mobiles.split(',').map(m => m.trim()).filter(Boolean),
        emailNotifications
      });""")

with open("components/ClientProfile.tsx", "w") as f:
    f.write(content)
