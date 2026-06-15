import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './config';

export async function uploadArquivo(
  file: File,
  pasta: string
): Promise<string> {
  const ext = file.name.split('.').pop();
  const nome = `${pasta}/${crypto.randomUUID()}.${ext}`;
  const storageRef = ref(storage, nome);
  const snap = await uploadBytes(storageRef, file);
  return getDownloadURL(snap.ref);
}

export async function uploadLogo(clienteId: string, file: File): Promise<string> {
  return uploadArquivo(file, `clientes/${clienteId}/logos`);
}

export async function uploadFotoProduto(
  clienteId: string,
  produtoId: string,
  file: File
): Promise<string> {
  return uploadArquivo(file, `clientes/${clienteId}/produtos/${produtoId}/fotos`);
}

export async function uploadReferenciaArte(
  clienteId: string,
  file: File
): Promise<string> {
  return uploadArquivo(file, `clientes/${clienteId}/referencias-artes`);
}

export async function deletarArquivo(url: string): Promise<void> {
  const fileRef = ref(storage, url);
  await deleteObject(fileRef);
}
