const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Konfigurasi Admin (Silakan diubah username dan password ini sesuai keinginan)
const adminUsername = 'admin_tazkia';
const adminPassword = 'Tazkia_SukaBelajar1704';

bcrypt.hash(adminPassword, 10, (err, hash) => {
    if (err) {
        console.error('Gagal melakukan hash password:', err);
        return;
    }

    db.run(`INSERT INTO admins (username, password) VALUES (?, ?)`, [adminUsername, hash], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                console.log('Akun admin sudah ada di database.');
            } else {
                console.error('Error menyimpan admin:', err.message);
            }
        } else {
            console.log(`Akun admin berhasil dibuat!`);
            console.log(`Username: ${adminUsername}`);
            console.log(`Password: ${adminPassword}`);
            console.log(`Simpan informasi ini dengan baik. File ini bisa Anda abaikan setelah dijalankan.`);
        }
        db.close();
    });
});