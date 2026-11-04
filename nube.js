// Sincronización con Firebase: entrada con correo y contraseña y copia de los datos en Firestore.
// Los datos siguen guardándose también en el aparato, así la app funciona sin conexión.
// La privacidad la dan las reglas de Firestore (solo el UID del dueño puede leer y escribir).
import {
  initializeApp, initializeAuth, indexedDBLocalPersistence, browserLocalPersistence,
  onAuthStateChanged, signInWithEmailAndPassword, sendPasswordResetEmail, signOut,
  initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager,
  doc, onSnapshot, setDoc, serverTimestamp, terminate, clearIndexedDbPersistence,
  collection, addDoc, getDocs, getDoc, query, orderBy, deleteDoc,
  EmailAuthProvider, reauthenticateWithCredential, updatePassword
} from './firebase.js';

const firebaseConfig = {
  apiKey: 'AIzaSyAsI4k9HbQxD3StRbw83x1HPf4Ob-_mg5U',
  authDomain: 'casas-c8b5f.firebaseapp.com',
  projectId: 'casas-c8b5f',
  storageBucket: 'casas-c8b5f.firebasestorage.app',
  messagingSenderId: '1094857514628',
  appId: '1:1094857514628:web:7a5c54a3d7c5a561bfecd1'
};

const puente = window.__salmo;
const $ = (s) => document.querySelector(s);

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence] });
let db;
try {
  db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
} catch (e) {
  db = getFirestore(app); // navegador sin almacenamiento persistente: solo en memoria
}
const ref = doc(db, 'datos', 'salmo');
const copias = collection(db, 'copias');
const MAX_COPIAS = 10;

// ---------- Indicador ----------
function estadoNube(tipo, detalle) {
  const textos = {
    ok: ['ok', '☁️ Sincronizado'],
    subiendo: ['', '⏳ Guardando en la nube…'],
    sinconexion: ['', '📴 Sin conexión: los cambios se subirán al volver'],
    error: ['error', '⚠️ ' + (detalle || 'Error con la nube')]
  };
  const [clase, texto] = textos[tipo];
  if (tipo === 'ok') $('#panelReglas').hidden = true;
  $('#nubeLinea').hidden = false;
  $('#nubeLinea').innerHTML = `<span class="nube ${clase}">${texto}</span>`;
  $('#cuentaEstado').textContent = texto.replace(/^\S+\s/, '') + '.';
}
function reglasPara(uid) {
  return `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null
                         && request.auth.uid == '${uid}';
    }
  }
}`;
}
function mensajeError(err) {
  const c = (err && err.code) || '';
  if (c === 'permission-denied') {
    // Muestra la regla correcta con el UID de quien ha entrado, lista para copiar.
    $('#textoReglas').textContent = reglasPara(auth.currentUser ? auth.currentUser.uid : 'TU_UID');
    $('#panelReglas').hidden = false;
    return 'Sin permiso en Firestore: entra en “Ajustes y seguridad”';
  }
  if (c === 'unavailable') return 'Sin conexión con la nube';
  return 'Error con la nube (' + (c || err) + ')';
}

// ---------- Datos ----------
let desuscribir = null;
let primeraDelServidor = true;
const vacio = (s) => !(s.participantes.length || s.rondas.length);
const resumen = (s) => `${s.rondas.length} Celebraciones y ${s.participantes.length} participantes`;

function subir(s) {
  estadoNube('subiendo');
  setDoc(ref, { json: JSON.stringify(s), actualizado: serverTimestamp() })
    .then(() => { $('#panelReglas').hidden = true; estadoNube('ok'); })
    .catch(err => estadoNube('error', mensajeError(err)));
}

function recibir(snap) {
  const esServidor = !snap.metadata.fromCache;
  if (snap.metadata.hasPendingWrites) return; // es nuestro propio cambio, aún sin confirmar
  const local = puente.obtener();
  const primera = esServidor && primeraDelServidor;
  if (esServidor) primeraDelServidor = false;

  if (!snap.exists()) {
    // Nube vacía: la primera vez se suben los datos de este aparato.
    if (primera && !vacio(local)) subir(local);
    else if (esServidor) estadoNube('ok');
    return;
  }
  let remoto;
  try { remoto = JSON.parse(snap.data().json); } catch (e) { estadoNube('error', 'Datos de la nube dañados'); return; }
  if (JSON.stringify(remoto) === JSON.stringify(local)) { if (esServidor) estadoNube('ok'); return; }

  const localMasNuevo = (local.modificado || 0) > (remoto.modificado || 0);
  if (!localMasNuevo) { puente.reemplazar(remoto); if (esServidor) estadoNube('ok'); return; }
  if (!esServidor) return; // esperamos a saber qué hay de verdad en la nube

  // Este aparato tiene cambios más recientes que la nube (p. ej. hechos sin conexión o una copia recién cargada).
  if (!primera || vacio(remoto) || confirm(
    'Los datos de este aparato son más recientes que los de la nube.\n\n' +
    `En este aparato: ${resumen(local)}.\nEn la nube: ${resumen(remoto)}.\n\n` +
    'Aceptar: subir los de este aparato a la nube.\nCancelar: quedarse con los de la nube.')) {
    subir(local);
  } else {
    puente.reemplazar(remoto);
    estadoNube('ok');
  }
}

function escuchar() {
  primeraDelServidor = true;
  desuscribir = onSnapshot(ref, { includeMetadataChanges: true }, snap => {
    recibir(snap);
    if (snap.metadata.fromCache && !snap.metadata.hasPendingWrites && !navigator.onLine) estadoNube('sinconexion');
  }, err => estadoNube('error', mensajeError(err)));
  puente.alGuardar = (s) => subir(s);
}
function dejarDeEscuchar() {
  if (desuscribir) desuscribir();
  desuscribir = null;
  puente.alGuardar = null;
}

// ---------- Copias en la nube y contraseña ----------
// Cada copia es un documento de la colección "copias"; se conservan las MAX_COPIAS más recientes.
const servicioNube = {
  crearCopia(motivo) {
    const s = puente.obtener(); // se toma ya, antes de que cambien los datos
    const json = JSON.stringify(s);
    return addDoc(copias, {
      json, motivo, creada: Date.now(), fecha: serverTimestamp(),
      resumen: `${s.rondas.length} ${s.rondas.length === 1 ? 'Celebración' : 'Celebraciones'} · ${s.participantes.length} participantes`
    }).then(async () => {
      const todas = await getDocs(query(copias, orderBy('creada', 'desc')));
      await Promise.all(todas.docs.slice(MAX_COPIAS).map(d => deleteDoc(d.ref)));
    });
  },
  async listarCopias() {
    const todas = await getDocs(query(copias, orderBy('creada', 'desc')));
    return todas.docs.slice(0, MAX_COPIAS).map(d => ({ id: d.id, creada: d.data().creada, motivo: d.data().motivo, resumen: d.data().resumen }));
  },
  async leerCopia(id) {
    const d = await getDoc(doc(db, 'copias', id));
    if (!d.exists()) throw new Error('esa copia ya no existe');
    return JSON.parse(d.data().json);
  },
  async cambiarClave(actual, nueva) {
    const user = auth.currentUser;
    try {
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, actual));
    } catch (err) {
      const c = err && err.code;
      if (c === 'auth/invalid-credential' || c === 'auth/wrong-password') throw new Error('La contraseña actual no es correcta.');
      if (c === 'auth/too-many-requests') throw new Error('Demasiados intentos. Espera unos minutos.');
      if (c === 'auth/network-request-failed') throw new Error('No hay conexión a internet.');
      throw new Error('No se ha podido comprobar la contraseña (' + (c || err) + ').');
    }
    try {
      await updatePassword(user, nueva);
    } catch (err) {
      if (err && err.code === 'auth/weak-password') throw new Error('La contraseña nueva es demasiado débil (mínimo 6 caracteres).');
      throw new Error('No se ha podido cambiar la contraseña (' + ((err && err.code) || err) + ').');
    }
  }
};

// ---------- Acceso ----------
$('#accIcono').innerHTML = document.querySelector('h1 .biblia').outerHTML;

function mostrarAcceso() {
  $('#acceso').hidden = false;
  $('#nubeLinea').hidden = true;
  document.body.classList.remove('con-sesion');
  setTimeout(() => $('#accEmail').focus(), 50);
}
function errorAcceso(err) {
  const c = (err && err.code) || '';
  if (['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-email', 'auth/missing-password'].includes(c))
    return 'Correo o contraseña incorrectos.';
  if (c === 'auth/too-many-requests') return 'Demasiados intentos. Espera unos minutos y vuelve a probar.';
  if (c === 'auth/network-request-failed') { $('#btnSinNube').hidden = false; return 'No hay conexión a internet.'; }
  if (c === 'auth/user-disabled') return 'Este usuario está desactivado.';
  return 'No se ha podido entrar (' + (c || err) + ').';
}

onAuthStateChanged(auth, user => {
  if (user) {
    $('#acceso').hidden = true;
    document.body.classList.add('con-sesion');
    $('#cuentaEmail').textContent = user.email;
    puente.nube = servicioNube;
    if (!desuscribir) escuchar();
  } else {
    dejarDeEscuchar();
    puente.nube = null;
    mostrarAcceso();
  }
});

$('#formAcceso').addEventListener('submit', async e => {
  e.preventDefault();
  const email = $('#accEmail').value.trim(), pass = $('#accPass').value;
  if (!email || !pass) { $('#accError').textContent = 'Escribe tu correo y tu contraseña.'; return; }
  $('#btnEntrar').disabled = true; $('#btnEntrar').textContent = 'Entrando…';
  $('#accError').textContent = '';
  try {
    await signInWithEmailAndPassword(auth, email, pass);
    $('#accPass').value = '';
  } catch (err) {
    $('#accError').textContent = errorAcceso(err);
  } finally {
    $('#btnEntrar').disabled = false; $('#btnEntrar').textContent = 'Entrar';
  }
});

$('#btnOlvido').addEventListener('click', async () => {
  const email = $('#accEmail').value.trim();
  if (!email) { $('#accError').textContent = 'Escribe tu correo y vuelve a pulsar “¿Has olvidado la contraseña?”.'; return; }
  try {
    await sendPasswordResetEmail(auth, email);
    $('#accError').textContent = '';
    alert(`Si ${email} es tu correo de acceso, te llegará un mensaje para cambiar la contraseña (mira también en “Correo no deseado”).`);
  } catch (err) {
    $('#accError').textContent = errorAcceso(err);
  }
});

$('#btnCopiarReglas').addEventListener('click', async () => {
  const texto = $('#textoReglas').textContent;
  try { await navigator.clipboard.writeText(texto); alert('Regla copiada. Pégala en Firestore → Reglas y pulsa Publicar.'); }
  catch (e) { prompt('Copia este texto:', texto); }
});

$('#btnSinNube').addEventListener('click', () => { $('#acceso').hidden = true; });

$('#btnSalir').addEventListener('click', async () => {
  if (!confirm('Se cerrará la sesión y se borrarán los datos guardados en este aparato (siguen en la nube). ¿Continuar?')) return;
  dejarDeEscuchar();
  await signOut(auth);
  await terminate(db);
  await clearIndexedDbPersistence(db).catch(() => {});
  puente.borrarLocal();
  location.reload();
});
