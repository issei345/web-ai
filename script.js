// --- 1. DEKLARASI VARIABEL & KONSTANTA ---

// URL ke model Teachable Machine Anda
const URL = "./model/";

let model, webcam, labelContainer, maxPredictions;

// Mengambil elemen-elemen HTML untuk interaksi
const uploadTab = document.getElementById('upload-tab');
const webcamTab = document.getElementById('webcam-tab');
const uploadSection = document.getElementById('upload-section');
const webcamSection = document.getElementById('webcam-section');

const fileInput = document.getElementById('file-input');
const imagePreview = document.getElementById('image-preview');
const previewText = document.getElementById('preview-text');
const uploadResultContainer = document.getElementById('upload-result');

const webcamButton = document.getElementById('webcam-button');
const webcamContainer = document.getElementById('webcam-container');
const webcamResultContainer = document.getElementById('webcam-result');

// --- 2. FUNGSI UTAMA ---

// Fungsi ini dijalankan saat halaman pertama kali dimuat
async function init() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    // Memuat model dan metadata dari folder 'model'
    try {
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();
        console.log("Model berhasil dimuat!");

        // Menyiapkan kontainer untuk hasil prediksi
        setupPredictionUI();
        
        // Menambahkan 'event listener' ke input file
        fileInput.addEventListener('change', handleImageUpload);
        webcamButton.addEventListener('click', setupWebcam);

    } catch (error) {
        console.error("Gagal memuat model:", error);
        alert("Tidak dapat memuat model AI. Pastikan file model ada di folder yang benar.");
    }
}

// Fungsi untuk menyiapkan UI hasil prediksi
function setupPredictionUI() {
    // Kosongkan kontainer jika ada isinya
    uploadResultContainer.innerHTML = '';
    webcamResultContainer.innerHTML = '';

    // Buat elemen untuk setiap kelas prediksi
    for (let i = 0; i < maxPredictions; i++) {
        const className = model.getClassLabels()[i];
        
        const html = `
            <div class="prediction-item">
                <span class="class-name">${className}</span>
                <div class="progress-bar">
                    <div class="progress"></div>
                </div>
                <span class="probability">0%</span>
            </div>
        `;

        uploadResultContainer.innerHTML += html;
        webcamResultContainer.innerHTML += html;
    }
}

// --- 3. LOGIKA TAB ---

function showTab(tabName) {
    // Sembunyikan semua section
    uploadSection.classList.remove('active');
    webcamSection.classList.remove('active');
    
    // Matikan status aktif semua tab
    uploadTab.classList.remove('active');
    webcamTab.classList.remove('active');

    // Tampilkan section dan aktifkan tab yang dipilih
    document.getElementById(tabName + '-section').classList.add('active');
    document.getElementById(tabName + '-tab').classList.add('active');
}


// --- 4. LOGIKA UPLOAD GAMBAR ---

async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();

    // Langkah 1: Baca file sebagai URL data
    reader.readAsDataURL(file);
    
    // Langkah 2: Setelah file selesai dibaca...
    reader.onload = () => {
        // Tampilkan teks "placeholder" lagi sambil menunggu gambar dimuat
        previewText.style.display = 'block';

        // PERBAIKAN: Tunggu gambar benar-benar dimuat di elemen <img>
        // sebelum menjalankan prediksi.
        imagePreview.onload = async () => {
            previewText.style.display = 'none'; // Sembunyikan teks placeholder lagi
            
            // Langkah 3: BARU SETELAH ITU, jalankan prediksi
            const prediction = await model.predict(imagePreview);
            updatePredictionUI(prediction, uploadResultContainer);
        }

        // Atur sumber gambar, yang akan memicu imagePreview.onload di atas
        imagePreview.src = reader.result;
    };
}

// --- 5. LOGIKA WEBCAM ---

async function setupWebcam() {
    webcam = new tmImage.Webcam(300, 300, true); // width, height, flip
    try {
        await webcam.setup(); // Minta izin akses kamera
        await webcam.play();
        window.requestAnimationFrame(loop);

        // Tambahkan elemen video ke kontainer
        webcamContainer.innerHTML = ''; // Bersihkan kontainer
        webcamContainer.appendChild(webcam.canvas);
        webcamButton.textContent = 'Memprediksi...';
        webcamButton.disabled = true;

    } catch (error) {
        console.error("Gagal mengakses webcam:", error);
        alert("Tidak dapat mengakses webcam. Pastikan Anda memberikan izin.");
    }
}

async function loop() {
    webcam.update(); // Update frame webcam
    await predictWebcam();
    window.requestAnimationFrame(loop);
}

async function predictWebcam() {
    const prediction = await model.predict(webcam.canvas);
    updatePredictionUI(prediction, webcamResultContainer);
}

// --- 6. FUNGSI PEMBANTU (HELPER) ---

function updatePredictionUI(prediction, container) {
    for (let i = 0; i < maxPredictions; i++) {
        const probability = prediction[i].probability;
        const formattedProb = Math.round(probability * 100);

        // Dapatkan elemen-elemen dari kontainer yang sesuai
        const progressElement = container.getElementsByClassName('progress')[i];
        const probabilityElement = container.getElementsByClassName('probability')[i];

        // Update lebar progress bar dan teks probabilitas
        progressElement.style.width = formattedProb + '%';
        probabilityElement.textContent = formattedProb + '%';
    }
}

// --- 7. JALANKAN FUNGSI UTAMA ---
init();