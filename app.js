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
// 7. ФИЛЬТРАЦИЯ, ПОИСК И СОРТИРОВКА (БЕЗОПАСНАЯ ВЕРСИЯ)
// ===================================================================
const filterAndRender = () => {
  let filtered = [...apps];

  // === БЕЗОПАСНЫЙ ПОИСК ===
  const searchInput = document.getElementById("search-input");
  const searchQuery = searchInput ? searchInput.value.toLowerCase() : "";
  if (searchQuery) {
    filtered = filtered.filter((app) =>
      app.name.toLowerCase().includes(searchQuery)
    );
  }

  // Фильтр по категории
  if (currentCategory) {
    filtered = filtered.filter((app) => app.category === currentCategory);
  }

  // === БЕЗОПАСНАЯ СОРТИРОВКА ===
  const sortSelect = document.getElementById("sort-select");
  const sortValue = sortSelect ? sortSelect.value : "name";

  if (sortValue === "rating") {
    filtered.sort((a, b) => b.rating - a.rating);
  } else if (sortValue === "new") {
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  } else {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Рендерим
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

  // === ТОЛЬКО НА ГЛАВНОМ ЭКРАНЕ ===
  if (screenId === "main") {
    setTimeout(() => {
      filterAndRender(); // Теперь безопасно
      if (document.getElementById("carousel-track").children.length === 0) {
        initBannersCarousel();
      }
    }, 100);
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
      const isFirstLaunch = !localStorage.getItem("onboarded");

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
// 11. ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ (добавлен запуск карусели + защита)
// ===================================================================
document.addEventListener("DOMContentLoaded", async () => {
  await loadData();
  await runSplash();

  // --- Профиль: проверяем наличие фото ---
  const profileBtn = document.getElementById("profile-btn");
  const profileImg = document.createElement("img");
  profileImg.src = "images/profile.jpg";
  profileImg.alt = "Профиль";
  profileImg.onload = () => {
    profileBtn.innerHTML = "";
    profileBtn.appendChild(profileImg);
  };
  profileImg.onerror = () => {
    console.log("Фото профиля не найдено: images/profile.jpg");
  };

  // Навигация
  document.getElementById("categories-btn").onclick = () => {
    renderCategories();
    showScreen("categories");
  };

  profileBtn.onclick = () => {
    alert("Профиль (муляж) — будет доступен позже");
  };

  document.getElementById("back-categories").onclick = () => {
    currentCategory = null;
    showScreen("main");
  };

  document.getElementById("back-btn").onclick = () => showScreen("main");

  // Поиск
  document.getElementById("search-input").oninput = filterAndRender;
  const sortSelect = document.getElementById("sort-select");
  if (sortSelect) sortSelect.onchange = filterAndRender;

  // Запуск карусели при показе main
  const oldShowScreen = showScreen;
  showScreen = (id) => {
    oldShowScreen(id);
    if (id === "main") {
      setTimeout(() => {
        if (document.getElementById("carousel-track").children.length === 0) {
          initBannersCarousel();
        }
      }, 200);
    }
  };
});

// ===================================================================
// 12. КАРУСЕЛЬ БАННЕРОВ — ГАРАНТИРОВАННАЯ РАБОТА
// ===================================================================
let currentSlide = 0;
let carouselInterval = null;

const initBannersCarousel = () => {
  const track = document.getElementById("carousel-track");
  const dots = document.getElementById("carousel-dots");
  if (!track || !dots) return;

  // Берём 4 приложения с баннерами
  const appsWithBanners = apps.filter(
    (a) => a.screenshots && a.screenshots.length > 0
  );
  if (appsWithBanners.length === 0) {
    console.warn("Нет баннеров");
    return;
  }

  track.innerHTML = "";
  dots.innerHTML = "";

  appsWithBanners.slice(0, 4).forEach((app, i) => {
    // Слайд
    const slide = document.createElement("div");
    slide.className = "carousel-slide";
    slide.innerHTML = `<img src="${app.screenshots[0]}" alt="${app.name}" loading="lazy">`;
    slide.onclick = () => showAppDetail(app);
    track.appendChild(slide);

    // Точка
    const dot = document.createElement("div");
    dot.className = "carousel-dot" + (i === 0 ? " active" : "");
    dot.onclick = () => goToSlide(i);
    dots.appendChild(dot);
  });

  document.getElementById("carousel-prev").onclick = () => changeSlide(-1);
  document.getElementById("carousel-next").onclick = () => changeSlide(1);

  goToSlide(0);
  startCarouselAutoplay();
};

const goToSlide = (n) => {
  const total = document.querySelectorAll(".carousel-slide").length;
  currentSlide = (n + total) % total;
  document.getElementById("carousel-track").style.transform = `translateX(-${
    currentSlide * 100
  }%)`;
  document
    .querySelectorAll(".carousel-dot")
    .forEach((d, i) => d.classList.toggle("active", i === currentSlide));
};

const changeSlide = (dir) => {
  goToSlide(currentSlide + dir);
  resetCarouselAutoplay();
};
const startCarouselAutoplay = () => {
  carouselInterval = setInterval(() => changeSlide(1), 5000);
};
const resetCarouselAutoplay = () => {
  clearInterval(carouselInterval);
  startCarouselAutoplay();
};

// ===================================================================
// 13. ПОПУЛЯРНЫЕ КАТЕГОРИИ (ТОП-3)
// ===================================================================

/**
 * Возвращает массив объектов {category, count}
 * отсортированный по убыванию количества приложений.
 */
const getTopCategories = () => {
  const counts = {};
  apps.forEach((a) => {
    counts[a.category] = (counts[a.category] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
};

/**
 * Рендерит блок «Популярные категории».
 */
const renderPopularCategories = () => {
  const container = document.getElementById("popular-categories");
  if (!container) return;

  const top = getTopCategories();
  if (top.length === 0) {
    container.style.display = "none";
    return;
  }

  const cards = container.querySelectorAll(".category-card");
  top.forEach((cat, i) => {
    const card = cards[i];
    if (!card) return;

    // Заполняем данные
    card.dataset.category = cat.category;
    card.querySelector(".category-name").textContent = cat.category;

    // Фон-градиент
    card.style.setProperty("--cat-bg", bgGradients[i]);

    // Клик → фильтр по категории
    card.onclick = () => {
      currentCategory = cat.category;
      filterAndRender();
      showScreen("main");
    };
  });

  // Скрываем лишние карточки, если топ < 3
  for (let i = top.length; i < cards.length; i++) {
    cards[i].style.display = "none";
  }
};

/* -------------------------------------------------
   Добавляем вызов в filterAndRender и в showScreen
   ------------------------------------------------- */
const oldFilterAndRender = filterAndRender;
filterAndRender = () => {
  oldFilterAndRender();
  renderPopularCategories(); // <--- обновляем каждый раз
};

const oldShowScreen = showScreen;
showScreen = (id) => {
  oldShowScreen(id);
  if (id === "main") {
    setTimeout(() => {
      renderPopularCategories(); // гарантируем отрисовку после появления экрана
    }, 150);
  }
};
