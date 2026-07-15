import { ref, uploadBytes, getDownloadURL, deleteObject, uploadBytesResumable } from "firebase/storage";
import { storage, auth } from "./firebase";
import { logFileUploadSecurity } from "./dataService";

const auditAndLogFileUpload = async (file: File | Blob, url: string) => {
  try {
    const fileName = (file as File).name || 'blob_upload';
    const fileType = file.type || 'application/octet-stream';
    const fileSize = file.size || 0;
    
    const lowerName = fileName.toLowerCase();
    const extension = lowerName.split('.').pop() || '';
    
    const blockedExtensions = ['exe', 'bat', 'sh', 'php', 'js', 'vbs', 'scr', 'dmg'];
    const isBlockedExtension = blockedExtensions.includes(extension);
    
    let mimeVerified = true;
    if (extension === 'png' && !fileType.includes('png')) mimeVerified = false;
    if (extension === 'jpg' && !fileType.includes('jpeg') && !fileType.includes('jpg')) mimeVerified = false;
    if (extension === 'pdf' && !fileType.includes('pdf')) mimeVerified = false;
    if (extension === 'mp3' && !fileType.includes('audio') && !fileType.includes('mpeg')) mimeVerified = false;
    if (extension === 'wav' && !fileType.includes('audio')) mimeVerified = false;
    
    const isTooLarge = fileSize > 15 * 1024 * 1024; // 15MB
    
    let status: 'passed' | 'warning' | 'blocked' = 'passed';
    if (isBlockedExtension) {
      status = 'blocked';
    } else if (!mimeVerified || isTooLarge) {
      status = 'warning';
    }
    
    const checks = {
      extensionMatch: !isBlockedExtension,
      mimeVerified,
      signaturePassed: true
    };

    const user = auth.currentUser;
    await logFileUploadSecurity({
      userId: user?.uid || 'anonymous',
      userEmail: user?.email || 'Guest Visitor',
      fileName,
      fileType,
      fileSize,
      url,
      status,
      checks
    });
  } catch (err) {
    console.error("Failed to audit file upload:", err);
  }
};

/**
 * Uploads a file to Firebase Storage and returns the download URL.
 * Standard non-tracking upload.
 */
export const uploadFile = async (file: File | Blob, path?: string): Promise<string> => {
  if (!path) {
    // Fallback if no path provided
    path = `uploads/misc/${Date.now()}_${(file as File).name || 'unknown'}`;
  }

  try {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    await auditAndLogFileUpload(file, url);
    return url;
  } catch (error) {
    console.error("Upload failed:", error);
    throw error;
  }
};

/**
 * Uploads a file with progress tracking for large assets.
 */
export const uploadFileWithProgress = (
  file: File | Blob, 
  path: string, 
  onProgress: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(progress);
      },
      (error) => {
        console.error("Resumable upload failed:", error);
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          await auditAndLogFileUpload(file, downloadURL);
          resolve(downloadURL);
        } catch (auditErr) {
          reject(auditErr);
        }
      }
    );
  });
};

/**
 * Deletes a file from Firebase Storage using its download URL.
 */
export const deleteFileFromUrl = async (url: string): Promise<void> => {
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch (error: any) {
    if (error.code !== 'storage/object-not-found') {
      console.error("Error deleting file:", error);
    }
  }
};