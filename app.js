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
      } else if (tab === "game") {
        openGameSetup();
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
