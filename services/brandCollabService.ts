import { db, storage } from './firebase';
import { collection, doc, setDoc, getDoc, getDocs, deleteDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { SharedFile, ShareAccessType } from './shareService';

export interface CollabServiceLine {
  id: string; // unique ID for this line item
  serviceId: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  shareLink?: string;
  extraCharges?: { name: string, price: number }[];
  
  // New per-service management fields
  status?: 'pending' | 'in_progress' | 'review' | 'completed';
  folderName?: string; // dedicated folder for this service
  accessType?: ShareAccessType;
  accessValue?: string;
  sharedDeliverables?: string; // e.g. "banners, flyers, templates"
}

export type BillingType = 'one-time' | 'recurring';

export interface PaymentRecord {
  amount: number;
  date: number;
  method?: string;
  note?: string;
}

export interface BrandCollaboration {
  id: string;
  brandName: string;
  
  // Backwards compatibility, but now we use arrays
  contactEmail?: string;
  whatsappNumber?: string;
  contactEmails: string[];
  whatsappNumbers: string[];
  contactName?: string;

  services: CollabServiceLine[];
  additionalCharges?: { name: string, price: number }[];
  totalPrice: number;
  billingType: BillingType;
  billingIntervalDays?: number;
  nextBillingDate?: number;
  status: 'active' | 'completed' | 'archived';
  paymentStatus: 'unpaid' | 'partial' | 'paid' | 'overdue';
  paymentHistory: PaymentRecord[];
  files: SharedFile[];
  folders: string[];
  accessType: ShareAccessType;
  accessValue: string;
  createdAt: number;
  completedAt?: number;
}

export const generateCollabSlug = (name: string) => {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 6);
};

export const createBrandCollaboration = async (collab: Omit<BrandCollaboration, 'id' | 'createdAt'>): Promise<string> => {
  const id = generateCollabSlug(collab.brandName);
  const docRef = doc(db, 'brand_collaborations', id);
  await setDoc(docRef, {
    ...collab,
    id,
    createdAt: Date.now()
  });
  return id;
};

export const updateBrandCollaboration = async (id: string, updates: Partial<BrandCollaboration>) => {
  const docRef = doc(db, 'brand_collaborations', id);
  await setDoc(docRef, updates, { merge: true });
};

export const deleteBrandCollaboration = async (collab: BrandCollaboration) => {
  if (collab.files && Array.isArray(collab.files)) {
    for (const file of collab.files) {
      if (file.path) {
        try {
          const fileRef = ref(storage, file.path);
          await deleteObject(fileRef);
        } catch (e: any) {
          console.warn("Storage deletion warning (ignoring to proceed with document deletion):", e);
        }
      }
    }
  }
  await deleteDoc(doc(db, 'brand_collaborations', collab.id));
};

export const getBrandCollaboration = async (id: string): Promise<BrandCollaboration | null> => {
  const docRef = doc(db, 'brand_collaborations', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as BrandCollaboration;
  }
  return null;
};

export const listenToBrandCollaborations = (callback: (collabs: BrandCollaboration[]) => void) => {
  const q = query(collection(db, 'brand_collaborations'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const collabs: BrandCollaboration[] = [];
    snapshot.forEach(doc => {
      collabs.push(doc.data() as BrandCollaboration);
    });
    callback(collabs);
  });
};

export const uploadCollabFile = (
  collabId: string,
  file: File,
  folder: string | undefined,
  onProgress: (progress: number) => void
): Promise<SharedFile> => {
  return new Promise((resolve, reject) => {
    const filePath = `brand_collaborations/${collabId}/${Date.now()}_${file.name}`;
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
          path: filePath,
          folder
        });
      }
    );
  });
};
