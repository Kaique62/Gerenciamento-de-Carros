document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/api/sells';
    const IMAGE_UPLOAD_URL = '/api/cars/images/upload';

    async function fetchSells() {
        try {
            const response = await fetch(`${API_URL}/retrieve`);
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

    async function renderSellCards() {
        const sells = await fetchSells();

        const sellGrid = document.getElementById("sell-grid");
        sellGrid.innerHTML = ''; // Clear existing cards

        sells.array.forEach(sell => {
            creatSellCard(sell);
        });
    }

    async function creatSellCard(sell) {
        const sellGrid = document.getElementById("sell-grid");

        sellGrid.innerHTML += `
            <div id="sell-${sell.license_plate}"
                class="flex flex-col sm:flex-row bg-white rounded-lg shadow-md overflow-hidden transform hover:scale-[1.02] transition-transform duration-300 w-full h-auto">
                <img src="${sell.image}" alt="${sell.name}"
                    class="w-full h-40 sm:w-40 sm:h-auto object-cover">
                <div class="p-4 flex flex-col justify-between flex-grow">
                    <div>
                        <div class="flex items-center justify-between">
                            <h3 class="text-lg font-bold text-gray-800 truncate" title="${sell.name}">${sell.name}</h3>
                            </h3>
                            <span class="text-sm text-gray-500">${sell.license_plate}</span>
                        </div>

                        <p class="text-sm text-gray-500">${sell.sold_by}</p>
                        <div class="text-sm text-gray-700 mt-2">
                            <p class="text-green-600"><span class="font-semibold">Vendido por:</span> ${sell.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                            </p>
                            <p><span class="font-semibold">Data:</span> ${new Date(sell.date).toLocaleDateString()}</p>
                            <p><span class="font-semibold">Metodo:</span> ${sell.method}</p>
                            <p><span class="font-semibold">Data da venda:</span> ${new Date(sell.sale_date).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Initialize the application
    async function initApp() {
        //initEventListeners();
        //await renderSellCards();
        creatSellCard({
            license_plate: "ABC-1234",
            name: "Honda Civic",
            image: "https://placehold.co/200x140/000/FFF?text=Honda+Civic",
            price: 20000,
            sold_by: "John Doe",
            date: "2023-10-01",
            method: "Parcelado em 12x",
            sale_date: "2023-10-02"
        });
    }

    // Start the app
    initApp();
});