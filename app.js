// ===================================================================
// 1. ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// ===================================================================
let apps = []; // Все приложения из data.json
let currentCategory = null; // Текущая выбранная категория
let history = []; // История просмотров (ID)
let views = {}; // Счётчик просмотров по ID

// ===================================================================
// 2. ЗАГРУЗКА ДАННЫХ
// ===================================================================
const loadData = async () => {
  try {
    const response = await fetch("data.json");
    if (!response.ok) throw new Error("Не удалось загрузить data.json");
    apps = await response.json();
  } catch (error) {
    console.error("Ошибка загрузки данных:", error);
    apps = [];
    setTimeout(showLoadError, 500);
  }
};

const showLoadError = () => {
  const mainScreen = document.getElementById("main");
  if (mainScreen && mainScreen.style.display !== "none") {
    mainScreen.innerHTML = `
      <div style="text-align:center;padding:40px;color:#d00;">
        <h3>Ошибка загрузки</h3>
        <p>Не удалось загрузить приложения.</p>
        <button onclick="location.reload()"
                style="padding:10px 20px;background:#0077ff;color:white;border:none;border-radius:5px;cursor:pointer;">
          Перезагрузить
        </button>
      </div>`;
  }
};

// ===================================================================
// 3. РЕНДЕР КАРТОЧЕК ПРИЛОЖЕНИЙ
// ===================================================================
const renderApps = (appList, containerId) => {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Показываем скелетон
  container.innerHTML = "";
  for (let i = 0; i < 6; i++) {
    const skeleton = document.createElement("div");
    skeleton.className = "skeleton";
    container.appendChild(skeleton);
  }

  // Имитация задержки загрузки
  setTimeout(() => {
    container.innerHTML = "";
    appList.forEach((app) => {
      const card = document.createElement("div");
      card.className = "app-card";
      card.innerHTML = `
        <img src="${app.icon}" alt="${app.name}">
        <h3>${app.name}</h3>
        <p>Оценка: ${app.rating}</p>
        <p>Категория: ${app.category}</p>
      `;
      card.onclick = () => showAppDetail(app);
      container.appendChild(card);
    });
  }, 1000);
};

// ===================================================================
// 4. ДЕТАЛЬНАЯ СТРАНИЦА ПРИЛОЖЕНИЯ
// ===================================================================
const showAppDetail = (app) => {
  // Заполняем основную информацию
  document.getElementById("app-icon").src = app.icon;
  document.getElementById("app-name").textContent = app.name;
  document.getElementById(
    "app-developer"
  ).textContent = `Разработчик: ${app.developer}`;
  document.getElementById(
    "app-category"
  ).textContent = `Категория: ${app.category}`;
  document.getElementById("app-rating").textContent = `Оценка: ${app.rating}`;
  document.getElementById("app-age").textContent = `Возраст: ${app.age}`;
  document.getElementById("app-description").textContent = app.description;

  // Скриншоты
  const screenshotsContainer = document.getElementById("screenshots");
  screenshotsContainer.innerHTML = "";
  app.screenshots.forEach((src) => {
    const img = document.createElement("img");
    img.src = src;
    img.onclick = () => openGallery(app.screenshots);
    screenshotsContainer.appendChild(img);
  });

  // Похожие приложения
  const similarApps = apps
    .filter((a) => a.category === app.category && a.id !== app.id)
    .slice(0, 5);
  renderApps(similarApps, "similar-apps");

  // Обновляем историю и просмотры
  addToHistory(app.id);

  // Переключаемся на экран
  showScreen("app-detail");
};

// ===================================================================
// 5. ГАЛЕРЕЯ СКРИНШОТОВ
// ===================================================================
const openGallery = (images) => {
  const modal = document.getElementById("gallery-modal");
  const gallery = document.getElementById("gallery-images");
  gallery.innerHTML = "";

  images.forEach((src) => {
    const img = document.createElement("img");
    img.src = src;
    gallery.appendChild(img);
  });

  modal.style.display = "flex";
  document.getElementById("close-gallery").onclick = () => {
    modal.style.display = "none";
  };
};

// ===================================================================
// 6. ИСТОРИЯ И ПОПУЛЯРНОСТЬ
// ===================================================================
const addToHistory = (appId) => {
  // Загружаем текущую историю
  history = JSON.parse(localStorage.getItem("history") || "[]");
  if (!history.includes(appId)) {
    history.push(appId);
    localStorage.setItem("history", JSON.stringify(history));
  }

  // Увеличиваем счётчик просмотров
  views = JSON.parse(localStorage.getItem("views") || "{}");
  views[appId] = (views[appId] || 0) + 1;
  localStorage.setItem("views", JSON.stringify(views));
};

const getRecentApps = () => {
  return apps.filter((app) => history.includes(app.id)).slice(-5);
};

const getPopularApps = () => {
  return [...apps]
    .sort((a, b) => (views[b.id] || 0) - (views[a.id] || 0))
    .slice(0, 5);
};

const getNewApps = () => {
  return [...apps]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);
};

// ===================================================================
// 7. ФИЛЬТРАЦИЯ, ПОИСК И СОРТИРОВКА
// ===================================================================
const filterAndRender = () => {
  let filtered = [...apps];

  // Поиск по названию
  const searchQuery = document
    .getElementById("search-input")
    .value.toLowerCase();
  if (searchQuery) {
    filtered = filtered.filter((app) =>
      app.name.toLowerCase().includes(searchQuery)
    );
  }

  // Фильтр по категории
  if (currentCategory) {
    filtered = filtered.filter((app) => app.category === currentCategory);
  }

  // Сортировка
  const sortValue = document.getElementById("sort-select").value;
  if (sortValue === "rating") {
    filtered.sort((a, b) => b.rating - a.rating);
  } else if (sortValue === "new") {
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  } else {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Рендерим все списки
  renderApps(filtered, "app-list");
  renderApps(getPopularApps(), "popular-apps");
  renderApps(getNewApps(), "new-apps");
  renderApps(getRecentApps(), "recent-apps");
};

// ===================================================================
// 8. КАТЕГОРИИ
// ===================================================================
const renderCategories = () => {
  const categories = [...new Set(apps.map((app) => app.category))];
  const list = document.getElementById("category-list");
  list.innerHTML = "";

  categories.forEach((category) => {
    const li = document.createElement("li");
    li.textContent = category;
    li.onclick = () => {
      currentCategory = category;
      filterAndRender();
      showScreen("main");
    };
    list.appendChild(li);
  });
};

// ===================================================================
// 9. НАВИГАЦИЯ ПО ЭКРАНАМ
// ===================================================================
const showScreen = (screenId) => {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.style.display = "none";
  });

  const targetScreen = document.getElementById(screenId);
  if (targetScreen) {
    targetScreen.style.display = "block";
  }

  if (screenId === "main") {
    filterAndRender();
  }
};

// ===================================================================
// 10. СПЛЕШ-ЭКРАН И ОНБОРДИНГ
// ===================================================================
const runSplash = () => {
  return new Promise((resolve) => {
    const splash = document.getElementById("splash");
    const logo = document.getElementById("shared-logo");
    const startBtn = document.getElementById("start-btn");

    setTimeout(() => {
      const isFirstLaunch = !localStorage.getItem("");

      if (isFirstLaunch) {
        // Анимация: логотип вверх
        logo.classList.add("to-onboarding");
        splash.classList.add("show-onboarding");

        // Активация кнопки
        setTimeout(() => {
          startBtn.classList.add("active");
          startBtn.disabled = false;
        }, 400);

        // Клик по "Начать"
        startBtn.onclick = () => {
          localStorage.setItem("onboarded", "true");
          splash.classList.add("fade-out");
          setTimeout(() => {
            splash.style.display = "none";
            showScreen("main");
            setTimeout(runDemo, 500);
            resolve();
          }, 1200);
        };
      } else {
        // Пропуск онбординга
        splash.classList.add("fade-out");
        setTimeout(() => {
          splash.style.display = "none";
          showScreen("main");
          resolve();
        }, 2500);
      }
    }, 700);
  });
};

// ===================================================================
// 11. ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ
// ===================================================================
document.addEventListener("DOMContentLoaded", async () => {
  await loadData();
  await runSplash();

  // Навигация
  document.getElementById("categories-btn").onclick = () => {
    renderCategories();
    showScreen("categories");
  };

  document.getElementById("back-categories").onclick = () => {
    currentCategory = null;
    showScreen("main");
  };

  document.getElementById("back-btn").onclick = () => showScreen("main");

  // Поиск и сортировка
  document.getElementById("search-input").oninput = filterAndRender;
  document.getElementById("sort-select").onchange = filterAndRender;
});
