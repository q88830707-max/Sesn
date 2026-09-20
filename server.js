const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Veritabanı (htdocs içinde)
const dbPath = path.join(__dirname, 'numaralar.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Veritabanına bağlanılamadı:', err.message);
    } else {
        console.log('✅ SQLite veritabanına bağlanıldı.');
    }
});

// Ana Sayfa
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============ API ============

// 1. Ülkeleri listele
app.get('/api/ulkeler', (req, res) => {
    db.all('SELECT DISTINCT ulke FROM telefon_numaralari ORDER BY ulke', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ ulkeler: rows.map(r => r.ulke) });
    });
});

// 2. Ülkeye göre numaralar (Sayfalama)
app.get('/api/numaralar/:ulke', (req, res) => {
    const ulke = req.params.ulke;
    const limit = Math.min(parseInt(req.query.limit) || 50, 500);
    const sayfa = parseInt(req.query.sayfa) || 1;
    const offset = (sayfa - 1) * limit;

    db.get('SELECT COUNT(*) as toplam FROM telefon_numaralari WHERE ulke = ?', [ulke], (err, countRow) => {
        if (err) return res.status(500).json({ error: err.message });

        db.all(
            'SELECT numara FROM telefon_numaralari WHERE ulke = ? LIMIT ? OFFSET ?',
            [ulke, limit, offset],
            (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });
                if (rows.length === 0) {
                    return res.status(404).json({ mesaj: 'Bu ülkeye ait numara bulunamadı.' });
                }
                res.json({
                    ulke: ulke,
                    sayfa: sayfa,
                    limit: limit,
                    toplamKayit: countRow.toplam,
                    toplamSayfa: Math.ceil(countRow.toplam / limit),
                    numaralar: rows.map(r => r.numara)
                });
            }
        );
    });
});

// 3. Numara sorgula
app.get('/api/sorgula/:numara', (req, res) => {
    const numara = req.params.numara;
    db.get('SELECT ulke FROM telefon_numaralari WHERE numara = ?', [numara], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) {
            res.json({ numara: numara, bulundu: true, ulke: row.ulke });
        } else {
            res.json({ numara: numara, bulundu: false });
        }
    });
});

// 4. Rastgele numara
app.get('/api/rastgele/:ulke', (req, res) => {
    const ulke = req.params.ulke;
    db.get(
        'SELECT numara FROM telefon_numaralari WHERE ulke = ? ORDER BY RANDOM() LIMIT 1',
        [ulke],
        (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!row) return res.status(404).json({ mesaj: 'Numara bulunamadı.' });
            res.json({ ulke: ulke, numara: row.numara });
        }
    );
});

app.listen(PORT, () => {
    console.log(`\n🚀 API Sunucusu çalışıyor: http://localhost:${PORT}\n`);
});