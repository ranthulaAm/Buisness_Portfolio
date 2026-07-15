import { collection, doc, getDocs, updateDoc, setDoc, deleteDoc, addDoc, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from './firebase';
import type { Unsubscribe } from 'firebase/firestore';
import { WheelSegment } from '../types';

export interface SkillItem {
  id?: string;
  name: string;
  level: number; // 1-100 or 1-5
  hidden?: boolean;
  order?: number;
}

export interface EducationItem {
  id?: string;
  degree: string;
  institution: string;
  year: string;
  description: string;
  hidden?: boolean;
  order?: number;
}

export interface ExperienceItem {
  id?: string;
  role: string;
  company: string;
  period: string;
  description: string;
  hidden?: boolean;
  order?: number;
}

export interface ContactMessage {
  id?: string;
  name: string;
  email?: string;
  whatsapp?: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  clientId?: string;
}

export interface PortfolioItem {
  id?: string;
  title: string;
  category: string;
  description: string;
  img: string;
  videoUrl?: string;
  order?: number;
  hidden?: boolean;
}

export interface ServiceItem {
  id: string; // The service ID
  price: number;
  discountPercentage?: number;
  hidden?: boolean;
  isCustom?: boolean;
  title?: string;
  description?: string;
  image?: string;
  features?: string[];
}

export const getPortfolioItems = async (): Promise<PortfolioItem[]> => {
  const q = query(collection(db, 'portfolio'));
  const snapshot = await getDocs(q);
  const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PortfolioItem));
  return items.sort((a, b) => (a.order || 0) - (b.order || 0));
};

export const addPortfolioItem = async (item: Omit<PortfolioItem, 'id'>) => {
  return await addDoc(collection(db, 'portfolio'), item);
};

export const updatePortfolioItem = async (id: string, updates: Partial<PortfolioItem>) => {
  const ref = doc(db, 'portfolio', id);
  return await updateDoc(ref, updates);
};

export const deletePortfolioItem = async (id: string) => {
  const ref = doc(db, 'portfolio', id);
  return await deleteDoc(ref);
};

// === SKILLS ===
export const getSkills = async (): Promise<SkillItem[]> => {
  const snapshot = await getDocs(collection(db, 'skills'));
  const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SkillItem));
  if (data.length === 0) {
    return [
      { name: 'Adobe Illustrator', level: 90, order: 1 },
      { name: 'Adobe Photoshop', level: 90, order: 2 },
      { name: 'Adobe Lightroom', level: 80, order: 3 },
      { name: 'Adobe InDesign', level: 60, order: 4 },
      { name: 'Adobe Premiere Pro', level: 50, order: 5 },
      { name: 'Adobe After Effects', level: 50, order: 6 },
    ];
  }
  return data.sort((a, b) => (a.order || 0) - (b.order || 0));
};
export const addSkill = async (item: Omit<SkillItem, 'id'>) => addDoc(collection(db, 'skills'), item);
export const updateSkill = async (id: string, updates: Partial<SkillItem>) => updateDoc(doc(db, 'skills', id), updates);
export const deleteSkill = async (id: string) => deleteDoc(doc(db, 'skills', id));

// === EDUCATION ===
export const getEducation = async (): Promise<EducationItem[]> => {
  const snapshot = await getDocs(collection(db, 'education'));
  const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EducationItem));
  if (data.length === 0) {
    return [
      { degree: 'BA(Hons) Animation And VFX', institution: 'Falmouth University UK', year: '(UG)', description: '', order: 1 },
      { degree: 'GCE Advanced Level (A/L)', institution: 'Physical Science Stream', year: '(Pending)', description: '', order: 2 },
    ];
  }
  return data.sort((a, b) => (a.order || 0) - (b.order || 0));
};
export const addEducation = async (item: Omit<EducationItem, 'id'>) => addDoc(collection(db, 'education'), item);
export const updateEducation = async (id: string, updates: Partial<EducationItem>) => updateDoc(doc(db, 'education', id), updates);
export const deleteEducation = async (id: string) => deleteDoc(doc(db, 'education', id));

// === EXPERIENCE ===
export const getExperience = async (): Promise<ExperienceItem[]> => {
  const snapshot = await getDocs(collection(db, 'experience'));
  const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExperienceItem));
  if (data.length === 0) {
    return [
      { role: 'Designer', company: 'Wings Designs (Clothing Brand)', period: '', description: '', order: 1 },
      { role: 'Designer', company: 'Nut Nut Ceylon (Food Company)', period: '', description: '', order: 2 },
      { role: 'Designer', company: 'Vita Organic (Food exporting company)', period: '', description: '', order: 3 },
      { role: 'Freelancer', company: 'Freelancing & Academic Institutions', period: '', description: '', order: 4 },
    ];
  }
  return data.sort((a, b) => (a.order || 0) - (b.order || 0));
};
export const addExperience = async (item: Omit<ExperienceItem, 'id'>) => addDoc(collection(db, 'experience'), item);
export const updateExperience = async (id: string, updates: Partial<ExperienceItem>) => updateDoc(doc(db, 'experience', id), updates);
export const deleteExperience = async (id: string) => deleteDoc(doc(db, 'experience', id));

// === CONTACT MESSAGES ===
export const getContacts = async (): Promise<ContactMessage[]> => {
  const q = query(collection(db, 'contacts'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContactMessage));
};

export const listenToContacts = (callback: (contacts: ContactMessage[]) => void): Unsubscribe => {
  const q = query(collection(db, 'contacts'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContactMessage)));
  });
};
export const addContact = async (item: Omit<ContactMessage, 'id'>) => addDoc(collection(db, 'contacts'), item);
export const updateContact = async (id: string, updates: Partial<ContactMessage>) => updateDoc(doc(db, 'contacts', id), updates);
export const deleteContact = async (id: string) => deleteDoc(doc(db, 'contacts', id));

// Services overrides for prices and discounts
export const getServicesConfig = async (): Promise<Record<string, ServiceItem>> => {
  const q = query(collection(db, 'service_configs'));
  const snapshot = await getDocs(q);
  const configs: Record<string, ServiceItem> = {};
  snapshot.docs.forEach(doc => {
    configs[doc.id] = { id: doc.id, ...doc.data() } as ServiceItem;
  });
  return configs;
};

export const updateServiceConfig = async (id: string, config: Omit<ServiceItem, 'id'>) => {
  const ref = doc(db, 'service_configs', id);
  return await setDoc(ref, config, { merge: true });
};

export const deleteServiceConfig = async (id: string) => {
  const ref = doc(db, 'service_configs', id);
  return await deleteDoc(ref);
};

export const getAdminPassword = async (): Promise<string> => {
  const q = query(collection(db, 'settings'));
  const snapshot = await getDocs(q);
  const doc = snapshot.docs.find(d => d.id === 'adminauth');
  if (doc) {
    return doc.data().password || 'admin123';
  }
  return 'admin123';
};

export const updateAdminPassword = async (newPassword: string) => {
  const ref = doc(db, 'settings', 'adminauth');
  return await setDoc(ref, { password: newPassword }, { merge: true });
};

export const getAdminEmails = async (): Promise<string[]> => {
  try {
    const q = query(collection(db, 'settings'));
    const snapshot = await getDocs(q);
    const docItem = snapshot.docs.find(d => d.id === 'admin_users');
    if (docItem) {
      return docItem.data().emails || [];
    }
  } catch (e) {
    console.error("Error getting admin emails:", e);
  }
  return [];
};

export const updateAdminEmails = async (emails: string[]): Promise<void> => {
  const ref = doc(db, 'settings', 'admin_users');
  return await setDoc(ref, { emails }, { merge: true });
};

export interface InvoiceConfig {
  logoUrl: string;
  logoBase64?: string;
  primaryColor: string;
  secondaryColor: string;
  layoutStyle: 'modern' | 'classic' | 'minimal';
  companyName: string;
  companyAddress: string;
  taxRate?: number;
  taxName?: string;
}

export const getInvoiceConfig = async (): Promise<InvoiceConfig> => {
  try {
    const q = query(collection(db, 'settings'));
    const snapshot = await getDocs(q);
    const docItem = snapshot.docs.find(d => d.id === 'invoice');
    if (docItem) {
      const data = docItem.data();
      return { 
        logoUrl: data.logoUrl || '', 
        logoBase64: data.logoBase64 || '',
        primaryColor: data.primaryColor || '#000000', 
        secondaryColor: data.secondaryColor || '#666666',
        layoutStyle: data.layoutStyle || 'modern',
        companyName: data.companyName || 'My Company',
        companyAddress: data.companyAddress || '',
        taxRate: data.taxRate || 0,
        taxName: data.taxName || 'Tax'
      };
    }
  } catch (e) {
    console.error("Error getting invoice config:", e);
  }
  return { logoUrl: '', logoBase64: '', primaryColor: '#000000', secondaryColor: '#666666', layoutStyle: 'modern', companyName: 'My Company', companyAddress: '', taxRate: 0, taxName: 'Tax' };
};

export const updateInvoiceConfig = async (config: InvoiceConfig) => {
  const ref = doc(db, 'settings', 'invoice');
  return await setDoc(ref, config, { merge: true });
};

export interface EmailConfig {
  emailSubjectTemplate: string;
  emailBodyTemplate: string;
}

export const getEmailConfig = async (): Promise<EmailConfig> => {
  try {
    const q = query(collection(db, 'settings'));
    const snapshot = await getDocs(q);
    const docItem = snapshot.docs.find(d => d.id === 'email_template');
    if (docItem) {
      const data = docItem.data();
      return { 
        emailSubjectTemplate: data.emailSubjectTemplate || `Order Confirmation - Tracking #{orderId}`,
        emailBodyTemplate: data.emailBodyTemplate || `Dear {clientName},

Thank you for choosing DesignFlow! Your order has been successfully placed and is now Pending Review.

== ORDER DETAILS ==
ID: {orderId}
Service: {serviceType}
Price: LKR {price}
Estimated Completion: {estimatedCompletion}

You can track the live status of your design here:
{trackingUrl}

We will be in touch shortly.

Best regards,
The DesignFlow Team`
      };
    }
  } catch (e) {
    console.error("Error getting email config:", e);
  }
  return { 
    emailSubjectTemplate: `Order Confirmation - Tracking #{orderId}`,
    emailBodyTemplate: `Dear {clientName},

Thank you for choosing DesignFlow! Your order has been successfully placed and is now Pending Review.

== ORDER DETAILS ==
ID: {orderId}
Service: {serviceType}
Price: LKR {price}
Estimated Completion: {estimatedCompletion}

You can track the live status of your design here:
{trackingUrl}

We will be in touch shortly.

Best regards,
The DesignFlow Team`
  };
};

export const updateEmailConfig = async (config: EmailConfig) => {
  const ref = doc(db, 'settings', 'email_template');
  return await setDoc(ref, config, { merge: true });
};

export const getDiscountsConfig = async (): Promise<{ globalDiscount: number, isActive: boolean }> => {
  try {
    const q = query(collection(db, 'settings'));
    const snapshot = await getDocs(q);
    const docItem = snapshot.docs.find(d => d.id === 'discounts');
    if (docItem) {
      return { globalDiscount: docItem.data().globalDiscount || 0, isActive: docItem.data().isActive || false };
    }
  } catch (e) {
    console.error("Error getting discount config:", e);
  }
  return { globalDiscount: 0, isActive: false };
}

export const updateDiscountsConfig = async (config: { globalDiscount: number, isActive: boolean }) => {
  const ref = doc(db, 'settings', 'discounts');
  return await setDoc(ref, config, { merge: true });
}

export const getLuckyWheelConfig = async (): Promise<WheelSegment[]> => {
  try {
    const q = query(collection(db, 'settings'));
    const snapshot = await getDocs(q);
    const docItem = snapshot.docs.find(d => d.id === 'lucky_wheel');
    if (docItem && docItem.data().segments && docItem.data().segments.length > 0) {
      return docItem.data().segments;
    }
  } catch (e) {
    console.error("Error getting lucky wheel config:", e);
  }
  return [
    { id: 'd10', title: '10% OFF', promoCode: 'WHEEL10', color: '#6366f1', textColor: '#ffffff', description: 'Get a 10% discount on any design service order.', probability: 15 },
    { id: 'frev', title: 'Free Extra Revision', promoCode: 'WHEELREV', color: '#a855f7', textColor: '#ffffff', description: 'Get an extra round of revision for your design project.', probability: 15 },
    { id: 'd5', title: '5% OFF', promoCode: 'WHEEL5', color: '#ec4899', textColor: '#ffffff', description: 'Save 5% on your next order immediately.', probability: 15 },
    { id: 'mock', title: 'Free 3D Mockup', promoCode: 'WHEEL3D', color: '#f43f5e', textColor: '#ffffff', description: 'Receive an additional high-quality 3D visual showcase mockup.', probability: 10 },
    { id: 'd15', title: '15% OFF', promoCode: 'WHEEL15', color: '#ef4444', textColor: '#ffffff', description: 'Get a super 15% discount on your design service.', probability: 15 },
    { id: 'extra', title: 'Free Priority Support', promoCode: 'WHEELVIP', color: '#f97316', textColor: '#ffffff', description: 'Your order is bumped to high-priority status.', probability: 10 },
    { id: 'd20', title: 'MEGA 20% OFF', promoCode: 'WHEEL20', color: '#10b981', textColor: '#ffffff', description: 'Jackpot! Save a full 20% on your premium services.', probability: 10 },
    { id: 'd8', title: '8% OFF', promoCode: 'WHEEL8', color: '#06b6d4', textColor: '#ffffff', description: 'Save 8% on your selected project today.', probability: 10 },
  ];
};

export const updateLuckyWheelConfig = async (segments: WheelSegment[]) => {
  const ref = doc(db, 'settings', 'lucky_wheel');
  return await setDoc(ref, { segments }, { merge: true });
}

export interface FooterURL {
  title: string;
  url: string;
}

export interface FooterConfig {
  email: string;
  phone: string;
  location: string;
  extraUrls: FooterURL[];
  instagram: string;
  facebook: string;
}

export const getFooterConfig = async (): Promise<FooterConfig> => {
  try {
    const q = query(collection(db, 'settings'));
    const snapshot = await getDocs(q);
    const docItem = snapshot.docs.find(d => d.id === 'footer');
    if (docItem) {
      const data = docItem.data();
      return {
        email: data.email || 'ranthuls112@gmail.com',
        phone: data.phone || '+94 712 132 855',
        location: data.location || '414/2, Thuduwegedara\nKiriwaththuduwa, Homagama\nSri Lanka (10200)',
        extraUrls: data.extraUrls || [{ title: 'ranthulaam.github.io/portfolio', url: 'https://ranthulaam.github.io/portfolio/' }],
        instagram: data.instagram || 'https://www.instagram.com/_razor_s/',
        facebook: data.facebook || 'https://web.facebook.com/Ranthula.senmith'
      };
    }
  } catch (e) {
    console.error("Error getting footer config:", e);
  }
  return {
    email: 'ranthuls112@gmail.com',
    phone: '+94 712 132 855',
    location: '414/2, Thuduwegedara\nKiriwaththuduwa, Homagama\nSri Lanka (10200)',
    extraUrls: [{ title: 'ranthulaam.github.io/portfolio', url: 'https://ranthulaam.github.io/portfolio/' }],
    instagram: 'https://www.instagram.com/_razor_s/',
    facebook: 'https://web.facebook.com/Ranthula.senmith'
  };
};

export const updateFooterConfig = async (config: FooterConfig) => {
  const ref = doc(db, 'settings', 'footer');
  return await setDoc(ref, config, { merge: true });
};

export interface Testimonial {
  id?: string;
  clientName: string;
  projectRole: string;
  feedback: string;
  order?: number;
  rating?: number;
}

export const getTestimonials = async (): Promise<Testimonial[]> => {
  const q = query(collection(db, 'testimonials'));
  const snapshot = await getDocs(q);
  const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Testimonial));
  return items.sort((a, b) => (a.order || 0) - (b.order || 0));
};

export const addTestimonial = async (item: Omit<Testimonial, 'id'>) => {
  return await addDoc(collection(db, 'testimonials'), item);
};

export const updateTestimonial = async (id: string, updates: Partial<Testimonial>) => {
  const ref = doc(db, 'testimonials', id);
  return await updateDoc(ref, updates);
};

export const deleteTestimonial = async (id: string) => {
  const ref = doc(db, 'testimonials', id);
  return await deleteDoc(ref);
};


export interface DisplayConfig {
  showServiceAnimations: boolean;
  enableServiceWheel?: boolean;
  enableDiscountWheel?: boolean;
}

export const getDisplayConfig = async (): Promise<DisplayConfig> => {
  try {
    const q = query(collection(db, 'settings'));
    const snapshot = await getDocs(q);
    const docItem = snapshot.docs.find(d => d.id === 'display_config');
    if (docItem) {
      const data = docItem.data();
      return { 
        showServiceAnimations: data.showServiceAnimations || false,
        enableServiceWheel: data.enableServiceWheel !== false, // default true
        enableDiscountWheel: data.enableDiscountWheel !== false // default true
      };
    }
  } catch (e) {
    console.error("Error getting display config:", e);
  }
  return { showServiceAnimations: false, enableServiceWheel: true, enableDiscountWheel: true };
}

export const updateDisplayConfig = async (config: DisplayConfig) => {
  const ref = doc(db, 'settings', 'display_config');
  return await setDoc(ref, config, { merge: true });
}


export const trackPresence = async () => {
  let visitorId = localStorage.getItem('visitor_id');
  if (!visitorId) {
    visitorId = 'visitor_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('visitor_id', visitorId);
  }
  
  try {
    await setDoc(doc(db, 'presence', visitorId), {
      lastActive: Date.now(),
      path: window.location.pathname
    }, { merge: true });
  } catch (e) {
    // Silently fail if they don't have the proper rules set up for presence tracking yet
  }
};

export const listenToActiveUsers = (callback: (count: number) => void): Unsubscribe => {
  // Listen to users active in the last 2 hours to keep the working set small
  const q = query(collection(db, 'presence'), where('lastActive', '>', Date.now() - 7200000));
  let latestDocs: any[] = [];
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    latestDocs = snapshot.docs.map(d => d.data());
    updateCount();
  }, (error) => {
    console.warn("Could not listen to presence:", error);
  });
  
  const updateCount = () => {
    const threshold = Date.now() - 45000; // 45 seconds
    const activeCount = latestDocs.filter(d => d.lastActive > threshold).length;
    callback(activeCount);
  };
  
  const interval = setInterval(updateCount, 5000);
  
  return () => {
    unsubscribe();
    clearInterval(interval);
  };
};
