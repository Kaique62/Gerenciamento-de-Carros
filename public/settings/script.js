(() => {
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
  const toastToggle = document.querySelector(".bg-gray-300[role='switch']");
  const darkModeToggle = document.getElementById("dark-mode-toggle");

  let selectedAvatarFile = null;

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
      alert("Erro ao carregar dados do usuário.");
    }
  }

  async function fetchUsers() {
    try {
      const res = await fetch("/api/login/users");
      if (!res.ok) throw new Error("Falha ao carregar usuários");
      const data = await res.json();
    } catch (err) {
      alert(err.message);
    }
  }

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

  function applyDarkMode(enabled) {
    if (enabled) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("darkModeEnabled", "true");
      darkModeToggle.setAttribute("aria-checked", "true");
      darkModeToggle.querySelector("span").classList.add("translate-x-6");
      darkModeToggle.classList.remove("bg-gray-300");
      darkModeToggle.classList.add("bg-blue-600");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("darkModeEnabled", "false");
      darkModeToggle.setAttribute("aria-checked", "false");
      darkModeToggle.querySelector("span").classList.remove("translate-x-6");
      darkModeToggle.classList.add("bg-gray-300");
      darkModeToggle.classList.remove("bg-blue-600");
    }
  }

  function applyToastNotifications(enabled) {
    toastToggle.setAttribute("aria-checked", enabled ? "true" : "false");
    const thumb = toastToggle.querySelector("span");
    if (enabled) {
      thumb.classList.add("translate-x-6");
      toastToggle.classList.remove("bg-gray-300");
      toastToggle.classList.add("bg-blue-600");
    } else {
      thumb.classList.remove("translate-x-6");
      toastToggle.classList.add("bg-gray-300");
      toastToggle.classList.remove("bg-blue-600");
    }
    localStorage.setItem("toastNotificationsEnabled", enabled ? "true" : "false");
  }

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

    if (darkModeToggle) {
      darkModeToggle.addEventListener("click", () => {
        const enabled = darkModeToggle.getAttribute("aria-checked") === "true";
        applyDarkMode(!enabled);
      });
    }

    if (toastToggle) {
      toastToggle.addEventListener("click", () => {
        const enabled = toastToggle.getAttribute("aria-checked") === "true";
        applyToastNotifications(!enabled);
      });
    }
  }

  function initializePreferences() {
    const darkModeStored = localStorage.getItem("darkModeEnabled") === "true";
    applyDarkMode(darkModeStored);
    const toastStored = localStorage.getItem("toastNotificationsEnabled") === "true";
    applyToastNotifications(toastStored);
  }

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
    initializePreferences();
    bindEvents();
    fetchUsers();
  }

  window.addEventListener("DOMContentLoaded", init);
})();
