document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/api/sales';
    const IMAGE_UPLOAD_URL = '/api/cars/images/upload';

    async function fetchSells() {
        try {
            const response = await fetch(`${API_URL}/sales/`);
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

    async function fetchCarImages(licensePlate) {
        try {
            const response = await fetch(`/api/cars/images/${licensePlate}`);
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

    async function renderSellCards() {
        const sells = await fetchSells();

        const sellGrid = document.getElementById("sell-grid");
        sellGrid.innerHTML = ''; // Clear existing cards

        sells.forEach(async sell => {
            const image = await fetchCarImages(sell.license_plate);
            createSellCard(sell, image.length > 0 ? image[0].image_path : "//placehold.co/600x400/000/FFF?text=No+Image");
        });
    }

    async function createSellCard(sell, image) {
        const sellGrid = document.getElementById("sell-grid");
        console.log(sell, image);

        sellGrid.innerHTML += `
            <div id="sell-${sell.car_license_plate}"
                class="flex flex-col sm:flex-row bg-white rounded-lg shadow-md overflow-hidden transform hover:scale-[1.02] transition-transform duration-300 w-full h-auto">
                <img src="${image}" alt="${sell.name}"
                    class="w-full h-40 sm:w-40 sm:h-auto object-cover">
                <div class="p-4 flex flex-col justify-between flex-grow">
                    <div>
                        <div class="flex items-center justify-between">
                            <h3 class="text-lg font-bold text-gray-800 truncate" title="${sell.name}">${sell.name}</h3>
                            </h3>
                            <span class="text-sm text-gray-500">${sell.car_license_plate}</span>
                        </div>

                        <p class="text-sm text-gray-500">${sell.sale_value}</p>
                        <div class="text-sm text-gray-700 mt-2">
                            <p class="text-green-600"><span class="font-semibold">Vendido por:</span> ${sell.value}</p>
                            </p>
                            <p><span class="font-semibold">Data:</span> ${new Date(sell.date).toLocaleDateString()}</p>
                            <p><span class="font-semibold">Metodo:</span> ${sell.payment_method}</p>
                            <p><span class="font-semibold">Data da venda:</span> ${new Date(sell.date).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Initialize the application
    async function initApp() {
        //initEventListeners();
        await renderSellCards();
    }

    // Start the app
    initApp();
});