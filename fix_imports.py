import sys

with open("services/dataService.ts", "r") as f:
    content = f.read()

content = content.replace("import { collection, doc, getDocs, updateDoc, setDoc, deleteDoc, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore';", "import { collection, doc, getDocs, updateDoc, setDoc, deleteDoc, addDoc, query, orderBy, onSnapshot, where } from 'firebase/firestore';")

with open("services/dataService.ts", "w") as f:
    f.write(content)
