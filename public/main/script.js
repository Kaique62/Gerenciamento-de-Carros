// se tu achar esse codigo estranho, é porque ele é mesmo

document.addEventListener('DOMContentLoaded', () => {
    // Dados de exemplo
    let cars = [
        {
            license_plate: 'QWE-1A23',
            name: 'Honda Civic Touring',
            year: '2021/2021',
            chassis: '9BWZZZ377MT000123',
            registration_number: 12345678901,
            ownership_document: 9876543210,
            mileage: 25000,
            description: 'Veículo em excelente estado, único dono, todas as revisões feitas na concessionária. Teto solar, bancos de couro e sistema de som premium.',
            registration_date: '2021-05-15',
            price: 135000,
            ipva_tax_years: JSON.stringify(['2023', '2024']),
            imageMain: 'https://placehold.co/600x400/000/FFF?text=Honda+Civic',
            status: 'available' // 'available', 'sold', 'maintenance'
        }
    ];

    // Seletores dos elementos principais
    const carGridContainer = document.getElementById('car-grid-container');
    const detailsModal = document.getElementById('details-modal');
    const addModal = document.getElementById('add-modal');
    const sellModal = document.getElementById('sell-modal');
    const addCarForm = document.getElementById('add-car-form');
    const sellCarForm = document.getElementById('sell-car-form');
    const editByPlateButton = document.getElementById('edit-by-plate-button');

    //FUNÇÕES DE RENDERIZAÇÃO E FORMATAÇÃO

    const formatPrice = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    const formatMileage = (value) => `${new Intl.NumberFormat('pt-BR').format(value)} KM`;

    //Cria o HTML para um único card de carro.
    function createCarCard(car) {
        const isSold = car.status === 'sold';
        return `
        <div id="card-${car.license_plate}" class="relative bg-white rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 flex flex-col">
            ${isSold ? `<div class="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-10"><span class="text-white text-3xl font-bold border-4 p-4 transform -rotate-12">VENDIDO</span></div>` : ''}
            <img src="${car.imageMain}" alt="${car.name}" class="w-full h-48 object-cover">
            <div class="p-5 flex flex-col flex-grow">
                <div class="flex-grow">
                    <h3 class="text-xl font-bold text-gray-800 truncate" title="${car.name}">${car.name}</h3>
                    <p class="text-sm text-gray-500 mb-3">${car.year}</p>
                    <p class="text-3xl font-bold text-green-600 mb-4">${formatPrice(car.price)}</p>
                    <div class="flex justify-between items-center text-sm text-gray-700">
                        <span>Placa:</span>
                        <div class="flex items-center gap-2">
                            <span class="font-mono font-semibold bg-gray-200 px-2 py-1 rounded">${car.license_plate}</span>
                            <button data-copy-text="${car.license_plate}" title="Copiar Placa" class="js-copy-button text-gray-500 hover:text-blue-600"><i class="bi bi-clipboard"></i></button>
                        </div>
                    </div>
                </div>
                <div class="mt-6 pt-4 border-t">
                    <button data-plate="${car.license_plate}" class="js-details-button w-full inline-flex items-center justify-center text-white font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-colors ${isSold ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}" ${isSold ? 'disabled' : ''}>
                        <i class="bi bi-search mr-2"></i> Ver Detalhes
                    </button>
                </div>
            </div>
        </div>`;
    }

    //Renderiza todos os cards na tela, limpando os antigos.
    const renderAllCards = () => {
        if (!carGridContainer) return;
        carGridContainer.innerHTML = cars.map(createCarCard).join('');
    };

    //FUNÇÕES DE MANIPULAÇÃO DOS MODAIS

    const openModal = (modalElement) => modalElement?.classList.remove('hidden');
    const closeModal = (modalElement) => {
        if (modalElement) {
            modalElement.classList.add('hidden');
            const form = modalElement.querySelector('form');
            if (form) {
                form.reset();
                // Resetar o modal de adição/edição para seu estado padrão
                if (modalElement.id === 'add-modal') {
                    form.querySelector('h2').textContent = 'Adicionar Novo Veículo';
                    form.querySelector('[name="license_plate"]').disabled = false;
                    delete form.dataset.mode;
                    delete form.dataset.editingPlate;
                }
            }
        }
    };

    //Preenche e exibe o modal de detalhes do carro.
    function populateAndShowDetailsModal(plate) {
        const car = cars.find(c => c.license_plate === plate);
        if (!car || !detailsModal) return;

        detailsModal.querySelector('#details-modal-title').textContent = car.name;
        detailsModal.querySelector('#details-modal-image').src = car.imageMain;
        detailsModal.querySelector('#details-modal-price').textContent = formatPrice(car.price);

        const specsContainer = detailsModal.querySelector('#details-modal-specs');
        specsContainer.innerHTML = `
            <div class="flex justify-between"><dt class="font-medium">Ano:</dt><dd>${car.year}</dd></div>
            <div class="flex justify-between"><dt class="font-medium">Quilometragem:</dt><dd>${formatMileage(car.mileage)}</dd></div>
            <div class="flex justify-between"><dt class="font-medium">Placa:</dt><dd class="font-mono bg-gray-100 px-2 rounded">${car.license_plate}</dd></div>
            <div class="flex justify-between"><dt class="font-medium">Chassi:</dt><dd class="font-mono">${car.chassis}</dd></div>
        `;

        detailsModal.querySelector('#details-sell-button').dataset.plate = plate;
        openModal(detailsModal);
    }

    //Preenche e exibe o modal de venda.
    function populateAndShowSellModal(plate) {
        const car = cars.find(c => c.license_plate === plate);
        if (!car || !sellModal) return;

        closeModal(detailsModal); // Fecha o modal de detalhes primeiro

        sellModal.querySelector('#sell-modal-car-name').textContent = car.name;
        sellModal.querySelector('#sell-modal-car-plate').textContent = car.license_plate;
        sellModal.querySelector('#sale_price').value = car.price;
        sellModal.querySelector('#sale_date').valueAsDate = new Date();

        sellCarForm.dataset.currentPlate = plate;
        openModal(sellModal);
    }

    //Preenche e exibe o modal de edição.
    function populateAndShowEditModal(plate) {
        const carToEdit = cars.find(c => c.license_plate === plate);

        if (!carToEdit) {
            alert(`Veículo com a placa "${plate}" não encontrado.`);
            return;
        }

        // Reutiliza o modal de adição
        const modal = addModal; 
        const form = addCarForm;

        // Altera o estado do modal para "edição"
        modal.querySelector('h2').textContent = 'Editar Veículo';
        form.dataset.mode = 'edit';
        form.dataset.editingPlate = plate;

        // Preenche cada campo do formulário com os dados do carro
        // Nota: campos de imagem não são pré-preenchidos por segurança do navegador
        form.querySelector('[name="name"]').value = carToEdit.name || '';
        form.querySelector('[name="license_plate"]').value = carToEdit.license_plate || '';
        form.querySelector('[name="year"]').value = carToEdit.year || '';
        form.querySelector('[name="price"]').value = carToEdit.price || '';
        form.querySelector('[name="mileage"]').value = carToEdit.mileage || '';
        form.querySelector('[name="chassis"]').value = carToEdit.chassis || '';
        form.querySelector('[name="registration_number"]').value = carToEdit.registration_number || '';
        form.querySelector('[name="ownership_document"]').value = carToEdit.ownership_document || '';
        form.querySelector('[name="ipva_tax_years"]').value = carToEdit.ipva_tax_years ? JSON.parse(carToEdit.ipva_tax_years).join(',') : '';
        form.querySelector('[name="description"]').value = carToEdit.description || '';

        // Desabilita a edição da placa, que é a chave primária
        form.querySelector('[name="license_plate"]').disabled = true;

        openModal(modal);
    }

    //HANDLERS DE EVENTOS (Ações do Usuário)

    //Lida com a submissão do formulário de adição de carro.
    function handleAddFormSubmit(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const newCarData = Object.fromEntries(formData.entries());

        // Processamento dos dados
        newCarData.price = parseFloat(newCarData.price);
        newCarData.mileage = parseInt(newCarData.mileage, 10);
        newCarData.status = 'available';
        newCarData.imageMain = URL.createObjectURL(formData.get('mainImage')); // Simulação

        console.log("Novo carro adicionado:", newCarData);
        cars.push(newCarData);
        renderAllCards(); // Re-renderiza tudo para incluir o novo card
        closeModal(addModal);
        event.target.reset(); // Limpa o formulário
    }

    //Lida com a submissão do formulário de venda.
    function handleSellFormSubmit(event) {
        event.preventDefault();
        const plate = event.target.dataset.currentPlate;
        const car = cars.find(c => c.license_plate === plate);
        if (car) {
            car.status = 'sold';
            // Aqui você enviaria os dados da venda para o backend
            console.log("Venda registrada para:", car.license_plate, Object.fromEntries(new FormData(event.target).entries()));
            renderAllCards(); // Re-renderiza para mostrar o status "VENDIDO"
        }
        closeModal(sellModal);
    }

    //Lida com o clique no botão de edição por placa.
    function handleEditByPlateClick() {
        const plateInput = document.getElementById('plate-search');
        const plate = plateInput.value.trim().toUpperCase();

        if (!plate) {
            alert('Por favor, digite uma placa para editar.');
            return;
        }

        populateAndShowEditModal(plate);
        plateInput.value = ''; // Limpa o input após a busca
    }

    //Lida com todos os cliques na página usando delegação de eventos.
    function handleAppClick(event) {
        const target = event.target;

        // Abrir modal de detalhes
        if (target.closest('.js-details-button')) {
            populateAndShowDetailsModal(target.closest('.js-details-button').dataset.plate);
        }
        // Abrir modal de adição
        else if (target.closest('#open-add-modal-button')) {
            openModal(addModal);
        }
        // Fechar qualquer modal
        else if (target.closest('.js-close-modal')) {
            closeModal(target.closest('.fixed'));
        }
        // Iniciar processo de venda a partir do modal de detalhes
        else if (target.closest('#details-sell-button')) {
            populateAndShowSellModal(target.closest('#details-sell-button').dataset.plate);
        }
        // Copiar texto para a área de transferência
        else if (target.closest('.js-copy-button')) {
            navigator.clipboard.writeText(target.closest('.js-copy-button').dataset.copyText)
                .then(() => alert("Placa copiada!"))
                .catch(err => console.error('Falha ao copiar:', err));
        }
    }

    //INICIALIZAÇÃO E LISTENERS GERAIS

    // Listeners de formulário
    addCarForm?.addEventListener('submit', handleAddFormSubmit);
    sellCarForm?.addEventListener('submit', handleSellFormSubmit);

    // Listener de clique global
    document.addEventListener('click', handleAppClick);

    // Listener para abrir o modal de adição
    editByPlateButton?.addEventListener('click', handleEditByPlateClick);

    // Listener para fechar modais com a tecla ESC
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            [detailsModal, addModal, sellModal].forEach(closeModal);
        }
    });

    // Renderiza os cards iniciais
    renderAllCards();
});