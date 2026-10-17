# Galeri Foto Server Sendiri

## Menjalankan di komputer server
1. Instal Node.js 20 atau lebih baru.
2. Buka terminal di folder ini.
3. Jalankan `npm install`.
4. Jalankan `npm start`.
5. Buka `http://localhost:3000`.

Foto disimpan di `uploads/` dan metadata foto di database SQLite `data/gallery.db`.

## Akses melalui internet
Agar orang di luar jaringan dapat mengaksesnya, server harus terus menyala dan dapat dijangkau dari internet. Siapkan domain/HTTPS dan konfigurasi jaringan yang sesuai. Jika ISP memakai CGNAT, port forwarding biasanya tidak cukup dan diperlukan tunnel atau IP publik.

## Catatan keamanan
Versi dasar ini memungkinkan siapa pun yang dapat mengakses situs untuk mengunggah foto. Sebelum dipublikasikan, tambahkan autentikasi atau pembatasan upload, moderasi, serta backup berkala untuk folder `uploads/` dan `data/`.
