const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Membuat atau menghubungkan ke file database
const dbPath = path.join(__dirname, 'database', 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Gagal terhubung ke database:', err.message);
    } else {
        console.log('Berhasil terhubung ke database SQLite.');
    }
});

// Membuat tabel jika belum ada
db.serialize(() => {
    // Tabel Admin
    db.run(`CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    )`);

    // Tabel Profil
    db.run(`CREATE TABLE IF NOT EXISTS profile (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT,
        profile_picture TEXT,
        birth_info TEXT,
        education TEXT,
        domicile TEXT,
        description TEXT,
        hobbies TEXT,
        skills TEXT,
        experience TEXT,
        goals TEXT
    )`);

    // Tabel Sertifikat
    db.run(`CREATE TABLE IF NOT EXISTS certificates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        organizer TEXT,
        date TEXT,
        description TEXT,
        image TEXT,
        pdf_file TEXT
    )`);

    // Tabel Pencapaian (Achievements)
    db.run(`CREATE TABLE IF NOT EXISTS achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        description TEXT,
        year TEXT
    )`);

    // Tabel Jasa / Keahlian
    db.run(`CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        description TEXT,
        details TEXT,
        price TEXT,
        image TEXT
    )`);

    // Tabel Momen (Galeri)
    db.run(`CREATE TABLE IF NOT EXISTS moments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        caption TEXT,
        date TEXT,
        image TEXT
    )`);

    // Tabel Komentar pada Momen
    db.run(`CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        moment_id INTEGER,
        name TEXT,
        comment TEXT,
        status TEXT DEFAULT 'pending', -- pending, approved, rejected
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Tabel Kritik dan Saran (Feedback)
    db.run(`CREATE TABLE IF NOT EXISTS feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        message TEXT,
        suggestion TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Tabel Testimoni
    db.run(`CREATE TABLE IF NOT EXISTS testimonials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        testimonial TEXT,
        status TEXT DEFAULT 'pending' -- pending, approved, rejected
    )`);

    // Tabel Kontak & Sosial Media
    db.run(`CREATE TABLE IF NOT EXISTS social_links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        whatsapp TEXT,
        instagram TEXT,
        tiktok TEXT,
        email TEXT,
        location TEXT
    )`);
});

module.exports = db;