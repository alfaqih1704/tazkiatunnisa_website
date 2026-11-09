require('dotenv').config();
const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. MEMASTIKAN FOLDER UPLOAD TERSEDIA (Mencegah error jika lupa buat folder)
const dirs = [
    './uploads/profile', 
    './uploads/certificates', 
    './uploads/services', 
    './uploads/moments'
];
dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// 2. PENGATURAN MIDDLEWARE
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Membuka akses folder public dan uploads agar bisa diakses browser
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Pengaturan Sesi (Session) untuk Keamanan Login Admin
app.use(session({
    secret: process.env.SESSION_SECRET || 'RahasiaDefault123',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // Sesi aktif 1 hari
}));

// Fungsi untuk mengecek apakah yang mengakses adalah admin yang sudah login
function requireAuth(req, res, next) {
    if (req.session && req.session.adminId) {
        next();
    } else {
        res.status(401).json({ error: 'Akses ditolak. Silakan login terlebih dahulu.' });
    }
}

// 3. PENGATURAN UPLOAD FILE (MULTER)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.fieldname === 'profile_picture') cb(null, 'uploads/profile/');
        else if (file.fieldname === 'cert_image' || file.fieldname === 'cert_pdf') cb(null, 'uploads/certificates/');
        else if (file.fieldname === 'service_image') cb(null, 'uploads/services/');
        else if (file.fieldname === 'moment_image') cb(null, 'uploads/moments/');
        else cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        // Membuat nama file acak agar tidak bentrok
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// ==========================================
// 4. API ENDPOINTS (Jalur Komunikasi Data)
// ==========================================

// --- SISTEM LOGIN & LOGOUT ---
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT * FROM admins WHERE username = ?`, [username], (err, admin) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!admin) return res.status(401).json({ error: 'Username atau password salah' });

        // Cek kecocokan password yang di-hash
        bcrypt.compare(password, admin.password, (err, isMatch) => {
            if (isMatch) {
                req.session.adminId = admin.id; // Simpan sesi
                res.json({ success: true, message: 'Login berhasil' });
            } else {
                res.status(401).json({ error: 'Username atau password salah' });
            }
        });
    });
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true, message: 'Logout berhasil' });
});

// Cek Status Login (Untuk Frontend Admin)
app.get('/api/check-auth', (req, res) => {
    if (req.session && req.session.adminId) {
        res.json({ authenticated: true });
    } else {
        res.json({ authenticated: false });
    }
});

// --- API PUBLIK (Bisa diakses siapa saja untuk melihat web) ---

// Ambil Data Profil
app.get('/api/profile', (req, res) => {
    db.get(`SELECT * FROM profile ORDER BY id DESC LIMIT 1`, [], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row || {});
    });
});

// Ambil Data Sertifikat
app.get('/api/certificates', (req, res) => {
    db.all(`SELECT * FROM certificates ORDER BY id DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Ambil Data Jasa (Publik)
app.get('/api/services', (req, res) => {
    db.all(`SELECT * FROM services ORDER BY id DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Ambil Data Momen
app.get('/api/moments', (req, res) => {
    db.all(`SELECT * FROM moments ORDER BY id DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Pengunjung Mengirim Pesan/Saran
app.post('/api/feedback', (req, res) => {
    const { name, message, suggestion } = req.body;
    db.run(`INSERT INTO feedback (name, message, suggestion) VALUES (?, ?, ?)`, 
    [name || 'Anonim', message, suggestion], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'Pesan berhasil dikirim!' });
    });
});

// --- API KHUSUS ADMIN (Harus Login) ---

// Update Profil (Admin)
app.post('/api/admin/profile', requireAuth, upload.single('profile_picture'), (req, res) => {
    const { full_name, description, education, skills } = req.body;
    let profile_picture = req.file ? '/uploads/profile/' + req.file.filename : req.body.existing_picture;

    db.run(`DELETE FROM profile`, (err) => {
        db.run(`INSERT INTO profile (full_name, description, education, skills, profile_picture) VALUES (?, ?, ?, ?, ?)`,
            [full_name, description, education, skills, profile_picture], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true, message: 'Profil berhasil diperbarui' });
            });
    });
});

// Tambah Sertifikat Baru (Admin)
app.post('/api/admin/certificates', requireAuth, upload.single('cert_image'), (req, res) => {
    const { title, organizer, description } = req.body;
    const image = req.file ? '/uploads/certificates/' + req.file.filename : '';

    db.run(`INSERT INTO certificates (title, organizer, description, image) VALUES (?, ?, ?, ?)`,
        [title, organizer, description, image], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: 'Sertifikat berhasil ditambahkan' });
        });
});

// Tambah Jasa Baru (Admin)
app.post('/api/admin/services', requireAuth, upload.single('service_image'), (req, res) => {
    const { name, description, price } = req.body;
    const image = req.file ? '/uploads/services/' + req.file.filename : '';

    db.run(`INSERT INTO services (name, description, price, image) VALUES (?, ?, ?, ?)`,
        [name, description, price, image], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: 'Jasa berhasil ditambahkan' });
        });
});

// Tambah Momen / Informasi Baru (Admin)
app.post('/api/admin/moments', requireAuth, upload.single('moment_image'), (req, res) => {
    const { title, caption, date } = req.body;
    const image = req.file ? '/uploads/moments/' + req.file.filename : '';

    db.run(`INSERT INTO moments (title, caption, date, image) VALUES (?, ?, ?, ?)`,
        [title, caption, date, image], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: 'Momen berhasil diposting' });
        });
});

// Lihat Pesan Pengunjung (Admin)
app.get('/api/admin/feedback', requireAuth, (req, res) => {
    db.all(`SELECT * FROM feedback ORDER BY id DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// ==========================================
// 5. MENGATUR TAMPILAN HALAMAN (ROUTING)
// ==========================================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Jalankan Server
app.listen(PORT, () => {
    console.log(`=============================================`);
    console.log(`🚀 Server berjalan di: http://localhost:${PORT}`);
    console.log(`⚙️ Halaman Admin di: http://localhost:${PORT}/admin`);
    console.log(`=============================================`);
});