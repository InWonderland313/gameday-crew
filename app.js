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



  const TEAMS_KEY = "gdc_v2_demo_teams";
  let lastClubScreen = "clubDashboardScreen";

  const getTeams = () => {
    try { return JSON.parse(localStorage.getItem(TEAMS_KEY) || "[]"); }
    catch { return []; }
  };

  const saveTeams = teams => localStorage.setItem(TEAMS_KEY, JSON.stringify(teams));

  const teamMeta = team => {
    const bits = [team.ageGroup, team.category];
    if (team.division) bits.push(team.division);
    return bits.filter(Boolean).join(" • ");
  };

  const teamCardHtml = team => `
    <button class="team-card" data-team-id="${team.id}">
      <div class="team-badge">${team.ageGroup || "TEAM"}</div>
      <div>
        <strong>${team.name}</strong>
        <small>${teamMeta(team)} • No manager assigned yet</small>
      </div>
      <div class="team-arrow">›</div>
    </button>`;

  const renderTeams = () => {
    const teams = getTeams();
    document.getElementById("teamCountStat").textContent = String(teams.length);
    const allPlayers = (() => { try { return JSON.parse(localStorage.getItem("gdc_v2_demo_players") || "[]"); } catch { return []; } })();
    const playerStat = document.querySelector("#clubDashboardScreen .stat-grid .stat-card:nth-child(4) strong");
    if (playerStat) playerStat.textContent = String(allPlayers.length);

    const empty = document.getElementById("dashboardTeamsEmpty");
    const wrap = document.getElementById("dashboardTeamsListWrap");
    const list = document.getElementById("dashboardTeamsList");

    if (teams.length) {
      empty?.classList.add("hidden");
      wrap?.classList.remove("hidden");
      if (list) list.innerHTML = teams.map(teamCardHtml).join("");

      document.getElementById("clubStatusTitle").textContent = `${teams.length} team${teams.length === 1 ? "" : "s"} set up`;
      document.getElementById("clubStatusText").textContent = "Next, add players and invite the people who will manage each team.";
    } else {
      empty?.classList.remove("hidden");
      wrap?.classList.add("hidden");
      if (list) list.innerHTML = "";
      document.getElementById("clubStatusTitle").textContent = "Your club is ready to set up";
      document.getElementById("clubStatusText").textContent = "Next, add your first team and invite managers.";
    }

    const teamsScreenList = document.getElementById("teamsScreenList");
    const teamsScreenEmpty = document.getElementById("teamsScreenEmpty");
    if (teams.length) {
      if (teamsScreenList) teamsScreenList.innerHTML = teams.map(teamCardHtml).join("");
      teamsScreenEmpty?.classList.add("hidden");
    } else {
      if (teamsScreenList) teamsScreenList.innerHTML = "";
      teamsScreenEmpty?.classList.remove("hidden");
    }
  };

  const openCreateTeam = () => {
    lastClubScreen = document.getElementById("teamsScreen")?.classList.contains("screen-active")
      ? "teamsScreen" : "clubDashboardScreen";
    document.getElementById("teamNameInput").value = "";
    document.getElementById("teamAgeInput").value = "";
    document.getElementById("teamCategoryInput").value = "";
    document.getElementById("teamDivisionInput").value = "";
    document.getElementById("ageFeatureHint")?.classList.add("hidden");
    showScreen("createTeamScreen");
  };

  document.querySelectorAll("[data-open-create-team]").forEach(btn => {
    btn.addEventListener("click", openCreateTeam);
  });

  document.querySelector("[data-back-from-team]")?.addEventListener("click", () => showScreen(lastClubScreen));
  document.querySelector("[data-back-dashboard]")?.addEventListener("click", () => showScreen("clubDashboardScreen"));
  document.querySelector("[data-return-dashboard]")?.addEventListener("click", () => {
    renderTeams();
    showScreen("clubDashboardScreen");
  });

  document.getElementById("teamAgeInput")?.addEventListener("change", event => {
    const age = event.target.value;
    const hint = document.getElementById("ageFeatureHint");
    if (!age) {
      hint?.classList.add("hidden");
      return;
    }

    let text = "";
    if (["U9","U10","U12"].includes(age)) {
      text = `<strong>${age} setup</strong>GameDay Crew will use weekly rotating captains and captain fairness tracking for this team.`;
    } else {
      text = `<strong>${age} setup</strong>GameDay Crew will use season Captains and Vice Captains, with support for multiple of each.`;
    }

    hint.innerHTML = text;
    hint.classList.remove("hidden");
  });

  document.querySelector("[data-create-team]")?.addEventListener("click", () => {
    const name = document.getElementById("teamNameInput")?.value.trim();
    const ageGroup = document.getElementById("teamAgeInput")?.value;
    const category = document.getElementById("teamCategoryInput")?.value;
    const division = document.getElementById("teamDivisionInput")?.value.trim() || "";

    if (!name) return alert("Enter a team name first.");
    if (!ageGroup) return alert("Choose the team's age group.");
    if (!category) return alert("Choose the team category.");

    const team = {
      id: "team_" + Date.now(),
      name,
      ageGroup,
      category,
      division,
      createdAt: new Date().toISOString()
    };

    const teams = getTeams();
    teams.push(team);
    saveTeams(teams);

    document.getElementById("createdTeamHeader").textContent = team.name;
    document.getElementById("createdTeamName").textContent = `${team.name} is ready`;
    document.getElementById("createdTeamMeta").textContent = teamMeta(team);

    renderTeams();
    showScreen("teamCreatedScreen");
  });

  document.querySelectorAll("[data-club-nav]").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.clubNav;
      if (target === "home") {
        renderTeams();
        showScreen("clubDashboardScreen");
      } else if (target === "teams") {
        renderTeams();
        showScreen("teamsScreen");
      } else if (target === "people") {
        alert("People & Invitations is coming after team creation.");
      } else if (target === "club") {
        alert("Club settings will be added after teams and people.");
      }
    });
  });

  renderTeams();


  const PLAYERS_KEY = "gdc_v2_demo_players";
  let currentTeamId = null;
  let editingPlayerId = null;

  const getAllPlayers = () => {
    try { return JSON.parse(localStorage.getItem(PLAYERS_KEY) || "[]"); }
    catch { return []; }
  };

  const saveAllPlayers = players => localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));

  const playersForTeam = teamId => getAllPlayers().filter(p => p.teamId === teamId);

  const getCurrentTeam = () => getTeams().find(t => t.id === currentTeamId) || null;

  const openTeamAdmin = teamId => {
    currentTeamId = teamId;
    const team = getCurrentTeam();
    if (!team) return;

    document.getElementById("teamAdminBadge").textContent = team.ageGroup || "TEAM";
    document.getElementById("teamAdminName").textContent = team.name;
    document.getElementById("teamAdminMeta").textContent = teamMeta(team);
    document.getElementById("playerScreenTeamName").textContent = `${team.name} Players`;

    const junior = ["U9","U10","U12"].includes(team.ageGroup);
    document.getElementById("teamSettingsSummary").textContent = junior
      ? "Weekly rotating captains and captain fairness tracking."
      : "Season Captains and Vice Captains, including multiple leaders.";

    renderTeamAdmin();
    showScreen("teamAdminScreen");
  };

  const renderTeamAdmin = () => {
    if (!currentTeamId) return;
    const players = playersForTeam(currentTeamId);
    document.getElementById("teamPlayerCount").textContent = String(players.length);
    document.getElementById("playersSetupSummary").textContent = players.length
      ? `${players.length} player${players.length === 1 ? "" : "s"} added.`
      : "Add names, numbers and career games.";

    const status = document.getElementById("teamSetupStatus");
    if (players.length) {
      status.classList.remove("warning-card");
      status.classList.add("success-card");
      status.querySelector(".attention-icon").textContent = "✓";
      status.querySelector("strong").textContent = "Player list started";
      status.querySelector("small").textContent = `${players.length} player${players.length === 1 ? "" : "s"} added. Managers and settings can be completed next.`;
    } else {
      status.classList.remove("success-card");
      status.classList.add("warning-card");
      status.querySelector(".attention-icon").textContent = "!";
      status.querySelector("strong").textContent = "Team setup isn't finished yet";
      status.querySelector("small").textContent = "Add the player list so this team is ready for game day.";
    }
  };

  const playerCardHtml = p => `
    <button class="player-card" data-player-id="${p.id}">
      <div class="player-number">${p.number || "—"}</div>
      <div>
        <strong>${p.name}</strong>
        <small>${Number(p.careerGames || 0)} starting career game${Number(p.careerGames || 0) === 1 ? "" : "s"}</small>
      </div>
      <div class="player-arrow">›</div>
    </button>`;

  const renderPlayerList = () => {
    const players = currentTeamId ? playersForTeam(currentTeamId) : [];
    const empty = document.getElementById("playersEmpty");
    const wrap = document.getElementById("playersListWrap");
    const list = document.getElementById("playersList");
    document.getElementById("playersCountHeading").textContent = String(players.length);

    if (players.length) {
      empty.classList.add("hidden");
      wrap.classList.remove("hidden");
      list.innerHTML = [...players]
        .sort((a,b) => Number(a.number || 999) - Number(b.number || 999) || a.name.localeCompare(b.name))
        .map(playerCardHtml).join("");
    } else {
      empty.classList.remove("hidden");
      wrap.classList.add("hidden");
      list.innerHTML = "";
    }
  };

  const hideAddPlayer = () => {
    document.getElementById("addPlayerPanel")?.classList.add("hidden");
  };

  const showAddPlayer = () => {
    document.getElementById("playerNameInput").value = "";
    document.getElementById("playerNumberInput").value = "";
    document.getElementById("playerCareerInput").value = "0";
    document.getElementById("addPlayerPanel")?.classList.remove("hidden");
    document.getElementById("playerNameInput")?.focus();
  };

  document.addEventListener("click", event => {
    const teamCard = event.target.closest("[data-team-id]");
    if (teamCard) {
      openTeamAdmin(teamCard.dataset.teamId);
      return;
    }

    const playerCard = event.target.closest("[data-player-id]");
    if (playerCard) {
      const p = getAllPlayers().find(x => x.id === playerCard.dataset.playerId);
      if (!p) return;
      editingPlayerId = p.id;
      document.getElementById("editPlayerNameInput").value = p.name;
      document.getElementById("editPlayerNumberInput").value = p.number || "";
      document.getElementById("editPlayerCareerInput").value = Number(p.careerGames || 0);
      showScreen("editPlayerScreen");
    }
  });

  document.querySelector("[data-back-to-club]")?.addEventListener("click", () => {
    renderTeams();
    showScreen("clubDashboardScreen");
  });

  document.querySelector("[data-open-team-players]")?.addEventListener("click", () => {
    renderPlayerList();
    showScreen("teamPlayersScreen");
  });

  document.querySelector("[data-back-team-admin]")?.addEventListener("click", () => {
    hideAddPlayer();
    renderTeamAdmin();
    showScreen("teamAdminScreen");
  });

  document.querySelectorAll("[data-show-add-player]").forEach(btn => btn.addEventListener("click", showAddPlayer));
  document.querySelector("[data-cancel-add-player]")?.addEventListener("click", hideAddPlayer);

  document.querySelector("[data-save-player]")?.addEventListener("click", () => {
    const name = document.getElementById("playerNameInput")?.value.trim();
    const number = document.getElementById("playerNumberInput")?.value.trim() || "";
    const careerGames = Math.max(0, Number(document.getElementById("playerCareerInput")?.value || 0));

    if (!name) return alert("Enter the player's name.");
    if (!currentTeamId) return alert("No team selected.");

    const all = getAllPlayers();
    if (number && all.some(p => p.teamId === currentTeamId && String(p.number) === String(number))) {
      if (!confirm(`Jumper #${number} is already being used in this team. Add this player anyway?`)) return;
    }

    all.push({
      id: "player_" + Date.now(),
      teamId: currentTeamId,
      name,
      number,
      careerGames,
      status: "active",
      createdAt: new Date().toISOString()
    });
    saveAllPlayers(all);
    hideAddPlayer();
    renderPlayerList();
  });

  document.querySelector("[data-back-player-list]")?.addEventListener("click", () => {
    editingPlayerId = null;
    renderPlayerList();
    showScreen("teamPlayersScreen");
  });

  document.querySelector("[data-save-player-edit]")?.addEventListener("click", () => {
    const all = getAllPlayers();
    const p = all.find(x => x.id === editingPlayerId);
    if (!p) return;

    const name = document.getElementById("editPlayerNameInput")?.value.trim();
    const number = document.getElementById("editPlayerNumberInput")?.value.trim() || "";
    const careerGames = Math.max(0, Number(document.getElementById("editPlayerCareerInput")?.value || 0));
    if (!name) return alert("Enter the player's name.");

    p.name = name;
    p.number = number;
    p.careerGames = careerGames;
    saveAllPlayers(all);
    editingPlayerId = null;
    renderPlayerList();
    showScreen("teamPlayersScreen");
  });

  document.querySelector("[data-delete-player]")?.addEventListener("click", () => {
    const all = getAllPlayers();
    const p = all.find(x => x.id === editingPlayerId);
    if (!p) return;
    if (!confirm(`Remove ${p.name} from this team?`)) return;

    saveAllPlayers(all.filter(x => x.id !== editingPlayerId));
    editingPlayerId = null;
    renderPlayerList();
    showScreen("teamPlayersScreen");
  });

  document.querySelector("[data-manager-placeholder]")?.addEventListener("click", () => {
    const m = document.getElementById("teamAdminMessage");
    m.classList.remove("hidden");
    m.textContent = "People & manager invitations are coming next.";
  });

  document.querySelector("[data-settings-placeholder]")?.addEventListener("click", () => {
    const m = document.getElementById("teamAdminMessage");
    m.classList.remove("hidden");
    m.textContent = "Team Settings will be added after players and managers.";
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(err => console.warn("Service worker registration failed:", err));
    });
  }
})();
