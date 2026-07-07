import { db, storage } from './firebase';
import { collection, doc, setDoc, getDoc, getDocs, deleteDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';

export interface SharedFile {
  name: string;
  url: string;
  type: string;
  size: number;
  path: string;
}

export type ShareAccessType = 'public' | 'email' | 'password';

export interface SharedProject {
  id: string; // Document ID (slug)
  clientName: string;
  accessType: ShareAccessType;
  accessValue: string; // password or email/phone
  files: SharedFile[];
  createdAt: number;
}

export const generateSlug = (name: string) => {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 6);
};

export const createSharedProject = async (project: Omit<SharedProject, 'id' | 'createdAt'>): Promise<string> => {
  const id = generateSlug(project.clientName);
  const docRef = doc(db, 'shared_projects', id);
  await setDoc(docRef, {
    ...project,
    id,
    createdAt: Date.now()
  });
  return id;
};

export const updateSharedProject = async (id: string, updates: Partial<SharedProject>) => {
  const docRef = doc(db, 'shared_projects', id);
  await setDoc(docRef, updates, { merge: true });
};

export const deleteSharedProject = async (project: SharedProject) => {
  // Delete all files first
  for (const file of project.files) {
    if (file.path) {
      try {
        const fileRef = ref(storage, file.path);
        await deleteObject(fileRef);
      } catch (e) {
        console.error("Error deleting file", e);
      }
    }
  }
  // Delete doc
  await deleteDoc(doc(db, 'shared_projects', project.id));
};

export const getSharedProject = async (id: string): Promise<SharedProject | null> => {
  const docRef = doc(db, 'shared_projects', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as SharedProject;
  }
  return null;
};

export const listenToSharedProjects = (callback: (projects: SharedProject[]) => void) => {
  const q = query(collection(db, 'shared_projects'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const projects: SharedProject[] = [];
    snapshot.forEach(doc => {
      projects.push(doc.data() as SharedProject);
    });
    callback(projects);
  });
};

export const uploadShareFile = (
  shareId: string, 
  file: File, 
  onProgress: (progress: number) => void
): Promise<SharedFile> => {
  return new Promise((resolve, reject) => {
    const filePath = `shared_projects/${shareId}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, filePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(progress);
      },
      (error) => reject(error),
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve({
          name: file.name,
          url,
          type: file.type || "",
          size: file.size,
          path: filePath
        });
      }
    );
  });
};
