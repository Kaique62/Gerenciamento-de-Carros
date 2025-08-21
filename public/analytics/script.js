// dashboard.js

const ctx = document.getElementById('salesChart').getContext('2d');
let salesChart;

const monthFilter = document.getElementById('filter-month');
const yearFilter = document.getElementById('filter-year');
const downloadBtn = document.getElementById('download-pdf');


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

async function updateChart() {
    const month = monthFilter.value;
    const year = yearFilter.value;

    // Busca vendas filtradas
    const res = await fetch(`/api/analytics/sales?month=${month}&year=${year}`);
    const sales = await res.json();

    let totalProfit = 0;
    const profitByDay = {};
    const pointColors = [];

    for (const sale of sales) {
        const carRes = await fetch(`/api/cars/price/${sale.car_license_plate}`);
        const carData = await carRes.json();
        const profitValue = sale.sale_value - carData.price;

        totalProfit += profitValue;

        // Define chave do dia ou do mês
        const date = new Date(sale.date);
        let key;
        if (month === "") key = `${date.getMonth()+1}/${date.getFullYear()}`; // agrupado por mês
        else key = `${date.getDate()}/${date.getMonth()+1}`; // agrupado por dia

        if (!profitByDay[key]) profitByDay[key] = 0;
        profitByDay[key] += profitValue;
    }

    // Atualiza KPIs
    document.getElementById('total-sales').innerText = sales.length;
    document.getElementById('total-profit').innerText = `R$ ${totalProfit.toFixed(2)}`;
    const avgTicket = sales.length > 0 ? totalProfit / sales.length : 0;
    document.getElementById('average-ticket').innerText = `R$ ${avgTicket.toFixed(2)}`;

    // Prepara dados do gráfico
    const labels = Object.keys(profitByDay);
    const data = Object.values(profitByDay);
    const colors = data.map(v => v >= 0 ? 'rgba(34,197,94,1)' : 'rgba(239,68,68,1)');

    if (salesChart) salesChart.destroy();
    salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Lucro/Prejuízo (R$)',
                data: data,
                fill: false,
                borderColor: 'rgba(34,197,94,1)',
                tension: 0.2,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointBackgroundColor: colors
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true },
                tooltip: {
                    callbacks: {
                        label: ctx => `R$ ${ctx.raw.toFixed(2)}`
                    }
                }
            },
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'Lucro/Prejuízo (R$)' } },
                x: { title: { display: true, text: month === "" ? 'Mês/Ano' : 'Dia/Mês' } }
            }
        }
    });
}

// Event listeners
monthFilter.addEventListener('change', updateChart);
yearFilter.addEventListener('change', updateChart);

// PDF
downloadBtn.addEventListener('click', async () => {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    pdf.setFontSize(16);
    pdf.text('Relatório de Vendas', 10, 20);

    const res = await fetch(`/api/analytics/sales?month=${monthFilter.value}&year=${yearFilter.value}`);
    const sales = await res.json();

    let yPos = 30;
    for (const sale of sales) {
        const carRes = await fetch(`/api/cars/price/${sale.car_license_plate}`);
        const carData = await carRes.json();
        const profitValue = sale.sale_value - carData.price;

        const date = new Date(sale.date);
        const line = `${date.getDate()}/${date.getMonth()+1}/${date.getFullYear()} - ${sale.car_license_plate} - Lucro/Prejuízo: R$ ${profitValue.toFixed(2)}`;
        pdf.text(line, 10, yPos);
        yPos += 10;

        if (yPos > 280) { pdf.addPage(); yPos = 20; }
    }

    pdf.save('relatorio_vendas.pdf');
});

// Inicial
updateChart();
