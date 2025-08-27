function createHistoryCard({
    type,
    authorName,
    authorAvatar,
    dateTime,
    tagText,
    tagColor,
    vehiclePlate,
    vehicleName = null,
    changes = []
}) {
    const cardId = `history-card-${Math.random().toString(36).substr(2, 9)}`;

    // Cabeçalho clicável com data e placa
    const header = `
        <div class="bg-gray-800 text-white p-4 flex justify-between items-center cursor-pointer" onclick="toggleCardSmooth('${cardId}')">
            <div class="flex items-center gap-3">
                <img src="${authorAvatar}" alt="Avatar de ${authorName}" class="w-10 h-10 rounded-full border-2 border-gray-600">
                <div>
                    <p class="font-bold">${authorName}</p>
                    <p class="text-sm text-gray-300">${dateTime} • Placa: <span class="font-mono font-semibold">${vehiclePlate}</span></p>
                </div>
            </div>
            <span class="bg-${tagColor}-500/20 text-${tagColor}-300 text-xs font-semibold px-2.5 py-1 rounded-full">
                ${tagText}
            </span>
        </div>
    `;

    // Corpo do card
    let bodyContent = "";
    if (type === "edit") {
        const items = changes.map(change => `
            <div>
                <p class="text-sm font-medium text-gray-600 mb-1">${change.label}</p>
                <div class="flex items-center justify-between gap-4 bg-gray-50 p-3 rounded-md">
                    <span class="text-red-600 line-through font-mono">${change.oldValue}</span>
                    <i class="bi bi-arrow-right text-gray-400 text-xl shrink-0"></i>
                    <span class="text-green-600 font-bold font-mono">${change.newValue}</span>
                </div>
            </div>
        `).join("");

        bodyContent = `
            <p class="text-sm text-gray-500 mb-4">
                Alterações no veículo:
            </p>
            <div class="space-y-4">${items}</div>
        `;
    }

    if (type === "create") {
        bodyContent = `
            <p class="text-gray-700">
                Novo veículo <span class="font-bold">${vehicleName}</span> foi adicionado ao estoque.
            </p>
        `;
    }

    if (type === "removed") {
        bodyContent = `
            <p class="text-red-700 font-semibold">
                O veículo <span class="font-bold">${vehicleName || ''}</span> (placa 
                <span class="font-mono font-bold">${vehiclePlate}</span>) foi <span class="underline">removido</span> do estoque.
            </p>
        `;
    }

    // Corpo com inner-wrapper para scroll se necessário
    const body = `
        <div id="${cardId}" class="overflow-hidden transition-all duration-500 ease-in-out max-h-0">
            <div class="p-6 max-h-60 overflow-y-auto">
                ${bodyContent}
            </div>
        </div>
    `;

    return `
        <div class="bg-white rounded-lg shadow-md overflow-hidden mb-4">
            ${header}
            ${body}
        </div>
    `;
}

function toggleCardSmooth(cardId) {
    const el = document.getElementById(cardId);
    if (!el) return;

    if (el.style.maxHeight && el.style.maxHeight !== "0px") {
        el.style.maxHeight = "0px";
    } else {
        el.style.maxHeight = el.scrollHeight + "px";
    }
}

// ======================
// Exemplo de uso e renderização dinâmica
// ======================
const container = document.getElementById("history-container");

container.innerHTML += createHistoryCard({
    type: "edit",
    authorName: "Admin",
    authorAvatar: "https://placehold.co/100x100/4A5568/FFFFFF?text=A",
    dateTime: "05 de Ago, 2024 - 14:32",
    tagText: "Edição de Veículo",
    tagColor: "orange",
    vehiclePlate: "QWE-1A23",
    changes: [
        { label: "Preço", oldValue: "R$ 135.000,00", newValue: "R$ 132.500,00" },
        { label: "Quilometragem", oldValue: "25.000 KM", newValue: "25.124 KM" }
    ]
});

async function renderHistoryCards() {
    try {
        const response = await fetch("/api/cars/changes/retrieve/all");
        if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
        const data = await response.json();
        const container = document.getElementById("history-container");
        container.innerHTML = ""; // clear previous cards

        data.forEach(item => {
            let changes = [];
            if (item.type === "edit" && item.changes) {
                try {
                    changes = item.changes;
                } catch (err) {
                    changes = [];
                }
            }

            const cardData = {
                type: item.type,
                authorName: item.author_name,
                authorAvatar: item.author_avatar || "https://placehold.co/100x100/gray/FFFFFF?text=?",
                dateTime: new Date(parseInt(item.date_time)).toLocaleString(),
                tagText: item.tagText || 
                         (item.type === "edit" ? "Edição de Veículo" : 
                         item.type === "removed" ? "Remoção de Veículo" : "Criação de Veículo"),
                tagColor: item.tagColor || 
                          (item.type === "edit" ? "orange" : 
                          item.type === "removed" ? "red" : "green"),
                vehiclePlate: item.vehicle_plate,
                vehicleName: item.vehicle_name
            };

            if (item.type === "edit") {
                cardData.changes = changes;
            }

            container.innerHTML += createHistoryCard(cardData);
        });

    } catch (error) {
    }
}

renderHistoryCards();

// Exemplo de criação de card removido
container.innerHTML += createHistoryCard({
    type: "removed",
    authorName: "João",
    authorAvatar: "https://placehold.co/100x100/FF0000/FFFFFF?text=J",
    dateTime: "06 de Ago, 2024 - 10:00",
    tagText: "Remoção de Veículo",
    tagColor: "red",
    vehiclePlate: "ABC-1234",
    vehicleName: "Honda Civic"
});
