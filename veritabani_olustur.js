const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const readline = require('readline');

// .txt dosyalarının bulunduğu klasör (htdocs/numbers-api.Quantex/api.numbers.quantex)
const TXT_KLASORU = path.join(__dirname, 'numbers-api.Quantex', 'api.numbers.quantex');
// Veritabanı htdocs içinde oluşacak
const DB_DOSYASI = path.join(__dirname, 'numaralar.db');

// Eski veritabanını sil (temiz başlangıç)
if (fs.existsSync(DB_DOSYASI)) {
    fs.unlinkSync(DB_DOSYASI);
    console.log('Eski veritabanı silindi.');
}

const db = new sqlite3.Database(DB_DOSYASI);

db.serialize(() => {
    db.run(`CREATE TABLE telefon_numaralari (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ulke TEXT,
        numara TEXT
    )`);

    // Hız için index
    db.run(`CREATE INDEX idx_numara ON telefon_numaralari(numara)`);
    db.run(`CREATE INDEX idx_ulke ON telefon_numaralari(ulke)`);

    const dosyalar = fs.readdirSync(TXT_KLASORU).filter(f => f.endsWith('.txt'));
    console.log(`Toplam ${dosyalar.length} dosya bulundu.\n`);

    let islenenDosya = 0;

    function sonrakiDosya() {
        if (islenenDosya >= dosyalar.length) {
            console.log('\n✅ TÜM VERİLER VERİTABANINA AKTARILDI!');
            db.close();
            return;
        }

        const dosyaAdi = dosyalar[islenenDosya];
        const ulkeAdi = dosyaAdi.replace('.txt', '');
        const dosyaYolu = path.join(TXT_KLASORU, dosyaAdi);

        console.log(`[${islenenDosya + 1}/${dosyalar.length}] ${ulkeAdi} yükleniyor...`);

        const stream = fs.createReadStream(dosyaYolu);
        const rl = readline.createInterface({ input: stream });

        let satirSayisi = 0;
        let ilkSatir = true;

        db.run('BEGIN TRANSACTION');

        rl.on('line', (satir) => {
            if (ilkSatir) {
                ilkSatir = false;
                return;
            }
            const numara = satir.trim();
            if (numara && numara.length > 5) {
                db.run(
                    'INSERT INTO telefon_numaralari (ulke, numara) VALUES (?, ?)',
                    [ulkeAdi, numara]
                );
                satirSayisi++;
            }
        });

        rl.on('close', () => {
            db.run('COMMIT', () => {
                console.log(`   ✓ ${satirSayisi} numara eklendi.`);
                islenenDosya++;
                sonrakiDosya();
            });
        });
    }

    sonrakiDosya();
});