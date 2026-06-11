import { doc, setDoc, getDocs, collection } from 'firebase/firestore';
import { db } from './firebase';

export const seedDatabase = async () => {
    const skills = [
        { name: 'Adobe Illustrator', level: 90 },
        { name: 'Adobe Photoshop', level: 90 },
        { name: 'Adobe Lightroom', level: 80 },
        { name: 'Adobe InDesign', level: 60 },
        { name: 'Adobe Premiere Pro', level: 50 },
        { name: 'Adobe After Effects', level: 50 },
    ];
    
    const experience = [
        { role: 'Designer', company: 'Wings Designs (Clothing Brand)', period: 'Past', description: 'Designer at Wings Designs' },
        { role: 'Designer', company: 'Nut Nut Ceylon (Food Company)', period: 'Past', description: 'Designer at Nut Nut Ceylon' },
        { role: 'Designer', company: 'Vita Organic (Food exporting company)', period: 'Past', description: 'Designer at Vita Organic' },
        { role: 'Designer', company: 'Freelancing & Academic Institutions', period: 'Past', description: 'Freelancer' },
    ];
    
    const education = [
        { degree: 'BA(Hons) Animation And VFX', institution: 'Falmouth University UK', year: '(UG)', description: 'Undergraduate Studies' },
        { degree: 'GCE Advanced Level (A/L)', institution: 'Physical Science Stream', year: '(Pending)', description: 'Advanced Level' },
    ];
    
    for (const skill of skills) {
        await setDoc(doc(collection(db, 'skills')), skill);
    }
    for (const exp of experience) {
        await setDoc(doc(collection(db, 'experience')), exp);
    }
    for (const edu of education) {
        await setDoc(doc(collection(db, 'education')), edu);
    }
    console.log('seeded!');
};
