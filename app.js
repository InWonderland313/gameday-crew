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

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(err => console.warn("Service worker registration failed:", err));
    });
  }
})();
