const user = localStorage.getItem("user");

(async () => {
    let user_data = await fetch('/api/login/users/' + user);
    user_data = await user_data.json();
    user_data = user_data.users[0];
    
    if (user == null && user_data == null){
        localStorage.removeItem("user");
        window.location.href = "/login"
    }
})

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
                return [];
            }

            return data;
        } catch (error) {
            return [];
        }
    }

    async function fetchCarImages(licensePlate) {
        try {
            const response = await fetch(`/api/cars/images/${licensePlate}`);
            const data = await response.json();
            if (data.error) {
                return [];
            }
            return data;
        } catch (error) {
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

    async function fetchCarPrice(licensePlate) {
        try {
            const response = await fetch(`/api/cars/price/${licensePlate}`);
            if (!response.ok) throw new Error();
            const data = await response.json();
            return data.price || 0;
        } catch {
            return 0;
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
                const price = await fetchCarPrice(sell.car_license_plate); // 🟢 NEW

                // 🟢 calculate profit/loss
                let profitPercentage = 0;
                if (price > 0) {
                    profitPercentage = ((sell.sale_value - price) / price) * 100;
                }

                const imagePath = images.length > 0
                    ? images[0].link
                    : `//placehold.co/600x400/000/FFF?text=${encodeURIComponent(name)}`;
                return { ...sell, name, imagePath, price, profitPercentage };
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
        const isProfit = sell.profitPercentage >= 0;
        const borderColor = isProfit ? "border-green-500" : "border-red-500";
        const profitBgColor = isProfit ? "bg-green-100" : "bg-red-100";
        const profitTextColor = isProfit ? "text-green-700" : "text-red-700";
        const profitLabel = isProfit ? "Lucro" : "Prejuízo";

        const saleValueFormatted = sell.sale_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const profitValue = sell.sale_value - sell.price;
        const profitValueFormatted = Math.abs(profitValue).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        const plateContainerId = `plate-container-${sell.car_license_plate}`;
        const viewPlateBtnId = `view-plate-btn-${sell.car_license_plate}`;

        sellGrid.innerHTML += `
            <div id="sell-${sell.car_license_plate}"
                class="flex flex-col bg-white rounded-lg shadow-md overflow-hidden transform hover:scale-[1.02] transition-transform duration-300 w-full border-l-8 ${borderColor}">

                <!-- Seção da Imagem -->
                <img src="${sell.imagePath}" alt="${sell.name}" class="w-full h-48 object-cover">

                <!-- Seção de Conteúdo Principal -->
                <div class="p-5 flex flex-col flex-grow">
                    <!-- Nome do Carro e Valor da Venda -->
                    <div class="flex flex-col sm:flex-row justify-between sm:items-start mb-4">
                        <h3 class="text-xl font-bold text-gray-800 truncate mb-2 sm:mb-0" title="${sell.name}">
                            ${sell.name}
                        </h3>
                        <p class="text-xl font-light text-gray-600 shrink-0 sm:ml-4">
                            ${saleValueFormatted}
                        </p>
                    </div>

                    <!-- Seção de Lucro/Prejuízo -->
                    <div class="rounded-lg p-3 text-center mb-4 ${profitBgColor} ${profitTextColor}">
                        <p class="text-sm font-semibold">${profitLabel}</p>
                        <p class="text-2xl font-bold">${profitValueFormatted}</p>
                        <p class="text-sm font-semibold">(${sell.profitPercentage.toFixed(2)}%)</p>
                    </div>

                    <!-- Detalhes Adicionais (Data, Método e Placa) -->
                    <div class="mt-auto text-sm text-gray-600">
                        <div class="flex justify-between items-center py-2 border-t">
                            <span class="font-semibold">Data da Venda:</span>
                            <span>${new Date(sell.date).toLocaleDateString()}</span>
                        </div>
                        <div class="flex justify-between items-center py-2 border-t">
                            <span class="font-semibold">Método:</span>
                            <span>${sell.payment_method}</span>
                        </div>
                        <div id="${plateContainerId}" class="flex justify-between items-center py-2 border-t">
                            <span class="font-semibold">Placa:</span>
                            <button id="${viewPlateBtnId}" onclick="showPlate('${viewPlateBtnId}', '${sell.car_license_plate}')"
                                    class="bg-gray-200 text-gray-700 px-3 py-1 rounded-md text-xs font-bold hover:bg-gray-300 transition-colors">
                                Ver Placa
                            </button>
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
