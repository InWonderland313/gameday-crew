(() => {
  const brand = window.APP_BRAND || {};
  document.querySelectorAll("[data-brand-name]").forEach(el => el.textContent = brand.name || "GameDay Crew");
  document.querySelectorAll("[data-brand-tagline]").forEach(el => el.textContent = brand.tagline || "");
  document.title = brand.name || "GameDay Crew";

  const splash = document.getElementById("splash");
  window.addEventListener("load", () => setTimeout(() => splash?.classList.add("splash-hide"), 650));

  const showScreen = id => {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("screen-active"));
    document.getElementById(id)?.classList.add("screen-active");
    window.scrollTo({top:0,behavior:"instant"});
  };

  const openPanel = id => {
    document.querySelectorAll(".auth-panel").forEach(p => p.classList.add("hidden"));
    document.getElementById(id)?.classList.remove("hidden");
  };

  document.querySelectorAll("[data-open]").forEach(btn => btn.addEventListener("click", () => openPanel(btn.dataset.open)));
  document.querySelectorAll("[data-demo-login]").forEach(btn => btn.addEventListener("click", () => showScreen("welcomeScreen")));
  document.querySelectorAll("[data-logout]").forEach(btn => btn.addEventListener("click", () => showScreen("authScreen")));

  document.querySelector("[data-go-create-club]")?.addEventListener("click", () => showScreen("createClubScreen"));
  document.querySelector("[data-back-welcome]")?.addEventListener("click", () => showScreen("welcomeScreen"));

  document.querySelector("[data-invite-placeholder]")?.addEventListener("click", () => {
    const m = document.getElementById("starterMessage");
    m.classList.remove("hidden");
    m.textContent = "Invitation acceptance will be wired in after club creation and teams.";
  });

  let clubLogoData = "";
  const logoInput = document.getElementById("clubLogoInput");
  logoInput?.addEventListener("change", event => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      clubLogoData = String(reader.result || "");
      document.getElementById("clubLogoPreview").src = clubLogoData;
      document.getElementById("clubLogoPreviewWrap")?.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  });

  document.querySelector("[data-remove-club-logo]")?.addEventListener("click", () => {
    clubLogoData = "";
    if (logoInput) logoInput.value = "";
    document.getElementById("clubLogoPreviewWrap")?.classList.add("hidden");
  });

  document.querySelector("[data-create-club]")?.addEventListener("click", () => {
    const name = document.getElementById("clubNameInput")?.value.trim();
    const season = Number(document.getElementById("clubSeasonInput")?.value || 2027);
    const footballType = document.getElementById("footballTypeInput")?.value || "Australian Rules";

    if (!name) {
      alert("Enter your club name first.");
      document.getElementById("clubNameInput")?.focus();
      return;
    }

    const club = {id:"club_"+Date.now(),name,season,footballType,logo:clubLogoData || ""};
    localStorage.setItem("gdc_v2_demo_club", JSON.stringify(club));

    document.getElementById("dashboardClubName").textContent = club.name;
    document.getElementById("dashboardSeason").textContent = `Season ${club.season}`;
    document.getElementById("dashboardClubLogo").src = club.logo || "logo.png";
    showScreen("clubDashboardScreen");
  });

  document.querySelector("[data-add-first-team]")?.addEventListener("click", () => {
    const m = document.getElementById("dashboardMessage");
    m.classList.remove("hidden");
    m.textContent = "Next build: create the first team, choose age group, then invite manager(s).";
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(err => console.warn("Service worker registration failed:", err));
    });
  }
})();
