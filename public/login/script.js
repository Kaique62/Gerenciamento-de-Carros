document.addEventListener('DOMContentLoaded', async () => {

    const logged = localStorage.getItem("user");
    if (logged) {
        window.location.href = "/";
        return;
    }

    // Busca os usuários (sem senha, só id, name, avatarUrl)
    const user_data = await fetch('/api/login/users');
    const response = await user_data.json();

    const users = response.users;

    // Elementos
    const profileSelectionView = document.getElementById('profile-selection-view');
    const passwordEntryView = document.getElementById('password-entry-view');
    const profilesGrid = document.getElementById('profiles-grid');
    const backButton = document.getElementById('back-to-profiles');
    const loginForm = document.getElementById('login-form');

    function renderProfiles() {
        profilesGrid.innerHTML = users.map(user => `
            <button class="profile-card group text-center space-y-3 focus:outline-none" data-user-id="${user.id}">
                <img src="${user.avatarUrl}" alt="${user.name}" class="w-32 h-32 rounded-lg mx-auto border-4 border-transparent group-hover:scale-110 transition">
                <span class="text-xl text-gray-400 group-hover:text-white transition">${user.name}</span>
            </button>
        `).join('');
    }

    function showPasswordView(userId) {
        const user = users.find(u => u.id == userId);
        if (!user) return;

        // Preenche dados do perfil
        document.getElementById('selected-profile-img').src = user.avatarUrl;
        document.getElementById('selected-profile-name').innerText = user.name;

        loginForm.dataset.userId = user.id;

        profileSelectionView.classList.add('hidden');
        passwordEntryView.classList.remove('hidden');

        document.getElementById('password-input').focus();
    }

    function showProfileSelectionView() {
        passwordEntryView.classList.add('hidden');
        profileSelectionView.classList.remove('hidden');
        loginForm.reset();
    }

    profilesGrid.addEventListener('click', (event) => {
        const profileCard = event.target.closest('.profile-card');
        if (profileCard) {
            const userId = profileCard.dataset.userId;
            showPasswordView(userId);
        }
    });

    backButton.addEventListener('click', showProfileSelectionView);

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const userId = event.target.dataset.userId;
        const password = document.getElementById('password-input').value;

        if (!password) {
            alert("Digite a senha");
            return;
        }

        try {
            const res = await fetch('/api/login/authenticate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: userId, password: password})
            });

            const data = await res.json();

            if (res.ok) {
                localStorage.setItem("user", userId);
                window.location.href = "/";
            } else {
                alert(data.message || "Senha incorreta");
            }
        } catch (error) {
            alert("Erro ao tentar fazer login");
        }
    });

    // Inicializa
    renderProfiles();
});
