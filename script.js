// Workout Tracker Application
class WorkoutTracker {
    constructor() {
        this.workouts = [];
        this.currentEditId = null;
        this.confirmDeleteId = null;
        
        this.init();
    }

    // Initialize the application
    init() {
        this.loadWorkouts();
        if (window.location.pathname.includes('form.html')) {
            this.initFormPage();
        } else {
            this.initListPage();
        }
    }

    // Set default date to today
    setDefaultDate() {
        const dateInput = document.getElementById('date');
        if (!dateInput) return;
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }

    // Handle form submission (Create/Update)
    handleFormSubmit() {
        const formData = new FormData(document.getElementById('workoutForm'));
        const workoutData = {
            exerciseType: formData.get('exerciseType'),
            duration: parseInt(formData.get('duration')),
            date: formData.get('date'),
            intensity: formData.get('intensity'),
            notes: formData.get('notes')
        };

        // Enhanced validation
        if (!workoutData.exerciseType || workoutData.exerciseType.trim() === '') {
            this.showToast('Jenis latihan wajib diisi', 'error');
            return;
        }
        
        if (!workoutData.duration || workoutData.duration <= 0) {
            this.showToast('Durasi harus lebih dari 0', 'error');
            return;
        }
        
        if (!workoutData.date || workoutData.date.trim() === '') {
            this.showToast('Tanggal wajib diisi', 'error');
            return;
        }

        if (this.currentEditId) {
            // Update existing workout
            this.updateWorkout(this.currentEditId, workoutData);
        } else {
            // Create new workout
            this.createWorkout(workoutData);
        }
    }

    // Create new workout
    createWorkout(workoutData) {
        const workout = {
            id: Date.now().toString(),
            ...workoutData,
            createdAt: new Date().toISOString()
        };

        this.workouts.unshift(workout);
        this.saveWorkouts();

        // If on form page, redirect with flash
        const isFormPage = !!document.getElementById('workoutForm');
        if (isFormPage) {
            this.setFlash('Latihan berhasil ditambahkan!', 'success');
            window.location.href = 'index.html';
            return;
        }

        // If on list page, update UI directly
        this.renderWorkouts();
        this.updateStats();
        this.resetForm();
        this.showToast('Latihan berhasil ditambahkan!', 'success');
    }

    // Update existing workout
    updateWorkout(id, workoutData) {
        const index = this.workouts.findIndex(w => w.id === id);
        if (index !== -1) {
            this.workouts[index] = {
                ...this.workouts[index],
                ...workoutData,
                updatedAt: new Date().toISOString()
            };
            this.saveWorkouts();

            // If on form page, redirect with flash
            const isFormPage = !!document.getElementById('workoutForm');
            if (isFormPage) {
                this.setFlash('Latihan berhasil diperbarui!', 'success');
                window.location.href = 'index.html';
                return;
            }

            // If on list page, update UI directly (legacy path)
            this.renderWorkouts();
            this.updateStats();
            this.resetForm();
            this.cancelEdit();
            this.showToast('Latihan berhasil diperbarui!', 'success');
        }
    }

    // Delete workout
    deleteWorkout(id) {
        const workout = this.workouts.find(w => w.id === id);
        if (workout) {
            document.getElementById('confirmMessage').textContent = 
                `Apakah Anda yakin ingin menghapus latihan "${workout.exerciseType}" pada ${this.formatDate(workout.date)}?`;
            this.showModal(id);
        }
    }

    // Confirm delete action
    confirmDelete() {
        const workoutId = this.confirmModal.dataset.workoutId;
        this.workouts = this.workouts.filter(w => w.id !== workoutId);
        this.saveWorkouts();
        this.renderWorkouts();
        this.updateStats();
        this.hideModal();
        this.showToast('Latihan berhasil dihapus!', 'success');
    }

    // Edit workout (populate form)
    editWorkout(id) {
        // Redirect to dedicated form page with id param
        window.location.href = `form.html?id=${encodeURIComponent(id)}`;
    }

    // Cancel edit mode
    cancelEdit() {
        this.currentEditId = null;
        this.resetForm();
        const submitBtn = document.querySelector('.btn-primary');
        const cancelBtn = document.getElementById('cancelBtn');
        if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-save"></i> Simpan Latihan';
        if (cancelBtn) cancelBtn.style.display = 'none';
    }

    // Reset form to default state
    resetForm() {
        const form = document.getElementById('workoutForm');
        if (form) {
            form.reset();
            this.setDefaultDate();
        }
    }

    // Filter workouts based on search and type filter
    filterWorkouts() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const filterType = document.getElementById('filterType').value;

        let filteredWorkouts = this.workouts;

        // Filter by type
        if (filterType) {
            filteredWorkouts = filteredWorkouts.filter(w => w.exerciseType === filterType);
        }

        // Filter by search term
        if (searchTerm) {
            filteredWorkouts = filteredWorkouts.filter(w => 
                w.exerciseType.toLowerCase().includes(searchTerm) ||
                (w.notes ? w.notes.toLowerCase() : '').includes(searchTerm)
            );
        }

        this.renderWorkouts(filteredWorkouts);
    }

    // Render workouts list
    renderWorkouts(workoutsToRender = null) {
        const workoutList = document.getElementById('workoutList');
        const noWorkouts = document.getElementById('noWorkouts');
        const workouts = workoutsToRender || this.workouts;

        if (workouts.length === 0) {
            workoutList.style.display = 'none';
            noWorkouts.style.display = 'block';
        } else {
            workoutList.style.display = 'block';
            noWorkouts.style.display = 'none';

            workoutList.innerHTML = workouts.map(workout => this.createWorkoutHTML(workout)).join('');
        }
    }

    // Create HTML for workout item
    createWorkoutHTML(workout) {
        const intensityColors = {
            'Low': '#48bb78',
            'Medium': '#ed8936',
            'High': '#e53e3e'
        };

        const intensityLabels = {
            'Low': 'Rendah',
            'Medium': 'Sedang',
            'High': 'Tinggi'
        };

        return `
            <div class="workout-item" data-id="${workout.id}">
                <div class="workout-header">
                    <div class="workout-title">${workout.exerciseType}</div>
                    <div class="workout-date">${this.formatDate(workout.date)}</div>
                </div>
                <div class="workout-details">
                    <div class="detail-item">
                        <span class="detail-label">Durasi</span>
                        <span class="detail-value">${workout.duration} menit</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Intensitas</span>
                        <span class="detail-value" style="color: ${intensityColors[workout.intensity]}">
                            ${intensityLabels[workout.intensity]}
                        </span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Dibuat</span>
                        <span class="detail-value">${this.formatDateTime(workout.createdAt)}</span>
                    </div>
                    ${workout.updatedAt ? `
                        <div class="detail-item">
                            <span class="detail-label">Diperbarui</span>
                            <span class="detail-value">${this.formatDateTime(workout.updatedAt)}</span>
                        </div>
                    ` : ''}
                </div>
                ${workout.notes ? `
                    <div class="workout-notes">
                        <strong>Catatan:</strong> ${workout.notes}
                    </div>
                ` : ''}
                <div class="workout-actions">
                    <button class="btn btn-edit" onclick="workoutTracker.editWorkout('${workout.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-delete" onclick="workoutTracker.deleteWorkout('${workout.id}')">
                        <i class="fas fa-trash"></i> Hapus
                    </button>
                </div>
            </div>
        `;
    }

    // Update statistics
    updateStats() {
        const totalWorkouts = this.workouts.length;
        const totalMinutes = this.workouts.reduce((sum, w) => sum + w.duration, 0);
        
        let avgIntensity = '-';
        if (totalWorkouts > 0) {
            const intensityValues = { 'Low': 1, 'Medium': 2, 'High': 3 };
            const avgValue = this.workouts.reduce((sum, w) => sum + intensityValues[w.intensity], 0) / totalWorkouts;
            avgIntensity = avgValue <= 1.5 ? 'Rendah' : avgValue <= 2.5 ? 'Sedang' : 'Tinggi';
        }

        document.getElementById('totalWorkouts').textContent = totalWorkouts;
        document.getElementById('totalMinutes').textContent = totalMinutes;
        document.getElementById('avgIntensity').textContent = avgIntensity;
    }

    // LocalStorage operations
    saveWorkouts() {
        localStorage.setItem('workoutTracker_workouts', JSON.stringify(this.workouts));
    }

    loadWorkouts() {
        const saved = localStorage.getItem('workoutTracker_workouts');
        this.workouts = saved ? JSON.parse(saved) : [];
    }

    // Modal operations
    showModal(workoutId) {
        this.confirmModal = document.getElementById('confirmModal');
        this.confirmModal.dataset.workoutId = workoutId;
        this.confirmModal.style.display = 'flex';
    }

    hideModal() {
        document.getElementById('confirmModal').style.display = 'none';
    }

    // Toast notifications
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        if (!toast || !toastMessage) return;
        toast.className = `toast show ${type}`;
        toastMessage.textContent = message;
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Utility functions
    formatDate(dateString) {
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        return new Date(dateString).toLocaleDateString('id-ID', options);
    }

    // Query param helpers and form-page logic
    getQueryParam(name) {
        const params = new URLSearchParams(window.location.search);
        return params.get(name);
    }

    // Flash messaging between pages via sessionStorage
    setFlash(message, type = 'success') {
        try {
            sessionStorage.setItem('workoutTracker_flash', JSON.stringify({ message, type }));
        } catch (_) {}
    }

    formatDateTime(dateString) {
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString('id-ID', options);
    }

    initListPage() {
        // Setup listeners for list page elements
        const searchInput = document.getElementById('searchInput');
        const filterType = document.getElementById('filterType');
        const confirmYes = document.getElementById('confirmYes');
        const confirmNo = document.getElementById('confirmNo');
        const confirmModal = document.getElementById('confirmModal');

        if (searchInput) searchInput.addEventListener('input', () => this.filterWorkouts());
        if (filterType) filterType.addEventListener('change', () => this.filterWorkouts());
        if (confirmYes) confirmYes.addEventListener('click', () => this.confirmDelete());
        if (confirmNo) confirmNo.addEventListener('click', () => this.hideModal());
        if (confirmModal) confirmModal.addEventListener('click', (e) => {
            if (e.target.id === 'confirmModal') this.hideModal();
        });

        // Add slogan interaction
        this.setupSloganInteraction();

        this.renderWorkouts();
        this.updateStats();
    }

    // Setup slogan interaction and automatic rotation
    setupSloganInteraction() {
        const sloganContainer = document.querySelector('.slogan-container');
        if (!sloganContainer) return;

        setInterval(() => {
            this.updateSlogan();
        }, 8000);

        sloganContainer.addEventListener('click', () => {
            this.updateSlogan();
        });

        sloganContainer.style.cursor = 'pointer';
        
        sloganContainer.addEventListener('mouseenter', () => {
            sloganContainer.style.transform = 'scale(1.02)';
        });
        
        sloganContainer.addEventListener('mouseleave', () => {
            sloganContainer.style.transform = 'scale(1)';
        });
    }

    // Create dynamic and attractive slogans
    createAttractiveSlogans() {
        const slogans = [
            "Lacak latihan harian Anda dengan mudah",
            "Setiap gerakan adalah langkah menuju kesehatan",
            "Konsistensi adalah kunci transformasi tubuh",
            "Latihan hari ini, hasil besok",
            "Kecil setiap hari, besar dalam sebulan",
            "Fitness bukan hanya olahraga, tapi gaya hidup",
            "Setiap workout adalah investasi masa depan",
            "Kekuatan datang dari ketekunan",
            "Latihan rutin, tubuh bugar sepanjang hari",
            "Mulai dari yang kecil, capai yang besar",
            "💪 Setiap rep adalah kemenangan",
            "🔥 Latihan adalah obat terbaik",
            "⚡ Energi tak terbatas dengan fitness",
            "🎯 Target fitness, target hidup sehat",
            "🌟 Setiap hari adalah kesempatan baru"
        ];

        const subtitles = [
            "Transformasi tubuh dimulai dari langkah kecil setiap hari",
            "Jadikan setiap hari sebagai kesempatan untuk menjadi lebih baik",
            "Kesehatan adalah kekayaan yang tak ternilai",
            "Latihan adalah obat terbaik untuk tubuh dan pikiran",
            "Konsistensi mengalahkan intensitas",
            "Setiap gerakan membawa Anda lebih dekat ke tujuan",
            "Latihan adalah investasi terbaik untuk diri sendiri",
            "Kekuatan fisik adalah cerminan kekuatan mental",
            "Jadikan fitness sebagai bagian dari rutinitas harian",
            "Latihan hari ini adalah hadiah untuk masa depan",
            "Setiap gerakan membangun kekuatan dan kepercayaan diri",
            "Fitness adalah perjalanan, bukan tujuan",
            "Latihan rutin membuka potensi tak terbatas",
            "Kesehatan adalah fondasi kehidupan yang bahagia",
            "Setiap workout adalah langkah menuju versi terbaik diri"
        ];

        return { slogans, subtitles };
    }

    // Update slogan dynamically
    updateSlogan() {
        const mainSlogan = document.getElementById('mainSlogan');
        const sloganSubtitle = document.querySelector('.slogan-subtitle');
        
        if (!mainSlogan || !sloganSubtitle) return;

        const { slogans, subtitles } = this.createAttractiveSlogans();
        const randomIndex = Math.floor(Math.random() * slogans.length);
        
        // Add fade out effect
        mainSlogan.style.opacity = '0';
        sloganSubtitle.style.opacity = '0';
        
        setTimeout(() => {
            mainSlogan.textContent = slogans[randomIndex];
            sloganSubtitle.textContent = subtitles[randomIndex];
            
            // Add fade in effect
            mainSlogan.style.opacity = '1';
            sloganSubtitle.style.opacity = '1';
        }, 300);
    }

    // Check if we're in edit mode based on URL parameters
    checkEditMode() {
        const urlParams = new URLSearchParams(window.location.search);
        const workoutId = urlParams.get('id');
        
        if (workoutId) {
            this.currentEditId = workoutId;
            this.loadWorkoutForEdit(workoutId);
            
            // Update button text
            const submitBtn = document.querySelector('.btn-primary');
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Latihan';
            }
        }
    }

    // Load workout data for editing
    loadWorkoutForEdit(workoutId) {
        const workout = this.workouts.find(w => w.id === workoutId);
        if (workout) {
            // Populate form fields
            const form = document.getElementById('workoutForm');
            if (form) {
                form.querySelector('[name="exerciseType"]').value = workout.exerciseType;
                form.querySelector('[name="duration"]').value = workout.duration;
                form.querySelector('[name="date"]').value = workout.date;
                form.querySelector('[name="intensity"]').value = workout.intensity;
                form.querySelector('[name="notes"]').value = workout.notes || '';
            }
        }
    }

    initFormPage() {
        // Setup listeners for form page elements
        const workoutForm = document.getElementById('workoutForm');
        const cancelBtn = document.getElementById('cancelBtn');

        if (workoutForm) workoutForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });
        if (cancelBtn) cancelBtn.addEventListener('click', () => {
            // Redirect back to index page
            window.location.href = 'index.html';
        });

        this.setDefaultDate();
        this.checkEditMode(); // Check if editing an existing workout
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.workoutTracker = new WorkoutTracker();
});
