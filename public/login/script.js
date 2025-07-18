document.addEventListener('DOMContentLoaded', async () => {

    logged = localStorage.getItem("user");
    if (logged) {
        window.location.href = "/"
    }

    const user_data = await fetch('/api/login/users');
    response = await user_data.json();
    console.log(response.users)

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
                        <img src="${user.avatarUrl}" alt="${user.name}" class="w-32 h-32 rounded-lg mx-auto border-4 border-transparent group-hover:group-hover:scale-110 transition">
                        <span class="text-xl text-gray-400 group-hover:text-white transition">${user.name}</span>
                    </button>
                `).join('');
    }

    function showPasswordView(userId) {
        const user = users.find(u => u.id == userId);
        if (!user) return;

        // Preenche os dados do perfil selecionado
        document.getElementById('selected-profile-img').src = user.avatarUrl;
        document.getElementById('selected-profile-name').innerText = user.name;

        // Armazena o ID do usuário no formulário para uso posterior
        loginForm.dataset.userId = user.id;

        // Alterna a visibilidade das telas
        profileSelectionView.classList.add('hidden');
        passwordEntryView.classList.remove('hidden');

        // Foca no campo de senha
        document.getElementById('password-input').focus();
    }

    //Alterna de volta para a visualização de seleção de perfil.
    function showProfileSelectionView() {
        passwordEntryView.classList.add('hidden');
        profileSelectionView.classList.remove('hidden');
        loginForm.reset(); // Limpa o campo de senha
    }

    //cliques nos perfis
    profilesGrid.addEventListener('click', (event) => {
        const profileCard = event.target.closest('.profile-card');
        if (profileCard) {
            const userId = profileCard.dataset.userId;
            showPasswordView(userId);
        }
    });

    //botão "Voltar"
    backButton.addEventListener('click', showProfileSelectionView);

    //submissão do formulário
    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const userId = event.target.dataset.userId;
        const password = document.getElementById('password-input').value;
        const user = users.find(u => u.id == userId);

        if (password == user.password){
            localStorage.setItem("user", userId);
            window.location.href = "/"
        } else {
            console.log("senha incoreta!");
        }
    });

    // --- INICIALIZAÇÃO ---
    renderProfiles();
});