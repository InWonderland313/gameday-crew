(() => {
  const brand = window.APP_BRAND || {};

  document.querySelectorAll("[data-brand-name]").forEach(el => {
    el.textContent = brand.name || "GameDay Crew";
  });
  document.querySelectorAll("[data-brand-tagline]").forEach(el => {
    el.textContent = brand.tagline || "";
  });
  document.title = brand.name || "GameDay Crew";

  const splash = document.getElementById("splash");
  window.addEventListener("load", () => {
    window.setTimeout(() => splash?.classList.add("splash-hide"), 650);
  });

  const openPanel = (id) => {
    document.querySelectorAll(".auth-panel").forEach(p => p.classList.add("hidden"));
    document.getElementById(id)?.classList.remove("hidden");
  };

  document.querySelectorAll("[data-open]").forEach(btn => {
    btn.addEventListener("click", () => openPanel(btn.dataset.open));
  });

  const showScreen = (id) => {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("screen-active"));
    document.getElementById(id)?.classList.add("screen-active");
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  document.querySelectorAll("[data-demo-login]").forEach(btn => {
    btn.addEventListener("click", () => showScreen("welcomeScreen"));
  });

  document.querySelector("[data-logout]")?.addEventListener("click", () => {
    showScreen("authScreen");
    document.querySelectorAll(".auth-panel").forEach(p => p.classList.add("hidden"));
  });

  document.querySelectorAll("[data-choice]").forEach(btn => {
    btn.addEventListener("click", () => {
      const message = document.getElementById("starterMessage");
      message.classList.remove("hidden");
      message.textContent = btn.dataset.choice === "create"
        ? "Next build: club creation, Club Admin account and the Club Dashboard."
        : "Next build: invitation acceptance and joining an existing club.";
    });
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(err => {
        console.warn("Service worker registration failed:", err);
      });
    });
  }
})();
