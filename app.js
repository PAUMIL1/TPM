// ===================================================================
// 1. GLOBAL VARIABLES
// ===================================================================
let apps = []; // All apps from data.json
let currentCategory = null; // Current selected category
let history = []; // View history (IDs)
let views = {}; // View counter per ID

// ===================================================================
// 2. DATA LOADING
// ===================================================================
const loadData = async () => {
  try {
    const response = await fetch("data.json");
    if (!response.ok) throw new Error("Failed to load data.json");
    apps = await response.json();
  } catch (error) {
    console.error("Data loading error:", error);
    apps = [];
    setTimeout(showLoadError, 500);
  }
};

const showLoadError = () => {
  const mainScreen = document.getElementById("main");
  if (mainScreen && mainScreen.style.display !== "none") {
    mainScreen.innerHTML = `
      <div style="text-align:center;padding:40px;color:#d00;">
        <h3>Loading Error</h3>
        <p>Could not load apps.</p>
        <button onclick="location.reload()"
                style="padding:10px 20px;background:#0077ff;color:white;border:none;border-radius:5px;cursor:pointer;">
          Reload
        </button>
      </div>`;
  }
};

// ===================================================================
// 3. RENDER APP CARDS (for similar apps)
// ===================================================================
const renderApps = (appList, containerId) => {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Show skeleton
  container.innerHTML = "";
  for (let i = 0; i < 6; i++) {
    const skeleton = document.createElement("div");
    skeleton.className = "skeleton";
    container.appendChild(skeleton);
  }

  // Simulate loading delay
  setTimeout(() => {
    container.innerHTML = "";
    appList.forEach((app) => {
      const card = document.createElement("div");
      card.className = "app-card";
      card.innerHTML = `
        <img src="${app.icon}" alt="${app.name}">
        <h3>${app.name}</h3>
        <p>Rating: ${app.rating}</p>
        <p>Category: ${app.category}</p>
      `;
      card.onclick = () => showAppDetail(app);
      container.appendChild(card);
    });
  }, 1000);
};

// ===================================================================
// 4. APP DETAIL PAGE
// ===================================================================
const showAppDetail = (app) => {
  document.getElementById("app-icon").src = app.icon;
  document.getElementById("app-name").textContent = app.name;
  document.getElementById(
    "app-developer"
  ).textContent = `Developer: ${app.developer}`;
  document.getElementById(
    "app-category"
  ).textContent = `Category: ${app.category}`;
  document.getElementById("app-rating").textContent = `Rating: ${app.rating}`;
  document.getElementById("app-age").textContent = `Age: ${app.age}`;
  document.getElementById("app-description").textContent = app.description;

  // Screenshots
  const screenshotsContainer = document.getElementById("screenshots");
  screenshotsContainer.innerHTML = "";
  app.screenshots.forEach((src) => {
    const img = document.createElement("img");
    img.src = src;
    img.onclick = () => openGallery(app.screenshots);
    screenshotsContainer.appendChild(img);
  });

  // Similar apps
  const similarApps = apps
    .filter((a) => a.category === app.category && a.id !== app.id)
    .slice(0, 5);
  renderApps(similarApps, "similar-apps");

  // Update history and views
  addToHistory(app.id);

  showScreen("app-detail");
};

// ===================================================================
// 5. SCREENSHOT GALLERY
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
// 6. HISTORY + 2x2 GRID FUNCTIONS
// ===================================================================
const addToHistory = (appId) => {
  history = JSON.parse(localStorage.getItem("history") || "[]");
  if (!history.includes(appId)) {
    history.push(appId);
    localStorage.setItem("history", JSON.stringify(history));
  }

  views = JSON.parse(localStorage.getItem("views") || "{}");
  views[appId] = (views[appId] || 0) + 1;
  localStorage.setItem("views", JSON.stringify(views));
};

const getRecentApps = () => {
  return apps.filter((app) => history.includes(app.id)).slice(-5);
};

const getPopularApps = () => {
  return [...apps]
    .sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
    .slice(0, 4);
};

const getNewApps = () => {
  return [...apps]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 4);
};

const getFreeApps = () => {
  return apps
    .filter((a) => (a.price || 0) === 0)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 4);
};

const getPaidApps = () => {
  return apps
    .filter((a) => (a.price || 0) > 0)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 4);
};

// ===================================================================
// 7. RENDER 2x2 GRIDS
// ===================================================================
const renderGridApps = (appList, containerId) => {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!appList || appList.length === 0) {
    container.innerHTML = `<p style="color:#888; text-align:center; grid-column:1/-1; padding:20px;">No apps</p>`;
    return;
  }

  container.innerHTML = "";
  appList.forEach((app) => {
    const price = app.price || 0;
    const priceHTML =
      price > 0 ? `<div class="app-grid-price">${price} ₽</div>` : "";

    const card = document.createElement("div");
    card.className = "app-grid-card";
    card.innerHTML = `
      <img src="${app.icon}" alt="${app.name}">
      <div class="app-grid-info">
        <div class="app-grid-name">${app.name}</div>
        <div class="app-grid-dev">${app.developer}</div>
      </div>
      <div class="app-grid-rating">
        ★ ${app.rating}
        ${priceHTML}
      </div>
    `;
    card.onclick = () => showAppDetail(app);
    container.appendChild(card);
  });
};

// ===================================================================
// 8. CATEGORIES TILES
// ===================================================================
const renderCategories = () => {
  const categories = [...new Set(apps.map((app) => app.category))];
  const grid = document.getElementById("categories-grid");
  if (!grid) return;

  grid.innerHTML = "";
  categories.forEach((cat) => {
    const tile = document.createElement("div");
    tile.className = "category-tile";
    tile.textContent = cat;
    tile.dataset.cat = cat;
    tile.onclick = () => {
      currentCategory = cat;
      filterAndRender();
      showScreen("main");
    };
    grid.appendChild(tile);
  });
};

// ===================================================================
// 9. SCREEN NAVIGATION
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
    setTimeout(() => {
      filterAndRender();
      if (document.getElementById("carousel-track").children.length === 0) {
        initBannersCarousel();
      }
    }, 100);
  }
};

// ===================================================================
// 10. SPLASH & ONBOARDING
// ===================================================================
const runSplash = () => {
  return new Promise((resolve) => {
    const splash = document.getElementById("splash");
    const logo = document.getElementById("shared-logo");
    const startBtn = document.getElementById("start-btn");

    setTimeout(() => {
      const isFirstLaunch = !localStorage.getItem("onboarded");

      if (isFirstLaunch) {
        logo.classList.add("to-onboarding");
        splash.classList.add("show-onboarding");

        setTimeout(() => {
          startBtn.classList.add("active");
          startBtn.disabled = false;
        }, 400);

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
// 11. APP INITIALIZATION
// ===================================================================
document.addEventListener("DOMContentLoaded", async () => {
  await loadData();
  await runSplash();

  const bottomNav = document.getElementById("bottom-nav");
  if (bottomNav) bottomNav.style.display = "flex";

  const profileBtn = document.getElementById("profile-btn");
  const profileImg = document.createElement("img");
  profileImg.src = "images/profile.jpg";
  profileImg.alt = "Profile";
  profileImg.onload = () => {
    profileBtn.innerHTML = "";
    profileBtn.appendChild(profileImg);
  };

  document.getElementById("categories-btn").onclick = () => {
    renderCategories();
    showScreen("categories");
  };

  document.getElementById("back-categories").onclick = () => {
    currentCategory = null;
    showScreen("main");
  };

  profileBtn.onclick = () => {
    alert("Profile (mock) — coming soon");
  };

  document.getElementById("back-btn").onclick = () => showScreen("main");

  document.getElementById("search-input").oninput = filterAndRender;
  const sortSelect = document.getElementById("sort-select");
  if (sortSelect) sortSelect.onchange = filterAndRender;

  // Override showScreen
  const originalShowScreen = showScreen;
  showScreen = (id) => {
    originalShowScreen(id);

    if (id === "main") {
      setTimeout(() => {
        filterAndRender();
        const track = document.getElementById("carousel-track");
        if (track && track.children.length === 0) {
          initBannersCarousel();
        }
      }, 100);
    }
  };

  showScreen("main");
});

// ===================================================================
// 12. BANNER CAROUSEL
// ===================================================================
let currentSlide = 0;
let carouselInterval = null;

const initBannersCarousel = () => {
  const track = document.getElementById("carousel-track");
  const dots = document.getElementById("carousel-dots");
  if (!track || !dots) return;

  // Берём приложения с banner !== null
  const bannerApps = apps.filter((app) => app.banner).slice(0, 4);

  if (bannerApps.length === 0) {
    console.warn("Нет баннеров (поле banner пустое)");
    return;
  }

  track.innerHTML = "";
  dots.innerHTML = "";

  bannerApps.forEach((app, i) => {
    const slide = document.createElement("div");
    slide.className = "carousel-slide";
    slide.innerHTML = `
      <img src="${app.banner}" alt="${app.name}" loading="lazy">
      <div class="carousel-caption">
        <h3>${app.name}</h3>
        <p>${app.category}</p>
      </div>
    `;
    slide.onclick = () => showAppDetail(app);
    track.appendChild(slide);

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
// 13. POPULAR CATEGORIES (TOP-3)
// ===================================================================
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

    card.dataset.category = cat.category;
    card.querySelector(".category-name").textContent = cat.category;

    card.onclick = () => {
      currentCategory = cat.category;
      filterAndRender();
      showScreen("main");
    };
  });

  for (let i = top.length; i < cards.length; i++) {
    cards[i].style.display = "none";
  }
};

// ===================================================================
// 14. FINAL filterAndRender — RENDERS ALL 2x2 GRIDS
// ===================================================================
const filterAndRender = () => {
  let filtered = [...apps];

  // Search
  const searchInput = document.getElementById("search-input");
  const query = searchInput?.value.toLowerCase() || "";
  if (query) {
    filtered = filtered.filter(
      (app) =>
        app.name.toLowerCase().includes(query) ||
        app.developer.toLowerCase().includes(query)
    );
  }

  // Category filter
  if (currentCategory) {
    filtered = filtered.filter((app) => app.category === currentCategory);
  }

  // Sorting
  const sortSelect = document.getElementById("sort-select");
  const sortBy = sortSelect?.value || "name";
  if (sortBy === "rating") filtered.sort((a, b) => b.rating - a.rating);
  else if (sortBy === "new")
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  else filtered.sort((a, b) => a.name.localeCompare(b.name));

  // Render 2x2 grids
  renderGridApps(getPopularApps(), "popular-apps-grid");
  renderGridApps(getNewApps(), "new-apps-grid");
  renderGridApps(getFreeApps(), "free-apps-grid");
  renderGridApps(getPaidApps(), "paid-apps-grid");

  // Popular categories
  renderPopularCategories();
};
