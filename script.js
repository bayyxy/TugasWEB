// Format harga ke Rupiah
function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(angka);
}

// Simpan semua data menu
let semuaMenu = [];

// Ambil data dari file JSON (ini APInya)
fetch('data/menu.json')
    .then(response => response.json())
    .then(data => {
        semuaMenu = data;
        renderMenu(semuaMenu);
    })
    .catch(() => {
        document.getElementById('menu-container').innerHTML =
            '<p style="text-align:center;color:red;">Gagal memuat data menu.</p>';
    });

// Tampilkan kartu menu
function renderMenu(items) {
    const container = document.getElementById('menu-container');
    if (!container) return;

    container.innerHTML = '';

    if (items.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#888;">Tidak ada menu ditemukan.</p>';
        return;
    }

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = `menu-card ${item.category}`;
        card.innerHTML = `
            <div class="menu-img">
                <img src="${item.image}" alt="${item.name}" loading="lazy">
                <span class="menu-category-badge">${item.category}</span>
            </div>
            <div class="menu-content">
                <h3 class="menu-title">${item.name}</h3>
                <p class="menu-desc">${item.desc}</p>
                <div class="menu-bottom">
                    <span class="menu-price">${formatRupiah(item.price)}</span>
                    <button class="btn-pesan" onclick="alert('Ditambahkan: ${item.name}')">
                        <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// Filter berdasarkan kategori
function filterMenu(kategori) {
    document.querySelectorAll('.btn-filter').forEach(btn => btn.classList.remove('aktif'));
    document.getElementById('btn-' + kategori).classList.add('aktif');

    if (kategori === 'semua') {
        renderMenu(semuaMenu);
    } else {
        renderMenu(semuaMenu.filter(item => item.category === kategori));
    }
}

// Update jam dan status warung (halaman index)
function updateStatus() {
    const jamEl = document.getElementById('jam-sekarang');
    const statusEl = document.getElementById('status-warung');
    if (!jamEl || !statusEl) return;

    const now = new Date();
    const jam = now.getHours();
    const menit = now.getMinutes();
    const detik = now.getSeconds();
    const hari = now.getDay();

    jamEl.textContent =
        String(jam).padStart(2, '0') + ':' +
        String(menit).padStart(2, '0') + ':' +
        String(detik).padStart(2, '0');

    const waktuMenit = jam * 60 + menit;
    const buka = (hari >= 1 && hari <= 5)
        ? (waktuMenit >= 8 * 60 && waktuMenit < 20 * 60)
        : (waktuMenit >= 9 * 60 && waktuMenit < 21 * 60);

    if (buka) {
        statusEl.innerHTML = '<span class="status-dot green"></span> Warung BUKA';
        statusEl.className = 'status-badge status-buka';
    } else {
        statusEl.innerHTML = '<span class="status-dot red"></span> Warung TUTUP';
        statusEl.className = 'status-badge status-tutup';
    }
}

// Inisialisasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('jam-sekarang')) {
        updateStatus();
        setInterval(updateStatus, 1000);
        // Halaman index: ambil rekomendasi dari API
        fetchRekomendasi();
    }
    if (document.getElementById('menu-api-container')) {
        // Halaman menu: langsung load kategori default
        fetchMenuAPI('Chicken');
    }
});

// =================================================================
//  EXTERNAL API INTEGRATION — TheMealDB (https://themealdb.com)
//  Endpoint yang digunakan:
//    1. GET /random.php          → 1 hidangan acak
//    2. GET /filter.php?c={cat}  → daftar menu per kategori
//    3. GET /lookup.php?i={id}   → detail hidangan
// =================================================================

const MEALDB_BASE = 'https://www.themealdb.com/api/json/v1/1';

/**
 * Halaman INDEX — Ambil 3 hidangan acak dari TheMealDB API
 * dan tampilkan sebagai kartu inspirasi.
 */
async function fetchRekomendasi() {
    const container = document.getElementById('rekomendasi-container');
    if (!container) return;

    // Tampilkan loading skeleton
    container.innerHTML = `
        <div class="rek-skeleton"></div>
        <div class="rek-skeleton"></div>
        <div class="rek-skeleton"></div>
    `;

    // Putar ikon refresh
    const icon = document.getElementById('refresh-icon');
    if (icon) icon.classList.add('spin-anim');

    try {
        // Panggil endpoint /random.php sebanyak 3x secara paralel
        const responses = await Promise.all([
            fetch(`${MEALDB_BASE}/random.php`),
            fetch(`${MEALDB_BASE}/random.php`),
            fetch(`${MEALDB_BASE}/random.php`)
        ]);
        const dataArr = await Promise.all(responses.map(r => r.json()));
        const meals   = dataArr.map(d => d.meals[0]);

        container.innerHTML = '';
        meals.forEach(meal => {
            const card = document.createElement('div');
            card.className = 'rek-card';
            card.innerHTML = `
                <div class="rek-img-wrap">
                    <img src="${meal.strMealThumb}" alt="${meal.strMeal}" loading="lazy">
                    <span class="rek-area-badge">${meal.strArea || 'International'}</span>
                </div>
                <div class="rek-info">
                    <span class="rek-category">${meal.strCategory}</span>
                    <h4 class="rek-name">${meal.strMeal}</h4>
                    <p class="rek-tags">${meal.strTags ? meal.strTags.split(',').slice(0,3).join(' · ') : 'Hidangan Internasional'}</p>
                    <a href="${meal.strYoutube || '#'}" target="_blank" rel="noopener" class="rek-link">
                        ▶ Lihat Resep
                    </a>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (err) {
        container.innerHTML = `
            <div class="api-error">
                ⚠️ Gagal memuat data dari TheMealDB API.<br>
                <small>Pastikan koneksi internet aktif.</small>
            </div>
        `;
    } finally {
        if (icon) icon.classList.remove('spin-anim');
    }
}

/**
 * Halaman MENU — Ambil daftar hidangan berdasarkan kategori
 * menggunakan endpoint /filter.php?c={category}
 */
async function fetchMenuAPI(category) {
    const container = document.getElementById('menu-api-container');
    if (!container) return;

    // Update tombol filter aktif
    document.querySelectorAll('.btn-filter-api').forEach(btn => btn.classList.remove('aktif-api'));
    const activeBtn = document.getElementById('api-' + category);
    if (activeBtn) activeBtn.classList.add('aktif-api');

    // Loading spinner
    container.innerHTML = `
        <div class="loading-state" style="grid-column:1/-1">
            <div class="loading-spinner"></div>
            <p style="color:var(--text-light);font-weight:600">
                Mengambil menu <strong>${category}</strong> dari TheMealDB API...
            </p>
        </div>
    `;

    try {
        // 1️⃣ Ambil list menu berdasarkan kategori
        const res  = await fetch(`${MEALDB_BASE}/filter.php?c=${category}`);
        const data = await res.json();
        const list = data.meals.slice(0, 8); // Tampilkan 8 menu

        // 2️⃣ Ambil detail tiap menu (nama lengkap, asal negara, tags)
        const detailResponses = await Promise.all(
            list.map(m => fetch(`${MEALDB_BASE}/lookup.php?i=${m.idMeal}`))
        );
        const detailData = await Promise.all(detailResponses.map(r => r.json()));
        const meals = detailData.map(d => d.meals[0]);

        container.innerHTML = '';
        meals.forEach(meal => {
            const card = document.createElement('div');
            card.className = 'menu-card';
            const tags = meal.strTags
                ? meal.strTags.split(',').slice(0, 2).join(' · ')
                : meal.strArea + ' Cuisine';

            card.innerHTML = `
                <div class="menu-img">
                    <img src="${meal.strMealThumb}" alt="${meal.strMeal}" loading="lazy">
                    <span class="menu-category-badge">🌍 ${meal.strArea || category}</span>
                </div>
                <div class="menu-content">
                    <h3 class="menu-title">${meal.strMeal}</h3>
                    <p class="menu-desc">${tags}</p>
                    <div class="menu-bottom">
                        <span class="api-source-badge">via API</span>
                        <a href="${meal.strYoutube || meal.strSource || '#'}"
                           target="_blank" rel="noopener"
                           class="btn-resep" title="Lihat Resep">
                            ▶
                        </a>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

    } catch (err) {
        container.innerHTML = `
            <div class="api-error" style="grid-column:1/-1">
                ⚠️ Gagal memuat data dari TheMealDB API.<br>
                <small>Pastikan koneksi internet aktif.</small>
            </div>
        `;
    }
}
