document.addEventListener('DOMContentLoaded', () => {

    const user = localStorage.getItem("user");

    if (user == null){
        window.location.href = "/login"
    }

    const API_URL = '/api/sales';
    const searchInput = document.getElementById("search-input");
    const filterSelect = document.getElementById("filter-select");
    const sellGrid = document.getElementById("sell-grid");

    function getDateRange(filterValue) {
        const today = new Date();
        let fromDate;

        switch (filterValue) {
            case "sold": // Últimos 7 dias
                fromDate = new Date(today.setDate(today.getDate() - 7));
                break;
            case "available": // Últimos 30 dias
                fromDate = new Date(today.setDate(today.getDate() - 30));
                break;
            case "maintenance": // Últimos 6 meses
                fromDate = new Date(today.setMonth(today.getMonth() - 6));
                break;
            default:
                return {};
        }

        const from = fromDate.toISOString().split("T")[0];
        const to = new Date().toISOString().split("T")[0];

        return { from, to };
    }

    async function fetchSells() {
        try {
            const { from, to } = getDateRange(filterSelect.value);
            const params = new URLSearchParams();

            if (from) params.append("from", from);
            if (to) params.append("to", to);

            const response = await fetch(`${API_URL}/sales?${params.toString()}`);
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
            console.log(data)
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

    async function fetchCarName(licensePlate) {
        try {
            const response = await fetch(`/api/cars/car_name/${licensePlate}`);
            if (!response.ok) throw new Error();
            const data = await response.json();
            return data.name || "Desconhecido";
        } catch {
            return "Desconhecido";
        }
    }

    async function renderSellCards() {
        const search = searchInput.value.trim().toLowerCase();
        const sells = await fetchSells();
        sellGrid.innerHTML = '';

        const enriched = await Promise.all(
            sells.map(async (sell) => {
                const name = await fetchCarName(sell.car_license_plate);
                const images = await fetchCarImages(sell.car_license_plate);
                const imagePath = images.length >= 0
                    ? images[0].link
                    : `//placehold.co/600x400/000/FFF?text=${encodeURIComponent(name)}`;
                return { ...sell, name, imagePath };
            })
        );

        // Filtro de busca por nome, placa, data, método
        const filtered = enriched.filter(sell =>
            sell.name.toLowerCase().includes(search) ||
            sell.car_license_plate.toLowerCase().includes(search) ||
            sell.payment_method.toLowerCase().includes(search) ||
            sell.date.includes(search)
        );

        if (filtered.length === 0) {
            sellGrid.innerHTML = `<div class="text-gray-600 col-span-full">Nenhum resultado encontrado.</div>`;
            return;
        }

        for (const sell of filtered) {
            createSellCard(sell);
        }
    }

    function createSellCard(sell) {
        sellGrid.innerHTML += `
            <div id="sell-${sell.car_license_plate}"
                class="flex flex-col sm:flex-row bg-white rounded-lg shadow-md overflow-hidden transform hover:scale-[1.02] transition-transform duration-300 w-full h-auto">
                <img src="${sell.imagePath}" alt="${sell.name}"
                    class="w-full h-40 sm:w-40 sm:h-auto object-cover">
                <div class="p-4 flex flex-col justify-between flex-grow">
                    <div>
                        <div class="flex items-center justify-between">
                            <h3 class="text-lg font-bold text-gray-800 truncate" title="${sell.name}">${sell.name}</h3>
                            <span class="text-sm text-gray-500">${sell.car_license_plate}</span>
                        </div>

                        <p class="text-sm text-gray-500">R$ ${sell.sale_value.toLocaleString('pt-BR')}</p>
                        <div class="text-sm text-gray-700 mt-2">
                            <p><span class="font-semibold">Data:</span> ${new Date(sell.date).toLocaleDateString()}</p>
                            <p><span class="font-semibold">Método:</span> ${sell.payment_method}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Eventos de filtro
    searchInput.addEventListener("input", renderSellCards);
    filterSelect.addEventListener("change", renderSellCards);

    renderSellCards(); // Inicialização
});
