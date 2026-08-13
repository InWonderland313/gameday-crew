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

  const teamCardHtml = team => {
    const invites = (() => {
      try { return JSON.parse(localStorage.getItem("gdc_v2_demo_invites") || "[]"); }
      catch { return []; }
    })();
    const managers = invites.filter(i => i.teamId === team.id && i.role === "Team Manager");
    const helperCount = invites.filter(i => i.teamId === team.id && i.role === "Team Helper").length;
    let accessText = "No manager assigned yet";
    if (managers.length === 1) accessText = `Manager: ${managers[0].email} (${managers[0].status})`;
    if (managers.length > 1) accessText = `${managers.length} managers invited`;
    if (!managers.length && helperCount) accessText = `${helperCount} helper${helperCount === 1 ? "" : "s"} invited`;
    if (managers.length && helperCount) accessText += ` • ${helperCount} helper${helperCount === 1 ? "" : "s"}`;

    return `
    <button class="team-card" data-team-id="${team.id}">
      <div class="team-badge">${team.ageGroup || "TEAM"}</div>
      <div>
        <strong>${team.name}</strong>
        <small>${teamMeta(team)} • ${accessText}</small>
      </div>
      <div class="team-arrow">›</div>
    </button>`;
  };

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
        renderClubPeople();
        showScreen("peopleScreen");
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
    if (typeof renderManagerCounts === "function") renderManagerCounts();
    showScreen("teamAdminScreen");
  };

  const renderTeamAdmin = () => {
    if (!currentTeamId) return;
    const players = playersForTeam(currentTeamId);
    document.getElementById("teamPlayerCount").textContent = String(players.length);

    const completedGames = typeof gamesForTeam === "function"
      ? gamesForTeam(currentTeamId)
      : [];
    const awardsGiven = completedGames.reduce((total, game) =>
      total + (game.awards || []).filter(award => award.playerId && award.given !== false).length
    , 0);

    const teamGameCount = document.getElementById("teamGameCount");
    const teamAwardCount = document.getElementById("teamAwardCount");
    if (teamGameCount) teamGameCount.textContent = String(completedGames.length);
    if (teamAwardCount) teamAwardCount.textContent = String(awardsGiven);

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

    if (typeof updateTeamSettingsSummary === "function") updateTeamSettingsSummary();
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
    const playerCountLabel = document.getElementById("playersCountLabel");
    if (playerCountLabel) playerCountLabel.textContent = players.length === 1 ? "player" : "players";

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




  const INVITES_KEY = "gdc_v2_demo_invites";

  const getInvites = () => {
    try { return JSON.parse(localStorage.getItem(INVITES_KEY) || "[]"); }
    catch { return []; }
  };

  const saveInvites = invites => localStorage.setItem(INVITES_KEY, JSON.stringify(invites));

  const isValidEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const roleIcon = role => {
    if (role === "Club Admin") return "🛡️";
    if (role === "Team Helper") return "🙋";
    return "👤";
  };

  const roleHintText = role => {
    if (role === "Club Admin") {
      return "Club Admins can manage the whole club, including teams, people and season administration.";
    }
    if (role === "Team Helper") {
      return "Team Helpers can assist with game-day scoring, interchange and awards, but cannot change the roster or team setup.";
    }
    return "Team Managers can run and edit their allocated team, including roster, games, awards and stats.";
  };

  const inviteCardHtml = invite => {
    const team = invite.teamId ? getTeams().find(t => t.id === invite.teamId) : null;
    const teamLine = team ? ` • ${team.name}` : "";
    return `
      <div class="person-card">
        <div class="person-icon">${roleIcon(invite.role)}</div>
        <div>
          <strong>${invite.email}</strong>
          <small>${invite.role}${teamLine}</small>
        </div>
        <div class="person-actions">
          <span class="status-pill ${invite.status === "Accepted" ? "accepted" : ""}">${invite.status}</span>
          <button class="revoke-btn" data-revoke-invite="${invite.id}">Remove</button>
        </div>
      </div>`;
  };

  const invitesForTeam = teamId => getInvites().filter(i => i.teamId === teamId);

  const renderTeamManagers = () => {
    const invites = currentTeamId ? invitesForTeam(currentTeamId) : [];
    const empty = document.getElementById("teamManagersEmpty");
    const wrap = document.getElementById("teamManagersListWrap");
    const list = document.getElementById("teamManagersList");
    const count = document.getElementById("teamAccessCount");
    const label = document.getElementById("teamAccessLabel");

    if (count) count.textContent = String(invites.length);
    if (label) label.textContent = invites.length === 1 ? "person" : "people";

    if (invites.length) {
      empty?.classList.add("hidden");
      wrap?.classList.remove("hidden");
      if (list) list.innerHTML = invites.map(inviteCardHtml).join("");
    } else {
      empty?.classList.remove("hidden");
      wrap?.classList.add("hidden");
      if (list) list.innerHTML = "";
    }
  };

  const renderClubPeople = () => {
    const invites = getInvites();
    const empty = document.getElementById("clubPeopleEmpty");
    const wrap = document.getElementById("clubPeopleListWrap");
    const list = document.getElementById("clubPeopleList");

    const admins = invites.filter(i => i.role === "Club Admin");
    const managers = invites.filter(i => i.role === "Team Manager");
    const helpers = invites.filter(i => i.role === "Team Helper");
    const pending = invites.filter(i => i.status === "Pending");

    document.getElementById("clubAdminPeopleStat").textContent = String(1 + admins.length);
    document.getElementById("clubManagerPeopleStat").textContent = String(managers.length);
    document.getElementById("clubHelperPeopleStat").textContent = String(helpers.length);
    document.getElementById("pendingInviteStat").textContent = String(pending.length);

    if (invites.length) {
      empty?.classList.add("hidden");
      wrap?.classList.remove("hidden");
      if (list) list.innerHTML = invites.map(inviteCardHtml).join("");
    } else {
      empty?.classList.remove("hidden");
      wrap?.classList.add("hidden");
      if (list) list.innerHTML = "";
    }
  };

  const renderManagerCounts = () => {
    const invites = getInvites();
    const managersForCurrent = currentTeamId
      ? invites.filter(i => i.teamId === currentTeamId && i.role === "Team Manager")
      : [];
    const teamManagerStat = document.querySelector("#teamAdminScreen .team-stat-grid .stat-card:nth-child(2) strong");
    if (teamManagerStat) teamManagerStat.textContent = String(managersForCurrent.length);

    const teamManagerSummary = document.querySelector("[data-open-team-managers] small");
    if (teamManagerSummary) {
      const teamInvites = currentTeamId ? invitesForTeam(currentTeamId) : [];
      if (!teamInvites.length) {
        teamManagerSummary.textContent = "Invite the people who will manage this team.";
      } else {
        const managers = teamInvites.filter(i => i.role === "Team Manager").length;
        const helpers = teamInvites.filter(i => i.role === "Team Helper").length;
        const bits = [];
        if (managers) bits.push(`${managers} manager${managers === 1 ? "" : "s"}`);
        if (helpers) bits.push(`${helpers} helper${helpers === 1 ? "" : "s"}`);
        teamManagerSummary.textContent = `${bits.join(" • ")} invited.`;
      }
    }

    const uniqueManagers = new Set(
      invites.filter(i => i.role === "Team Manager").map(i => i.email.toLowerCase())
    );
    const clubManagerStat = document.querySelector("#clubDashboardScreen .stat-grid .stat-card:nth-child(3) strong");
    if (clubManagerStat) clubManagerStat.textContent = String(uniqueManagers.size);
  };

  const fillClubInviteTeams = () => {
    const select = document.getElementById("clubInviteTeamInput");
    if (!select) return;
    const teams = getTeams();
    select.innerHTML = teams.length
      ? teams.map(t => `<option value="${t.id}">${t.name}</option>`).join("")
      : '<option value="">No teams created yet</option>';
  };

  const updateClubInviteRoleUI = () => {
    const role = document.getElementById("clubInviteRoleInput")?.value || "Club Admin";
    const teamLabel = document.getElementById("clubInviteTeamLabel");
    const hint = document.getElementById("clubInviteRoleHint");
    if (hint) hint.textContent = roleHintText(role);

    if (role === "Club Admin") {
      teamLabel?.classList.add("hidden");
    } else {
      fillClubInviteTeams();
      teamLabel?.classList.remove("hidden");
    }
  };

  document.querySelector("[data-open-team-managers]")?.addEventListener("click", () => {
    const team = getCurrentTeam();
    if (!team) return;
    document.getElementById("managerScreenTeamName").textContent = `${team.name} Access`;
    renderTeamManagers();
    showScreen("teamManagersScreen");
  });

  document.querySelector("[data-back-team-admin-from-managers]")?.addEventListener("click", () => {
    document.getElementById("teamInvitePanel")?.classList.add("hidden");
    renderManagerCounts();
    renderTeamAdmin();
    showScreen("teamAdminScreen");
  });

  const showTeamInvitePanel = () => {
    document.getElementById("teamInviteEmailInput").value = "";
    document.getElementById("teamInviteRoleInput").value = "Team Manager";
    document.getElementById("teamInviteRoleHint").textContent = roleHintText("Team Manager");
    document.getElementById("teamInvitePanel")?.classList.remove("hidden");
    document.getElementById("teamInviteEmailInput")?.focus();
  };

  document.querySelectorAll("[data-show-team-invite]").forEach(btn => btn.addEventListener("click", showTeamInvitePanel));

  document.querySelector("[data-cancel-team-invite]")?.addEventListener("click", () => {
    document.getElementById("teamInvitePanel")?.classList.add("hidden");
  });

  document.getElementById("teamInviteRoleInput")?.addEventListener("change", event => {
    document.getElementById("teamInviteRoleHint").textContent = roleHintText(event.target.value);
  });

  document.querySelector("[data-save-team-invite]")?.addEventListener("click", () => {
    const email = document.getElementById("teamInviteEmailInput")?.value.trim().toLowerCase();
    const role = document.getElementById("teamInviteRoleInput")?.value || "Team Manager";
    if (!email || !isValidEmail(email)) return alert("Enter a valid email address.");
    if (!currentTeamId) return alert("No team selected.");

    const invites = getInvites();
    if (invites.some(i => i.email.toLowerCase() === email && i.teamId === currentTeamId && i.role === role)) {
      return alert("That person already has this invitation for the team.");
    }

    invites.push({
      id: "invite_" + Date.now(),
      email,
      role,
      teamId: currentTeamId,
      status: "Pending",
      createdAt: new Date().toISOString()
    });
    saveInvites(invites);

    document.getElementById("teamInvitePanel")?.classList.add("hidden");
    renderTeamManagers();
    renderManagerCounts();
    renderTeams();
  });

  const showClubInvitePanel = () => {
    document.getElementById("clubInviteEmailInput").value = "";
    document.getElementById("clubInviteRoleInput").value = "Club Admin";
    updateClubInviteRoleUI();
    document.getElementById("clubInvitePanel")?.classList.remove("hidden");
    document.getElementById("clubInviteEmailInput")?.focus();
  };

  document.querySelectorAll("[data-show-club-invite]").forEach(btn => btn.addEventListener("click", showClubInvitePanel));

  document.querySelector("[data-cancel-club-invite]")?.addEventListener("click", () => {
    document.getElementById("clubInvitePanel")?.classList.add("hidden");
  });

  document.getElementById("clubInviteRoleInput")?.addEventListener("change", updateClubInviteRoleUI);

  document.querySelector("[data-save-club-invite]")?.addEventListener("click", () => {
    const email = document.getElementById("clubInviteEmailInput")?.value.trim().toLowerCase();
    const role = document.getElementById("clubInviteRoleInput")?.value || "Club Admin";
    const teamId = role === "Club Admin" ? null : (document.getElementById("clubInviteTeamInput")?.value || null);

    if (!email || !isValidEmail(email)) return alert("Enter a valid email address.");
    if (role !== "Club Admin" && !teamId) return alert("Choose a team for this person.");

    const invites = getInvites();
    if (invites.some(i => i.email.toLowerCase() === email && i.role === role && i.teamId === teamId)) {
      return alert("That invitation already exists.");
    }

    invites.push({
      id: "invite_" + Date.now(),
      email,
      role,
      teamId,
      status: "Pending",
      createdAt: new Date().toISOString()
    });
    saveInvites(invites);

    document.getElementById("clubInvitePanel")?.classList.add("hidden");
    renderClubPeople();
    renderManagerCounts();
    renderTeams();
  });

  document.addEventListener("click", event => {
    const revoke = event.target.closest("[data-revoke-invite]");
    if (!revoke) return;

    const invites = getInvites();
    const invite = invites.find(i => i.id === revoke.dataset.revokeInvite);
    if (!invite) return;

    if (!confirm(`Remove access/invitation for ${invite.email}?`)) return;

    saveInvites(invites.filter(i => i.id !== invite.id));
    renderTeamManagers();
    renderClubPeople();
    renderManagerCounts();
    renderTeams();
  });

  document.querySelector("[data-back-dashboard-from-people]")?.addEventListener("click", () => {
    document.getElementById("clubInvitePanel")?.classList.add("hidden");
    renderTeams();
    showScreen("clubDashboardScreen");
  });

  renderManagerCounts();


  const TEAM_SETTINGS_KEY = "gdc_v2_demo_team_settings";
  let workingCaptains = [];
  let workingViceCaptains = [];

  const getTeamSettings = () => {
    try { return JSON.parse(localStorage.getItem(TEAM_SETTINGS_KEY) || "{}"); }
    catch { return {}; }
  };

  const saveTeamSettings = settings => {
    localStorage.setItem(TEAM_SETTINGS_KEY, JSON.stringify(settings));
  };

  const settingsForCurrentTeam = () => {
    const all = getTeamSettings();
    return all[currentTeamId] || { captains: [], viceCaptains: [] };
  };

  const leadershipNameList = ids => {
    const players = currentTeamId ? playersForTeam(currentTeamId) : [];
    return ids.map(id => players.find(p => p.id === id)?.name).filter(Boolean);
  };

  const leadershipSummaryText = () => {
    const team = getCurrentTeam();
    if (!team) return "Age-aware captain and game settings.";

    if (["U9","U10","U12"].includes(team.ageGroup)) {
      return "Weekly rotating captains and captain fairness tracking.";
    }

    const settings = settingsForCurrentTeam();
    const captains = leadershipNameList(settings.captains || []);
    const vice = leadershipNameList(settings.viceCaptains || []);

    if (!captains.length && !vice.length) {
      return "Season Captains and Vice Captains, including multiple leaders.";
    }

    const bits = [];
    if (captains.length) bits.push(`${captains.length} Captain${captains.length === 1 ? "" : "s"}`);
    if (vice.length) bits.push(`${vice.length} Vice Captain${vice.length === 1 ? "" : "s"}`);
    return bits.join(" • ") + " set.";
  };

  const updateTeamSettingsSummary = () => {
    const el = document.getElementById("teamSettingsSummary");
    if (el) el.textContent = leadershipSummaryText();
  };

  const playerChoiceHtml = (player, selected, disabled, type) => `
    <button class="player-choice ${selected ? "selected" : ""} ${disabled ? "disabled" : ""}"
            data-leadership-choice="${type}"
            data-leadership-player-id="${player.id}"
            ${disabled ? 'disabled aria-disabled="true"' : ""}>
      <div class="player-choice-number">${player.number || "—"}</div>
      <div>
        <strong>${player.name}</strong>
        <small>${Number(player.careerGames || 0)} career game${Number(player.careerGames || 0) === 1 ? "" : "s"}</small>
      </div>
      <div class="choice-check">${selected ? "✓" : ""}</div>
    </button>`;

  const renderLeadershipChoices = () => {
    const players = currentTeamId ? [...playersForTeam(currentTeamId)] : [];
    players.sort((a,b) => Number(a.number || 999) - Number(b.number || 999) || a.name.localeCompare(b.name));

    const captainWrap = document.getElementById("captainPlayerChoices");
    const viceWrap = document.getElementById("vicePlayerChoices");

    if (captainWrap) {
      captainWrap.innerHTML = players.map(player => playerChoiceHtml(
        player,
        workingCaptains.includes(player.id),
        workingViceCaptains.includes(player.id),
        "captain"
      )).join("");
    }

    if (viceWrap) {
      viceWrap.innerHTML = players.map(player => playerChoiceHtml(
        player,
        workingViceCaptains.includes(player.id),
        workingCaptains.includes(player.id),
        "vice"
      )).join("");
    }

    const capPill = document.getElementById("captainCountPill");
    const vicePill = document.getElementById("viceCountPill");
    if (capPill) capPill.textContent = `${workingCaptains.length} selected`;
    if (vicePill) vicePill.textContent = `${workingViceCaptains.length} selected`;
  };

  const openTeamSettings = () => {
    const team = getCurrentTeam();
    if (!team) return;

    const savedFullSettings = fullSettingsForCurrentTeam();
    workingAwards = (savedFullSettings.awards || []).map(a => ({...a}));
    workingMilestones = [...(savedFullSettings.milestones || [50,100,150])];

    renderAwardTypes();

    document.querySelectorAll("[data-milestone-value]").forEach(btn => {
      const value = Number(btn.dataset.milestoneValue);
      const selected = workingMilestones.includes(value);
      btn.classList.toggle("selected", selected);
      const check = btn.querySelector(".choice-check");
      if (check) check.textContent = selected ? "✓" : "";
    });

    const milestoneWindowInput = document.getElementById("milestoneWindowInput");
    if (milestoneWindowInput) milestoneWindowInput.value = String(savedFullSettings.milestoneWindow || 5);

    document.getElementById("awardsSavedMessage")?.classList.add("hidden");
    document.getElementById("milestonesSavedMessage")?.classList.add("hidden");

    document.getElementById("teamSettingsScreenTitle").textContent = `${team.name} Settings`;

    const junior = ["U9","U10","U12"].includes(team.ageGroup);
    const juniorPanel = document.getElementById("leadershipJuniorPanel");
    const seniorPanel = document.getElementById("leadershipSeniorPanel");

    if (junior) {
      juniorPanel?.classList.remove("hidden");
      seniorPanel?.classList.add("hidden");
    } else {
      juniorPanel?.classList.add("hidden");
      seniorPanel?.classList.remove("hidden");

      const players = playersForTeam(currentTeamId);
      const noPlayers = document.getElementById("leadershipNoPlayers");
      const controls = document.getElementById("leadershipPlayerControls");

      if (!players.length) {
        noPlayers?.classList.remove("hidden");
        controls?.classList.add("hidden");
      } else {
        noPlayers?.classList.add("hidden");
        controls?.classList.remove("hidden");

        const saved = settingsForCurrentTeam();
        const validIds = new Set(players.map(p => p.id));
        workingCaptains = (saved.captains || []).filter(id => validIds.has(id));
        workingViceCaptains = (saved.viceCaptains || []).filter(id => validIds.has(id) && !workingCaptains.includes(id));
        renderLeadershipChoices();
      }
    }

    document.getElementById("leadershipSavedMessage")?.classList.add("hidden");
    showScreen("teamSettingsScreen");
  };

  document.querySelector("[data-open-team-settings]")?.addEventListener("click", openTeamSettings);

  document.querySelector("[data-back-team-admin-from-settings]")?.addEventListener("click", () => {
    updateTeamSettingsSummary();
    showScreen("teamAdminScreen");
  });

  document.querySelector("[data-settings-go-players]")?.addEventListener("click", () => {
    renderPlayerList();
    showScreen("teamPlayersScreen");
  });

  document.addEventListener("click", event => {
    const choice = event.target.closest("[data-leadership-choice]");
    if (!choice || choice.disabled) return;

    const playerId = choice.dataset.leadershipPlayerId;
    const type = choice.dataset.leadershipChoice;

    if (type === "captain") {
      if (workingCaptains.includes(playerId)) {
        workingCaptains = workingCaptains.filter(id => id !== playerId);
      } else {
        workingCaptains.push(playerId);
        workingViceCaptains = workingViceCaptains.filter(id => id !== playerId);
      }
    } else {
      if (workingViceCaptains.includes(playerId)) {
        workingViceCaptains = workingViceCaptains.filter(id => id !== playerId);
      } else {
        workingViceCaptains.push(playerId);
        workingCaptains = workingCaptains.filter(id => id !== playerId);
      }
    }

    renderLeadershipChoices();
    document.getElementById("leadershipSavedMessage")?.classList.add("hidden");
  });

  document.querySelector("[data-save-leadership]")?.addEventListener("click", () => {
    if (!currentTeamId) return;

    const all = getTeamSettings();
    all[currentTeamId] = {
      ...(all[currentTeamId] || {}),
      captains: [...workingCaptains],
      viceCaptains: [...workingViceCaptains],
      updatedAt: new Date().toISOString()
    };
    saveTeamSettings(all);

    document.getElementById("leadershipSavedMessage")?.classList.remove("hidden");
    updateTeamSettingsSummary();
  });

  updateTeamSettingsSummary();


  let workingAwards = [];
  let workingMilestones = [50, 100, 150];

  const defaultSettingsForTeam = () => ({
    captains: [],
    viceCaptains: [],
    awards: [],
    milestones: [50, 100, 150],
    milestoneWindow: 5
  });

  const fullSettingsForCurrentTeam = () => {
    const all = getTeamSettings();
    return {
      ...defaultSettingsForTeam(),
      ...(all[currentTeamId] || {})
    };
  };

  const renderAwardTypes = () => {
    const list = document.getElementById("awardTypesList");
    const empty = document.getElementById("awardTypesEmpty");
    if (!list || !empty) return;

    if (!workingAwards.length) {
      list.innerHTML = "";
      empty.classList.remove("hidden");
      return;
    }

    empty.classList.add("hidden");
    list.innerHTML = workingAwards.map((award, index) => `
      <div class="award-type-row" data-award-id="${award.id}">
        <div class="award-order">${index + 1}</div>
        <input class="award-name-input" data-award-name="${award.id}" value="${award.name.replace(/"/g, "&quot;")}">
        <div class="award-actions">
          <button class="small-icon-btn" data-award-up="${award.id}" ${index === 0 ? "disabled" : ""} aria-label="Move up">↑</button>
          <button class="small-icon-btn" data-award-down="${award.id}" ${index === workingAwards.length - 1 ? "disabled" : ""} aria-label="Move down">↓</button>
          <button class="small-icon-btn remove" data-award-remove="${award.id}" aria-label="Remove">×</button>
        </div>
      </div>
    `).join("");
  };

  const saveWorkingAwards = () => {
    if (!currentTeamId) return;
    const all = getTeamSettings();
    all[currentTeamId] = {
      ...defaultSettingsForTeam(),
      ...(all[currentTeamId] || {}),
      awards: workingAwards.map(a => ({ id: a.id, name: a.name.trim() })).filter(a => a.name),
      updatedAt: new Date().toISOString()
    };
    saveTeamSettings(all);
    document.getElementById("awardsSavedMessage")?.classList.remove("hidden");
  };

  document.querySelector("[data-add-award-type]")?.addEventListener("click", () => {
    const input = document.getElementById("newAwardNameInput");
    const name = input?.value.trim();
    if (!name) return alert("Enter an award name first.");

    if (workingAwards.some(a => a.name.toLowerCase() === name.toLowerCase())) {
      return alert("That award already exists.");
    }

    workingAwards.push({
      id: "award_" + Date.now(),
      name
    });

    if (input) input.value = "";
    renderAwardTypes();
    saveWorkingAwards();
  });

  document.getElementById("newAwardNameInput")?.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      document.querySelector("[data-add-award-type]")?.click();
    }
  });

  document.addEventListener("input", event => {
    const id = event.target?.dataset?.awardName;
    if (!id) return;
    const award = workingAwards.find(a => a.id === id);
    if (!award) return;
    award.name = event.target.value;
    document.getElementById("awardsSavedMessage")?.classList.add("hidden");
  });

  document.addEventListener("change", event => {
    const id = event.target?.dataset?.awardName;
    if (!id) return;
    saveWorkingAwards();
    renderAwardTypes();
  });

  document.addEventListener("click", event => {
    const remove = event.target.closest("[data-award-remove]");
    if (remove) {
      const award = workingAwards.find(a => a.id === remove.dataset.awardRemove);
      if (!award) return;
      if (!confirm(`Remove "${award.name}" from this team's awards?`)) return;
      workingAwards = workingAwards.filter(a => a.id !== award.id);
      renderAwardTypes();
      saveWorkingAwards();
      return;
    }

    const up = event.target.closest("[data-award-up]");
    if (up) {
      const index = workingAwards.findIndex(a => a.id === up.dataset.awardUp);
      if (index > 0) {
        [workingAwards[index - 1], workingAwards[index]] = [workingAwards[index], workingAwards[index - 1]];
        renderAwardTypes();
        saveWorkingAwards();
      }
      return;
    }

    const down = event.target.closest("[data-award-down]");
    if (down) {
      const index = workingAwards.findIndex(a => a.id === down.dataset.awardDown);
      if (index >= 0 && index < workingAwards.length - 1) {
        [workingAwards[index + 1], workingAwards[index]] = [workingAwards[index], workingAwards[index + 1]];
        renderAwardTypes();
        saveWorkingAwards();
      }
      return;
    }

    const milestone = event.target.closest("[data-milestone-value]");
    if (milestone) {
      const value = Number(milestone.dataset.milestoneValue);
      if (workingMilestones.includes(value)) {
        workingMilestones = workingMilestones.filter(v => v !== value);
      } else {
        workingMilestones = [...workingMilestones, value].sort((a,b) => a - b);
      }

      document.querySelectorAll("[data-milestone-value]").forEach(btn => {
        const v = Number(btn.dataset.milestoneValue);
        const selected = workingMilestones.includes(v);
        btn.classList.toggle("selected", selected);
        const check = btn.querySelector(".choice-check");
        if (check) check.textContent = selected ? "✓" : "";
      });

      document.getElementById("milestonesSavedMessage")?.classList.add("hidden");
    }
  });

  document.querySelector("[data-save-milestones]")?.addEventListener("click", () => {
    if (!currentTeamId) return;
    if (!workingMilestones.length) {
      return alert("Choose at least one milestone.");
    }

    const windowValue = Number(document.getElementById("milestoneWindowInput")?.value || 5);
    const all = getTeamSettings();
    all[currentTeamId] = {
      ...defaultSettingsForTeam(),
      ...(all[currentTeamId] || {}),
      milestones: [...workingMilestones],
      milestoneWindow: windowValue,
      updatedAt: new Date().toISOString()
    };
    saveTeamSettings(all);
    document.getElementById("milestonesSavedMessage")?.classList.remove("hidden");
  });

  const NEXT_GAME_KEY = "gdc_v2_demo_next_games";
  const GAMES_KEY = "gdc_v2_demo_games";

  const getNextGames = () => {
    try { return JSON.parse(localStorage.getItem(NEXT_GAME_KEY) || "{}"); }
    catch { return {}; }
  };

  const saveNextGames = data => localStorage.setItem(NEXT_GAME_KEY, JSON.stringify(data));

  const getAllCompletedGames = () => {
    try { return JSON.parse(localStorage.getItem(GAMES_KEY) || "[]"); }
    catch { return []; }
  };

  const saveAllCompletedGames = games =>
    localStorage.setItem(GAMES_KEY, JSON.stringify(games));

  const gamesForTeam = teamId =>
    getAllCompletedGames().filter(game => game.teamId === teamId);

  const nextGameForCurrentTeam = () => {
    const all = getNextGames();
    return all[currentTeamId] || null;
  };

  const formatGameDate = value => {
    if (!value) return "—";
    const date = new Date(value + "T12:00:00");
    return date.toLocaleDateString("en-AU", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const renderNextGameHome = () => {
    const game = nextGameForCurrentTeam();
    const live = typeof liveGameForCurrentTeam === "function" ? liveGameForCurrentTeam() : null;
    const heading = document.getElementById("nextGameHeading");
    const subtext = document.getElementById("nextGameSubtext");
    const details = document.getElementById("nextGameDetails");
    const dateBadge = document.getElementById("nextGameDateBadge");
    const setBtn = document.getElementById("setNextGameButton");
    const prepareBtn = document.getElementById("prepareGameButton");
    const editBtn = document.getElementById("editNextGameButton");

    if (!game) {
      heading.textContent = "Set up your next game";
      subtext.textContent = "Add the round and date so GameDay Crew is ready.";
      details?.classList.add("hidden");
      dateBadge?.classList.add("hidden");
      setBtn?.classList.remove("hidden");
      prepareBtn?.classList.add("hidden");
      editBtn?.classList.add("hidden");
      return;
    }

    heading.textContent = live ? `Round ${game.round} — Game in progress` : `Round ${game.round}`;
    subtext.textContent = live
      ? "Scoring is being saved as you go."
      : "Your next game is ready for game-day setup.";
    document.getElementById("nextGameRoundDisplay").textContent = `Round ${game.round}`;
    document.getElementById("nextGameDateDisplay").textContent = formatGameDate(game.date);

    const d = new Date(game.date + "T12:00:00");
    document.getElementById("nextGameDateDay").textContent = String(d.getDate());
    document.getElementById("nextGameDateMonth").textContent =
      d.toLocaleDateString("en-AU", {month: "short"}).toUpperCase();

    details?.classList.remove("hidden");
    dateBadge?.classList.remove("hidden");
    setBtn?.classList.add("hidden");
    prepareBtn?.classList.remove("hidden");
    if (prepareBtn) prepareBtn.textContent = live ? "Return to Live Game" : "Set Up Game Day";
    editBtn?.classList.toggle("hidden", Boolean(live));
  };

  const milestoneCardsForCurrentTeam = () => {
    const players = currentTeamId ? playersForTeam(currentTeamId) : [];
    const settings = fullSettingsForCurrentTeam();
    const milestones = [...(settings.milestones || [50, 100, 150])].sort((a, b) => a - b);
    const watch = Number(settings.milestoneWindow || 5);
    const cards = [];

    players.forEach(player => {
      const games = Number(player.careerGames || 0);
      for (const target of milestones) {
        const away = target - games;
        if (away >= 0 && away <= watch) {
          cards.push({player, target, away});
          break;
        }
      }
    });

    return cards.sort((a, b) =>
      a.away - b.away ||
      a.target - b.target ||
      a.player.name.localeCompare(b.player.name)
    );
  };

  const renderMilestoneWatchHome = () => {
    const cards = milestoneCardsForCurrentTeam();
    const list = document.getElementById("milestoneWatchList");
    const empty = document.getElementById("milestoneWatchEmpty");

    if (!cards.length) {
      list.innerHTML = "";
      empty?.classList.remove("hidden");
      return;
    }

    empty?.classList.add("hidden");
    list.innerHTML = cards.map(({player, target, away}) => `
      <div class="milestone-watch-card">
        <div class="milestone-watch-number">${target}</div>
        <div>
          <strong>${player.name}</strong>
          <small>${Number(player.careerGames || 0)} career games • ${target}-game milestone</small>
        </div>
        <span class="games-away-pill">
          ${away === 0 ? "Milestone game" : `${away} game${away === 1 ? "" : "s"} away`}
        </span>
      </div>
    `).join("");
  };

  const renderLeadershipHome = () => {
    const team = getCurrentTeam();
    if (!team) return;

    const title = document.getElementById("leadershipHomeTitle");
    const text = document.getElementById("leadershipHomeText");
    const chips = document.getElementById("leadershipHomeNames");
    chips.innerHTML = "";

    if (["U9", "U10", "U12"].includes(team.ageGroup)) {
      title.textContent = "Weekly rotating captains";
      text.textContent =
        "Choose captain(s) during game setup. Players yet to captain will be shown first.";
      chips.innerHTML =
        '<span class="leader-chip captain">🔄 Fairness tracking on</span>';
      return;
    }

    const settings = fullSettingsForCurrentTeam();
    const players = playersForTeam(currentTeamId);
    const captains = (settings.captains || [])
      .map(id => players.find(p => p.id === id))
      .filter(Boolean);
    const vice = (settings.viceCaptains || [])
      .map(id => players.find(p => p.id === id))
      .filter(Boolean);

    title.textContent = "Season leadership";

    if (!captains.length && !vice.length) {
      text.textContent = "No Captains or Vice Captains have been set yet.";
      chips.innerHTML = '<span class="leader-chip">Set in Team Settings</span>';
      return;
    }

    text.textContent = "Leadership is set for the season.";
    chips.innerHTML = [
      ...captains.map(p => `<span class="leader-chip captain">C • ${p.name}</span>`),
      ...vice.map(p => `<span class="leader-chip">VC • ${p.name}</span>`)
    ].join("");
  };

  const renderAwardsHome = () => {
    const settings = fullSettingsForCurrentTeam();
    const awards = settings.awards || [];
    const list = document.getElementById("homeAwardsList");
    const empty = document.getElementById("homeAwardsEmpty");

    document.getElementById("homeAwardTypeCount").textContent = String(awards.length);

    if (!awards.length) {
      list.innerHTML = "";
      empty?.classList.remove("hidden");
      return;
    }

    empty?.classList.add("hidden");
    list.innerHTML = awards.map((award, index) =>
      `<span class="award-home-chip">🏆 ${index + 1}. ${award.name}</span>`
    ).join("");
  };

  const renderTeamHome = () => {
    const team = getCurrentTeam();
    if (!team) return;

    document.getElementById("teamHomeNotice")?.classList.add("hidden");

    document.getElementById("teamHomeBadge").textContent = team.ageGroup || "TEAM";
    document.getElementById("teamHomeName").textContent = team.name;

    const club = (() => {
      try { return JSON.parse(localStorage.getItem("gdc_v2_demo_club") || "{}"); }
      catch { return {}; }
    })();

    const metaBits = [team.ageGroup, team.category];
    if (team.division) metaBits.push(team.division);
    metaBits.push(`Season ${club.season || 2027}`);
    document.getElementById("teamHomeMeta").textContent = metaBits.filter(Boolean).join(" • ");

    const players = playersForTeam(currentTeamId);
    const nextGame = nextGameForCurrentTeam();

    document.getElementById("homePlayerCount").textContent = String(players.length);
    document.getElementById("homeGamesCount").textContent =
      String(gamesForTeam(currentTeamId).length);
    document.getElementById("homeReadyStatus").textContent =
      nextGame && players.length ? "Yes" : "No";

    renderNextGameHome();
    renderMilestoneWatchHome();
    renderLeadershipHome();
    renderGoldenBootHome();
    renderAwardsHome();
  };

  document.querySelector("[data-open-team-home]")?.addEventListener("click", () => {
    renderTeamHome();
    showScreen("teamHomeScreen");
  });

  document.querySelector("[data-back-team-admin-from-home]")?.addEventListener("click", () => {
    renderTeamAdmin();
    showScreen("teamAdminScreen");
  });

  const openNextGameForm = () => {
    const existing = nextGameForCurrentTeam();
    document.getElementById("nextRoundInput").value = existing?.round || "";
    document.getElementById("nextGameDateInput").value = existing?.date || "";
    document.getElementById("nextGameSetupPanel")?.classList.remove("hidden");
    document.getElementById("setNextGameButton")?.classList.add("hidden");
    document.getElementById("prepareGameButton")?.classList.add("hidden");
    document.getElementById("editNextGameButton")?.classList.add("hidden");
  };

  document.querySelector("[data-show-next-game-form]")?.addEventListener("click", openNextGameForm);
  document.querySelector("[data-edit-next-game]")?.addEventListener("click", openNextGameForm);

  document.querySelector("[data-cancel-next-game]")?.addEventListener("click", () => {
    document.getElementById("nextGameSetupPanel")?.classList.add("hidden");
    renderNextGameHome();
  });

  document.querySelector("[data-save-next-game]")?.addEventListener("click", () => {
    if (!currentTeamId) return;

    const round = Number(document.getElementById("nextRoundInput")?.value || 0);
    const date = document.getElementById("nextGameDateInput")?.value;

    if (!round || round < 1) return alert("Enter the round number.");
    if (!date) return alert("Choose the game date.");

    const all = getNextGames();
    all[currentTeamId] = {
      teamId: currentTeamId,
      round,
      date,
      updatedAt: new Date().toISOString()
    };
    saveNextGames(all);

    document.getElementById("nextGameSetupPanel")?.classList.add("hidden");
    renderTeamHome();
  });

  document.querySelector("[data-prepare-game]")?.addEventListener("click", () => {
    openGameSetup();
  });


  let managerProfilePlayerId = null;

  const completedStatForPlayer = (game, playerId) => {
    const recorded = (game.playerStats || []).find(stat => stat.playerId === playerId);
    if (recorded) {
      return {
        goals: Number(recorded.goals || 0),
        points: Number(recorded.points || 0),
        score: Number(recorded.score || 0)
      };
    }

    const legacy = game.scoring?.[playerId];
    if (legacy) {
      const goals = Number(legacy.goals || 0);
      const points = Number(legacy.points || 0);
      return {goals, points, score: goals * 6 + points};
    }

    return null;
  };

  const seasonStatsForPlayer = playerId => {
    const games = gamesForTeam(currentTeamId);
    let seasonGames = 0;
    let goals = 0;
    let points = 0;
    let awards = 0;

    games.forEach(game => {
      const stat = completedStatForPlayer(game, playerId);
      if (stat) {
        seasonGames += 1;
        goals += stat.goals;
        points += stat.points;
      }

      awards += (game.awards || []).filter(award =>
        award.playerId === playerId && award.given !== false
      ).length;
    });

    return {
      seasonGames,
      goals,
      points,
      score: goals * 6 + points,
      awards
    };
  };


  const currentGoldenBoot = () => {
    const players = [...playersForTeam(currentTeamId)];
    const ranked = players.map(player => ({
      player,
      goals: seasonStatsForPlayer(player.id).goals
    }));

    const leadingGoals = ranked.reduce((max, item) =>
      Math.max(max, Number(item.goals || 0))
    , 0);

    if (leadingGoals <= 0) {
      return {goals: 0, leaders: []};
    }

    return {
      goals: leadingGoals,
      leaders: ranked
        .filter(item => Number(item.goals || 0) === leadingGoals)
        .sort((a, b) =>
          Number(a.player.number || 999) - Number(b.player.number || 999) ||
          a.player.name.localeCompare(b.player.name)
        )
        .map(item => item.player)
    };
  };

  const goldenBootLeaderHtml = (result, large = false) => {
    if (!result.leaders.length) {
      return `<span class="golden-boot-empty">No goals recorded yet.</span>`;
    }

    return result.leaders.map(player => `
      <span class="golden-boot-chip${large ? " golden-boot-chip-large" : ""}">
        <span class="golden-boot-number">${player.number || "—"}</span>
        <span>${player.name}</span>
        <small>${result.goals} goal${result.goals === 1 ? "" : "s"}</small>
      </span>
    `).join("");
  };

  const renderGoldenBootHome = () => {
    const result = currentGoldenBoot();
    const text = document.getElementById("goldenBootHomeText");
    const wrap = document.getElementById("goldenBootHomeLeaders");

    if (!text || !wrap) return;

    if (!result.leaders.length) {
      text.textContent = "No Golden Boot leader yet — goals will appear after completed games.";
      wrap.innerHTML = goldenBootLeaderHtml(result);
      return;
    }

    text.textContent = result.leaders.length > 1
      ? `Joint leaders on ${result.goals} goal${result.goals === 1 ? "" : "s"}.`
      : `Leading goal kicker with ${result.goals} goal${result.goals === 1 ? "" : "s"}.`;
    wrap.innerHTML = goldenBootLeaderHtml(result);
  };

  const leadershipLabelForPlayer = playerId => {
    const team = getCurrentTeam();
    if (!team) return "Team member";

    if (["U9", "U10", "U12"].includes(team.ageGroup)) {
      const turns = captainCountForPlayer(playerId);
      return turns
        ? `${turns} captain turn${turns === 1 ? "" : "s"} this season`
        : "Yet to captain this season";
    }

    const settings = fullSettingsForCurrentTeam();
    if ((settings.captains || []).includes(playerId)) return "Season Captain";
    if ((settings.viceCaptains || []).includes(playerId)) return "Season Vice Captain";
    return "Team member";
  };

  const renderManagerTeam = () => {
    const team = getCurrentTeam();
    if (!team) return;

    const players = [...playersForTeam(currentTeamId)].sort((a, b) =>
      Number(a.number || 999) - Number(b.number || 999) ||
      a.name.localeCompare(b.name)
    );
    const games = gamesForTeam(currentTeamId);
    const totalScore = games.reduce((sum, game) =>
      sum + Number(game.teamScore || 0)
    , 0);
    const awardsGiven = games.reduce((sum, game) =>
      sum + (game.awards || []).filter(award => award.playerId && award.given !== false).length
    , 0);

    document.getElementById("managerTeamBadge").textContent = team.ageGroup || "TEAM";
    document.getElementById("managerTeamName").textContent = team.name;

    const club = (() => {
      try { return JSON.parse(localStorage.getItem("gdc_v2_demo_club") || "{}"); }
      catch { return {}; }
    })();
    const bits = [team.ageGroup, team.category];
    if (team.division) bits.push(team.division);
    bits.push(`Season ${club.season || 2027}`);
    document.getElementById("managerTeamMeta").textContent = bits.filter(Boolean).join(" • ");

    document.getElementById("managerTeamPlayerCount").textContent = String(players.length);
    document.getElementById("managerTeamGamesCount").textContent = String(games.length);
    document.getElementById("managerTeamScoreTotal").textContent = String(totalScore);
    document.getElementById("managerTeamAwardsCount").textContent = String(awardsGiven);

    const list = document.getElementById("managerTeamPlayerList");
    const empty = document.getElementById("managerTeamEmpty");

    if (!players.length) {
      list.innerHTML = "";
      empty?.classList.remove("hidden");
      return;
    }

    empty?.classList.add("hidden");

    list.innerHTML = players.map(player => {
      const stats = seasonStatsForPlayer(player.id);
      const leadership = leadershipLabelForPlayer(player.id);

      return `
        <button class="manager-player-card" data-manager-player-id="${player.id}">
          <div class="player-number">${player.number || "—"}</div>
          <div>
            <strong>${player.name}</strong>
            <small>${Number(player.careerGames || 0)} career games • ${leadership}</small>
            <div class="manager-player-mini-stats">
              <span class="manager-player-mini-stat">🏉 ${stats.seasonGames} games</span>
              <span class="manager-player-mini-stat">🥅 ${stats.goals} G</span>
              <span class="manager-player-mini-stat">• ${stats.points} P</span>
              <span class="manager-player-mini-stat">🏆 ${stats.awards}</span>
            </div>
          </div>
          <span class="manager-player-arrow">›</span>
        </button>
      `;
    }).join("");
  };

  const openManagerTeam = () => {
    renderManagerTeam();
    showScreen("managerTeamScreen");
  };

  const playerAwardHistory = playerId => {
    const counts = new Map();

    gamesForTeam(currentTeamId).forEach(game => {
      (game.awards || []).forEach(award => {
        if (award.playerId !== playerId || award.given === false) return;
        const key = award.awardName || "Award";
        counts.set(key, (counts.get(key) || 0) + 1);
      });
    });

    return [...counts.entries()]
      .map(([name, count]) => ({name, count}))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  };

  const gamesForPlayer = playerId => {
    return gamesForTeam(currentTeamId)
      .map(game => ({game, stat: completedStatForPlayer(game, playerId)}))
      .filter(item => item.stat)
      .sort((a, b) => {
        const dateCompare = String(b.game.date || "").localeCompare(String(a.game.date || ""));
        if (dateCompare) return dateCompare;
        return Number(b.game.round || 0) - Number(a.game.round || 0);
      });
  };

  const renderManagerPlayerProfile = playerId => {
    const player = getAllPlayers().find(item =>
      item.id === playerId && item.teamId === currentTeamId
    );
    if (!player) return;

    managerProfilePlayerId = player.id;

    const stats = seasonStatsForPlayer(player.id);
    const awards = playerAwardHistory(player.id);
    const history = gamesForPlayer(player.id);

    document.getElementById("profilePlayerNumber").textContent = player.number || "—";
    document.getElementById("profilePlayerName").textContent = player.name;
    document.getElementById("profilePlayerLeadership").textContent =
      leadershipLabelForPlayer(player.id);

    document.getElementById("profileCareerGames").textContent =
      String(Number(player.careerGames || 0));
    document.getElementById("profileSeasonGames").textContent =
      String(stats.seasonGames);
    document.getElementById("profileSeasonGoals").textContent =
      String(stats.goals);
    document.getElementById("profileSeasonPoints").textContent =
      String(stats.points);
    document.getElementById("profileSeasonScore").textContent =
      String(stats.score);
    document.getElementById("profileAwardCount").textContent =
      String(stats.awards);

    const awardWrap = document.getElementById("profileAwardHistory");
    const noAwards = document.getElementById("profileNoAwards");

    if (!awards.length) {
      awardWrap.innerHTML = "";
      noAwards?.classList.remove("hidden");
    } else {
      noAwards?.classList.add("hidden");
      awardWrap.innerHTML = awards.map(award => `
        <div class="profile-award-card">
          <div class="profile-award-icon">🏆</div>
          <div>
            <strong>${award.name}</strong>
            <small>Received ${award.count} time${award.count === 1 ? "" : "s"} this season</small>
          </div>
          <span class="profile-award-count">${award.count}</span>
        </div>
      `).join("");
    }

    const gameWrap = document.getElementById("profileGameHistory");
    const noGames = document.getElementById("profileNoGames");

    if (!history.length) {
      gameWrap.innerHTML = "";
      noGames?.classList.remove("hidden");
    } else {
      noGames?.classList.add("hidden");
      gameWrap.innerHTML = history.map(({game, stat}) => {
        const wonAwards = (game.awards || []).filter(award =>
          award.playerId === player.id && award.given !== false
        );
        const awardHtml = wonAwards.length
          ? `<div class="profile-game-awards">${
              wonAwards.map(award =>
                `<span class="profile-game-award-chip">🏆 ${award.awardName}</span>`
              ).join("")
            }</div>`
          : "";

        return `
          <div class="profile-game-card">
            <div class="profile-game-round">
              <strong>R${game.round || "—"}</strong>
              <small>${game.date ? new Date(game.date + "T12:00:00").toLocaleDateString("en-AU", {day:"numeric", month:"short"}) : "—"}</small>
            </div>
            <div>
              <strong>${stat.goals} goal${stat.goals === 1 ? "" : "s"} • ${stat.points} point${stat.points === 1 ? "" : "s"}</strong>
              <small>Team score ${Number(game.teamScore || 0)}</small>
              ${awardHtml}
            </div>
            <div class="profile-game-score">
              <strong>${stat.score}</strong>
              <small>player score</small>
            </div>
          </div>
        `;
      }).join("");
    }
  };

  const openManagerPlayerProfile = playerId => {
    renderManagerPlayerProfile(playerId);
    showScreen("managerPlayerProfileScreen");
  };


  const managerSeasonMeta = team => {
    const club = (() => {
      try { return JSON.parse(localStorage.getItem("gdc_v2_demo_club") || "{}"); }
      catch { return {}; }
    })();

    const bits = [team?.ageGroup, team?.category];
    if (team?.division) bits.push(team.division);
    bits.push(`Season ${club.season || 2027}`);
    return bits.filter(Boolean).join(" • ");
  };

  const completedGamesSorted = () =>
    [...gamesForTeam(currentTeamId)].sort((a, b) => {
      const dateCompare = String(b.date || "").localeCompare(String(a.date || ""));
      if (dateCompare) return dateCompare;
      return Number(b.round || 0) - Number(a.round || 0);
    });


  let managerReviewGameId = null;
  let managerReviewEditMode = false;
  let managerReviewDraft = null;

  const completedGameById = gameId =>
    getAllCompletedGames().find(game =>
      game.id === gameId && game.teamId === currentTeamId
    );

  const gameRosterSnapshot = game => {
    const byId = new Map();

    (game.rosterSnapshot || []).forEach(item => {
      if (!item?.playerId) return;
      byId.set(item.playerId, {
        playerId: item.playerId,
        playerName: item.playerName || "Player",
        number: item.number || null
      });
    });

    (game.playerStats || []).forEach(stat => {
      if (!stat?.playerId || byId.has(stat.playerId)) return;
      byId.set(stat.playerId, {
        playerId: stat.playerId,
        playerName: stat.playerName || "Player",
        number: stat.number || null
      });
    });

    playersForTeam(currentTeamId).forEach(player => {
      if (byId.has(player.id)) return;
      byId.set(player.id, {
        playerId: player.id,
        playerName: player.name,
        number: player.number || null
      });
    });

    return [...byId.values()].sort((a, b) =>
      Number(a.number || 999) - Number(b.number || 999) ||
      a.playerName.localeCompare(b.playerName)
    );
  };

  const participantIdsForGame = game => {
    if (Array.isArray(game.participantIds)) {
      return new Set(game.participantIds.filter(Boolean));
    }

    if ((game.playerStats || []).length) {
      return new Set(
        game.playerStats
          .map(stat => stat.playerId)
          .filter(Boolean)
      );
    }

    return new Set(Object.keys(game.scoring || {}));
  };

  const reviewGameParticipants = game => {
    const playerMap = new Map(
      gameRosterSnapshot(game).map(item => [item.playerId, item])
    );
    const participants = participantIdsForGame(game);

    const recordedMap = new Map(
      (game.playerStats || []).map(stat => [stat.playerId, stat])
    );

    return [...participants].map(playerId => {
      const recorded = recordedMap.get(playerId);
      const legacy = game.scoring?.[playerId] || {};
      const snapshot = playerMap.get(playerId) || {};
      const goals = Math.max(
        0,
        Number(recorded?.goals ?? legacy.goals ?? 0)
      );
      const points = Math.max(
        0,
        Number(recorded?.points ?? legacy.points ?? 0)
      );

      return {
        playerId,
        playerName:
          recorded?.playerName ||
          snapshot.playerName ||
          "Player",
        number:
          recorded?.number ||
          snapshot.number ||
          null,
        goals,
        points,
        score: goals * 6 + points
      };
    });
  };

  const normaliseReviewDraft = game => {
    const draft = JSON.parse(JSON.stringify(game));
    draft.rosterSnapshot = gameRosterSnapshot(draft);

    const participants = participantIdsForGame(draft);
    const recorded = new Map(
      reviewGameParticipants(draft).map(stat => [stat.playerId, stat])
    );

    draft.participantIds = draft.rosterSnapshot
      .map(item => item.playerId)
      .filter(playerId => participants.has(playerId));

    draft.playerStats = draft.participantIds.map(playerId => {
      const snapshot = draft.rosterSnapshot.find(item =>
        item.playerId === playerId
      ) || {};
      const stat = recorded.get(playerId) || {};
      const goals = Math.max(0, Number(stat.goals || 0));
      const points = Math.max(0, Number(stat.points || 0));

      return {
        playerId,
        playerName: stat.playerName || snapshot.playerName || "Player",
        number: stat.number || snapshot.number || null,
        goals,
        points,
        score: goals * 6 + points
      };
    });

    draft.scoring = {};
    draft.playerStats.forEach(stat => {
      draft.scoring[stat.playerId] = {
        goals: stat.goals,
        points: stat.points
      };
    });

    draft.teamGoals = draft.playerStats.reduce(
      (sum, stat) => sum + stat.goals,
      0
    );
    draft.teamPoints = draft.playerStats.reduce(
      (sum, stat) => sum + stat.points,
      0
    );
    draft.teamScore = draft.teamGoals * 6 + draft.teamPoints;

    const participantSet = new Set(draft.participantIds);

    draft.captainIds = (draft.captainIds || []).filter(playerId =>
      participantSet.has(playerId)
    );

    if (draft.interchange) {
      Object.values(draft.interchange).forEach(quarter => {
        Object.keys(quarter || {}).forEach(playerId => {
          if (!participantSet.has(playerId)) {
            delete quarter[playerId];
          }
        });
      });
    }

    draft.awards = (draft.awards || []).map(award => {
      const validRecipient =
        award.playerId && participantSet.has(award.playerId);

      return {
        ...award,
        playerId: validRecipient ? award.playerId : null,
        playerName: validRecipient ? (award.playerName || null) : null,
        given: Boolean(validRecipient)
      };
    });

    return draft;
  };

  const reviewParticipationDelta = (original, corrected) => {
    const before = participantIdsForGame(original);
    const after = participantIdsForGame(corrected);

    return {
      removed: [...before].filter(playerId => !after.has(playerId)),
      added: [...after].filter(playerId => !before.has(playerId))
    };
  };

  const renderManagerGameReview = () => {
    const original = completedGameById(managerReviewGameId);
    if (!original) {
      renderManagerStats();
      showScreen("managerStatsScreen");
      return;
    }

    const game = managerReviewEditMode && managerReviewDraft
      ? normaliseReviewDraft(managerReviewDraft)
      : normaliseReviewDraft(original);

    if (managerReviewEditMode) managerReviewDraft = game;

    const team = getCurrentTeam();
    document.getElementById("reviewGameTeamBadge").textContent =
      team?.ageGroup || "TEAM";
    document.getElementById("reviewGameTitle").textContent =
      `Round ${game.round || "—"}`;
    document.getElementById("reviewGameDate").textContent =
      formatGameDate(game.date);
    document.getElementById("reviewGameTeamName").textContent =
      game.teamName || team?.name || "Team";
    document.getElementById("reviewGameScoreBreakdown").textContent =
      `${game.teamGoals} goal${game.teamGoals === 1 ? "" : "s"} • ` +
      `${game.teamPoints} point${game.teamPoints === 1 ? "" : "s"}`;
    document.getElementById("reviewGameTeamScore").textContent =
      String(game.teamScore);

    const participantSet = new Set(game.participantIds || []);
    const statsById = new Map(
      (game.playerStats || []).map(stat => [stat.playerId, stat])
    );
    const originalParticipants = participantIdsForGame(original);
    const originalStats = new Map(
      reviewGameParticipants(original).map(stat => [stat.playerId, stat])
    );

    const playerWrap = document.getElementById("reviewGamePlayerStats");

    playerWrap.innerHTML = game.rosterSnapshot.map(snapshot => {
      const playing = participantSet.has(snapshot.playerId);
      const stat = statsById.get(snapshot.playerId) || {
        playerId: snapshot.playerId,
        playerName: snapshot.playerName,
        number: snapshot.number,
        goals: 0,
        points: 0,
        score: 0
      };

      if (managerReviewEditMode) {
        const wasPlaying = originalParticipants.has(snapshot.playerId);
        const participationChange = playing !== wasPlaying
          ? `<span class="review-participation-warning">${
              playing ? "Will add 1 career game when saved." : "Will remove 1 career game when saved."
            }</span>`
          : "";

        return `
          <div class="review-player-stat-row ${playing ? "" : "did-not-play"}">
            <div class="review-player-number">${snapshot.number || "—"}</div>
            <div class="review-player-copy">
              <strong>${snapshot.playerName}</strong>
              <small>${playing ? `${stat.score} player points` : "Not counted as playing this game"}</small>
              ${participationChange}
            </div>

            <div class="review-player-edit-controls ${playing ? "" : "disabled"}">
              <div class="review-number-field">
                <label>Goals</label>
                <input type="number" min="0" step="1"
                  value="${playing ? stat.goals : 0}"
                  ${playing ? "" : "disabled"}
                  data-review-player-id="${snapshot.playerId}"
                  data-review-stat-field="goals">
              </div>
              <div class="review-number-field">
                <label>Points</label>
                <input type="number" min="0" step="1"
                  value="${playing ? stat.points : 0}"
                  ${playing ? "" : "disabled"}
                  data-review-player-id="${snapshot.playerId}"
                  data-review-stat-field="points">
              </div>
            </div>

            <label class="review-participation-control ${playing ? "playing" : ""}">
              <input type="checkbox"
                data-review-participation-id="${snapshot.playerId}"
                ${playing ? "checked" : ""}>
              <span>
                <strong>Counted as playing this game</strong>
                <small>${playing
                  ? "Counts toward season games and career games."
                  : "Does not count toward season or career games."
                }</small>
              </span>
            </label>
          </div>
        `;
      }

      return `
        <div class="review-player-stat-row ${playing ? "" : "did-not-play"}">
          <div class="review-player-number">${snapshot.number || "—"}</div>
          <div class="review-player-copy">
            <strong>${snapshot.playerName}</strong>
            <small>${playing
              ? `${stat.goals} goal${stat.goals === 1 ? "" : "s"} • ${stat.points} point${stat.points === 1 ? "" : "s"}`
              : "Did not play"
            }</small>
          </div>
          ${playing
            ? `<div class="review-player-score">
                <strong>${stat.score}</strong>
                <span>player score</span>
              </div>`
            : `<span class="review-participation-badge out">DID NOT PLAY</span>`
          }
        </div>
      `;
    }).join("");

    const playingCount = participantSet.size;
    const totalOnSnapshot = game.rosterSnapshot.length;
    if (totalOnSnapshot) {
      playerWrap.insertAdjacentHTML(
        "beforeend",
        `<p class="review-participation-summary">${playingCount} of ${totalOnSnapshot} player${totalOnSnapshot === 1 ? "" : "s"} counted as playing this game.</p>`
      );
    }

    const awardWrap = document.getElementById("reviewGameAwards");
    const participantOptions = game.rosterSnapshot
      .filter(snapshot => participantSet.has(snapshot.playerId));

    if (!(game.awards || []).length) {
      awardWrap.innerHTML = `
        <div class="soft-empty">
          <span>🏆</span>
          <strong>No awards were configured for this game</strong>
          <small>There are no saved award outcomes to edit.</small>
        </div>
      `;
    } else {
      awardWrap.innerHTML = game.awards.map(award => {
        if (!managerReviewEditMode) {
          return `
            <div class="review-award-row">
              <div class="review-award-icon">🏆</div>
              <div>
                <strong>${award.awardName}</strong>
                <small>${award.playerId ? "Recipient saved for this game" : "Recorded as not given"}</small>
              </div>
              <span class="review-award-result">${award.playerName || "No award this game"}</span>
            </div>
          `;
        }

        const options = [
          `<option value="">No award this game</option>`,
          ...participantOptions.map(snapshot =>
            `<option value="${snapshot.playerId}" ${award.playerId === snapshot.playerId ? "selected" : ""}>${snapshot.playerName}</option>`
          )
        ].join("");

        return `
          <div class="review-award-row">
            <div class="review-award-icon">🏆</div>
            <div>
              <strong>${award.awardName}</strong>
              <small>Only players counted as playing can receive this award.</small>
            </div>
            <select data-review-award-id="${award.awardId}">
              ${options}
            </select>
          </div>
        `;
      }).join("");
    }

    document.getElementById("reviewGameEditButton")?.classList.toggle(
      "hidden",
      managerReviewEditMode
    );
    document.getElementById("reviewGameEditActions")?.classList.toggle(
      "hidden",
      !managerReviewEditMode
    );
  };

  const openManagerCompletedGame = gameId => {
    managerReviewGameId = gameId;
    managerReviewEditMode = false;
    managerReviewDraft = null;
    document.getElementById("reviewGameNotice")?.classList.add("hidden");
    renderManagerGameReview();
    showScreen("managerGameReviewScreen");
  };

  document.addEventListener("click", event => {
    const gameCard = event.target.closest("[data-completed-game-id]");
    if (!gameCard) return;
    openManagerCompletedGame(gameCard.dataset.completedGameId);
  });

  document.querySelector("[data-back-game-review-stats]")?.addEventListener("click", () => {
    managerReviewGameId = null;
    managerReviewEditMode = false;
    managerReviewDraft = null;
    renderManagerStats();
    showScreen("managerStatsScreen");
  });

  document.querySelector("[data-edit-completed-game]")?.addEventListener("click", () => {
    const game = completedGameById(managerReviewGameId);
    if (!game) return;
    managerReviewDraft = normaliseReviewDraft(game);
    managerReviewEditMode = true;
    document.getElementById("reviewGameNotice")?.classList.add("hidden");
    renderManagerGameReview();
  });

  document.querySelector("[data-cancel-completed-game-edit]")?.addEventListener("click", () => {
    managerReviewEditMode = false;
    managerReviewDraft = null;
    renderManagerGameReview();
  });

  document.addEventListener("change", event => {
    const input = event.target.closest(
      "[data-review-player-id][data-review-stat-field]"
    );
    if (!input || !managerReviewEditMode || !managerReviewDraft) return;

    const stat = managerReviewDraft.playerStats.find(item =>
      item.playerId === input.dataset.reviewPlayerId
    );
    if (!stat) return;

    stat[input.dataset.reviewStatField] = Math.max(
      0,
      Number(input.value || 0)
    );
    managerReviewDraft = normaliseReviewDraft(managerReviewDraft);
    renderManagerGameReview();
  });

  document.addEventListener("change", event => {
    const toggle = event.target.closest("[data-review-participation-id]");
    if (!toggle || !managerReviewEditMode || !managerReviewDraft) return;

    const playerId = toggle.dataset.reviewParticipationId;
    const snapshot = managerReviewDraft.rosterSnapshot.find(item =>
      item.playerId === playerId
    );
    if (!snapshot) return;

    const participantSet = new Set(managerReviewDraft.participantIds || []);
    const currentlyPlaying = participantSet.has(playerId);
    const shouldPlay = Boolean(toggle.checked);

    if (currentlyPlaying === shouldPlay) return;

    if (!shouldPlay) {
      const stat = managerReviewDraft.playerStats.find(item =>
        item.playerId === playerId
      );
      const assignedAwards = (managerReviewDraft.awards || []).filter(
        award => award.playerId === playerId
      );
      const hasScoring = Number(stat?.goals || 0) > 0 ||
        Number(stat?.points || 0) > 0;

      if ((hasScoring || assignedAwards.length) && !confirm(
        `${snapshot.playerName} has ${
          hasScoring ? "saved scoring" : "no saved scoring"
        }${assignedAwards.length ? ` and ${assignedAwards.length} award assignment${assignedAwards.length === 1 ? "" : "s"}` : ""}. ` +
        "Marking them as Did Not Play will clear their scoring and any awards from this game. Continue?"
      )) {
        toggle.checked = true;
        return;
      }

      participantSet.delete(playerId);
      managerReviewDraft.participantIds = [...participantSet];

      managerReviewDraft.playerStats = managerReviewDraft.playerStats.filter(
        item => item.playerId !== playerId
      );
      delete managerReviewDraft.scoring?.[playerId];

      managerReviewDraft.captainIds = (
        managerReviewDraft.captainIds || []
      ).filter(id => id !== playerId);

      if (managerReviewDraft.interchange) {
        Object.values(managerReviewDraft.interchange).forEach(quarter => {
          if (quarter) delete quarter[playerId];
        });
      }

      managerReviewDraft.awards = (managerReviewDraft.awards || []).map(
        award => award.playerId === playerId
          ? {
              ...award,
              playerId: null,
              playerName: null,
              given: false
            }
          : award
      );
    } else {
      participantSet.add(playerId);
      managerReviewDraft.participantIds = [...participantSet];

      if (!managerReviewDraft.playerStats.some(
        item => item.playerId === playerId
      )) {
        managerReviewDraft.playerStats.push({
          playerId,
          playerName: snapshot.playerName,
          number: snapshot.number || null,
          goals: 0,
          points: 0,
          score: 0
        });
      }

      if (!managerReviewDraft.scoring) {
        managerReviewDraft.scoring = {};
      }
      managerReviewDraft.scoring[playerId] = {
        goals: 0,
        points: 0
      };
    }

    managerReviewDraft = normaliseReviewDraft(managerReviewDraft);
    renderManagerGameReview();
  });

  document.addEventListener("change", event => {
    const select = event.target.closest("[data-review-award-id]");
    if (!select || !managerReviewEditMode || !managerReviewDraft) return;

    const award = managerReviewDraft.awards.find(item =>
      item.awardId === select.dataset.reviewAwardId
    );
    if (!award) return;

    const playerId = select.value || null;
    const participantSet = new Set(
      managerReviewDraft.participantIds || []
    );

    if (playerId && !participantSet.has(playerId)) {
      renderManagerGameReview();
      return;
    }

    const snapshot = managerReviewDraft.rosterSnapshot.find(item =>
      item.playerId === playerId
    );

    award.playerId = playerId;
    award.playerName = snapshot?.playerName || null;
    award.given = Boolean(playerId);

    renderManagerGameReview();
  });

  document.querySelector("[data-save-completed-game-edit]")?.addEventListener("click", () => {
    if (!managerReviewDraft || !managerReviewGameId) return;

    const corrected = normaliseReviewDraft(managerReviewDraft);

    const allGames = getAllCompletedGames();
    const index = allGames.findIndex(game =>
      game.id === managerReviewGameId && game.teamId === currentTeamId
    );
    if (index < 0) return;

    const original = allGames[index];
    const delta = reviewParticipationDelta(original, corrected);
    const participationChanges = delta.removed.length + delta.added.length;

    const participationMessage = participationChanges
      ? ` Participation changes will adjust career games for ${participationChanges} player${participationChanges === 1 ? "" : "s"} exactly once.`
      : " Career games will be unchanged.";

    if (!confirm(
      `Save corrections to Round ${corrected.round}? Season stats, awards, Golden Boot and reports will update.${participationMessage}`
    )) return;

    if (participationChanges) {
      const removedSet = new Set(delta.removed);
      const addedSet = new Set(delta.added);

      const adjustedPlayers = getAllPlayers().map(player => {
        if (player.teamId !== currentTeamId) return player;

        if (removedSet.has(player.id)) {
          return {
            ...player,
            careerGames: Math.max(
              0,
              Number(player.careerGames || 0) - 1
            )
          };
        }

        if (addedSet.has(player.id)) {
          return {
            ...player,
            careerGames:
              Number(player.careerGames || 0) + 1
          };
        }

        return player;
      });

      saveAllPlayers(adjustedPlayers);
    }

    corrected.correctedAt = new Date().toISOString();
    corrected.correctedCount =
      Number(original.correctedCount || 0) + 1;
    corrected.participationCorrected =
      Boolean(
        original.participationCorrected ||
        participationChanges
      );
    allGames[index] = corrected;
    saveAllCompletedGames(allGames);

    managerReviewDraft = null;
    managerReviewEditMode = false;

    const notice = document.getElementById("reviewGameNotice");
    if (notice) {
      const careerText = participationChanges
        ? `Career games adjusted for ${participationChanges} player${participationChanges === 1 ? "" : "s"}`
        : "Career games unchanged";

      notice.textContent =
        `✓ Corrections saved • Season stats, awards, Golden Boot and reports updated • ${careerText}`;
      notice.classList.remove("hidden");
    }

    renderManagerGameReview();
  });

  const renderManagerStats = () => {
    const team = getCurrentTeam();
    if (!team) return;

    const games = completedGamesSorted();
    const players = [...playersForTeam(currentTeamId)].sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    const totals = games.reduce((sum, game) => {
      sum.goals += Number(game.teamGoals || 0);
      sum.points += Number(game.teamPoints || 0);
      sum.score += Number(game.teamScore || 0);
      return sum;
    }, {goals: 0, points: 0, score: 0});

    document.getElementById("statsTeamBadge").textContent = team.ageGroup || "TEAM";
    document.getElementById("statsTeamName").textContent = `${team.name} Stats`;
    document.getElementById("statsTeamMeta").textContent = managerSeasonMeta(team);
    document.getElementById("statsGamesTotal").textContent = String(games.length);
    document.getElementById("statsGoalsTotal").textContent = String(totals.goals);
    document.getElementById("statsPointsTotal").textContent = String(totals.points);
    document.getElementById("statsScoreTotal").textContent = String(totals.score);

    const goldenBoot = currentGoldenBoot();
    const statsGoldenBootText = document.getElementById("statsGoldenBootText");
    const statsGoldenBootLeaders = document.getElementById("statsGoldenBootLeaders");

    if (statsGoldenBootText && statsGoldenBootLeaders) {
      if (!goldenBoot.leaders.length) {
        statsGoldenBootText.textContent =
          "No Golden Boot leader yet — goals will appear after completed games.";
      } else {
        statsGoldenBootText.textContent = goldenBoot.leaders.length > 1
          ? `Joint leaders on ${goldenBoot.goals} goal${goldenBoot.goals === 1 ? "" : "s"}.`
          : `Leading goal kicker with ${goldenBoot.goals} goal${goldenBoot.goals === 1 ? "" : "s"}.`;
      }
      statsGoldenBootLeaders.innerHTML = goldenBootLeaderHtml(goldenBoot, true);
    }

    const leaderboard = players
      .map(player => ({player, stats: seasonStatsForPlayer(player.id)}))
      .filter(item =>
        item.stats.seasonGames > 0 ||
        item.stats.goals > 0 ||
        item.stats.points > 0 ||
        item.stats.awards > 0
      )
      .sort((a, b) =>
        b.stats.score - a.stats.score ||
        b.stats.goals - a.stats.goals ||
        b.stats.points - a.stats.points ||
        a.player.name.localeCompare(b.player.name)
      );

    const leaderboardWrap = document.getElementById("statsPlayerLeaderboard");
    const noPlayers = document.getElementById("statsNoPlayers");

    if (!leaderboard.length) {
      leaderboardWrap.innerHTML = "";
      noPlayers?.classList.remove("hidden");
    } else {
      noPlayers?.classList.add("hidden");
      leaderboardWrap.innerHTML = leaderboard.map((item, index) => `
        <button class="stats-player-row" data-manager-player-id="${item.player.id}">
          <div class="stats-rank">${index + 1}</div>
          <div>
            <strong>${item.player.name}</strong>
            <small>#${item.player.number || "—"} • ${Number(item.player.careerGames || 0)} career games</small>
          </div>
          <div class="stats-cell"><strong>${item.stats.goals}</strong><small>Goals</small></div>
          <div class="stats-cell"><strong>${item.stats.points}</strong><small>Points</small></div>
          <div class="stats-cell"><strong>${item.stats.score}</strong><small>Score</small></div>
          <div class="stats-cell"><strong>${item.stats.awards}</strong><small>Awards</small></div>
        </button>
      `).join("");
    }

    const gameWrap = document.getElementById("statsGameHistory");
    const noGames = document.getElementById("statsNoGames");

    if (!games.length) {
      gameWrap.innerHTML = "";
      noGames?.classList.remove("hidden");
    } else {
      noGames?.classList.add("hidden");
      gameWrap.innerHTML = games.map(game => {
        const playerLines = (game.playerStats || [])
          .slice()
          .sort((a, b) =>
            Number(b.score || 0) - Number(a.score || 0) ||
            String(a.playerName || "").localeCompare(String(b.playerName || ""))
          )
          .map(stat => `
            <div class="stats-game-player-line">
              <span>${stat.number ? `#${stat.number} ` : ""}${stat.playerName}</span>
              <strong>${Number(stat.goals || 0)}G • ${Number(stat.points || 0)}P • ${Number(stat.score || 0)} pts</strong>
            </div>
          `).join("");

        return `
          <article class="stats-game-card" data-completed-game-id="${game.id}">
            <div class="stats-game-top">
              <div class="stats-game-round">
                <strong>R${game.round || "—"}</strong>
                <small>${game.date ? new Date(game.date + "T12:00:00").toLocaleDateString("en-AU", {day:"numeric", month:"short"}) : "—"}</small>
              </div>
              <div class="stats-game-copy">
                <strong>${Number(game.teamGoals || 0)} goal${Number(game.teamGoals || 0) === 1 ? "" : "s"} • ${Number(game.teamPoints || 0)} point${Number(game.teamPoints || 0) === 1 ? "" : "s"}</strong>
                <small>${formatGameDate(game.date)} • ${Number((game.awards || []).filter(award => award.playerId).length)} award${Number((game.awards || []).filter(award => award.playerId).length) === 1 ? "" : "s"} given${game.correctedAt ? " • Corrected" : ""}</small>
              </div>
              <div class="stats-game-score">
                <strong>${Number(game.teamScore || 0)}</strong>
                <small>team score</small>
              </div>
            </div>
            ${playerLines ? `<div class="stats-game-player-lines">${playerLines}</div>` : ""}
          </article>
        `;
      }).join("");
    }
  };

  const openManagerStats = () => {
    renderManagerStats();
    showScreen("managerStatsScreen");
  };

  const awardOutcomesForType = awardId => {
    const games = completedGamesSorted();
    const outcomes = [];

    games.forEach(game => {
      const outcome = (game.awards || []).find(award => award.awardId === awardId);
      if (outcome) outcomes.push({game, outcome});
    });

    return outcomes;
  };

  const renderManagerAwards = () => {
    const team = getCurrentTeam();
    if (!team) return;

    const players = [...playersForTeam(currentTeamId)].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    const settings = fullSettingsForCurrentTeam();
    const awardTypes = settings.awards || [];
    const games = completedGamesSorted();

    let givenTotal = 0;
    let notGivenTotal = 0;
    const recipientIds = new Set();

    games.forEach(game => {
      (game.awards || []).forEach(award => {
        if (award.playerId && award.given !== false) {
          givenTotal += 1;
          recipientIds.add(award.playerId);
        } else {
          notGivenTotal += 1;
        }
      });
    });

    document.getElementById("awardsTeamBadge").textContent = team.ageGroup || "TEAM";
    document.getElementById("awardsTeamName").textContent = `${team.name} Awards`;
    document.getElementById("awardsTeamMeta").textContent = managerSeasonMeta(team);
    document.getElementById("awardsTypesTotal").textContent = String(awardTypes.length);
    document.getElementById("awardsGivenTotal").textContent = String(givenTotal);
    document.getElementById("awardsNotGivenTotal").textContent = String(notGivenTotal);
    document.getElementById("awardsRecipientsTotal").textContent = String(recipientIds.size);

    const historyWrap = document.getElementById("managerAwardsHistoryList");
    const empty = document.getElementById("managerAwardsEmpty");

    if (!awardTypes.length) {
      historyWrap.innerHTML = "";
      empty?.classList.remove("hidden");
    } else {
      empty?.classList.add("hidden");

      historyWrap.innerHTML = awardTypes.map(awardType => {
        const outcomes = awardOutcomesForType(awardType.id);
        const counts = new Map();
        let notGiven = 0;

        outcomes.forEach(({outcome}) => {
          if (outcome.playerId && outcome.given !== false) {
            counts.set(outcome.playerId, (counts.get(outcome.playerId) || 0) + 1);
          } else {
            notGiven += 1;
          }
        });

        const received = players
          .filter(player => counts.has(player.id))
          .sort((a, b) =>
            (counts.get(b.id) || 0) - (counts.get(a.id) || 0) ||
            a.name.localeCompare(b.name)
          );
        const yet = players.filter(player => !counts.has(player.id));
        const totalGivenForType = [...counts.values()].reduce((a, b) => a + b, 0);

        const receivedHtml = received.length
          ? `<div class="manager-award-recipient-list">${
              received.map(player => `
                <div class="manager-award-recipient">
                  <strong>${player.name}</strong>
                  <span>${counts.get(player.id)} time${counts.get(player.id) === 1 ? "" : "s"}</span>
                </div>
              `).join("")
            }</div>`
          : `<p class="manager-award-empty-copy">No recipients yet.</p>`;

        const yetHtml = yet.length
          ? `<div class="manager-award-yet">${
              yet.map(player => `<span>${player.name}</span>`).join("")
            }</div>`
          : `<p class="manager-award-empty-copy">Everyone on the current team has received this award.</p>`;

        return `
          <article class="manager-award-history-card">
            <div class="manager-award-history-head">
              <div>
                <p class="eyebrow">AWARD</p>
                <h3>${awardType.name}</h3>
                <small class="muted">${notGiven} game${notGiven === 1 ? "" : "s"} recorded as not given</small>
              </div>
              <div class="manager-award-total">${totalGivenForType}</div>
            </div>

            <div class="manager-award-columns">
              <div class="manager-award-column">
                <h4>Received</h4>
                ${receivedHtml}
              </div>
              <div class="manager-award-column">
                <h4>Yet to receive award</h4>
                ${yetHtml}
              </div>
            </div>
          </article>
        `;
      }).join("");
    }

    const timeline = [];
    games.forEach(game => {
      (game.awards || []).forEach(award => {
        if (!award.playerId || award.given === false) return;
        timeline.push({game, award});
      });
    });

    const timelineWrap = document.getElementById("managerAwardsTimeline");
    const noTimeline = document.getElementById("managerAwardsNoTimeline");

    if (!timeline.length) {
      timelineWrap.innerHTML = "";
      noTimeline?.classList.remove("hidden");
    } else {
      noTimeline?.classList.add("hidden");
      timelineWrap.innerHTML = timeline.map(({game, award}) => `
        <div class="awards-timeline-item">
          <div class="awards-timeline-round">
            <strong>R${game.round || "—"}</strong>
            <small>${game.date ? new Date(game.date + "T12:00:00").toLocaleDateString("en-AU", {day:"numeric", month:"short"}) : "—"}</small>
          </div>
          <div>
            <strong>${award.playerName}</strong>
            <small>${formatGameDate(game.date)}</small>
          </div>
          <span class="awards-timeline-badge">🏆 ${award.awardName}</span>
        </div>
      `).join("");
    }
  };

  const openManagerAwards = () => {
    renderManagerAwards();
    showScreen("managerAwardsScreen");
  };

  const pdfSafeText = value => String(value ?? "")
    .replace(/[–—]/g, "-")
    .replace(/•/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, "...")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "");

  const pdfEscape = value => pdfSafeText(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");

  const buildSimplePdf = reportLines => {
    const pageWidth = 595;
    const pageHeight = 842;
    const marginX = 48;
    const topY = 792;
    const bottomY = 54;

    const pages = [];
    let current = [];
    let y = topY;

    const heightFor = line => {
      if (line.gap) return Number(line.gap);
      return Math.max(13, Number(line.size || 11) + 4);
    };

    reportLines.forEach(line => {
      const lineHeight = heightFor(line);
      if (current.length && y - lineHeight < bottomY) {
        pages.push(current);
        current = [];
        y = topY;
      }
      current.push(line);
      y -= lineHeight;
    });
    if (current.length || !pages.length) pages.push(current);

    const objects = [];
    const addObject = body => {
      objects.push(body);
      return objects.length;
    };

    const catalogId = addObject("");
    const pagesId = addObject("");
    const regularFontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
    const boldFontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

    const pageIds = [];

    pages.forEach(pageLines => {
      let cursorY = topY;
      const streamParts = [];

      pageLines.forEach(line => {
        const size = Number(line.size || 11);
        const font = line.bold ? "F2" : "F1";
        if (line.text) {
          streamParts.push(
            `BT /${font} ${size} Tf ${marginX} ${cursorY} Td (${pdfEscape(line.text)}) Tj ET`
          );
        }
        cursorY -= heightFor(line);
      });

      const stream = streamParts.join("\n") + "\n";
      const contentId = addObject(`<< /Length ${stream.length} >>\nstream\n${stream}endstream`);
      const pageId = addObject(
        `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] ` +
        `/Resources << /Font << /F1 ${regularFontId} 0 R /F2 ${boldFontId} 0 R >> >> ` +
        `/Contents ${contentId} 0 R >>`
      );
      pageIds.push(pageId);
    });

    objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
    objects[pagesId - 1] =
      `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;

    let pdf = "%PDF-1.4\n";
    const offsets = [0];

    objects.forEach((body, index) => {
      offsets[index + 1] = pdf.length;
      pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
    });

    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += "0000000000 65535 f \n";
    for (let i = 1; i <= objects.length; i += 1) {
      pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\n`;
    pdf += `startxref\n${xrefOffset}\n%%EOF`;

    return new Blob([pdf], {type: "application/pdf"});
  };

  const seasonStatsPdfLines = () => {
    const team = getCurrentTeam();
    if (!team) return [];

    const games = completedGamesSorted();
    const players = [...playersForTeam(currentTeamId)].sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    const totals = games.reduce((sum, game) => {
      sum.goals += Number(game.teamGoals || 0);
      sum.points += Number(game.teamPoints || 0);
      sum.score += Number(game.teamScore || 0);
      return sum;
    }, {goals: 0, points: 0, score: 0});

    const lines = [
      {text: "GameDay Crew", size: 11, bold: true},
      {text: `${team.name} - Season Stats`, size: 20, bold: true, gap: 27},
      {text: managerSeasonMeta(team), size: 11, gap: 22},
      {text: "Season Summary", size: 14, bold: true, gap: 20},
      {text: `Completed games: ${games.length}`},
      {text: `Goals: ${totals.goals}`},
      {text: `Points: ${totals.points}`},
      {text: `Team score: ${totals.score}`, gap: 22}
    ];

    const goldenBoot = currentGoldenBoot();
    lines.push({text: "Season Honours", size: 14, bold: true, gap: 20});

    if (!goldenBoot.leaders.length) {
      lines.push({text: "Current Golden Boot: No goals recorded yet.", gap: 22});
    } else {
      const leaderNames = goldenBoot.leaders
        .map(player => `${player.number ? `#${player.number} ` : ""}${player.name}`)
        .join(", ");
      const label = goldenBoot.leaders.length > 1 ? "Current Golden Boot leaders" : "Current Golden Boot";
      lines.push({
        text: `${label}: ${leaderNames} - ${goldenBoot.goals} goal${goldenBoot.goals === 1 ? "" : "s"}`,
        gap: 22
      });
    }

    lines.push({text: "Player Totals", size: 14, bold: true, gap: 20});

    if (!players.length) {
      lines.push({text: "No players on the current team.", gap: 22});
    } else {
      players.forEach(player => {
        const stats = seasonStatsForPlayer(player.id);
        lines.push({
          text:
            `${player.number ? `#${player.number} ` : ""}${player.name} | ` +
            `Career ${Number(player.careerGames || 0)} | Season ${stats.seasonGames} | ` +
            `Goals ${stats.goals} | Points ${stats.points} | Score ${stats.score} | Awards ${stats.awards}`
        });
      });
      lines.push({text: "", gap: 10});
    }

    lines.push({text: "Completed Games", size: 14, bold: true, gap: 20});

    if (!games.length) {
      lines.push({text: "No completed games yet."});
    } else {
      games.forEach(game => {
        const awardsGiven = (game.awards || []).filter(award =>
          award.playerId && award.given !== false
        );

        lines.push({
          text:
            `Round ${game.round || "-"} - ${formatGameDate(game.date)} - ` +
            `${Number(game.teamGoals || 0)} goals, ${Number(game.teamPoints || 0)} points - ` +
            `Team score ${Number(game.teamScore || 0)}${game.correctedAt ? " - Corrected" : ""}`,
          bold: true,
          gap: 17
        });

        (game.playerStats || []).forEach(stat => {
          lines.push({
            text:
              `  ${stat.number ? `#${stat.number} ` : ""}${stat.playerName}: ` +
              `${Number(stat.goals || 0)}G ${Number(stat.points || 0)}P - ${Number(stat.score || 0)} pts`
          });
        });

        const rosterSnapshot = gameRosterSnapshot(game);
        const participants = participantIdsForGame(game);
        const didNotPlay = rosterSnapshot.filter(
          player => !participants.has(player.playerId)
        );

        if (didNotPlay.length) {
          lines.push({
            text:
              `  Did not play: ${didNotPlay.map(player =>
                `${player.number ? `#${player.number} ` : ""}${player.playerName}`
              ).join(", ")}`
          });
        }

        if (awardsGiven.length) {
          lines.push({
            text: `  Awards: ${awardsGiven.map(award => `${award.awardName} - ${award.playerName}`).join("; ")}`
          });
        } else {
          lines.push({text: "  Awards: none given"});
        }

        lines.push({text: "", gap: 9});
      });
    }

    lines.push({text: "", gap: 8});
    lines.push({
      text: `Generated by GameDay Crew on ${new Date().toLocaleDateString("en-AU")}`,
      size: 9
    });

    return lines;
  };

  document.querySelector("[data-export-season-stats]")?.addEventListener("click", () => {
    const team = getCurrentTeam();
    if (!team) return;

    const blob = buildSimplePdf(seasonStatsPdfLines());
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      `${team.name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase()}-season-stats.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  document.querySelector("[data-back-manager-stats-home]")?.addEventListener("click", () => {
    renderTeamHome();
    showScreen("teamHomeScreen");
  });

  document.querySelector("[data-back-manager-awards-home]")?.addEventListener("click", () => {
    renderTeamHome();
    showScreen("teamHomeScreen");
  });

  const managerTabCopy = {
    team: {
      icon: "👥",
      title: "Team",
      heading: "Team list & player profiles",
      text:
        "Next we’ll turn this into the manager-facing Team tab with player profiles, career games and season stats."
    },
    game: {
      icon: "🏉",
      title: "Game",
      heading: "Game-day setup",
      text:
        "Next build: select captain(s), choose whether to track interchange, then start the game."
    },
    stats: {
      icon: "📊",
      title: "Stats",
      heading: "Season stats",
      text:
        "This will hold player goals, points, games, awards and exportable season summaries."
    },
    awards: {
      icon: "🏆",
      title: "Awards",
      heading: "Awards history",
      text:
        "This will show who has received each award, including players yet to receive an award."
    }
  };

  const openManagerPlaceholder = tab => {
    const copy = managerTabCopy[tab];
    if (!copy) return;

    document.getElementById("managerPlaceholderTitle").textContent = copy.title;
    document.getElementById("managerPlaceholderIcon").textContent = copy.icon;
    document.getElementById("managerPlaceholderHeading").textContent = copy.heading;
    document.getElementById("managerPlaceholderText").textContent = copy.text;
    showScreen("managerPlaceholderScreen");

    document.querySelectorAll("#managerPlaceholderScreen [data-manager-tab]").forEach(btn => {
      btn.classList.toggle("manager-nav-active", btn.dataset.managerTab === tab);
    });
  };

  document.querySelectorAll("[data-manager-tab]").forEach(btn => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.managerTab;

      if (tab === "home") {
        renderTeamHome();
        showScreen("teamHomeScreen");
      } else if (tab === "team") {
        openManagerTeam();
      } else if (tab === "game") {
        openGameSetup();
      } else if (tab === "stats") {
        openManagerStats();
      } else if (tab === "awards") {
        openManagerAwards();
      } else {
        openManagerPlaceholder(tab);
      }
    });
  });

  document.querySelectorAll("[data-back-manager-home]").forEach(btn => {
    btn.addEventListener("click", () => {
      renderTeamHome();
      showScreen("teamHomeScreen");
    });
  });



  document.addEventListener("click", event => {
    const managerPlayerCard = event.target.closest("[data-manager-player-id]");
    if (!managerPlayerCard) return;

    openManagerPlayerProfile(managerPlayerCard.dataset.managerPlayerId);
  });

  document.querySelector("[data-back-manager-team-home]")?.addEventListener("click", () => {
    renderTeamHome();
    showScreen("teamHomeScreen");
  });

  document.querySelector("[data-back-manager-team-list]")?.addEventListener("click", () => {
    managerProfilePlayerId = null;
    renderManagerTeam();
    showScreen("managerTeamScreen");
  });

  const LIVE_GAME_KEY = "gdc_v2_demo_live_games";
  let selectedGameCaptains = [];
  let setupTrackInterchange = null;
  let currentLiveQuarter = 1;

  const getLiveGames = () => {
    try { return JSON.parse(localStorage.getItem(LIVE_GAME_KEY) || "{}"); }
    catch { return {}; }
  };

  const saveLiveGames = games => {
    localStorage.setItem(LIVE_GAME_KEY, JSON.stringify(games));
  };

  const liveGameForCurrentTeam = () => {
    const all = getLiveGames();
    return all[currentTeamId] || null;
  };

  const saveCurrentLiveGame = game => {
    const all = getLiveGames();
    all[currentTeamId] = game;
    saveLiveGames(all);
  };

  const captainCountForPlayer = playerId => {
    return gamesForTeam(currentTeamId)
      .filter(game => Array.isArray(game.captainIds) && game.captainIds.includes(playerId))
      .length;
  };

  const renderJuniorCaptainChoices = () => {
    const list = document.getElementById("gameCaptainChoices");
    if (!list) return;

    const players = [...playersForTeam(currentTeamId)];
    players.sort((a, b) =>
      captainCountForPlayer(a.id) - captainCountForPlayer(b.id) ||
      Number(a.number || 999) - Number(b.number || 999) ||
      a.name.localeCompare(b.name)
    );

    list.innerHTML = players.map(player => {
      const turns = captainCountForPlayer(player.id);
      const selected = selectedGameCaptains.includes(player.id);
      const fairnessText = turns === 0
        ? "Yet to captain"
        : `${turns} captain turn${turns === 1 ? "" : "s"}`;

      return `
        <button class="game-captain-choice ${selected ? "selected" : ""}" data-game-captain="${player.id}">
          <div class="captain-turn-badge">${player.number || "—"}</div>
          <div>
            <strong>${player.name}</strong>
            <small>${Number(player.careerGames || 0)} career games</small>
          </div>
          <span class="captain-fairness-pill">${selected ? "Selected" : fairnessText}</span>
        </button>
      `;
    }).join("");
  };

  const renderSeniorLeadershipForGame = () => {
    const wrap = document.getElementById("gameLeadershipDisplay");
    if (!wrap) return;

    const settings = fullSettingsForCurrentTeam();
    const players = playersForTeam(currentTeamId);
    const captains = (settings.captains || [])
      .map(id => players.find(player => player.id === id))
      .filter(Boolean);
    const vice = (settings.viceCaptains || [])
      .map(id => players.find(player => player.id === id))
      .filter(Boolean);

    selectedGameCaptains = captains.map(player => player.id);

    if (!captains.length && !vice.length) {
      wrap.innerHTML = `
        <div class="soft-empty">
          <span>🏅</span>
          <strong>No season leadership set</strong>
          <small>You can still start the game, but Team Settings is where Captains and Vice Captains are configured.</small>
        </div>
      `;
      return;
    }

    wrap.innerHTML = [
      ...captains.map(player =>
        `<span class="game-leader-card captain">C • ${player.name}</span>`
      ),
      ...vice.map(player =>
        `<span class="game-leader-card">VC • ${player.name}</span>`
      )
    ].join("");
  };

  const updateGameSetupReadyState = () => {
    const team = getCurrentTeam();
    const players = playersForTeam(currentTeamId);
    const junior = team && ["U9", "U10", "U12"].includes(team.ageGroup);
    const captainReady = !junior || selectedGameCaptains.length > 0;
    const interchangeReady = setupTrackInterchange !== null;
    const rosterReady = players.length > 0;

    const ready = captainReady && interchangeReady && rosterReady;
    const text = document.getElementById("gameSetupReadyText");
    const button = document.querySelector("[data-start-live-game]");

    if (!rosterReady) {
      text.textContent = "Add at least one player before starting the game.";
    } else if (!captainReady) {
      text.textContent = "Choose at least one captain for today.";
    } else if (!interchangeReady) {
      text.textContent = "Choose whether you'll be tracking interchange today.";
    } else {
      text.textContent = setupTrackInterchange
        ? "Ready — scoring and interchange tracking will be available."
        : "Ready — scoring will be shown without interchange tracking.";
    }

    text?.classList.toggle("ready", ready);
    if (button) button.disabled = !ready;
  };

  const renderGameSetup = () => {
    const team = getCurrentTeam();
    const game = nextGameForCurrentTeam();
    if (!team || !game) return;

    document.getElementById("gameSetupTitle").textContent = `Round ${game.round}`;
    document.getElementById("gameSetupDate").textContent = formatGameDate(game.date);

    const junior = ["U9", "U10", "U12"].includes(team.ageGroup);
    const juniorPanel = document.getElementById("juniorCaptainSetup");
    const seniorPanel = document.getElementById("seniorCaptainSetup");

    selectedGameCaptains = [];
    setupTrackInterchange = null;

    document.querySelectorAll("[data-interchange-choice]").forEach(button => {
      button.classList.remove("selected");
    });

    if (junior) {
      juniorPanel?.classList.remove("hidden");
      seniorPanel?.classList.add("hidden");
      renderJuniorCaptainChoices();
    } else {
      juniorPanel?.classList.add("hidden");
      seniorPanel?.classList.remove("hidden");
      renderSeniorLeadershipForGame();
    }

    updateGameSetupReadyState();
  };

  const openGameSetup = () => {
    const live = liveGameForCurrentTeam();
    if (live) {
      currentLiveQuarter = Number(live.quarter || 1);
      renderLiveGame();
      showScreen("liveGameScreen");
      return;
    }

    const next = nextGameForCurrentTeam();
    if (!next) {
      alert("Set up the next round and date from Team Home first.");
      renderTeamHome();
      showScreen("teamHomeScreen");
      return;
    }

    renderGameSetup();
    showScreen("gameSetupScreen");
  };

  document.addEventListener("click", event => {
    const captainButton = event.target.closest("[data-game-captain]");
    if (captainButton) {
      const playerId = captainButton.dataset.gameCaptain;
      if (selectedGameCaptains.includes(playerId)) {
        selectedGameCaptains = selectedGameCaptains.filter(id => id !== playerId);
      } else {
        selectedGameCaptains.push(playerId);
      }
      renderJuniorCaptainChoices();
      updateGameSetupReadyState();
      return;
    }

    const interchangeButton = event.target.closest("[data-interchange-choice]");
    if (interchangeButton) {
      setupTrackInterchange = interchangeButton.dataset.interchangeChoice === "yes";
      document.querySelectorAll("[data-interchange-choice]").forEach(button => {
        button.classList.toggle("selected", button === interchangeButton);
      });
      updateGameSetupReadyState();
    }
  });

  document.querySelector("[data-back-team-home-from-game-setup]")?.addEventListener("click", () => {
    renderTeamHome();
    showScreen("teamHomeScreen");
  });

  document.querySelector("[data-start-live-game]")?.addEventListener("click", () => {
    const team = getCurrentTeam();
    const next = nextGameForCurrentTeam();
    const players = playersForTeam(currentTeamId);
    if (!team || !next || !players.length) return;

    const scoring = {};
    const interchange = {1: {}, 2: {}, 3: {}, 4: {}};

    players.forEach(player => {
      scoring[player.id] = {goals: 0, points: 0};
      [1, 2, 3, 4].forEach(q => {
        interchange[q][player.id] = "on";
      });
    });

    const game = {
      id: "live_" + Date.now(),
      teamId: currentTeamId,
      round: next.round,
      date: next.date,
      captainIds: [...selectedGameCaptains],
      trackInterchange: setupTrackInterchange === true,
      quarter: 1,
      hiddenInterchangeQuarters: [],
      scoring,
      interchange,
      startedAt: new Date().toISOString()
    };

    currentLiveQuarter = 1;
    saveCurrentLiveGame(game);
    renderLiveGame();
    showScreen("liveGameScreen");
  });

  const scoreTotalsForGame = game => {
    let goals = 0;
    let points = 0;

    Object.values(game.scoring || {}).forEach(score => {
      goals += Number(score.goals || 0);
      points += Number(score.points || 0);
    });

    return {goals, points, total: goals * 6 + points};
  };

  const renderLiveScoring = game => {
    const players = playersForTeam(currentTeamId);
    const list = document.getElementById("liveScoringList");
    if (!list) return;

    list.innerHTML = players.map(player => {
      const score = game.scoring?.[player.id] || {goals: 0, points: 0};

      return `
        <div class="live-score-row">
          <div class="live-player-number">${player.number || "—"}</div>
          <div>
            <strong>${player.name}</strong>
            <small>${Number(score.goals || 0) * 6 + Number(score.points || 0)} points scored</small>
          </div>

          <div class="score-control">
            <button data-score-player="${player.id}" data-score-type="goals" data-score-delta="-1">−</button>
            <div class="score-value">
              <span>${Number(score.goals || 0)}</span>
              <div class="score-label">GOALS</div>
            </div>
            <button data-score-player="${player.id}" data-score-type="goals" data-score-delta="1">+</button>
          </div>

          <div class="score-control">
            <button data-score-player="${player.id}" data-score-type="points" data-score-delta="-1">−</button>
            <div class="score-value">
              <span>${Number(score.points || 0)}</span>
              <div class="score-label">POINTS</div>
            </div>
            <button data-score-player="${player.id}" data-score-type="points" data-score-delta="1">+</button>
          </div>
        </div>
      `;
    }).join("");
  };

  const renderLiveInterchange = game => {
    const section = document.getElementById("liveInterchangeSection");
    const offCard = document.getElementById("liveInterchangeOffCard");

    if (!game.trackInterchange) {
      section?.classList.add("hidden");
      offCard?.classList.remove("hidden");
      return;
    }

    section?.classList.remove("hidden");
    offCard?.classList.add("hidden");

    document.getElementById("liveQuarterNumber").textContent = String(currentLiveQuarter);

    document.querySelectorAll("[data-game-quarter]").forEach(button => {
      button.classList.toggle(
        "selected",
        Number(button.dataset.gameQuarter) === currentLiveQuarter
      );
    });

    const hidden = (game.hiddenInterchangeQuarters || []).includes(currentLiveQuarter);
    document.getElementById("interchangeControls")?.classList.toggle("hidden", hidden);
    document.getElementById("interchangeHiddenMessage")?.classList.toggle("hidden", !hidden);

    const toggleButton = document.querySelector("[data-toggle-interchange-panel]");
    if (toggleButton) {
      toggleButton.textContent = hidden ? "Show this quarter" : "Hide this quarter";
    }

    const list = document.getElementById("interchangePlayerList");
    const players = playersForTeam(currentTeamId);
    const quarterData = game.interchange?.[currentLiveQuarter] || {};

    list.innerHTML = players.map(player => {
      const status = quarterData[player.id] || "on";
      const bench = status === "bench";

      return `
        <div class="interchange-player-row ${bench ? "bench" : ""}">
          <div class="player-number">${player.number || "—"}</div>
          <div>
            <strong>${player.name}</strong>
            <small>${bench ? "Currently on interchange" : "Currently on field"}</small>
          </div>
          <button class="interchange-status ${bench ? "bench" : "on"}" data-toggle-player-interchange="${player.id}">
            ${bench ? "INTERCHANGE" : "ON FIELD"}
          </button>
        </div>
      `;
    }).join("");
  };

  const renderLiveGame = () => {
    const team = getCurrentTeam();
    const game = liveGameForCurrentTeam();
    if (!team || !game) return;

    document.getElementById("liveGameRound").textContent = `Round ${game.round}`;
    document.getElementById("liveGameDate").textContent = formatGameDate(game.date);
    document.getElementById("liveTeamName").textContent = team.name;

    const totals = scoreTotalsForGame(game);
    document.getElementById("liveTotalScore").textContent = String(totals.total);
    document.getElementById("liveGoalsTotal").textContent = String(totals.goals);
    document.getElementById("livePointsTotal").textContent = String(totals.points);

    renderLiveScoring(game);
    renderLiveInterchange(game);
  };

  document.addEventListener("click", event => {
    const scoreButton = event.target.closest("[data-score-player]");
    if (scoreButton) {
      const game = liveGameForCurrentTeam();
      if (!game) return;

      const playerId = scoreButton.dataset.scorePlayer;
      const type = scoreButton.dataset.scoreType;
      const delta = Number(scoreButton.dataset.scoreDelta || 0);

      if (!game.scoring[playerId]) game.scoring[playerId] = {goals: 0, points: 0};
      game.scoring[playerId][type] = Math.max(
        0,
        Number(game.scoring[playerId][type] || 0) + delta
      );

      saveCurrentLiveGame(game);
      renderLiveGame();
      return;
    }

    const quarterButton = event.target.closest("[data-game-quarter]");
    if (quarterButton) {
      const game = liveGameForCurrentTeam();
      if (!game) return;

      currentLiveQuarter = Number(quarterButton.dataset.gameQuarter);
      game.quarter = currentLiveQuarter;
      saveCurrentLiveGame(game);
      renderLiveInterchange(game);
      return;
    }

    const interchangePlayerButton = event.target.closest("[data-toggle-player-interchange]");
    if (interchangePlayerButton) {
      const game = liveGameForCurrentTeam();
      if (!game || !game.trackInterchange) return;

      const playerId = interchangePlayerButton.dataset.togglePlayerInterchange;
      if (!game.interchange[currentLiveQuarter]) game.interchange[currentLiveQuarter] = {};

      const current = game.interchange[currentLiveQuarter][playerId] || "on";
      game.interchange[currentLiveQuarter][playerId] = current === "on" ? "bench" : "on";

      saveCurrentLiveGame(game);
      renderLiveInterchange(game);
    }
  });

  document.querySelector("[data-toggle-interchange-panel]")?.addEventListener("click", () => {
    const game = liveGameForCurrentTeam();
    if (!game) return;

    const hidden = new Set(game.hiddenInterchangeQuarters || []);
    if (hidden.has(currentLiveQuarter)) {
      hidden.delete(currentLiveQuarter);
    } else {
      hidden.add(currentLiveQuarter);
    }

    game.hiddenInterchangeQuarters = [...hidden];
    saveCurrentLiveGame(game);
    renderLiveInterchange(game);
  });

  document.querySelector("[data-show-interchange-panel]")?.addEventListener("click", () => {
    const game = liveGameForCurrentTeam();
    if (!game) return;

    game.hiddenInterchangeQuarters = (game.hiddenInterchangeQuarters || [])
      .filter(q => q !== currentLiveQuarter);

    saveCurrentLiveGame(game);
    renderLiveInterchange(game);
  });

  document.querySelector("[data-enable-live-interchange]")?.addEventListener("click", () => {
    const game = liveGameForCurrentTeam();
    if (!game) return;

    game.trackInterchange = true;
    saveCurrentLiveGame(game);
    renderLiveInterchange(game);
  });

  document.querySelector("[data-live-game-home]")?.addEventListener("click", () => {
    renderTeamHome();
    showScreen("teamHomeScreen");
  });


  const awardHistoryForTeam = awardId => {
    const counts = new Map();

    gamesForTeam(currentTeamId).forEach(game => {
      (game.awards || []).forEach(award => {
        if (award.awardId !== awardId || !award.playerId) return;
        counts.set(award.playerId, (counts.get(award.playerId) || 0) + 1);
      });
    });

    return counts;
  };

  const renderPostGameAwards = () => {
    const team = getCurrentTeam();
    const game = liveGameForCurrentTeam();
    if (!team || !game) return;

    const totals = scoreTotalsForGame(game);
    const players = playersForTeam(currentTeamId);
    const settings = fullSettingsForCurrentTeam();
    const awards = settings.awards || [];

    document.getElementById("postGameAwardsRound").textContent =
      `Round ${game.round} Awards`;
    document.getElementById("postGameAwardsDate").textContent =
      formatGameDate(game.date);
    document.getElementById("postGameTeamName").textContent = team.name;
    document.getElementById("postGameTotalScore").textContent =
      String(totals.total);
    document.getElementById("postGameScoreBreakdown").textContent =
      `${totals.goals} goal${totals.goals === 1 ? "" : "s"} • ${totals.points} point${totals.points === 1 ? "" : "s"}`;

    const awardsList = document.getElementById("postGameAwardsList");
    const noAwards = document.getElementById("postGameNoAwards");

    if (!awards.length) {
      awardsList.innerHTML = "";
      noAwards?.classList.remove("hidden");
    } else {
      noAwards?.classList.add("hidden");

      awardsList.innerHTML = awards.map((award, index) => {
        const history = awardHistoryForTeam(award.id);
        const previous = players
          .filter(player => history.has(player.id))
          .sort((a, b) =>
            (history.get(b.id) || 0) - (history.get(a.id) || 0) ||
            a.name.localeCompare(b.name)
          );
        const yet = players
          .filter(player => !history.has(player.id))
          .sort((a, b) => a.name.localeCompare(b.name));

        const selectedPlayerId = game.pendingAwards?.[award.id] || "";

        const previousHtml = previous.length
          ? `<div class="award-history-chips">${
              previous.map(player => {
                const count = history.get(player.id) || 0;
                return `<span class="award-history-chip">${player.name}${count > 1 ? ` ×${count}` : ""}</span>`;
              }).join("")
            }</div>`
          : `<p>No previous recipients yet.</p>`;

        const yetHtml = yet.length
          ? `<div class="award-history-chips">${
              yet.map(player =>
                `<span class="award-history-chip yet ${selectedPlayerId === player.id ? "selected-now" : ""}">${player.name}</span>`
              ).join("")
            }</div>`
          : `<p>Everyone on the current team has received this award before.</p>`;

        return `
          <article class="post-game-award-card">
            <div class="post-game-award-title-row">
              <div>
                <p class="eyebrow">AWARD ${index + 1}</p>
                <h3>${award.name}</h3>
              </div>
              <div class="post-game-award-number">${index + 1}</div>
            </div>

            <label>Today's recipient
              <select class="award-winner-select" data-post-game-award="${award.id}">
                <option value="">No award this game</option>
                ${players.map(player =>
                  `<option value="${player.id}" ${selectedPlayerId === player.id ? "selected" : ""}>${player.number ? `#${player.number} — ` : ""}${player.name}</option>`
                ).join("")}
              </select>
            </label>

            <div class="award-history-grid">
              <div class="award-history-box">
                <h4>Previously received</h4>
                ${previousHtml}
              </div>
              <div class="award-history-box">
                <h4>Yet to receive award</h4>
                ${yetHtml}
              </div>
            </div>
          </article>
        `;
      }).join("");
    }

    const statsList = document.getElementById("postGamePlayerStatsList");
    statsList.innerHTML = players.map(player => {
      const score = game.scoring?.[player.id] || {goals: 0, points: 0};
      const goals = Number(score.goals || 0);
      const points = Number(score.points || 0);
      const total = goals * 6 + points;

      return `
        <div class="post-game-player-stat-row">
          <div class="player-number">${player.number || "—"}</div>
          <div>
            <strong>${player.name}</strong>
            <small>${goals} goal${goals === 1 ? "" : "s"} • ${points} point${points === 1 ? "" : "s"}</small>
          </div>
          <div class="post-game-player-score">
            ${total}
            <small>score</small>
          </div>
        </div>
      `;
    }).join("");
  };

  const openPostGameAwards = () => {
    const game = liveGameForCurrentTeam();
    if (!game) {
      renderTeamHome();
      showScreen("teamHomeScreen");
      return;
    }

    if (!game.pendingAwards) {
      game.pendingAwards = {};
      saveCurrentLiveGame(game);
    }

    renderPostGameAwards();
    showScreen("postGameAwardsScreen");
  };

  document.querySelector("[data-finish-game]")?.addEventListener("click", () => {
    openPostGameAwards();
  });

  document.querySelector("[data-back-live-from-awards]")?.addEventListener("click", () => {
    renderLiveGame();
    showScreen("liveGameScreen");
  });

  document.addEventListener("change", event => {
    const select = event.target.closest("[data-post-game-award]");
    if (!select) return;

    const game = liveGameForCurrentTeam();
    if (!game) return;

    if (!game.pendingAwards) game.pendingAwards = {};
    game.pendingAwards[select.dataset.postGameAward] = select.value;
    saveCurrentLiveGame(game);
    renderPostGameAwards();
  });

  const completedAwardAssignments = (game, awards, players) => {
    const playerMap = new Map(players.map(player => [player.id, player]));

    return awards.map(award => {
      const playerId = game.pendingAwards?.[award.id] || "";
      const player = playerMap.get(playerId);

      return {
        awardId: award.id,
        awardName: award.name,
        playerId: player?.id || null,
        playerName: player?.name || null,
        given: Boolean(player)
      };
    });
  };

  document.querySelector("[data-save-completed-game]")?.addEventListener("click", () => {
    const team = getCurrentTeam();
    const live = liveGameForCurrentTeam();
    if (!team || !live) return;

    const totals = scoreTotalsForGame(live);
    const players = playersForTeam(currentTeamId);
    const settings = fullSettingsForCurrentTeam();
    const awards = settings.awards || [];

    const awardOutcomes = completedAwardAssignments(live, awards, players);
    const assignedAwards = awardOutcomes.filter(award => award.given);
    const unassignedCount = awardOutcomes.filter(award => !award.given).length;

    const confirmText = unassignedCount
      ? `Save Round ${live.round} as complete? ${unassignedCount} award${unassignedCount === 1 ? "" : "s"} will be recorded as not given this game.`
      : `Save Round ${live.round} as complete?`;

    if (!confirm(confirmText)) return;

    const button = document.querySelector("[data-save-completed-game]");
    if (button) {
      button.disabled = true;
      button.textContent = "Saving…";
    }

    const participantIds = new Set(Object.keys(live.scoring || {}));
    const playerStats = players
      .filter(player => participantIds.has(player.id))
      .map(player => {
        const score = live.scoring?.[player.id] || {goals: 0, points: 0};
        const goals = Number(score.goals || 0);
        const points = Number(score.points || 0);

        return {
          playerId: player.id,
          playerName: player.name,
          number: player.number || null,
          goals,
          points,
          score: goals * 6 + points
        };
      });

    const completedGame = {
      id: "game_" + Date.now(),
      teamId: currentTeamId,
      teamName: team.name,
      round: live.round,
      date: live.date,
      captainIds: [...(live.captainIds || [])],
      trackInterchange: Boolean(live.trackInterchange),
      scoring: JSON.parse(JSON.stringify(live.scoring || {})),
      playerStats,
      rosterSnapshot: players.map(player => ({
        playerId: player.id,
        playerName: player.name,
        number: player.number || null
      })),
      participantIds: [...participantIds],
      interchange: JSON.parse(JSON.stringify(live.interchange || {})),
      hiddenInterchangeQuarters: [...(live.hiddenInterchangeQuarters || [])],
      awards: awardOutcomes,
      teamGoals: totals.goals,
      teamPoints: totals.points,
      teamScore: totals.total,
      startedAt: live.startedAt,
      completedAt: new Date().toISOString(),
      status: "completed"
    };

    const allGames = getAllCompletedGames();
    allGames.push(completedGame);
    saveAllCompletedGames(allGames);

    const allPlayers = getAllPlayers().map(player => {
      if (!participantIds.has(player.id) || player.teamId !== currentTeamId) {
        return player;
      }

      return {
        ...player,
        careerGames: Number(player.careerGames || 0) + 1
      };
    });
    saveAllPlayers(allPlayers);

    const liveGames = getLiveGames();
    delete liveGames[currentTeamId];
    saveLiveGames(liveGames);

    const nextGames = getNextGames();
    delete nextGames[currentTeamId];
    saveNextGames(nextGames);

    currentLiveQuarter = 1;

    renderTeamHome();

    const notice = document.getElementById("teamHomeNotice");
    if (notice) {
      notice.textContent =
        `✓ Round ${completedGame.round} saved • Team score ${completedGame.teamScore} • Career games updated`;
      notice.classList.remove("hidden");
    }

    showScreen("teamHomeScreen");

    if (button) {
      button.disabled = false;
      button.textContent = "Save Game & Finish";
    }
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(err => console.warn("Service worker registration failed:", err));
    });
  }
})();
