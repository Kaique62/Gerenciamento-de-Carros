
document.addEventListener('DOMContentLoaded', () => {
    // --- Sidebar Toggle ---
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    const toggleBtn = document.getElementById('toggle-sidebar-btn');
    const sidebarTexts = document.querySelectorAll('.sidebar-text');
    const navItems = document.querySelectorAll('.nav-item');
    const logoContainer = sidebar.querySelector('.logo-container');
    const collapseIcon = document.getElementById('collapse-icon-svg');
    const collapseText = toggleBtn.querySelector('.sidebar-text');
    let isDarkMode = false

    const setSidebarState = (collapsed) => {
        localStorage.setItem('sidebarCollapsed', collapsed);
        
        if (collapsed) {
            sidebar.classList.remove('w-64');
            sidebar.classList.add('w-20');
            logoContainer.classList.add('justify-center');
            logoContainer.classList.remove('px-4');

            sidebarTexts.forEach(text => {
                text.classList.add('opacity-0', 'w-0', 'invisible');
            });

            navItems.forEach(item => item.classList.add('justify-center'));
            toggleBtn.classList.add('justify-center');

            if(collapseIcon) collapseIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />`;
            if(collapseText) collapseText.textContent = "Expandir";
            toggleBtn.title = 'Expandir';

        } else {
            sidebar.classList.add('w-64');
            sidebar.classList.remove('w-20');
            logoContainer.classList.remove('justify-center');
            logoContainer.classList.add('px-4');

            sidebarTexts.forEach(text => {
                text.classList.remove('opacity-0', 'w-0', 'invisible');
            });

            navItems.forEach(item => item.classList.remove('justify-center'));
            toggleBtn.classList.remove('justify-center');

            if(collapseIcon) collapseIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h8m-8 6h16" />`;
            if(collapseText) collapseText.textContent = "Recolher";
            toggleBtn.title = 'Recolher';
        }
    };
    
    let isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    setSidebarState(isCollapsed);

    if(toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            isCollapsed = !isCollapsed;
            setSidebarState(isCollapsed);
        });
    }

    // --- Active Page Highlight ---
    const currentPagePath = window.location.pathname.split('/').pop();
    const activePageId = (currentPagePath === '' || currentPagePath === 'index.html') ? 'home'
                     : currentPagePath.replace('.html', '');

    const activeNavItem = document.getElementById(`nav-${activePageId}`);
    if (activeNavItem) {
        activeNavItem.classList.add('bg-blue-600', 'text-white');
        activeNavItem.classList.remove('hover:bg-gray-700');
    }

    // --- Settings Page Toggles ---
    if (activePageId === 'settings') {
        const toggles = document.querySelectorAll('.toggle-btn');
        toggles.forEach(button => {
            button.addEventListener('click', () => {
                const enabled = button.getAttribute('aria-checked') === 'true';
                button.setAttribute('aria-checked', String(!enabled));
                
                const circle = button.querySelector('span');
                if (!enabled) {
                    button.classList.remove('bg-gray-300');
                    button.classList.add('bg-blue-600');
                    circle.classList.remove('translate-x-1');
                    circle.classList.add('translate-x-6');
                } else {
                    button.classList.add('bg-gray-300');
                    button.classList.remove('bg-blue-600');
                    circle.classList.add('translate-x-1');
                    circle.classList.remove('translate-x-6');
                }
            });
        });
    }

    // --- Analytics Page Chart ---
    if (activePageId === 'analytics') {
        const ctx = document.getElementById('salesChart');
        if (ctx && typeof Chart !== 'undefined') {
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho'],
                    datasets: [{
                        label: 'Vendas',
                        data: [2400, 1398, 9800, 3908, 4800, 3800, 4300],
                        backgroundColor: 'rgba(136, 132, 216, 0.8)',
                        borderRadius: 4,
                    }, {
                        label: 'Visitantes',
                        data: [4000, 3000, 2000, 2780, 1890, 2390, 3490],
                        backgroundColor: 'rgba(130, 202, 157, 0.8)',
                        borderRadius: 4,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true, grid: { color: '#e5e7eb' } }, x: { grid: { display: false } } },
                    plugins: {
                        legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } },
                        tooltip: { 
                            backgroundColor: '#fff',
                            titleColor: '#333',
                            bodyColor: '#666',
                            borderColor: '#ddd',
                            borderWidth: 1,
                            padding: 10,
                            displayColors: true,
                            boxPadding: 4,
                            usePointStyle: true,
                        }
                    }
                }
            });
        }
    }

    // is dark mode
    document.getElementById('dark-mode-toggle').addEventListener('click', () => {
        isDarkMode = !isDarkMode;
        if (isDarkMode) {
            document.body.classList.remove('bg-gray-100');
            document.body.classList.add('bg-gray-500');
        } else {
            document.body.classList.remove('bg-gray-500');
            document.body.classList.add('bg-gray-100');
        }
    });

    // --- Toast Notifications ---
    function showToast(message, type = 'success', duration = 3000) {
        const container = document.getElementById('toast-container');
        if (!container) {
            console.error('Toast container not found!');
            return;
        }

        // Cria o elemento do toast
        const toast = document.createElement('div');
        
        // Define as classes base do toast
        toast.className = 'flex items-center gap-4 text-white p-4 rounded-lg shadow-lg transform transition-all duration-500';

        // Adiciona classes de estilo com base no tipo
        let iconHtml = '';
        switch (type) {
            case 'success':
                toast.classList.add('bg-green-500');
                // Ícone de check (Heroicons)
                iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
                break;
            case 'error':
                toast.classList.add('bg-red-600');
                // Ícone de erro (Heroicons)
                iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
                break;
            case 'info':
            default:
                toast.classList.add('bg-blue-500');
                // Ícone de informação (Heroicons)
                iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
                break
        }
    }
});
