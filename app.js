// Данные: Загружаем из JSON (локально или mock API)
let apps = [];
let currentCategory = null; // Для фильтрации

// Пример структуры data.json (добавьте в файл data.json)
const loadData = async () => {
  try {
    // Mock API: fetch('https://your-mock-api-url/data.json') или локально
    const response = await fetch("data.json"); // Локальный JSON
    apps = await response.json();
    renderApps();
  } catch (error) {
    console.error("Ошибка загрузки данных:", error);
  }
};

// Рендер списка приложений
const renderApps = (filteredApps = apps, containerId = "app-list") => {
  const container = document.getElementById(containerId);
  container.innerHTML = ""; // Очистка

  // Skeleton loading: Показываем 5 placeholder'ов на 1 сек
  for (let i = 0; i < 5; i++) {
    const skeleton = document.createElement("div");
    skeleton.classList.add("skeleton");
    container.appendChild(skeleton);
  }
  setTimeout(() => {
    container.innerHTML = ""; // Убрать skeleton
    filteredApps.forEach((app) => {
      const card = document.createElement("div");
      card.classList.add("app-card");
      card.innerHTML = `
                <img src="${app.icon}" alt="${app.name}">
                <h3>${app.name}</h3>
                <p>Оценка: ${app.rating}</p>
                <p>Категория: ${app.category}</p>
            `;
      card.addEventListener("click", () => showAppDetail(app));
      container.appendChild(card);
    });
  }, 1000); // Имитация загрузки
};

// Показать детали приложения
const showAppDetail = (app) => {
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
  const screenshots = document.getElementById("screenshots");
  screenshots.innerHTML = "";
  app.screenshots.forEach((src) => {
    const img = document.createElement("img");
    img.src = src;
    img.addEventListener("click", () => openGallery(app.screenshots));
    screenshots.appendChild(img);
  });

  // Похожие: Фильтр по категории
  const similar = apps
    .filter((a) => a.category === app.category && a.id !== app.id)
    .slice(0, 5);
  renderApps(similar, "similar-apps");

  // Сохранить в историю просмотров
  let history = JSON.parse(localStorage.getItem("history")) || [];
  if (!history.includes(app.id)) history.push(app.id);
  localStorage.setItem("history", JSON.stringify(history));

  showScreen("app-detail");
};

// Открыть галерею
const openGallery = (images) => {
  const modal = document.getElementById("gallery-modal");
  const gallery = document.getElementById("gallery-images");
  gallery.innerHTML = "";
  images.forEach((src) => {
    const img = document.createElement("img");
    img.src = src;
    gallery.appendChild(img);
  });
  modal.classList.remove("hidden");
  document
    .getElementById("close-gallery")
    .addEventListener("click", () => modal.classList.add("hidden"));
};

// Рендер категорий
const renderCategories = () => {
  const uniqueCategories = [...new Set(apps.map((app) => app.category))];
  const list = document.getElementById("category-list");
  list.innerHTML = "";
  uniqueCategories.forEach((cat) => {
    const li = document.createElement("li");
    li.textContent = cat;
    li.addEventListener("click", () => {
      currentCategory = cat;
      filterApps();
      showScreen("main");
    });
    list.appendChild(li);
  });
};

// Фильтр и сортировка
const filterApps = () => {
  let filtered = apps;
  const search = document.getElementById("search-input").value.toLowerCase();
  if (search)
    filtered = filtered.filter((app) =>
      app.name.toLowerCase().includes(search)
    );
  if (currentCategory)
    filtered = filtered.filter((app) => app.category === currentCategory);

  const sort = document.getElementById("sort-select").value;
  if (sort === "rating") filtered.sort((a, b) => b.rating - a.rating);
  else if (sort === "new")
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  else filtered.sort((a, b) => a.name.localeCompare(b.name));

  renderApps(filtered);

  // Рекомендации
  const popular = [...filtered]
    .sort((a, b) => getViews(b.id) - getViews(a.id))
    .slice(0, 5);
  renderApps(popular, "popular-apps");

  const newApps = [...filtered]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);
  renderApps(newApps, "new-apps");

  const history = JSON.parse(localStorage.getItem("history")) || [];
  const recent = apps.filter((app) => history.includes(app.id)).slice(-5);
  renderApps(recent, "recent-apps");
};

// Получить просмотры (имитация популярности)
const getViews = (id) => {
  let views = JSON.parse(localStorage.getItem("views")) || {};
  return views[id] || 0;
};

// Навигация: Показать экран
const showScreen = (id) => {
  document
    .querySelectorAll(".screen")
    .forEach((screen) => screen.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
};

// Инициализация
document.addEventListener("DOMContentLoaded", () => {
  loadData();

  // Онбординг: Показать если первый раз
  if (!localStorage.getItem("onboarded")) {
    showScreen("onboarding");
    // Шаги с подсветкой (по очереди)
    const steps = document.querySelectorAll("#steps p");
    let i = 0;
    const interval = setInterval(() => {
      if (i > 0) steps[i - 1].classList.remove("highlight");
      if (i < steps.length) {
        steps[i].classList.add("highlight");
        i++;
      } else clearInterval(interval);
    }, 2000); // Каждые 2 сек

    document.getElementById("start-btn").addEventListener("click", () => {
      localStorage.setItem("onboarded", "true");
      showScreen("main");
    });
  } else {
    showScreen("main");
  }

  // Кнопки навигации
  document.getElementById("categories-btn").addEventListener("click", () => {
    renderCategories();
    showScreen("categories");
  });
  document.getElementById("back-categories").addEventListener("click", () => {
    currentCategory = null;
    showScreen("main");
  });
  document
    .getElementById("back-btn")
    .addEventListener("click", () => showScreen("main"));

  // Поиск и сортировка
  document.getElementById("search-input").addEventListener("input", filterApps);
  document.getElementById("sort-select").addEventListener("change", filterApps);
});
