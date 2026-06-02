import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, where, deleteDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
const firebaseConfig = {
  apiKey: "AIzaSyBzgOuPbzGfOGey_nIUWhAJ0WqGVM1nGgg",
  authDomain: "byte-and-bite-a668c.firebaseapp.com",
  projectId: "byte-and-bite-a668c",
  storageBucket: "byte-and-bite-a668c.firebasestorage.app",
  messagingSenderId: "92084492666",
  appId: "1:92084492666:web:f1fc73818c55037dc3dec3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  async agregarBookmark(userId: string, alimento: any) {
    await addDoc(collection(db, 'bookmarks'), {
      userId,
      nombre: alimento.nombre,
      categoria: alimento.categoria,
      kcal: alimento.kcal,
      gramos: alimento.gramos,
      img: alimento.img
    });
  }

  async getBookmarks(userId: string) {
    const q = query(collection(db, 'bookmarks'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }));
  }

  async eliminarBookmark(id: string) {
    await deleteDoc(doc(db, 'bookmarks', id));
  }

  async getProfile(userId: string) {
    const docRef = doc(db, 'profiles', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      return null;
    }
  }

  async updateProfile(userId: string, data: any) {
    const docRef = doc(db, 'profiles', userId);
    await setDoc(docRef, data, { merge: true });
  }

  async uploadAvatar(userId: string, dataUrl: string): Promise<string> {
    const storageRef = ref(storage, `avatars/${userId}`);
    await uploadString(storageRef, dataUrl, 'data_url');
    const downloadURL = await getDownloadURL(storageRef);
    await this.updateProfile(userId, { avatarUrl: downloadURL });
    return downloadURL;
  }
}