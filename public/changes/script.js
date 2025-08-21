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

function createHistoryCard({
    type, // "edit" ou "create"
    authorName,
    authorAvatar,
    dateTime,
    tagText,
    tagColor, // ex: "green" para adicionar, "red" para exclusao, "orange" ou "yelow" para edicao
    vehiclePlate,
    vehicleName = null,
    changes = []
}) {
    // Cabeçalho
    let header = `
        <div class="bg-gray-800 text-white p-4 flex justify-between items-center">
            <div class="flex items-center gap-3">
                <img src="${authorAvatar}" alt="Avatar de ${authorName}"
                    class="w-10 h-10 rounded-full border-2 border-gray-600">
                <div>
                    <p class="font-bold">${authorName}</p>
                    <p class="text-sm text-gray-400">${dateTime}</p>
                </div>
            </div>
            <span class="bg-${tagColor}-500/20 text-${tagColor}-300 text-xs font-semibold px-2.5 py-1 rounded-full">
                ${tagText}
            </span>
        </div>
    `;

    // Corpo
    let body = "";

    if (type === "edit") {
        // Lista de alterações
        let items = changes.map(change => `
            <div>
                <p class="text-sm font-medium text-gray-600 mb-1">${change.label}</p>
                <div class="flex items-center justify-between gap-4 bg-gray-50 p-3 rounded-md">
                    <span class="text-red-600 line-through font-mono">${change.oldValue}</span>
                    <i class="bi bi-arrow-right text-gray-400 text-xl shrink-0"></i>
                    <span class="text-green-600 font-bold font-mono">${change.newValue}</span>
                </div>
            </div>
        `).join("");

        body = `
            <div class="p-6">
                <p class="text-sm text-gray-500 mb-4">
                    Alterações no veículo de placa <span class="font-mono font-bold text-gray-700">${vehiclePlate}</span>:
                </p>
                <div class="space-y-4">${items}</div>
            </div>
        `;
    }

    if (type === "create") {
        body = `
            <div class="p-6">
                <p class="text-gray-700">
                    Novo veículo <span class="font-bold">${vehicleName}</span> (placa 
                    <span class="font-mono font-bold">${vehiclePlate}</span>) foi adicionado ao estoque.
                </p>
            </div>
        `;
    }

    // Monta o card
    return `
        <div class="bg-white rounded-lg shadow-md overflow-hidden">
            ${header}
            ${body}
        </div>
    `;
}

// ======================
// Exemplo de uso
// ======================
const container = document.getElementById("history-container");

// Card de edição
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

async function renderCreateCards() {
    const response = await fetch("/api/cars/changes/retireve/add");
    const data = await response.json();

    for (i = 0; i < data.length; i++){
        container.innerHTML += createHistoryCard(
            {
                type: data[i].type,
                authorName: data[i].author_name,
                authorAvatar: data[i].author_avatar,
                dateTime: data[i].date_time,
                tagColor: data[i].tagColor,
                tagText: data[i].tagText,
                vehiclePlate: data[i].vehicle_plate,
                vehicleName: data[i].vehicle_name
            }
        )
    }
}

renderCreateCards();

// Card de criação
container.innerHTML += createHistoryCard({
    type: "create",
    authorName: "Camila",
    authorAvatar: "https://placehold.co/100x100/9B2C2C/FFFFFF?text=C",
    dateTime: "04 de Ago, 2024 - 09:15",
    tagText: "Criação de Veículo",
    tagColor: "green",
    vehiclePlate: "RTY-4B56",
    vehicleName: "Toyota Corolla XEi"
});