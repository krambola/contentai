import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import type {
  Cliente,
  ClienteInput,
  Produto,
  ProdutoInput,
  ItemCalendario,
  Ideia,
  Roteiro,
  ConteudoBiblioteca,
  AlertaRadar,
  AnaliseNegocio,
  Arte,
} from '@/types';

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function toISOString(ts: unknown): string {
  if (ts instanceof Timestamp) return ts.toDate().toISOString();
  if (typeof ts === 'string') return ts;
  return new Date().toISOString();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function docToObj<T>(id: string, data: Record<string, any>): T {
  const result: Record<string, unknown> = { id };
  for (const key of Object.keys(data)) {
    const val = data[key];
    if (val instanceof Timestamp) {
      result[key] = toISOString(val);
    } else {
      result[key] = val;
    }
  }
  return result as T;
}

// ─── CLIENTES ────────────────────────────────────────────────────────────────

export async function getClientes(): Promise<Cliente[]> {
  const snap = await getDocs(
    query(collection(db, 'clientes'), orderBy('criadoEm', 'desc'))
  );
  return snap.docs.map((d) => docToObj<Cliente>(d.id, d.data()));
}

export async function getCliente(id: string): Promise<Cliente | null> {
  const snap = await getDoc(doc(db, 'clientes', id));
  if (!snap.exists()) return null;
  return docToObj<Cliente>(snap.id, snap.data());
}

export async function criarCliente(input: ClienteInput): Promise<string> {
  const ref = await addDoc(collection(db, 'clientes'), {
    ...input,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });
  return ref.id;
}

export async function atualizarCliente(
  id: string,
  input: Partial<ClienteInput>
): Promise<void> {
  await updateDoc(doc(db, 'clientes', id), {
    ...input,
    atualizadoEm: serverTimestamp(),
  });
}

export async function deletarCliente(id: string): Promise<void> {
  await deleteDoc(doc(db, 'clientes', id));
}

// ─── PRODUTOS ────────────────────────────────────────────────────────────────

export async function getProdutos(clienteId: string): Promise<Produto[]> {
  const snap = await getDocs(
    query(
      collection(db, 'produtos'),
      where('clienteId', '==', clienteId),
      orderBy('criadoEm', 'desc')
    )
  );
  return snap.docs.map((d) => docToObj<Produto>(d.id, d.data()));
}

export async function getProduto(id: string): Promise<Produto | null> {
  const snap = await getDoc(doc(db, 'produtos', id));
  if (!snap.exists()) return null;
  return docToObj<Produto>(snap.id, snap.data());
}

export async function criarProduto(input: ProdutoInput): Promise<string> {
  const ref = await addDoc(collection(db, 'produtos'), {
    ...input,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });
  return ref.id;
}

export async function atualizarProduto(
  id: string,
  input: Partial<ProdutoInput>
): Promise<void> {
  await updateDoc(doc(db, 'produtos', id), {
    ...input,
    atualizadoEm: serverTimestamp(),
  });
}

export async function deletarProduto(id: string): Promise<void> {
  await deleteDoc(doc(db, 'produtos', id));
}

// ─── CALENDÁRIO ──────────────────────────────────────────────────────────────

export async function getCalendario(
  clienteId: string,
  mes: number,
  ano: number
): Promise<ItemCalendario[]> {
  const snap = await getDocs(
    query(
      collection(db, 'calendario'),
      where('clienteId', '==', clienteId),
      where('mes', '==', mes),
      where('ano', '==', ano),
      orderBy('data', 'asc')
    )
  );
  return snap.docs.map((d) => docToObj<ItemCalendario>(d.id, d.data()));
}

export async function salvarItensCalendario(
  itens: Omit<ItemCalendario, 'id'>[]
): Promise<void> {
  await Promise.all(
    itens.map((item) =>
      addDoc(collection(db, 'calendario'), {
        ...item,
        geradoEm: serverTimestamp(),
      })
    )
  );
}

// ─── IDEIAS ──────────────────────────────────────────────────────────────────

export async function getIdeias(
  clienteId: string,
  produtoId?: string
): Promise<Ideia[]> {
  const constraints = [where('clienteId', '==', clienteId)];
  if (produtoId) constraints.push(where('produtoId', '==', produtoId));
  const snap = await getDocs(
    query(collection(db, 'ideias'), ...constraints, orderBy('geradoEm', 'desc'))
  );
  return snap.docs.map((d) => docToObj<Ideia>(d.id, d.data()));
}

export async function salvarIdeias(
  ideias: Omit<Ideia, 'id'>[]
): Promise<void> {
  await Promise.all(
    ideias.map((ideia) =>
      addDoc(collection(db, 'ideias'), {
        ...ideia,
        geradoEm: serverTimestamp(),
      })
    )
  );
}

// ─── ROTEIROS ────────────────────────────────────────────────────────────────

export async function getRoteiros(clienteId: string): Promise<Roteiro[]> {
  const snap = await getDocs(
    query(
      collection(db, 'roteiros'),
      where('clienteId', '==', clienteId),
      orderBy('geradoEm', 'desc')
    )
  );
  return snap.docs.map((d) => docToObj<Roteiro>(d.id, d.data()));
}

export async function salvarRoteiro(
  roteiro: Omit<Roteiro, 'id'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'roteiros'), {
    ...roteiro,
    geradoEm: serverTimestamp(),
  });
  return ref.id;
}

// ─── ANÁLISE ─────────────────────────────────────────────────────────────────

export async function getUltimaAnalise(
  clienteId: string
): Promise<AnaliseNegocio | null> {
  const snap = await getDocs(
    query(
      collection(db, 'analises'),
      where('clienteId', '==', clienteId),
      orderBy('geradoEm', 'desc')
    )
  );
  if (snap.empty) return null;
  return docToObj<AnaliseNegocio>(snap.docs[0].id, snap.docs[0].data());
}

export async function salvarAnalise(
  analise: Omit<AnaliseNegocio, 'id'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'analises'), {
    ...analise,
    geradoEm: serverTimestamp(),
  });
  return ref.id;
}

// ─── RADAR ───────────────────────────────────────────────────────────────────

export async function getAlertas(clienteId: string): Promise<AlertaRadar[]> {
  const snap = await getDocs(
    query(
      collection(db, 'alertas'),
      where('clienteId', '==', clienteId),
      orderBy('geradoEm', 'desc')
    )
  );
  return snap.docs.map((d) => docToObj<AlertaRadar>(d.id, d.data()));
}

export async function salvarAlertas(
  alertas: Omit<AlertaRadar, 'id'>[]
): Promise<void> {
  await Promise.all(
    alertas.map((alerta) =>
      addDoc(collection(db, 'alertas'), {
        ...alerta,
        geradoEm: serverTimestamp(),
      })
    )
  );
}

// ─── BIBLIOTECA ──────────────────────────────────────────────────────────────

export async function getBiblioteca(
  clienteId: string
): Promise<ConteudoBiblioteca[]> {
  const snap = await getDocs(
    query(
      collection(db, 'biblioteca'),
      where('clienteId', '==', clienteId),
      orderBy('criadoEm', 'desc')
    )
  );
  return snap.docs.map((d) => docToObj<ConteudoBiblioteca>(d.id, d.data()));
}

export async function salvarNaBiblioteca(
  conteudo: Omit<ConteudoBiblioteca, 'id'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'biblioteca'), {
    ...conteudo,
    criadoEm: serverTimestamp(),
  });
  return ref.id;
}

// ─── ARTES ───────────────────────────────────────────────────────────────────

export async function getArtes(clienteId: string): Promise<Arte[]> {
  const snap = await getDocs(
    query(
      collection(db, 'artes'),
      where('clienteId', '==', clienteId),
      orderBy('geradoEm', 'desc')
    )
  );
  return snap.docs.map((d) => docToObj<Arte>(d.id, d.data()));
}

export async function salvarArte(arte: Omit<Arte, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'artes'), {
    ...arte,
    geradoEm: serverTimestamp(),
  });
  return ref.id;
}
