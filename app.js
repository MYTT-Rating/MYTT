const config = window.MYTT;

function parseCSV(csvText) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < csvText.length; i++) {
    const c = csvText[i];
    const n = csvText[i + 1];

    if (c === '"' && quoted && n === '"') {
      cell += '"';
      i++;
    } else if (c === '"') {
      quoted = !quoted;
    } else if (c === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (cell || row.length) {
        row.push(cell.trim());
        rows.push(row);
        row = [];
        cell = "";
      }
      if (c === "\r" && n === "\n") i++;
    } else {
      cell += c;
    }
  }

  if (cell || row.length) {
    row.push(cell.trim());
    rows.push(row);
  }

  return rows;
}

function cleanRows(rows) {
  return rows
    .filter(row => row.some(cell => String(cell).trim() !== ""))
    .slice(1);
}

function rankLabel(rank) {
  const value = String(rank || "").trim();

  if (value === "1") return "🥇 1";
  if (value === "2") return "🥈 2";
  if (value === "3") return "🥉 3";

  return value || "-";
}

function makeRow(row) {
  const [rank, name, rating, record, winRate, peak] = row;
  const tr = document.createElement("tr");

  tr.className = "rank-" + String(rank || "").trim();
  tr.innerHTML = `
    <td><span class="rank-badge">${rankLabel(rank)}</span></td>
    <td class="name">${name || "-"}</td>
    <td class="rating">${rating || "-"}</td>
    <td>${record || "-"}</td>
    <td>${winRate || "-"}</td>
    <td>${peak || "-"}</td>
  `;

  return tr;
}

async function loadLeaderboard(csvUrl, bodyId, statusId, label) {
  const body = document.getElementById(bodyId);
  const status = document.getElementById(statusId);

  try {
    const url = csvUrl + (csvUrl.includes("?") ? "&" : "?") + "t=" + Date.now();
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Unable to load " + label);
    }

    const text = await response.text();
    const rows = cleanRows(parseCSV(text));

    body.innerHTML = "";

    if (!rows.length) {
      body.innerHTML = `<tr><td colspan="6" class="loading">No data yet.</td></tr>`;
      status.textContent = "No data";
      return;
    }

    rows.forEach(row => {
      body.appendChild(makeRow(row));
    });

    status.textContent = "Updated " + new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch (error) {
    console.error(error);
    body.innerHTML = `<tr><td colspan="6" class="loading">Failed to load ${label} leaderboard.</td></tr>`;
    status.textContent = "Load failed";
  }
}

function loadAll() {
  loadLeaderboard(config.singlesCsv, "singlesBody", "singlesStatus", "singles");
  loadLeaderboard(config.doublesCsv, "doublesBody", "doublesStatus", "doubles");
}

loadAll();
setInterval(loadAll, 60000);
