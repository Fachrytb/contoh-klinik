// ============================================================
// IMPORT MODUL FIREBASE SDK v10 (MODULAR API)
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,        // Inisialisasi Firestore
  collection,          // Referensi ke koleksi dokumen
  addDoc,              // Tambah dokumen baru
  getDocs,             // Ambil semua dokumen
  getDoc,              // Ambil satu dokumen berdasarkan ID
  deleteDoc,           // Hapus dokumen
  doc,                 // Referensi ke dokumen spesifik
  query,               // Buat query
  orderBy,             // Urutkan hasil query
  updateDoc,           // Update dokumen
  onSnapshot,          // Listener real-time perubahan data
  where,               // Filter query
  limit                // Batasi jumlah hasil query
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ============================================================
// KONFIGURASI FIREBASE — Ganti dengan config project Anda
// ============================================================
const firebaseConfig = {
   apiKey: "AIzaSyCjXlgysJkN-2s3Gu0forgp7as5-9NqCkI",
            authDomain: "pasar-b04a7.firebaseapp.com",
            databaseURL: "https://pasar-b04a7-default-rtdb.firebaseio.com",
            projectId: "pasar-b04a7",
            storageBucket: "pasar-b04a7.appspot.com",
            messagingSenderId: "508470916587",
            appId: "1:508470916587:web:460e9a1612e92b712e15ae",
            measurementId: "G-33T7CQCWBX"
};

// Inisialisasi aplikasi Firebase dan database Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);




// ============================================================
// FUNGSI CRUD PASIEN
// ============================================================

/**
 * Ambil daftar semua pasien, diurutkan berdasarkan nomor urut
 * Query ini hanya pakai orderBy pada satu field (nomerUrut)
 * sehingga tidak memerlukan composite index
 * @returns {Array} Array objek pasien
 */
export async function ambilDaftarPasien() {
  const refDokumen = collection(db, "pasien");
  // Hanya orderBy single field — index otomatis dibuat Firestore
  const kueri = query(refDokumen, orderBy("nomerUrut", "asc"));
  const cuplikankueri = await getDocs(kueri);

  let hasil = [];
  cuplikankueri.forEach((dok) => {
    hasil.push({
      id: dok.id,
      nomerUrut: dok.data().nomerUrut,
      nama: dok.data().nama,
      tanggalDaftar: dok.data().tanggalDaftar,
      status: dok.data().status || "menunggu",
      dipanggilPada: dok.data().dipanggilPada || null
    });
  });

  return hasil;
}

/**
 * Ambil daftar pasien yang masih menunggu (belum dipanggil)
 * Karena tidak bisa pakai where+orderBy berbeda tanpa composite index,
 * kita ambil SEMUA pasien lalu filter & sort di JavaScript
 * @returns {Array} Array objek pasien dengan status "menunggu"
 */
export async function ambilDaftarPasienMenunggu() {
  // Ambil semua pasien yang sudah diurutkan by nomerUrut
  const semuaPasien = await ambilDaftarPasien();
  
  // Filter di client: hanya yang statusnya "menunggu"
  // Sort di client: sudah terurut dari ambilDaftarPasien()
  let hasil = semuaPasien.filter((pasien) => pasien.status === "menunggu");

  return hasil;
}

/**
 * Ambil pasien yang sedang dipanggil (status "dipanggil")
 * Hindari where+orderBy berbeda. Ambil semua, lalu filter & sort manual.
 * @returns {Object|null} Objek pasien atau null jika tidak ada
 */
export async function ambilPasienDipanggil() {
  // Ambil semua pasien
  const semuaPasien = await ambilDaftarPasien();
  
  // Filter: hanya yang status "dipanggil"
  const yangDipanggil = semuaPasien.filter((p) => p.status === "dipanggil");
  
  if (yangDipanggil.length === 0) return null;
  
  // Sort manual berdasarkan dipanggilPada terbaru (descending)
  yangDipanggil.sort((a, b) => {
    const tglA = a.dipanggilPada ? new Date(a.dipanggilPada) : new Date(0);
    const tglB = b.dipanggilPada ? new Date(b.dipanggilPada) : new Date(0);
    return tglB - tglA; // descending: terbaru di atas
  });
  
  // Ambil yang paling terbaru (index 0)
  return yangDipanggil[0];
}

/**
 * Tambah data pasien baru ke Firestore
 * @param {number} nomerUrut - Nomor antrian pasien
 * @param {string} nama - Nama lengkap pasien
 * @param {string} tanggalDaftar - Tanggal pendaftaran (YYYY-MM-DD)
 */
export async function tambahPasien(nomerUrut, nama, tanggalDaftar) {
  try {
    const dokRef = await addDoc(collection(db, "pasien"), {
      nomerUrut: nomerUrut,
      nama: nama,
      tanggalDaftar: tanggalDaftar,
      status: "menunggu",
      dipanggilPada: null
    });
    console.log("Berhasil menambah data pasien: " + dokRef.id);
    return dokRef.id;
  } catch (e) {
    console.log("Gagal menambah data pasien: " + e);
    throw e;
  }
}

/**
 * Ubah/update data pasien berdasarkan ID dokumen
 * @param {string} docId - ID dokumen Firestore
 * @param {number} nomerUrut - Nomor urut baru
 * @param {string} nama - Nama baru
 * @param {string} tanggalDaftar - Tanggal daftar baru
 */
export async function ubahPasien(docId, nomerUrut, nama, tanggalDaftar) {
  try {
    await updateDoc(doc(db, "pasien", docId), {
      nomerUrut: nomerUrut,
      nama: nama,
      tanggalDaftar: tanggalDaftar
    });
    console.log("Berhasil mengubah data pasien: " + docId);
  } catch (e) {
    console.log("Gagal mengubah data pasien: " + e);
    throw e;
  }
}

/**
 * Hapus data pasien berdasarkan ID dokumen
 * @param {string} docId - ID dokumen yang akan dihapus
 */
export async function hapusdataPasien(docId) {
  try {
    await deleteDoc(doc(db, "pasien", docId));
    console.log("Berhasil menghapus data pasien: " + docId);
  } catch (e) {
    console.log("Gagal menghapus data pasien: " + e);
    throw e;
  }
}

/**
 * Ambil satu data pasien berdasarkan ID dokumen
 * @param {string} docId - ID dokumen
 * @returns {Object} Data pasien
 */
export async function ambilPasien(docId) {
  const docRef = doc(db, "pasien", docId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data()
    };
  }
  return null;
}

// ============================================================
// FUNGSI PEMANGGILAN PASIEN
// ============================================================

/**
 * Tandai pasien sebagai "dipanggil" dan catat waktu pemanggilan
 * Reset pasien yang sebelumnya "dipanggil" menjadi "selesai"
 * @param {string} docId - ID dokumen pasien
 */
export async function panggilPasien(docId) {
  try {
    // Ambil semua pasien yang statusnya "dipanggil"
    // Hindari where+orderBy, pakai ambilDaftarPasien() lalu filter
    const semuaPasien = await ambilDaftarPasien();
    const yangDipanggil = semuaPasien.filter((p) => p.status === "dipanggil");

    // Reset semua yang statusnya "dipanggil" menjadi "selesai"
    for (const p of yangDipanggil) {
      await updateDoc(doc(db, "pasien", p.id), {
        status: "selesai"
      });
    }

    // Update pasien yang dipilih menjadi "dipanggil"
    await updateDoc(doc(db, "pasien", docId), {
      status: "dipanggil",
      dipanggilPada: new Date().toISOString()
    });

    console.log("Pasien dipanggil: " + docId);
  } catch (e) {
    console.log("Gagal memanggil pasien: " + e);
    throw e;
  }
}

/**
 * Ulangi pemanggilan pasien yang sedang aktif (tidak mengubah status)
 * @param {string} docId - ID dokumen pasien
 */
export async function ulangiPanggilanPasien(docId) {
  try {
    await updateDoc(doc(db, "pasien", docId), {
      dipanggilPada: new Date().toISOString()
    });
    console.log("Pemanggilan pasien diulang: " + docId);
  } catch (e) {
    console.log("Gagal mengulang panggilan: " + e);
    throw e;
  }
}

/**
 * Reset semua pasien hari ini ke status menunggu (opsional, untuk reset harian)
 * Hindari where+orderBy, ambil semua lalu filter di client
 */
export async function resetStatusPasien() {
  try {
    const semuaPasien = await ambilDaftarPasien();
    const yangReset = semuaPasien.filter(
      (p) => p.status === "dipanggil" || p.status === "selesai"
    );

    for (const p of yangReset) {
      await updateDoc(doc(db, "pasien", p.id), {
        status: "menunggu",
        dipanggilPada: null
      });
    }

    console.log("Status pasien berhasil direset. Total: " + yangReset.length);
  } catch (e) {
    console.log("Gagal reset status: " + e);
    throw e;
  }
}

// ============================================================
// FUNGSI REAL-TIME LISTENER (untuk display TV)
// ============================================================

/**
 * Dengarkan perubahan data pasien secara real-time
 * Hanya pakai orderBy single field — tidak butuh composite index
 * @param {Function} callback - Fungsi yang dipanggil saat data berubah
 * @returns {Function} Fungsi unsubscribe untuk berhenti mendengarkan
 */
export function dengarkanPerubahanPasien(callback) {
  const refDokumen = collection(db, "pasien");
  // Single field orderBy — aman tanpa composite index
  const kueri = query(refDokumen, orderBy("nomerUrut", "asc"));

  return onSnapshot(kueri, (snapshot) => {
    let hasil = [];
    snapshot.forEach((dok) => {
      hasil.push({
        id: dok.id,
        ...dok.data()
      });
    });
    callback(hasil);
  });
}

/**
 * Dengarkan pasien yang sedang dipanggil secara real-time
 * Hindari where+orderBy berbeda. Ambil semua, lalu filter & sort di callback.
 * @param {Function} callback - Fungsi yang dipanggil saat ada pasien dipanggil
 * @returns {Function} Fungsi unsubscribe
 */
export function dengarkanPasienDipanggil(callback) {
  const refDokumen = collection(db, "pasien");
  // Hanya orderBy single field — aman tanpa composite index
  const kueri = query(refDokumen, orderBy("nomerUrut", "asc"));

  return onSnapshot(kueri, (snapshot) => {
    let hasil = [];
    snapshot.forEach((dok) => {
      hasil.push({
        id: dok.id,
        ...dok.data()
      });
    });

    // Filter di client: hanya yang status "dipanggil"
    const yangDipanggil = hasil.filter((p) => p.status === "dipanggil");
    
    if (yangDipanggil.length === 0) {
      callback(null);
      return;
    }

    // Sort manual: yang paling baru dipanggil (dipanggilPada terbesar)
    yangDipanggil.sort((a, b) => {
      const tglA = a.dipanggilPada ? new Date(a.dipanggilPada) : new Date(0);
      const tglB = b.dipanggilPada ? new Date(b.dipanggilPada) : new Date(0);
      return tglB - tglA;
    });

    // Kirim yang terbaru
    callback(yangDipanggil[0]);
  });
}

// ============================================================
// FUNGSI TEXT-TO-SPEECH (Suara Panggilan)
// ============================================================

/**
 * Memutar suara panggilan nama pasien menggunakan Web Speech API
 * @param {string} namaPasien - Nama pasien yang akan dipanggil
 * @param {number} nomerUrut - Nomor urut pasien
 */
export function putarSuaraPanggilan(namaPasien, nomerUrut) {
  if (!("speechSynthesis" in window)) {
    console.log("Browser tidak mendukung Text-to-Speech");
    return;
  }

  // Hentikan suara yang sedang berjalan
  window.speechSynthesis.cancel();

  const teks = `Nomor antrian ${nomerUrut}, atas nama ${namaPasien}, silakan menuju ruang pemeriksaan.`;
  const utterance = new SpeechSynthesisUtterance(teks);

  // Konfigurasi suara Bahasa Indonesia
  utterance.lang = "id-ID";
  utterance.rate = 0.9;   // Kecepatan sedang
  utterance.pitch = 1.0;  // Nada normal
  utterance.volume = 1.0; // Volume penuh

  window.speechSynthesis.speak(utterance);
}

/**
 * Format tanggal ke format Indonesia (DD/MM/YYYY)
 * @param {string} tanggal - String tanggal
 * @returns {string} Tanggal terformat
 */
export function formatTanggal(tanggal) {
  if (!tanggal) return "-";
  const tgl = new Date(tanggal);
  return tgl.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

/**
 * Format angka dengan leading zero (001, 002, dst)
 * @param {number} angka - Angka yang akan diformat
 * @returns {string} Angka dengan leading zero
 */
export function formatNomorUrut(angka) {
  return angka.toString().padStart(3, "0");
}