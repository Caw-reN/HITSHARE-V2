# PANDUAN DEPLOYMENT DOCKER (LOCAL VPS RUNNER) & HARDENING UBUNTU 24.04
## PERSIAPAN HITSHARE UNTUK CLOUDFLARE ZERO TRUST TUNNEL

**Target Sistem Operasi:** Ubuntu 24.04 LTS (Noble Numbat) — Fresh Installation  
**Arsitektur Aplikasi:** Multi-Container Docker (Nginx Alpine, PHP 8.3-FPM, MySQL 8.0, Redis, Laravel Scheduler Worker)  
**Model Akses Jaringan:** **Local Listener (`http://localhost:8080`)** — Dirancang khusus untuk ditargetkan oleh **Cloudflare Zero Trust Tunnel** (`cloudflared`)  
**Repositori Resmi:** `https://github.com/Caw-reN/HITSHARE-V2.git`  
**Tanggal Pembaruan:** 08 Oktober 2026  

---

## DAFTAR ISI
1. [Konsep Arsitektur Cloudflare Tunnel + Docker Local](#1-konsep-arsitektur-cloudflare-tunnel--docker-local)
2. [Fase 1: Server Hardening & Keamanan Awal (Fresh Ubuntu 24.04)](#2-fase-1-server-hardening--keamanan-awal-fresh-ubuntu-2404)
   - [1.1 Update Paket & Zona Waktu](#11-update-paket--zona-waktu)
   - [1.2 Pembuatan User Administrator Non-Root](#12-pembuatan-user-administrator-non-root)
   - [1.3 Hardening Akses SSH (Kunci Publik & Disable Password)](#13-hardening-akses-ssh-kunci-publik--disable-password)
   - [1.4 Konfigurasi Firewall UFW (Zero Inbound Web Port)](#14-konfigurasi-firewall-ufw-zero-inbound-web-port)
   - [1.5 Instalasi & Konfigurasi Fail2ban](#15-instalasi--konfigurasi-fail2ban)
   - [1.6 Konfigurasi Swap Space (2 GB)](#16-konfigurasi-swap-space-2-gb)
   - [1.7 Kernel Network Hardening (sysctl)](#17-kernel-network-hardening-sysctl)
   - [1.8 Auto-Update Patch Keamanan (Unattended Upgrades)](#18-auto-update-patch-keamanan-unattended-upgrades)
   - [1.9 Optimasi DNS & Eliminasi Latensi Resolusi Domain](#19-optimasi-dns--eliminasi-latensi-resolusi-domain-wajib-untuk-vps)
3. [Fase 2: Instalasi & Konfigurasi Docker Engine Resmi](#3-fase-2-instalasi--konfigurasi-docker-engine-resmi)
   - [2.1 Install Docker CE & Docker Compose Plugin](#21-install-docker-ce--docker-compose-plugin)
   - [2.2 Konfigurasi Docker Daemon & Log Rotation](#22-konfigurasi-docker-daemon--log-rotation)
4. [Fase 3: Clone Repositori & Konfigurasi Lingkungan (.env)](#4-fase-3-clone-repositori--konfigurasi-lingkungan-env)
   - [3.1 Clone Repositori Git ke Server](#31-clone-repositori-git-ke-server)
   - [3.2 Setup File Konfigurasi .env](#32-setup-file-konfigurasi-env)
5. [Fase 4: Build & Menjalankan Kontainer Docker](#5-fase-4-build--menjalankan-kontainer-docker)
   - [4.1 Eksekusi Docker Compose Build & Up](#41-eksekusi-docker-compose-build--up)
   - [4.2 Inisialisasi Database, Storage, dan Caching Laravel](#42-inisialisasi-database-storage-dan-caching-laravel)
6. [Fase 5: Verifikasi Sistem Berjalan di Localhost VPS](#6-fase-5-verifikasi-sistem-berjalan-di-localhost-vps)
7. [Fase 6: Informasi Kesiapan Integrasi Cloudflare Tunnel](#7-fase-6-informasi-kesiapan-integrasi-cloudflare-tunnel)
8. [Fase 7: Prosedur Backup & Pemeliharaan Rutin](#8-fase-7-prosedur-backup--pemeliharaan-rutin)

---

## 1. Konsep Arsitektur Cloudflare Tunnel + Docker Local

Dengan menggunakan layanan **Cloudflare Zero Trust Tunnel** (`cloudflared`), arsitektur server menjadi jauh lebih aman dibandingkan deployment tradisional:

1. **Zero Open Inbound Ports**: Port HTTP (80) dan HTTPS (443) **TIDAK PERLU** dibuka di firewall server VPS Anda. Port IP publik VPS Anda tidak akan bisa di-scan oleh bot/hacker di internet.
2. **Outbound Encrypted Tunnel**: Daemon `cloudflared` membuat koneksi keluar (*outbound*) terenkripsi ke edge server Cloudflare terdekat.
3. **Local Listener**: Kontainer Docker HitShare hanya perlu berjalan dan mendengarkan permintaan di jaringan internal lokal VPS: **`http://localhost:8080`** (atau `http://127.0.0.1:8080`).
4. **SSL Otomatis di Edge**: Pengunjung mengakses `https://hitshare.web.id` dengan sertifikat SSL gratis berkelas enterprise yang dikelola langsung oleh Cloudflare.

```
 [ Pengunjung Publik ] ──HTTPS──► [ Cloudflare Edge Network ]
                                              │
                                   (Koneksi Tunnel Outbound)
                                              ▼
╔═══════════════════════════════════════════════════════════════════════════════════════════╗
║ VPS UBUNTU 24.04 (FIREWALL: Hanya Buka Port 22 SSH)                                       ║
║                                                                                           ║
║   [ cloudflared daemon ] ──HTTP Forward──► http://127.0.0.1:8080                         ║
║                                                   │                                       ║
║                                                   ▼                                       ║
║   ┌───────────────────────────────────────────────────────────────────────────────────┐   ║
║   │  hitshare_web (Nginx Alpine) - Mendengarkan di Port 8080                          │   ║
║   │  - Melayani aset SPA React (dist)                                                 │   ║
║   │  - Menyajikan /downloads/extension.zip & /uploads                                 │   ║
║   │  - Proxy FastCGI /api ke hitshare_app (port 9000)                                 │   ║
║   └───────────────────────────────────────┬───────────────────────────────────────────┘   ║
║                                           │                                               ║
║                                           ▼                                               ║
║   ┌───────────────────────────────────────────────────────────────────────────────────┐   ║
║   │  hitshare_app (Laravel PHP 8.3-FPM)                                               │   ║
║   │  - Terhubung ke hitshare_db (MySQL 8) & hitshare_redis (Redis 7)                   │   ║
║   └───────────────────────────────────────────────────────────────────────────────────┘   ║
║                                                                                           ║
║   ┌───────────────────────────────────────────────────────────────────────────────────┐   ║
║   │  hitshare_scheduler (Background Worker)                                           │   ║
║   │  - Menjalankan `php artisan schedule:work` (Auto-expire pesanan pending, dll.)     │   ║
║   └───────────────────────────────────────────────────────────────────────────────────┘   ║
╚═══════════════════════════════════════════════════════════════════════════════════════════╝
```

---

## 2. Fase 1: Server Hardening & Keamanan Awal (Fresh Ubuntu 24.04)

Lakukan langkah ini segera setelah pertama kali login ke VPS sebagai `root`.

### 1.1 Update Paket & Zona Waktu
```bash
# Update repository dan seluruh paket bawaan Ubuntu 24.04
apt update && apt upgrade -y

# Install utility esensial
apt install -y curl wget git nano htop ufw fail2ban unattended-upgrades software-properties-common ca-certificates gnupg lsb-release

# Set zona waktu ke Waktu Indonesia Barat (WIB)
timedatectl set-timezone Asia/Jakarta
```

---

### 1.2 Pembuatan User Administrator Non-Root
Menjalankan perintah langsung sebagai `root` berisiko tinggi. Buat user administrator baru:
```bash
# Buat user baru (contoh nama: deployer)
adduser deployer

# Berikan hak akses sudo
usermod -aG sudo deployer
```

---

### 1.3 Hardening Akses SSH (Kunci Publik & Disable Password)

> [!IMPORTANT]
> Jangan tutup sesi terminal SSH `root` Anda sebelum memverifikasi bahwa user `deployer` dapat login dengan SSH Key di jendela terminal baru!

1. Salin SSH Public Key dari komputer lokal Anda ke server:
   ```bash
   # Jalankan di terminal komputer lokal Anda (PowerShell / Linux terminal):
   ssh-copy-id -i ~/.ssh/id_rsa.pub deployer@IP_VPS_ANDA
   ```
   *(Jika belum memiliki SSH Key di lokal, buat terlebih dahulu dengan `ssh-keygen -t ed25519 -C "admin@hitshare"`).*

2. Di server VPS, terapkan konfigurasi hardening SSH:
   ```bash
   # Buat file konfigurasi override pada drop-in directory Ubuntu 24.04
   nano /etc/ssh/sshd_config.d/99-hardening.conf
   ```
   Tempelkan konfigurasi berikut:
   ```text
   # Nonaktifkan login langsung user root
   PermitRootLogin no

   # Wajibkan otentikasi kunci publik (larang login pakai password)
   PasswordAuthentication no
   PubkeyAuthentication yes

   # Batasi percobaan login gagal
   MaxAuthTries 3
   ClientAliveInterval 300
   ClientAliveCountMax 2
   ```

3. Uji sintaks dan restart service SSH:
   ```bash
   sshd -t
   systemctl restart ssh
   ```

---

### 1.4 Konfigurasi Firewall UFW (Zero Inbound Web Port)
Karena Anda akan menggunakan **Cloudflare Tunnel**, port web 80 dan 443 **tidak perlu dibuka** ke internet. Anda hanya perlu membuka port SSH:

```bash
# Set aturan default: tolak semua koneksi masuk, izinkan semua koneksi keluar
ufw default deny incoming
ufw default allow outgoing

# HANYA buka port SSH (22)
ufw allow 22/tcp comment 'SSH Port'

# Aktifkan firewall
ufw --force enable

# Verifikasi status firewall
ufw status verbose
```
*Hasil:* Seluruh port aplikasi tertutup rapat dari dunia luar; hanya Anda yang bisa mengakses server via SSH.

---

### 1.5 Instalasi & Konfigurasi Fail2ban
Fail2ban otomatis memblokir IP penyerang yang mencoba melakukan brute-force SSH:
```bash
nano /etc/fail2ban/jail.d/ssh-hardening.local
```
Tempelkan konfigurasi berikut:
```ini
[sshd]
enabled = true
port = 22
filter = sshd
maxretry = 3
findtime = 600
bantime = 86400
backend = systemd
```
Aktifkan service Fail2ban:
```bash
systemctl enable --now fail2ban
fail2ban-client status sshd
```

---

### 1.6 Konfigurasi Swap Space

> [!TIP]
> **Rekomendasi Swap berdasarkan kapasitas RAM VPS:**
> | RAM VPS | Swap yang Disarankan | Alasan |
> |---|---|---|
> | 1 GB | 2 GB | Wajib — tanpa swap sistem akan OOM saat build Docker |
> | 2 GB | 2 GB | Sangat disarankan — build React + MySQL startup butuh headroom |
> | **4 GB** | **1 GB (Recommended)** | Cukup sebagai safety buffer saat `docker compose build` peak ~3.5 GB |
> | 8 GB+ | Opsional | Umumnya tidak diperlukan |

Swap tetap disarankan bahkan di VPS RAM 4 GB karena proses `docker compose build --no-cache` pertama kali (compile React via Node.js + Composer install) dapat mencapai peak RAM ~3.5–3.8 GB secara bersamaan dengan proses OS, MySQL startup, dan Redis.

**Untuk VPS RAM 4 GB — pasang 1 GB Swap:**
```bash
# Alokasikan 1 GB swap file (cukup untuk RAM 4 GB)
fallocate -l 1G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Buat permanen di /etc/fstab
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Optimasi swappiness (10 ideal untuk server database & Docker)
# Nilai rendah = RAM diutamakan, swap hanya dipakai saat darurat
sysctl vm.swappiness=10
echo 'vm.swappiness=10' >> /etc/sysctl.d/99-swap.conf
```

**Untuk VPS RAM 1–2 GB — pasang 2 GB Swap:**
```bash
# Alokasikan 2 GB swap file (wajib untuk RAM rendah)
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

echo '/swapfile none swap sw 0 0' >> /etc/fstab
sysctl vm.swappiness=10
echo 'vm.swappiness=10' >> /etc/sysctl.d/99-swap.conf
```

---

### 1.7 Kernel Network Hardening (sysctl)
Mencegah serangan DoS, SYN flood, dan IP spoofing:
```bash
nano /etc/sysctl.d/99-security.conf
```
Tempelkan konfigurasi berikut:
```ini
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 2048
net.ipv4.tcp_synack_retries = 2
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1
net.ipv4.icmp_echo_ignore_broadcasts = 1
```
Terapkan ke kernel:
```bash
sysctl --system
```

---

### 1.8 Auto-Update Patch Keamanan (Unattended Upgrades)
```bash
dpkg-reconfigure --priority=low unattended-upgrades
```

---

### 1.9 Optimasi DNS & Eliminasi Latensi Resolusi Domain (Wajib untuk VPS)
Secara bawaan di Ubuntu 24.04, `glibc` dan `systemd-resolved` melakukan query ganda (IPv4 A dan IPv6 AAAA). Pada VPS yang tidak memiliki rute global IPv6 aktif, lookup domain keluar (seperti `paymenku.com` atau `github.com`) mengalami delay/timeout 5-10 detik. Terapkan 2 baris optimasi berikut di VPS:

1. **Prioritaskan IPv4 di `gai.conf` (Menghilangkan hang 5-10s saat ping/resolving):**
```bash
sudo sed -i 's/#precedence ::ffff:0:0\/96  100/precedence ::ffff:0:0\/96  100/' /etc/gai.conf
```

2. **Gunakan DNS Resolvers Anycast Cepat (Cloudflare & Google):**
```bash
sudo mkdir -p /etc/systemd/resolved.conf.d
sudo tee /etc/systemd/resolved.conf.d/dns.conf << 'EOF'
[Resolve]
DNS=1.1.1.1 8.8.8.8
FallbackDNS=1.0.0.1 8.8.4.4
DNSSEC=no
EOF
sudo systemctl restart systemd-resolved
```

---

## 3. Fase 2: Instalasi & Konfigurasi Docker Engine Resmi

### 2.1 Install Docker CE & Docker Compose Plugin
```bash
# Tambahkan GPG key resmi Docker
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

# Tambahkan repository Docker ke APT sources
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

# Update paket dan install Docker CE
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Masukkan user deployer ke grup docker agar bisa menjalankan docker tanpa sudo
usermod -aG docker deployer
```

---

### 2.2 Konfigurasi Docker Daemon & Log Rotation
Mencegah log kontainer Docker memenuhi ruang hard disk VPS:
```bash
nano /etc/docker/daemon.json
```
Isi konfigurasi:
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "no-new-privileges": true,
  "live-restore": true
}
```
Restart Docker daemon:
```bash
systemctl restart docker
systemctl enable docker
```

---

## 4. Fase 3: Clone Repositori & Konfigurasi Lingkungan (.env)

Sekarang login kembali sebagai user `deployer`:
```bash
su - deployer
```

### 3.1 Clone Repositori Git ke Server
```bash
# Buat direktori aplikasi
sudo mkdir -p /var/www/hitshare
sudo chown -R deployer:deployer /var/www/hitshare
cd /var/www

# Clone repositori resmi langsung ke folder hitshare
git clone https://github.com/Caw-reN/HITSHARE-V2.git hitshare
cd /var/www/hitshare
```

Verifikasi struktur file di `/var/www/hitshare`:
```text
├── backend/
├── frontend/
├── docker/
├── docker-compose.yml
├── .env.production.example
├── .dockerignore
└── .gitignore
```

---

### 3.2 Setup File Konfigurasi .env
Salin file template `.env.production.example` menjadi `.env`:
```bash
cp .env.production.example .env
nano .env
```

**Periksa dan sesuaikan variabel-variabel kunci berikut pada `.env`:**

```ini
APP_NAME=HitShare
APP_ENV=production
APP_KEY=                         # Dibiarkan kosong, akan di-generate otomatis nanti
APP_DEBUG=false
APP_URL=https://hitshare.web.id  # Masukkan domain akhir Anda yang akan dipasangi Cloudflare Tunnel

# Port Lokal Docker yang akan diakses oleh Cloudflare Tunnel
WEB_PORT=8080

# Database MySQL (Internal Docker Network)
DB_CONNECTION=mysql
DB_HOST=db
DB_PORT=3306
DB_DATABASE=hitshare_prod
DB_USERNAME=hitshare_user
DB_PASSWORD=GantiPasswordKuatDB123!
DB_ROOT_PASSWORD=GantiPasswordRootKuat456!

# Cache & Sessions (Gunakan file: stabil, ringan, dan tidak membutuhkan ekstensi C redis)
SESSION_DRIVER=file
CACHE_STORE=file

# Paymenku Gateway (OPSIONAL — Bisa Dikonfigurasi via Admin Dashboard)
# Variabel di bawah ini TIDAK WAJIB diisi sekarang.
# Aplikasi akan mengutamakan nilai dari tabel settings (Admin Dashboard > Pengaturan > Gateway).
# Variabel .env hanya digunakan sebagai fallback jika Admin Dashboard belum dikonfigurasi.
PAYMENKU_API_KEY=
PAYMENKU_WEBHOOK_SECRET=
PAYMENKU_IS_PRODUCTION=true

# Frontend & Extension
FRONTEND_URL=https://hitshare.web.id
ALLOWED_EXTENSION_ID=
SANCTUM_EXPIRATION_MINUTES=43200
```
> Simpan dengan menekan `Ctrl + O`, `Enter`, lalu keluar dengan `Ctrl + X`.

---

## 5. Fase 4: Build & Menjalankan Kontainer Docker

Setelah file `.env` selesai dikonfigurasi, jalankan kontainer Docker:

```bash
cd /var/www/hitshare
```

### 4.1 Eksekusi Docker Compose Build & Up
```bash
# Build kontainer (React frontend & PHP 8.3 FPM)
docker compose build --no-cache

# Jalankan seluruh 5 service di background
docker compose up -d
```

Periksa status seluruh service:
```bash
docker compose ps
```
Pastikan seluruh 5 kontainer berjalan dengan status **Up / healthy**:
- `hitshare_web` (Port `0.0.0.0:8080->80/tcp`)
- `hitshare_app`
- `hitshare_db` (Healthy)
- `hitshare_redis`
- `hitshare_scheduler`

---

### 4.2 Inisialisasi Database, Storage, dan Caching Laravel

Jalankan serangkaian perintah inisialisasi di dalam kontainer `hitshare_app`:

```bash
# 1. Generate Application Key Laravel
docker compose exec app php artisan key:generate

# 2. Buat symlink storage publik
docker compose exec app php artisan storage:link

# 3. Jalankan migrasi tabel database & seeder dasar
docker compose exec app php artisan migrate --force
docker compose exec app php artisan db:seed --force

# 4. Buat Akun Super Admin Produksi & Hapus Akun Default
docker compose exec -T app php artisan tinker << 'EOF'
$admin = \App\Models\Admin::updateOrCreate(
    ['username' => 'raja_terahir_passwordnya'],
    [
        'password' => \Illuminate\Support\Facades\Hash::make('_10@(38$*57^"MAKAN-makan"'),
        'role'     => 'superadmin',
    ]
);
// Hapus user 'admin' bawaan seeder agar tidak ada celah keamanan default password
\App\Models\Admin::where('username', 'admin')->delete();
echo "\nAkun Super Admin berhasil dibuat/diperbarui: " . $admin->username . "\n";
EOF

# 5. Kompilasi & Cache Laravel untuk Kecepatan Maksimal
docker compose exec app php artisan optimize:clear
docker compose exec app php artisan config:cache
docker compose exec app php artisan route:cache
docker compose exec app php artisan view:cache
```

---

## 6. Fase 5: Verifikasi Sistem Berjalan di Localhost VPS

Lakukan pengujian lokal langsung dari terminal VPS untuk memastikan sistem merespon dengan sempurna:

### 1. Uji Web Server & SPA Frontend di Localhost
```bash
curl -I http://localhost:8080
```
*Ekspektasi Output:*
```http
HTTP/1.1 200 OK
Server: nginx/...
Content-Type: text/html
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
```

---

### 2. Uji Routing Webhook Paymenku (Hasil Resolusi AUD3-CRIT-01)
```bash
curl -X POST http://localhost:8080/api/payment/webhook/paymenku
```
*Ekspektasi Output:* Respon JSON dari controller (bukan 404).

---

### 3. Uji Unduhan Arsip Ekstensi v2.0.5 Resmi (Hasil Resolusi AUD3-CRIT-02)
```bash
curl -I http://localhost:8080/downloads/extension.zip
```
*Ekspektasi Output:*
```http
HTTP/1.1 200 OK
Content-Type: application/zip
Content-Length: 817672
```

---

### 4. Periksa Log Scheduler Worker
```bash
docker compose logs --tail=30 scheduler
```
*Ekspektasi Output:* Memperlihatkan bahwa `php artisan schedule:work` aktif memonitor perintah auto-expire pesanan pending setiap 10 menit.

---

## 7. Fase 6: Informasi Kesiapan Integrasi Cloudflare Tunnel

🎉 **Aplikasi HitShare kini telah 100% aktif dan berjalan di local VPS Anda!**

Saat Anda mengonfigurasi **Cloudflare Zero Trust Tunnel** (`cloudflared`):
- **Service Type:** `HTTP`
- **URL Target:** `localhost:8080` (atau `127.0.0.1:8080`)
- **Public Hostname:** Masukkan domain Anda (misal `hitshare.web.id`)
- **HTTP Settings:**
  - Tidak memerlukan modifikasi SSL di server lokal, karena koneksi antara `cloudflared` dan kontainer `hitshare_web` berlangsung secara aman di dalam *loopback network* internal VPS Anda.
  - Laravel di kontainer backend telah dilengkapi dengan `$middleware->trustProxies(at: '*');` pada `bootstrap/app.php` sehingga otomatis mengenali protokol `https://` dan header asli pengunjung (`CF-Connecting-IP`, `X-Forwarded-Proto`) yang dikirimkan oleh Cloudflare.

---

## 8. Fase 7: Prosedur Backup & Pemeliharaan Rutin

### 8.1 Skrip Backup Database MySQL Otomatis
Buat direktori backup di host:
```bash
mkdir -p /var/backups/hitshare
nano /var/www/hitshare/backup.sh
```
Isi skrip:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/hitshare"
DB_USER=$(grep DB_USERNAME /var/www/hitshare/.env | cut -d '=' -f2)
DB_PASS=$(grep DB_PASSWORD /var/www/hitshare/.env | cut -d '=' -f2)
DB_NAME=$(grep DB_DATABASE /var/www/hitshare/.env | cut -d '=' -f2)

# Dump database dari container MySQL ke host
docker exec hitshare_db mysqldump -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" | gzip > "$BACKUP_DIR/db_${DB_NAME}_${DATE}.sql.gz"

# Hapus backup yang lebih lama dari 14 hari
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +14 -delete

echo "[$DATE] Backup completed: db_${DB_NAME}_${DATE}.sql.gz"
```
Beri hak eksekusi dan pasang di Crontab:
```bash
chmod +x /var/www/hitshare/backup.sh
crontab -e
```
Jadwalkan backup setiap pukul 02:00 dini hari:
```cron
0 2 * * * /var/www/hitshare/backup.sh >> /var/log/hitshare_backup.log 2>&1
```

---

### 8.2 Perintah Pemeliharaan Cepat (Cheat Sheet)

| Kebutuhan | Perintah Terminal |
|---|---|
| **Cek Log Real-time Aplikasi** | `docker compose logs -f --tail=100 app` |
| **Cek Log Web Server Nginx** | `docker compose logs -f --tail=100 web` |
| **Restart Seluruh Layanan** | `docker compose restart` |
| **Stop Seluruh Layanan** | `docker compose down` |
| **Update Kode Baru dari GitHub** | `git pull origin main && docker compose build && docker compose up -d && docker compose exec app php artisan migrate --force && docker compose exec app php artisan optimize` |
| **Monitoring Resource CPU / RAM** | `docker stats` |
| **Masuk ke Container Backend** | `docker compose exec app bash` (atau `sh`) |
| **Pemeriksaan Kesehatan Cookie Akun** | `docker compose exec app php artisan cookies:health-check` |

---
*Dokumen ini merupakan panduan deployment lokal Docker dan hardening sistem HitShare yang siap dihubungkan ke Cloudflare Zero Trust Tunnel.*
