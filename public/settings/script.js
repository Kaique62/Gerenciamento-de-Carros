(async () => {
  let currentUser = {
    id: null,
    name: "",
    avatarUrl: null,
  };

  const profilePreview = document.getElementById("profile-preview");
  const profileUpload = document.getElementById("profile-pic-upload");
  const nameInput = document.getElementById("name");
  const saveButton = document.querySelector("button.bg-blue-600");
  const userManagementSection = document.getElementById("user-management-section");
  const newUsernameInput = document.getElementById("new-username");
  const newPasswordInput = document.getElementById("new-password");
  const registerUserBtn = userManagementSection?.querySelector("button");
  const userListContainer = document.getElementById("user-list");

  let selectedAvatarFile = null;

  // Fetch current logged-in user
  async function fetchCurrentUser(userId) {
    try {
      const res = await fetch(`/api/login/users/${userId}`);
      if (!res.ok) throw new Error("Erro ao buscar dados do usuário.");
      const user = await res.json();
      currentUser.id = user.id;
      currentUser.name = user.name;
      currentUser.avatarUrl = user.avatarUrl;

      nameInput.value = currentUser.name;
      if (currentUser.avatarUrl) {
        profilePreview.src = currentUser.avatarUrl;
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao carregar dados do usuário.");
    }
  }

  // Fetch all users
  async function fetchUsers() {
    try {
      const res = await fetch("/api/login/users");
      if (!res.ok) throw new Error("Falha ao carregar usuários");
      const data = await res.json();

      // Populate user list div if it exists
      if (userListContainer && data.users) {
        userListContainer.innerHTML = data.users
          .map(
            (u) =>
              `<li class="py-2 flex justify-between"><span>${u.name}</span><span class="text-xs text-gray-500">ID: ${u.id}</span></li>`
          )
          .join("");
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Handle profile image upload
  function handleProfileUpload(event) {
    const file = event.target.files[0];
    if (!file || !file.type.startsWith("image/")) {
      alert("Por favor, selecione um arquivo de imagem válido.");
      profileUpload.value = "";
      return;
    }
    selectedAvatarFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      profilePreview.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  // Upload avatar to server
  async function uploadAvatar(userId, file) {
    if (!file) return null;
    const formData = new FormData();
    formData.append("avatar", file);
    const res = await fetch(`/api/login/users/${userId}/avatar`, {
      method: "PATCH",
      body: formData,
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Erro ao atualizar avatar");
    }
    const data = await res.json();
    return data.avatarUrl;
  }

  // Register new user
  async function registerUser(name, password) {
    if (!name.trim() || !password.trim()) {
      alert("Nome de usuário e senha são obrigatórios.");
      return false;
    }
    const payload = { name, password };
    const res = await fetch("/api/login/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errData = await res.json();
      alert(`Erro ao registrar usuário: ${errData.error || "Erro desconhecido"}`);
      return false;
    }
    alert("Usuário registrado com sucesso!");
    newUsernameInput.value = "";
    newPasswordInput.value = "";
    return true;
  }

  // Bind event listeners
  function bindEvents() {
    if (profileUpload) profileUpload.addEventListener("change", handleProfileUpload);

    if (saveButton) {
      saveButton.addEventListener("click", async (e) => {
        e.preventDefault();
        saveButton.disabled = true;
        saveButton.textContent = "Salvando...";
        try {
          if (selectedAvatarFile) {
            const avatarUrl = await uploadAvatar(currentUser.id, selectedAvatarFile);
            currentUser.avatarUrl = avatarUrl;
            alert("Foto de perfil atualizada com sucesso!");
          } else {
            alert("Nenhuma alteração para salvar.");
          }
        } catch (error) {
          alert(error.message);
          console.error(error);
        } finally {
          saveButton.disabled = false;
          saveButton.textContent = "Salvar Alterações";
        }
      });
    }

    if (registerUserBtn) {
      registerUserBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        const username = newUsernameInput.value;
        const password = newPasswordInput.value;
        registerUserBtn.disabled = true;
        registerUserBtn.textContent = "Registrando...";
        try {
          const success = await registerUser(username, password);
          if (success) await fetchUsers();
        } finally {
          registerUserBtn.disabled = false;
          registerUserBtn.textContent = "Registrar Usuário";
        }
      });
    }
  }

  // Initialize script
  async function init() {
    const userId = localStorage.getItem("user");
    if (!userId) {
      alert("Usuário não autenticado.");
      return;
    }
    await fetchCurrentUser(userId);
    if (typeof canRegisterUsers !== "undefined" && canRegisterUsers) {
      userManagementSection?.classList.remove("hidden");
    }
    bindEvents();
    fetchUsers();
  }

  window.addEventListener("DOMContentLoaded", init);
})();
