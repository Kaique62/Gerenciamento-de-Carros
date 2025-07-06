
/* TODO: Consultas de placas digitais, já puxa o modelo e o ano do carro 
ex da Api: https://www.npmjs.com/package/sinesp-api 
*/

// a unica coisa estranha é vc
document.addEventListener('DOMContentLoaded', () => {
    // API Endpoints (replace with your actual endpoints)
    const API_URL = '/api/cars';
    const API_URL_SELL = '/api/sales';
    const IMAGE_UPLOAD_URL = '/api/cars/images/upload';
    const CAR_STATUSES = ['available', 'sold', 'maintenance'];

    // DOM Elements
    const carGridContainer = document.getElementById('car-grid-container');
    const detailsModal = document.getElementById('details-modal');
    const addModal = document.getElementById('add-modal');
    const sellModal = document.getElementById('sell-modal');
    const addCarForm = document.getElementById('add-car-form');
    const sellCarForm = document.getElementById('sell-car-form');
    const searchInput = document.getElementById('search-input');
    const filterSelect = document.getElementById('filter-select');
    const editByPlateButton = document.getElementById('edit-by-plate-button');
    const plateSearchInput = document.getElementById('plate-search');
    
    // State
    let cars = [];
    let filteredCars = [];

    // Helper functions
    const formatPrice = (value) => new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);

    const formatMileage = (value) => `${new Intl.NumberFormat('pt-BR').format(value)} KM`;

    // API Functions
    async function fetchCars() {
        try {
            const response = await fetch(`${API_URL}/retrieve`);
            const data = await response.json({status: 'available'});
            
            if (data.error) {
                console.error('Error fetching cars:', data.error);
                return [];
            }
            
            return data;
        } catch (error) {
            console.error('Failed to fetch cars:', error);
            return [];
        }
    }

    async function fetchCarImages(licensePlate) {
        try {
            const response = await fetch(`${API_URL}/images/${licensePlate}`);
            const data = await response.json();
            
            if (data.error) {
                console.error(`Error fetching images for ${licensePlate}:`, data.error);
                return [];
            }
            
            return data;
        } catch (error) {
            console.error(`Failed to fetch images for ${licensePlate}:`, error);
            return [];
        }
    }

    async function addCar(carData) {
        try {
            const response = await fetch(`${API_URL}/upload`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(carData)
            });
            
            return await response.json();
        } catch (error) {
            console.error('Failed to add car:', error);
            return { error: 'Failed to add car' };
        }
    }

    async function uploadCarImages(licensePlate, images) {
        try {
            const formData = new FormData();
            formData.append('license_plate', licensePlate);
            
            for (let i = 0; i < images.length; i++) {
                formData.append('images', images[i]);
            }
            
            const response = await fetch(IMAGE_UPLOAD_URL, {
                method: 'POST',
                body: formData
            });
            
            return await response.json();
        } catch (error) {
            console.error('Failed to upload images:', error);
            return { error: 'Failed to upload images' };
        }
    }

    async function updateCar(licensePlate, carData) {
        try {
            carData.license_plate = licensePlate;
            const response = await fetch(`${API_URL}/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(carData)
            });

            return await response.json();
        } catch (error) {
            console.error('Failed to update car:', error);
            return { error: 'Failed to update car' };
        }
    }

    async function sellCar(saleData) {
        try {
            const response = await fetch(`${API_URL_SELL}/sales/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(saleData)
            });
            
            return await response.json();
        } catch (error) {
            console.error('Failed to sell car:', error);
            return { error: 'Failed to register sale' };
        }
    }

    // Render Functions
   async function createCarCard(car) {
        let mainImage;
        const images = await fetchCarImages(car.license_plate);
        if (images.length > 0) {
            mainImage = images[0].link;
        }
        else {
            mainImage = `https://placehold.co/600x400/000/FFF?text=${car.name}`;
        }

        const isSold = car.status === 'sold';
        return `
        <div id="card-${car.license_plate}" class="relative bg-white rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 flex flex-col">
            ${isSold ? `<div class="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-10">
                <span class="text-white text-3xl font-bold border-4 p-4 transform -rotate-12">VENDIDO</span>
            </div>` : ''}
            <img src="${mainImage}" 
                 alt="${car.name}" 
                 class="w-full h-48 object-cover">
            <div class="p-5 flex flex-col flex-grow">
                <div class="flex-grow">
                    <h3 class="text-xl font-bold text-gray-800 truncate" title="${car.name}">${car.name}</h3>
                    <p class="text-sm text-gray-500 mb-3">${car.year}</p>
                    <p class="text-3xl font-bold text-green-600 mb-4">${formatPrice(car.price)}</p>
                    <div class="flex justify-between items-center text-sm text-gray-700">
                        <span>Placa:</span>
                        <div class="flex items-center gap-2">
                            <span class="font-mono font-semibold bg-gray-200 px-2 py-1 rounded">${car.license_plate}</span>
                            <button data-copy-text="${car.license_plate}" 
                                    title="Copiar Placa" 
                                    class="js-copy-button text-gray-500 hover:text-blue-600">
                                <i class="bi bi-clipboard"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="mt-6 pt-4 border-t">
                    <button data-plate="${car.license_plate}" 
                            class="js-details-button w-full inline-flex items-center justify-center text-white font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-colors ${isSold ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}" 
                            ${isSold ? 'disabled' : ''}>
                        <i class="bi bi-search mr-2"></i> Ver Detalhes
                    </button>
                </div>
            </div>
        </div>`;
    }

    async function renderCarCards() {
        if (!carGridContainer) return;
        
        carGridContainer.innerHTML = '<div class="col-span-full text-center py-10">Carregando veículos...</div>';
        
        try {
            cars = await fetchCars();
            applyFilters();
            
            if (filteredCars.length === 0) {
                carGridContainer.innerHTML = '<div class="col-span-full text-center py-10">Nenhum veículo encontrado</div>';
                return;
            }
            
            let cardsHTML = '';
            for (const car of filteredCars) {
                cardsHTML += await createCarCard(car);
            }
            
            carGridContainer.innerHTML = cardsHTML;
        } catch (error) {
            console.error('Error rendering car cards:', error);
            carGridContainer.innerHTML = '<div class="col-span-full text-center py-10 text-red-500">Erro ao carregar veículos</div>';
        }
    }

    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase();
        const statusFilter = filterSelect.value;
        
        filteredCars = cars.filter(car => {
            const matchesSearch = car.license_plate.toLowerCase().includes(searchTerm) || 
                                car.name.toLowerCase().includes(searchTerm) ||
                                (car.year && car.year.toLowerCase().includes(searchTerm));
            
            const matchesStatus = !statusFilter || car.status === statusFilter;
            
            return matchesSearch && matchesStatus;
        });
    }

    // Modal Functions
    function openModal(modalElement) {
        if (modalElement) {
            modalElement.classList.remove('hidden');
            document.body.classList.add('overflow-hidden');
        }
    }

    function closeModal(modalElement) {
        if (modalElement) {
            modalElement.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
            
            const form = modalElement.querySelector('form');
            if (form) {
                form.reset();
                
                if (modalElement.id === 'add-modal') {
                    // Reset image previews
                    const mainImagePreview = form.querySelector('.mainImagePreview');
                    const mainImageIcon = form.querySelector('.mainImageIcon');
                    if (mainImagePreview && mainImageIcon) {
                        mainImagePreview.classList.add('hidden');
                        mainImagePreview.src = '';
                        mainImageIcon.classList.remove('hidden');
                    }
                
                    
                    form.querySelector('h2').textContent = 'Adicionar Novo Veículo';
                    const licensePlateInput = form.querySelector('[name="license_plate"]');
                    if (licensePlateInput) {
                        licensePlateInput.disabled = false;
                    }
                    delete form.dataset.mode;
                    delete form.dataset.editingPlate;
                }
            }
        }
    }

    async function populateAndShowDetailsModal(plate) {
        const car = cars.find(c => c.license_plate === plate);
        if (!car || !detailsModal) return;

        const images = await fetchCarImages(plate);
        if (images.length > 0) {
            mainImage = images[0].link;
        }
        else {
            mainImage = "https://placehold.co/600x400/000/FFF?text=No+Image";
        }

        detailsModal.querySelector('#details-modal-title').textContent = car.name;
        detailsModal.querySelector('#details-modal-image').src = mainImage;
        detailsModal.querySelector('#details-modal-price').textContent = formatPrice(car.price);

        const specsContainer = detailsModal.querySelector('#details-modal-specs');
        specsContainer.innerHTML = `
            <div class="flex justify-between"><dt class="font-medium">Ano:</dt><dd>${car.year || 'N/A'}</dd></div>
            <div class="flex justify-between"><dt class="font-medium">Quilometragem:</dt><dd>${car.mileage ? formatMileage(car.mileage) : 'N/A'}</dd></div>
            <div class="flex justify-between"><dt class="font-medium">Placa:</dt><dd class="font-mono bg-gray-100 px-2 rounded">${car.license_plate}</dd></div>
            <div class="flex justify-between"><dt class="font-medium">Chassi:</dt><dd class="font-mono">${car.chassis || 'N/A'}</dd></div>
            <div class="flex justify-between"><dt class="font-medium">RENAVAM:</dt><dd class="font-mono">${car.registration_number || 'N/A'}</dd></div>
            <div class="flex justify-between"><dt class="font-medium">CRV/ATPV-e:</dt><dd class="font-mono">${car.ownership_document || 'N/A'}</dd></div>
        `;

        detailsModal.querySelector('#details-sell-button').dataset.plate = plate;
        openModal(detailsModal);
    }

    function populateAndShowSellModal(plate) {
        const car = cars.find(c => c.license_plate === plate);
        if (!car || !sellModal) return;

        closeModal(detailsModal);

        sellModal.querySelector('#sell-modal-car-name').textContent = car.name;
        sellModal.querySelector('#sell-modal-car-plate').textContent = car.license_plate;
        sellModal.querySelector('#sell-modal-hidden-plate').textContent = car.license_plate;
        sellModal.querySelector('#sale_value').value = car.price || '';
        
        // Set today as default sale date
        const today = new Date().toISOString().split('T')[0];
        sellModal.querySelector('#sale_date').value = today;

        sellCarForm.dataset.currentPlate = plate;
        openModal(sellModal);
    }

    async function populateAndShowEditModal(plate) {
        const carToEdit = cars.find(c => c.license_plate === plate);

        if (!carToEdit) {
            alert(`Veículo com a placa "${plate}" não encontrado.`);
            return;
        }

        const modal = addModal;
        const form = addCarForm;

        modal.querySelector('h2').textContent = 'Editar Veículo';
        form.dataset.mode = 'edit';
        form.dataset.editingPlate = plate;

        // Fill form with car data
        form.querySelector('[name="name"]').value = carToEdit.name || '';
        form.querySelector('[name="license_plate"]').value = carToEdit.license_plate || '';
        form.querySelector('[name="year"]').value = carToEdit.year || '';
        form.querySelector('[name="price"]').value = carToEdit.price || '';
        form.querySelector('[name="mileage"]').value = carToEdit.mileage || '';
        form.querySelector('[name="chassis"]').value = carToEdit.chassis || '';
        form.querySelector('[name="registration_number"]').value = carToEdit.registration_number || '';
        form.querySelector('[name="ownership_document"]').value = carToEdit.ownership_document || '';
        form.querySelector('[name="ipva_tax_years"]').value = carToEdit.ipva_tax_years || '';
        form.querySelector('[name="description"]').value = carToEdit.description || '';

        // Disable license plate editing
        form.querySelector('[name="license_plate"]').disabled = true;

        let mainImage = await fetchCarImages(plate);

        if (mainImage.length > 0){
            const mainImagePreview = form.querySelector('.mainImagePreview');
            const mainImageIcon = form.querySelector('.mainImageIcon');
            if (mainImagePreview && mainImageIcon) {
                mainImagePreview.src = mainImage[0].link;
                mainImagePreview.classList.remove('hidden');
                mainImageIcon.classList.add('hidden');
            }
        }
        // show delete button
        const deleteButtonDiv = modal.querySelector('#delete-car-div');
        if (deleteButtonDiv) {
            deleteButtonDiv.classList.remove('hidden');
        }

        // Show the modal
        openModal(modal);
    }

    // Event Handlers
    async function handleAddFormSubmit(event) {
        event.preventDefault();
        const form = event.target;
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;
        
        try {
            submitButton.innerHTML = '<i class="bi bi-arrow-repeat animate-spin"></i> Salvando...';
            submitButton.disabled = true;
            
            // Get form data
            const formData = new FormData(form);
            const carData = {
                name: formData.get('name'),
                license_plate: formData.get('license_plate'),
                year: formData.get('year'),
                price: parseFloat(formData.get('price')),
                mileage: parseInt(formData.get('mileage'), 10),
                chassis: formData.get('chassis'),
                registration_number: formData.get('registration_number'),
                ownership_document: formData.get('ownership_document'),
                ipva_tax_years: formData.get('ipva_tax_years'),
                description: formData.get('description'),
                status: 'available'
            };
            
            // Handle images
            const mainImageFile = formData.get('mainImage');
            
            // Add/update car
            let result;
            if (form.dataset.mode === 'edit') {
                // Update existing car
                result = await updateCar(form.dataset.editingPlate, carData);
            } else {
                // Add new car
                result = await addCar(carData);
            }
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            // Upload images if any
            if (mainImageFile.size > 0) {
                const images = [];
                if (mainImageFile.size > 0) images.push(mainImageFile);
                const uploadResult = await uploadCarImages(carData.license_plate, images);
                if (uploadResult.error) {
                    console.error('Image upload error:', uploadResult.error);
                }
            }
            
            // Refresh car list
            await renderCarCards();
            closeModal(addModal);
            
            // Show success message
            alert(`Veículo ${form.dataset.mode === 'edit' ? 'atualizado' : 'adicionado'} com sucesso!`);
        } catch (error) {
            console.error('Form submission error:', error);
            alert(`Erro ao ${form.dataset.mode === 'edit' ? 'atualizar' : 'adicionar'} veículo: ${error.message}`);
        } finally {
            submitButton.innerHTML = originalButtonText;
            submitButton.disabled = false;
        }
    }

    async function handleSellFormSubmit(event) {
        event.preventDefault();
        const form = event.target;
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;
        const plate = form.dataset.currentPlate;
        
        try {
            submitButton.innerHTML = '<i class="bi bi-arrow-repeat animate-spin"></i> Registrando...';
            submitButton.disabled = true;
            
            // Get form data
            const saleData = {
                car_license_plate: plate,
                sale_value: parseFloat(form.querySelector('#sale_value').value),
                date: form.querySelector('#sale_date').value,
                payment_method: form.querySelector('#payment_method').value,
            };
            
            console.log('Sale Data:', saleData);
            // Register sale
            const result = await sellCar(saleData);
            //if (result.error) {
            //    throw new Error(result.error);
            //}
            
            // Refresh car list
            await renderCarCards();
            closeModal(sellModal);
            
            // Show success message
            alert('Venda registrada com sucesso!');
        } catch (error) {
            console.error('Sale registration error:', error);
            alert(`Erro ao registrar venda: ${error.message}`);
        } finally {
            submitButton.innerHTML = originalButtonText;
            submitButton.disabled = false;
        }
    }

    function handleEditByPlateClick() {
        const plate = plateSearchInput.value.trim().toUpperCase();
        
        if (!plate) {
            alert('Por favor, digite uma placa para editar.');
            return;
        }
        
        populateAndShowEditModal(plate);
        plateSearchInput.value = '';
    }

    function handleAppClick(event) {
        const target = event.target;
        
        // Open details modal
        if (target.closest('.js-details-button')) {
            const button = target.closest('.js-details-button');
            if (!button.disabled) {
                populateAndShowDetailsModal(button.dataset.plate);
            }
        }
        // Open add modal
        else if (target.closest('#open-add-modal-button')) {
            openModal(addModal);
            const deleteButtonDiv = addModal.querySelector('#delete-car-div');
            if (deleteButtonDiv) {
                deleteButtonDiv.classList.add('hidden');
            }
        }
        // Close modal
        else if (target.closest('.js-close-modal')) {
            const modal = target.closest('.fixed');
            closeModal(modal);
        }
        // Start sale process
        else if (target.closest('#details-sell-button')) {
            populateAndShowSellModal(target.closest('#details-sell-button').dataset.plate);
        }
        // Copy plate to clipboard
        else if (target.closest('.js-copy-button')) {
            const button = target.closest('.js-copy-button');
            navigator.clipboard.writeText(button.dataset.copyText)
                .then(() => {
                    // Visual feedback
                    const originalHTML = button.innerHTML;
                    button.innerHTML = '<i class="bi bi-check"></i>';
                    setTimeout(() => {
                        button.innerHTML = originalHTML;
                    }, 2000);
                })
                .catch(err => console.error('Failed to copy:', err));
        }
        // Image preview handling
        else if (target.closest('input[type="file"]')) {
            const input = target.closest('input[type="file"]');
            const container = input.closest('label');
            
            input.addEventListener('change', function() {
                if (this.files && this.files[0]) {
                    const reader = new FileReader();
                    
                    reader.onload = function(e) {
                        if (input.name === 'mainImage') {
                            const preview = container.querySelector('.mainImagePreview');
                            const icon = container.querySelector('.mainImageIcon');
                            if (preview && icon) {
                                preview.src = e.target.result;
                                preview.classList.remove('hidden');
                                icon.classList.add('hidden');
                            }
                        }
                    }
                    
                    reader.readAsDataURL(this.files[0]);
                }
            });
        }
    }

    // Initialize Event Listeners
    function initEventListeners() {
        // Form submissions
        addCarForm?.addEventListener('submit', handleAddFormSubmit);
        sellCarForm?.addEventListener('submit', handleSellFormSubmit);
        
        // Global click handler
        document.addEventListener('click', handleAppClick);
        
        // Edit by plate button
        editByPlateButton?.addEventListener('click', handleEditByPlateClick);
        
        // Search and filter
        searchInput?.addEventListener('input', () => {
            applyFilters();
            renderCarCards();
        });
        
        filterSelect?.addEventListener('change', () => {
            applyFilters();
            renderCarCards();
        });
        
        // Close modals with ESC key
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                [detailsModal, addModal, sellModal].forEach(closeModal);
            }
        });
    }

    // Initialize the application
    async function initApp() {
        initEventListeners();
        await renderCarCards();
    }

    // Start the app
    initApp();
});