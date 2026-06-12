import { Injectable } from '@angular/core';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, where, deleteDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { environment } from '../../environments/environment';

const firebaseConfig = {
  apiKey: environment.firebaseConfig.apiKey,
  authDomain: environment.firebaseConfig.authDomain,
  projectId: environment.firebaseConfig.projectId,
  storageBucket: environment.firebaseConfig.storageBucket,
  messagingSenderId: environment.firebaseConfig.messagingSenderId,
  appId: environment.firebaseConfig.appId
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  /**
   * @function agregarBookmark
   * @description La función será ejecutada cuando el usuario marque un alimento como favorito desde el buscador.
   * Crea e inserta de forma asíncrona un nuevo documento con la información nutricional completa en la colección 'bookmarks' de Firestore.
   */
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

  /**
   * @function getBookmarks
   * @description La función será ejecutada para poblar el listado de elementos guardados del usuario.
   * Ejecuta una consulta (query) en Firestore filtrando por el ID único del usuario actual y retorna un arreglo mapeado con los favoritos encontrados.
   */
  async getBookmarks(userId: string) {
    const q = query(collection(db, 'bookmarks'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }));
  }

  /**
   * @function eliminarBookmark
   * @description La función será ejecutada cuando el usuario decida remover un alimento de su catálogo de favoritos.
   * Obtiene la referencia única del documento mediante su ID en Firestore y efectúa una operación destructiva de borrado (deleteDoc).
   */
  async eliminarBookmark(id: string) {
    await deleteDoc(doc(db, 'bookmarks', id));
  }

  /**
   * @function getProfile
   * @description La función será ejecutada para inicializar los datos corporales en la pestaña de perfil.
   * Busca en la colección 'profiles' el documento único emparejado con el ID del usuario logueado para extraer variables como edad, peso o altura.
   */
  async getProfile(userId: string) {
    const docRef = doc(db, 'profiles', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      return null;
    }
  }

  /**
   * @function updateProfile
   * @description La función será ejecutada cuando el usuario edite y confirme cambios en sus datos corporales.
   * Impacta sobre la colección 'profiles' utilizando setDoc con la bandera { merge: true } para sobreescribir solo los campos modificados sin romper el resto del documento.
   */
  async updateProfile(userId: string, data: any) {
    const docRef = doc(db, 'profiles', userId);
    await setDoc(docRef, data, { merge: true });
  }

  /**
   * @function uploadAvatar
   * @description La función será ejecutada tras capturar una imagen con la cámara nativa o galería del celular mediante Capacitor.
   * Sube la cadena de texto base64 (DataUrl) a Firebase Storage, recupera la URL pública de descarga, actualiza el perfil del usuario y retorna dicha dirección.
   */
  async uploadAvatar(userId: string, dataUrl: string): Promise<string> {
    const storageRef = ref(storage, `avatars/${userId}`);
    await uploadString(storageRef, dataUrl, 'data_url');
    const downloadURL = await getDownloadURL(storageRef);
    await this.updateProfile(userId, { avatarUrl: downloadURL });
    return downloadURL;
  }
}