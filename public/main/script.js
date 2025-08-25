
/* TODO: Consultas de placas digitais, já puxa o modelo e o ano do carro 
ex da Api: https://www.npmjs.com/package/sinesp-api 

Essencial para entrega do projeto: 
* Entrada, custo, saida e lucro
* Sistema de Login (Não sei como sera realizado em relação ao cadastro, se os usuários ja serao pre-cadastrados ou realmente tera a opção de cadastrar) || ( Alta prioridade)
* Poderia ser feito um sistema onde o daniel autoriza o cadastro de um usuário (Prioridade média).
* Histórico de Mudança, deve conter todas as mudanças realizadas no estoque para auxilio de controle de movimentação e alterações de carros (Alta prioridade).
* Algum tipo de cyber segurança simples, não precisa ser muito aprofundada, apenas para evitar algum tipo de sql inject como já foi testado antes (Baixa Prioridade).
* Possível tela de financias onde mostra os carros sendo financiados, mostrando os valores das parcelas com uma checklist de qual ja foi paga (Média prioridade).
* Sistema de Backup do banco de dados (Essencial para evitar dores de cabeça no suporte tecnico) || (Alta Prioridade)
* Prazo de Entrega (24/07/2025)
*/

// a unica coisa estranha é vc  
document.addEventListener('DOMContentLoaded', async () => {
    const user = localStorage.getItem("user");

    let user_data = await fetch('/api/login/users/' + user);
    user_data = await user_data.json();
    user_data = user_data.users[0];

    if (user == null && user_data == null){
        localStorage.removeItem("user");
        window.location.href = "/login"
    }

    // API Endpoints (replace with your actual endpoints)
    const API_URL = '/api/cars';
    const API_URL_SELL = '/api/sales';
    const IMAGE_UPLOAD_URL = '/api/cars/images/upload';

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
    
    const removeConfirm = document.getElementById("removeConfirm");
    removeConfirm.onclick = removeCar;

    // --- CONFIGURAÇÕES E SELETORES ---
    const MAX_IMAGES = 5;
    const imageInput = document.getElementById('additional-images-input');
    const imageContainer = document.getElementById('additional-image-container');
    const imageCounter = document.getElementById('extraIamgeCouter');
    
    // O DataTransfer é a forma correta de gerenciar uma lista de arquivos que pode ser modificada
    let fileStore = new DataTransfer();
    let isEditing = false;

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

        //user_data
        
        try {
            await fetch(`${API_URL}/changes/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                        type: "create",
                        author: user_data.name,
                        authorAvatar: user_data.avatarUrl,
                        dateTime: new Date().getTime(),
                        tagText: "Criação de Veículo",
                        tagColor: "green",
                        vehiclePlate: carData.license_plate,
                        vehicleName: carData.name
                    }
                )
            })


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

    async function removeCar(carData){
        let excluirTextField = document.getElementById("ExcluirInput");
        let plate = document.getElementById("add-license_plate").value;

        if (excluirTextField.value == "Excluir"){
            await fetch(`${API_URL}/changes/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                        type: "removed",
                        author: user_data.name,
                        authorAvatar: user_data.avatarUrl,
                        dateTime: new Date().getTime(),
                        tagText: "Remoção de Veículo",
                        tagColor: "red",
                        vehiclePlate: document.getElementById("add-license_plate").value,
                        vehicleName: document.getElementById("add-name").value
                    }
                )
            })

            await fetch(API_URL + "/remove/" + plate);
            alert("Veículo removido com sucesso!")
            await renderCarCards();
            closeModal(addModal);
        }
        else {
            alert("Digite 'Excluir' para confirmar a exclusão!")
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

async function updateCar(licensePlate, newCarData) {
    try {
        const currentRes = await fetch(`${API_URL}/car/${licensePlate}`);
        if (!currentRes.ok) throw new Error("Failed to fetch current car data");
        const currentData = await currentRes.json();

        const changes = [];
        for (const key in newCarData) {
            if (Object.hasOwn(newCarData, key)) {
                const oldValue = currentData[key];
                const newValue = newCarData[key];

                // Only log if values differ and the oldValue exists
                if (oldValue !== undefined && oldValue !== newValue) {
                    changes.push({
                        label: key,
                        oldValue: String(oldValue),
                        newValue: String(newValue)
                    });
                }
            }
        }

        if (changes.length === 0) {
            return { message: "Nenhuma alteração detectada" };
        }

        await fetch(`${API_URL}/changes/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: "edit",
                author: user_data.name,
                authorAvatar: user_data.avatarUrl,
                dateTime: Date.now(),
                tagText: "Edição de Veículo",
                tagColor: "orange",
                vehiclePlate: licensePlate,
                vehicleName: newCarData.name || currentData.name,
                changes
            })
        });

        const updateRes = await fetch(`${API_URL}/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...newCarData, license_plate: licensePlate })
        });

        return await updateRes.json();
    } catch (err) {
        console.error("Erro ao atualizar automaticamente:", err);
        return { error: err.message };
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

    async function fetchSells(plate) {
        try {
            const response = await fetch(`/api/sales/sales/${plate}`);
            const data = await response.json();

            if (data.error) {
                console.error('Error fetching sells:', data.error);
                return [];
            }

            return data;
        } catch (error) {
            console.error('Failed to fetch sells:', error);
            return [];
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

        var isProfit = false;
        var borderColor;
        var profitTextColor;
        var saleData;
        var profitPercentage;

        if (isSold) {
            console.log(car.license_plate)
            saleData = await fetchSells(car.license_plate);
            saleData = saleData[0];

            isProfit = (saleData.sale_value - car.price) >= 0;
            borderColor = isProfit ? "border-green-500" : "border-red-500";
            profitTextColor = isProfit ? "text-green-600" : "text-red-600";
           
            profitPercentage = ((saleData.sale_value - car.price) / car.price) * 100;
        }

return `
  <div 
    id="card-${car.license_plate}" 
    class="relative flex flex-col bg-white rounded-lg shadow-lg overflow-hidden transform transition-transform duration-300 hover:scale-105"
  >
    ${isSold ? `
      <div class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 text-center px-4">
        <span class="text-white text-3xl font-bold border-4 px-6 py-3 transform -rotate-12">
          VENDIDO
        </span>
        <p class="mt-3">
          <span class="inline-block px-3 py-1 rounded-md text-white font-bold
            ${isProfit ? 'bg-green-600' : 'bg-red-600'}">
            ${isProfit ? "Lucro" : "Prejuízo"}: R$ ${(saleData.sale_value - car.price).toLocaleString('pt-BR')}
          </span>
        </p>
        <p class="mt-2">
          <span class="inline-block px-3 py-1 rounded-md font-bold
            ${isProfit ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
            ${profitPercentage.toFixed(2)}%
          </span>
        </p>
      </div>
    ` : ''}

    <figure>
      <img 
        src="${mainImage}" 
        alt="Imagem do carro ${car.name}" 
        class="w-full h-48 object-cover"
        loading="lazy"
      >
    </figure>

    <div class="flex flex-col flex-grow p-5">
      <header class="flex-grow">
        <h3 
          class="text-xl font-bold text-gray-800 truncate" 
          title="${car.name}"
        >
          ${car.name}
        </h3>
        <p class="text-sm text-gray-500 mb-3">${car.year}</p>
        <p class="text-3xl font-bold text-green-600 mb-4">
          ${formatPrice(car.price)}
        </p>
      </header>

      <div class="flex justify-between items-center text-sm text-gray-700">
        <span>Placa:</span>
        <div class="flex items-center gap-2">
          <span class="font-mono font-semibold bg-gray-200 px-2 py-1 rounded">
            ${car.license_plate}
          </span>
          <button 
            type="button"
            data-copy-text="${car.license_plate}" 
            title="Copiar placa ${car.license_plate}" 
            aria-label="Copiar placa ${car.license_plate}" 
            class="js-copy-button text-gray-500 hover:text-blue-600 transition-colors"
          >
            <i class="bi bi-clipboard"></i>
          </button>
        </div>
      </div>

      <div class="mt-6 pt-4 border-t">
        <button 
          type="button"
          data-plate="${car.license_plate}" 
          class="js-details-button w-full inline-flex items-center justify-center text-white font-medium rounded-lg text-sm px-5 py-2.5 transition-colors 
                 ${isSold ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-400'}" 
          ${isSold ? 'disabled aria-disabled="true"' : ''}
        >
          <i class="bi bi-search mr-2"></i>
          Ver Detalhes
        </button>
      </div>
    </div>
  </div>
`;

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
                    removeAllAdditionalImages();
                
                    
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
        detailsModal.querySelector('#details-modal-price').textContent = formatPrice(car.price);
        createCarousel("my-carousel-container", images.map(img => img.link));

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
        isEditing = true;
        
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
        //form.querySelector('[name="license_plate"]').disabled = true; não pode estar necessáriamente desabilitada, caso ele erre a placa nao teria como mudar

        const images = await fetchCarImages(plate);

        if (images.length > 0){
            const mainImagePreview = form.querySelector('.mainImagePreview');
            const mainImageIcon = form.querySelector('.mainImageIcon');
            if (mainImagePreview && mainImageIcon) {
                mainImagePreview.src = images[0].link;
                mainImagePreview.classList.remove('hidden');
                mainImageIcon.classList.add('hidden');
            }
        }
        
        if (images.length > 1) {
            imageContainer.innerHTML = '';
            let imageCounter = 0;

            images.forEach((imageObj, index) => {
                if (index == 0) {
                    return;
                }

                const previewWrapper = document.createElement('div');
                previewWrapper.className = "relative aspect-square rounded-xl overflow-hidden";

                previewWrapper.innerHTML = `
                    <img src="${imageObj.link}" alt="Pré-visualização da imagem ${index + 1}" class="w-full h-full object-cover">
                    <button type="button" data-index="${index}" class="js-remove-image absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full w-6 h-6 flex items-center justify-center text-lg font-bold hover:bg-red-500 transition-colors">
                        &times;
                    </button>
                `;

                imageCounter += 1;
                document.querySelector('#extraIamgeCouter').textContent = `${imageCounter}/${5}`;
                imageContainer.appendChild(previewWrapper);

                if (images.length < MAX_IMAGES) {
                    const uploadButton = document.createElement('label');
                    uploadButton.className = "relative aspect-square bg-gray-200 border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer hover:border-blue-500";
                    uploadButton.innerHTML = `
                        <input type="file" accept="image/*" multiple class="absolute inset-0 opacity-0 w-full h-full cursor-pointer">
                        <span class="text-4xl text-gray-400 font-light"><i class="bi bi-plus-circle"></i></span>
                    `;

                    uploadButton.querySelector('input').addEventListener('change', handleFileSelection);
                    imageContainer.appendChild(uploadButton);
                }
            });
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
            const additionalImages = fileStore.files;
            
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
                for (const additionalImageFile of additionalImages) {
                    images.push(additionalImageFile);
                }
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
        const plate = plateSearchInput.value.trim();
        
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

    // Image handling functions
    function renderPreviews() {
        // Limpa o container, mas mantém o input de arquivo (que estará dentro do botão '+')
        if (!isEditing) { imageContainer.innerHTML = ''; }

        // Cria e adiciona um card de pré-visualização para cada arquivo
        Array.from(fileStore.files).forEach((file, index) => {
            const previewWrapper = document.createElement('div');
            previewWrapper.className = "relative aspect-square rounded-xl overflow-hidden";
            
            const reader = new FileReader();
            reader.onload = (e) => {
                previewWrapper.innerHTML = `
                    <img src="${e.target.result}" class="w-full h-full object-cover">
                    <button type="button" data-index="${index}" class="js-remove-image absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full w-6 h-6 flex items-center justify-center text-lg font-bold hover:bg-red-500 transition-colors">
                        &times;
                    </button>
                `;
            };
            reader.readAsDataURL(file);
            imageContainer.appendChild(previewWrapper);
        });

        // Adiciona o botão de upload se o limite não foi atingido
        if (fileStore.files.length < MAX_IMAGES) {
            const uploadButton = document.createElement('label');
            uploadButton.className = "relative aspect-square bg-gray-200 border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer hover:border-blue-500";
            uploadButton.innerHTML = `
                <input type="file" accept="image/*" multiple class="absolute inset-0 opacity-0 w-full h-full cursor-pointer">
                <span class="text-4xl text-gray-400 font-light"><i class="bi bi-plus-circle"></i></span>
            `;
            // Reatribui o listener ao novo input
            uploadButton.querySelector('input').addEventListener('change', handleFileSelection);
            imageContainer.appendChild(uploadButton);
        }
        
        // Sincroniza a lista de arquivos do DataTransfer com o input original
        imageInput.files = fileStore.files;
    }

    function handleFileSelection(event) {
        const newFiles = Array.from(event.target.files);

        for (const file of newFiles) {
            if (fileStore.files.length < MAX_IMAGES) {
                fileStore.items.add(file);
                imageCounter.textContent = `${fileStore.files.length}/${MAX_IMAGES}`;
            } else {
                break;
            }
        }
        
        // Limpa o valor do input para permitir selecionar os mesmos arquivos novamente se forem removidos
        event.target.value = '';
        renderPreviews();
    }

    function handleRemoveImage(event) {
        const removeButton = event.target.closest('.js-remove-image');
        if (removeButton) {
            const indexToRemove = parseInt(removeButton.dataset.index, 10);
            
            // Cria um novo DataTransfer sem o arquivo removido
            const newFileStore = new DataTransfer();
            Array.from(fileStore.files)
                .filter((_, i) => i !== indexToRemove)
                .forEach(file => newFileStore.items.add(file));
            
            // Atualiza o fileStore global
            fileStore = newFileStore;
           imageCounter.textContent = `${fileStore.files.length}/${MAX_IMAGES}`;
            renderPreviews();
        }
    }

    function removeAllAdditionalImages() {
        fileStore = new DataTransfer();
        imageCounter.textContent = `${fileStore.files.length}/${MAX_IMAGES}`;
        renderPreviews();
    }

    function createCarousel(containerId, images) {
        const container = document.getElementById(containerId);
        if (!container || images.length === 0) return;

        // HTML base do carrossel
        container.innerHTML = `
        <div class="relative w-full h-64">
            <div class="overflow-hidden rounded-lg shadow-md w-full h-full">
            <img id="${containerId}-image" src="" alt="Imagem do Veículo" class="w-full h-full object-cover">
            </div>

            <!-- Bolinhas (dots) -->
            <div id="${containerId}-dots" class="flex justify-center mt-2 gap-2"></div>

            <!-- Botão anterior -->
            <button id="${containerId}-prev" class="absolute top-1/2 left-2 transform -translate-y-1/2 bg-gray-800 bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-80">
            &#10094;
            </button>

            <!-- Botão próximo -->
            <button id="${containerId}-next" class="absolute top-1/2 right-2 transform -translate-y-1/2 bg-gray-800 bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-80">
            &#10095;
            </button>
        </div>
        `;

        let currentIndex = 0;

        const carouselImage = document.getElementById(`${containerId}-image`);
        const indicator = document.getElementById(`${containerId}-indicator`);
        const dotsContainer = document.getElementById(`${containerId}-dots`);
        const prevBtn = document.getElementById(`${containerId}-prev`);
        const nextBtn = document.getElementById(`${containerId}-next`);

        // Cria bolinhas
        images.forEach((_, idx) => {
        const dot = document.createElement("span");
        dot.classList.add("w-3", "h-3", "bg-gray-400", "rounded-full", "cursor-pointer");
        dot.addEventListener("click", () => {
            currentIndex = idx;
            updateCarousel();
        });
        dotsContainer.appendChild(dot);
        });

        const dots = dotsContainer.children;

        function updateDots(index) {
        Array.from(dots).forEach((dot, idx) => {
            dot.classList.toggle("bg-gray-800", idx === index);
            dot.classList.toggle("bg-gray-400", idx !== index);
        });
        }

        function updateCarousel() {
        carouselImage.src = images[currentIndex];
        updateDots(currentIndex);
        }

        prevBtn.addEventListener("click", () => {
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        updateCarousel();
        });

        nextBtn.addEventListener("click", () => {
        currentIndex = (currentIndex + 1) % images.length;
        updateCarousel();
        });

        // Inicializa
        updateCarousel();
    }

    // Initialize Event Listeners
    function initEventListeners() {
        // Form submissions
        addCarForm?.addEventListener('submit', handleAddFormSubmit);
        sellCarForm?.addEventListener('submit', handleSellFormSubmit);
        
        // Extra Image input handling
        imageContainer.addEventListener('change', handleFileSelection); 
        imageContainer.addEventListener('click', handleRemoveImage);

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
