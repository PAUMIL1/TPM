let apps = [],
  currentCategory = null;
let history = [],
  views = {};

/* ------------------- 1. Загрузка данных ------------------- */
const loadData = async () => {
  try {
    const res = await fetch("data.json");
    if (!res.ok) throw new Error("Не удалось загрузить data.json");
    apps = await res.json();
  } catch (e) {
    console.error(e);
    apps = []; // fallback
    setTimeout(showLoadError, 500);
  }
};

const showLoadError = () => {
  const main = document.getElementById("main");
  if (main && main.style.display !== "none") {
    main.innerHTML = `
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

/* ------------------- 2. Рендер карточек ------------------- */
const renderApps = (list, containerId) => {
  const container = document.getElementById(containerId);
  if (!container) return;

  // скелетон
  container.innerHTML = "";
  for (let i = 0; i < 6; i++) {
    const s = document.createElement("div");
    s.className = "skeleton";
    container.appendChild(s);
  }

  setTimeout(() => {
    container.innerHTML = "";
    list.forEach((app) => {
      const card = document.createElement("div");
      card.className = "app-card";
      card.innerHTML = `
        <img src="${app.icon}" alt="${app.name}">
        <h3>${app.name}</h3>
        <p>Оценка: ${app.rating}</p>
        <p>Категория: ${app.category}</p>`;
      card.onclick = () => showAppDetail(app);
      container.appendChild(card);
    });
  }, 1000);
};

/* ------------------- 3. Детальная карточка ------------------- */
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

  const screenshots = document.getElementById("screenshots");
  screenshots.innerHTML = "";
  app.screenshots.forEach((src) => {
    const img = document.createElement("img");
    img.src = src;
    img.onclick = () => openGallery(app.screenshots);
    screenshots.appendChild(img);
  });

  const similar = apps
    .filter((a) => a.category === app.category && a.id !== app.id)
    .slice(0, 5);
  renderApps(similar, "similar-apps");

  addToHistory(app.id);
  showScreen("app-detail");
};

/* ------------------- 4. Галерея ------------------- */
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
  document.getElementById("close-gallery").onclick = () =>
    (modal.style.display = "none");
};

/* ------------------- 5. История / Популярные / Новые ------------------- */
const addToHistory = (id) => {
  history = JSON.parse(localStorage.getItem("history") || "[]");
  if (!history.includes(id)) {
    history.push(id);
    localStorage.setItem("history", JSON.stringify(history));
  }
  views = JSON.parse(localStorage.getItem("views") || "{}");
  views[id] = (views[id] || 0) + 1;
  localStorage.setItem("views", JSON.stringify(views));
};

const getRecent = () => apps.filter((a) => history.includes(a.id)).slice(-5);
const getPopular = () =>
  [...apps].sort((a, b) => (views[b.id] || 0) - (views[a.id] || 0)).slice(0, 5);
const getNew = () =>
  [...apps].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

/* ------------------- 6. Фильтрация и рендер ------------------- */
const filterAndRender = () => {
  let filtered = apps;
  const q = document.getElementById("search-input").value.toLowerCase();
  if (q) filtered = filtered.filter((a) => a.name.toLowerCase().includes(q));
  if (currentCategory)
    filtered = filtered.filter((a) => a.category === currentCategory);

  const sort = document.getElementById("sort-select").value;
  if (sort === "rating") filtered.sort((a, b) => b.rating - a.rating);
  else if (sort === "new")
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  else filtered.sort((a, b) => a.name.localeCompare(b.name));

  renderApps(filtered, "app-list"); // ← исправлено!
  renderApps(getPopular(), "popular-apps");
  renderApps(getNew(), "new-apps");
  renderApps(getRecent(), "recent-apps");
};

/* ------------------- 7. Категории ------------------- */
const renderCategories = () => {
  const cats = [...new Set(apps.map((a) => a.category))];
  const list = document.getElementById("category-list");
  list.innerHTML = "";
  cats.forEach((c) => {
    const li = document.createElement("li");
    li.textContent = c;
    li.onclick = () => {
      currentCategory = c;
      filterAndRender();
      showScreen("main");
    };
    list.appendChild(li);
  });
};

/* ------------------- 8. Навигация ------------------- */
const showScreen = (id) => {
  document
    .querySelectorAll(".screen")
    .forEach((s) => (s.style.display = "none"));
  const screen = document.getElementById(id);
  if (screen) screen.style.display = "block";
  if (id === "main") filterAndRender();
};

/* ------------------- 9. Сплеш ------------------- */
const showSplash = () =>
  new Promise((r) =>
    setTimeout(() => {
      document.getElementById("splash").style.display = "none";
      r();
    }, 2000)
  );

/* ------------------- 10. Онбординг (новая анимация) ------------------- */
const runOnboarding = () => {
  const container = document.querySelector(".onboarding-container");
  const logo = document.querySelector(".onboarding-logo");
  const welcome = document.querySelector(".welcome-text");
  const sub = document.querySelector(".subtext");
  const btn = document.getElementById("start-btn");

  container.style.opacity = "0";
  logo.style.opacity = "0";
  logo.style.transform = "translateY(0)";
  welcome.style.opacity = "0";
  sub.style.opacity = "0";
  btn.classList.remove("active");
  btn.disabled = true;

  setTimeout(() => {
    container.style.opacity = "1";
  }, 100);

  setTimeout(() => {
    logo.style.opacity = "1";
    logo.style.transform = "translateY(-80px)";
  }, 400);

  setTimeout(() => {
    welcome.style.opacity = "1";
  }, 600);
  setTimeout(() => {
    sub.style.opacity = "1";
  }, 900);

  setTimeout(() => {
    btn.classList.add("active");
    btn.disabled = false;
  }, 1200);
};

/* ------------------- 11. Инициализация ------------------- */
document.addEventListener("DOMContentLoaded", async () => {
  await loadData();
  await showSplash();

  showScreen("onboarding");
  runOnboarding(); // ← запуск новой анимации

  const startBtn = document.getElementById("start-btn");
  startBtn.onclick = () => {
    if (!startBtn.disabled) showScreen("main");
  };

  /* ---------- кнопки навигации ---------- */
  document.getElementById("categories-btn").onclick = () => {
    renderCategories();
    showScreen("categories");
  };
  document.getElementById("back-categories").onclick = () => {
    currentCategory = null;
    showScreen("main");
  };
  document.getElementById("back-btn").onclick = () => showScreen("main");

  /* ---------- поиск и сортировка ---------- */
  document.getElementById("search-input").oninput = filterAndRender;
  document.getElementById("sort-select").onchange = filterAndRender;
});
