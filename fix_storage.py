import sys

with open("services/storageService.ts", "r") as f:
    content = f.read()

content = content.replace(
    "export const updateClientMobileByEmail = async (email: string, newMobile: string): Promise<void> => {",
    "export const updateClientMobileByEmail = async (email: string, newMobile: string | string[]): Promise<void> => {"
)
content = content.replace(
    "updatePromises.push(updateDoc(docSnap.ref, { mobile: newMobile }));",
    "updatePromises.push(updateDoc(docSnap.ref, { mobile: typeof newMobile === 'string' ? newMobile.split(',').map(n => n.trim()).filter(Boolean) : newMobile }));"
)

with open("services/storageService.ts", "w") as f:
    f.write(content)
