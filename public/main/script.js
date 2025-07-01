function createCarCard(carData) {
    // Sanitiza a placa para ser usada em IDs HTML (remove hífens e caracteres especiais)
    const sanitizedPlate = carData.plate.replace(/[^a-zA-Z0-9]/g, '');

    return `
    <div class="bg-white rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 ease-in-out">
        <img src="${carData.imageUrl}" alt="${carData.name}" class="w-full h-48 object-cover">
        
        <div class="p-5">
            <h3 class="text-xl font-bold text-gray-800">${carData.name}</h3>
            <p class="text-sm text-gray-500 mb-3">${carData.year}</p>
            
            <p class="text-2xl font-bold text-green-600 mb-4">${carData.price}</p>
            
            <div class="space-y-2 text-sm text-gray-700">
                <div class="flex justify-between">
                    <span>Quilometragem:</span> 
                    <span class="font-semibold">${carData.mileage}</span>
                </div>
                
                <div class="flex justify-between items-center">
                    <span>Placa:</span>
                    <div class="flex items-center gap-2">
                        <span id="car-plate-${sanitizedPlate}" class="font-semibold bg-gray-200 px-2 py-1 rounded">${carData.plate}</span>
                        <button data-copy-target="car-plate-${sanitizedPlate}" title="Copiar Placa" class="js-copy-button text-gray-500 hover:text-blue-600 transition-colors">
                            <svg class="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                        </button>
                    </div>
                </div>

                <div class="flex justify-between">
                    <span>Cor:</span> 
                    <span class="font-semibold">${carData.color}</span>
                </div>
            </div>
            
            <div class="mt-6" onclick="populateAndShowModal('${carData.detailsUrl}')">
                <a href="#" class="w-full inline-flex items-center justify-center text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-colors">
                    Ver Detalhes
                    <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                </a>
            </div>
        </div>
    </div>
    `;
}

// carsData example
const cars = [
    {
        imageUrl: 'https://s3.amazonaws.com/altimus2.arquivos.prod/3e124c03-2e5b-4290-b41c-5384db549594/fotos/veiculo/f4d4de46a9404c338f558306e9ac6de4_1726248283317.jpg',
        name: 'Honda Civic Touring',
        year: 2021,
        price: 'R$ 135.000,00',
        mileage: '25.000 KM',
        plate: 'QWE-1A23',
        color: 'Branco',
        detailsUrl: '0'
    },
    {
        imageUrl: 'https://idealveiculosoeste.com.br/wp-content/uploads/2024/11/36bdab2781f2412a82613448d8958fe2_1730979679675.jpeg',
        name: 'Toyota Corolla XEi',
        year: 2022,
        price: 'R$ 148.000,00',
        mileage: '12.500 KM',
        plate: 'RTY-4B56',
        color: 'Vermelho',
        detailsUrl: '1'
    },
    {
        imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQg9hcLEurCVXfEg3A0U_8ed6Sih3geq0hy_g&s',
        name: 'VW Nivus Highline',
        year: 2023,
        price: 'R$ 141.890,00',
        mileage: '5.000 KM',
        plate: 'UIO-7C89',
        color: 'Cinza',
        detailsUrl: '2'
    }
];

// render cards on load logic
document.addEventListener('DOMContentLoaded', () => {
    const carGridContainer = document.getElementById('car-grid-container');

    if (carGridContainer) {
        cars.forEach(car => {
            const cardHTML = createCarCard(car);
            carGridContainer.innerHTML += cardHTML;
        });

        setupCopyListeners();
    }
});

// copy buttons logic
function setupCopyListeners() {
    const copyButtons = document.querySelectorAll('.js-copy-button');

    copyButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.dataset.copyTarget;
            const plateElement = document.getElementById(targetId);

            if (plateElement) {
                navigator.clipboard.writeText(plateElement.innerText).then(() => {
                    const originalIcon = button.innerHTML;
                    button.innerHTML = `<svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
                    setTimeout(() => { button.innerHTML = originalIcon; }, 2000);
                }).catch(err => console.error('Falha ao copiar:', err));
            }
        });
    });
}

const modal = document.getElementById('car-details-modal');
const modalBackdrop = document.getElementById('modal-backdrop');
const closeButtonX = document.getElementById('modal-close-button-x');
const closeButtonFooter = document.getElementById('modal-close-button-footer')

if (modal) {
    closeButtonX.addEventListener('click', closeModal);
    closeButtonFooter.addEventListener('click', closeModal);
    modalBackdrop.addEventListener('click', closeModal);

    // Fechar com a tecla ESC
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
            closeModal();
        }
    });
}

function populateAndShowModal(car) {
    car = cars[car]
    if (!car || !modal) return;

    // Preenche todos os campos do modal com os dados do carro selecionado
    document.getElementById('modal-title').innerText = car.name;
    document.getElementById('modal-image').src = car.imageUrl;
    document.getElementById('modal-image').alt = car.name;
    document.getElementById('modal-price').innerText = car.price;
    document.getElementById('modal-year').innerText = car.year;
    document.getElementById('modal-mileage').innerText = car.mileage;
    document.getElementById('modal-plate').innerText = car.plate;
    document.getElementById('modal-color').innerText = car.color;
    document.getElementById('modal-transmission').innerText = car.transmission; // Exemplo de campo adicional
    document.getElementById('modal-fuel').innerText = car.fuel; // Exemplo de campo adicional
    document.getElementById('modal-description').innerText = car.description; // Exemplo de campo adicional

    // Torna o modal visível
    modal.classList.remove('hidden');
}

function closeModal() {
    if (modal) modal.classList.add('hidden');
}