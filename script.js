// Game state
let gameState = {
    players: [],
    betAmount: 1,
    tables: [],
  };

  // DOM Elements
  const splashScreen = document.getElementById("splashScreen");
  const setupForm = document.getElementById("setupForm");
  const appContainer = document.getElementById("appContainer");
  const tablesContainer = document.getElementById("tablesContainer");
  const statusBarBody = document.getElementById("statusBarBody");
  const menuButton = document.getElementById("menuButton");
  const menuDropdown = document.getElementById("menuDropdown");
  const addTableBtn = document.getElementById("addTableBtn");
  const exportBtn = document.getElementById("exportBtn");
  const newSessionBtn = document.getElementById("newSessionBtn");
  const exportOverlay = document.getElementById("exportOverlay");
  const exportContent = document.getElementById("exportContent");
  const copyBtn = document.getElementById("copyBtn");
  const closeExportBtn = document.getElementById("closeExportBtn");

  // Initialize the app
  document.addEventListener("DOMContentLoaded", () => {
    // Check for saved state
    const savedState = localStorage.getItem("scoreTrackerState");

    setTimeout(() => {
      splashScreen.style.opacity = "0";
      setTimeout(() => {
        splashScreen.style.display = "none";

        if (savedState) {
          // Restore saved state
          gameState = JSON.parse(savedState);
          renderGame();
        } else {
          // Show setup form
          setupForm.style.display = "block";
        }
      }, 500);
    }, 1500);
  });

  // Event Listeners
  document
    .getElementById("startButton")
    .addEventListener("click", startGame);
  menuButton.addEventListener("click", toggleMenu);
  addTableBtn.addEventListener("click", addTable);
  exportBtn.addEventListener("click", exportSession);
  newSessionBtn.addEventListener("click", confirmNewSession);
  closeExportBtn.addEventListener("click", closeExportModal);
  copyBtn.addEventListener("click", copyExportContent);

  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (e.target !== menuButton && menuDropdown.style.display === "block") {
      menuDropdown.style.display = "none";
    }
  });

  // Start a new game
  function startGame() {
    const player1 =
      document.getElementById("player1").value.trim() || "Player 1";
    const player2 =
      document.getElementById("player2").value.trim() || "Player 2";
    const player3 =
      document.getElementById("player3").value.trim() || "Player 3";
    const player4 =
      document.getElementById("player4").value.trim() || "Player 4";
    const betAmount =
      parseInt(document.getElementById("betAmount").value) || 1;

    gameState = {
      players: [player1, player2, player3, player4],
      betAmount: betAmount,
      tables: [],
    };

    // Create first table
    gameState.tables.push({
      id: generateId(),
      rounds: Array(10)
        .fill()
        .map(() => ({
          scores: [null, null, null, null],
        })),
    });

    setupForm.style.display = "none";
    renderGame();
  }

  // Render the game
  function renderGame() {
    appContainer.style.display = "block";
    tablesContainer.innerHTML = "";

    // Render tables
    gameState.tables.forEach((table, tableIndex) => {
      renderTable(table, tableIndex);
    });

    // Render status bar
    updateStatusBar();

    // Save state
    saveGameState();
  }

  // Render a single table
  function renderTable(table, tableIndex) {
    const tableDiv = document.createElement("div");
    tableDiv.className = "table-container";
    tableDiv.innerHTML = `
            <div class="table-header">Table ${tableIndex + 1}</div>
            <table>
                <thead>
                    <tr>
                        <th>Round</th>
                        ${gameState.players
                          .map((player) => `<th>${player}</th>`)
                          .join("")}
                    </tr>
                </thead>
                <tbody id="tableBody${table.id}">
                    ${table.rounds
                      .map(
                        (round, roundIndex) => `
                        <tr>
                            <td class="round-label">Round ${
                              roundIndex + 1
                            }</td>
                            ${round.scores
                              .map(
                                (score, playerIndex) => `
                                <td>
                                    <input type="number" 
                                           class="score-input" 
                                           value="${
                                             score !== null ? score : ""
                                           }" 
                                           data-table="${table.id}" 
                                           data-round="${roundIndex}" 
                                           data-player="${playerIndex}"
                                           min="0">
                                </td>
                            `
                              )
                              .join("")}
                        </tr>
                    `
                      )
                      .join("")}
                    <tr class="total-row">
                        <td>Total</td>
                        ${Array(4)
                          .fill()
                          .map((_, playerIndex) => {
                            const total = calculatePlayerTotal(
                              table,
                              playerIndex
                            );
                            return `<td id="total-${
                              table.id
                            }-${playerIndex}">${
                              total !== null ? total : "-"
                            }</td>`;
                          })
                          .join("")}
                    </tr>
                </tbody>
            </table>
        `;
    tablesContainer.appendChild(tableDiv);

    // Add event listeners to inputs
    const inputs = tableDiv.querySelectorAll(".score-input");
    inputs.forEach((input) => {
      input.addEventListener("input", handleScoreInput);
    });
  }

  // Handle score input
  function handleScoreInput(e) {
    const tableId = e.target.dataset.table;
    const roundIndex = parseInt(e.target.dataset.round);
    const playerIndex = parseInt(e.target.dataset.player);
    const value =
      e.target.value.trim() === "" ? null : parseInt(e.target.value);

    // Find the table
    const tableIndex = gameState.tables.findIndex((t) => t.id === tableId);
    if (tableIndex !== -1) {
      gameState.tables[tableIndex].rounds[roundIndex].scores[playerIndex] =
        value;

      // Update totals
      updateTableTotals(tableId);
      updateStatusBar();

      // Save state
      saveGameState();
    }
  }

  // Update table totals
  function updateTableTotals(tableId) {
    const table = gameState.tables.find((t) => t.id === tableId);
    if (!table) return;

    for (let playerIndex = 0; playerIndex < 4; playerIndex++) {
      const total = calculatePlayerTotal(table, playerIndex);
      const totalElement = document.getElementById(
        `total-${tableId}-${playerIndex}`
      );
      if (totalElement) {
        totalElement.textContent = total !== null ? total : "-";
      }
    }
  }

  // Calculate player total for a table
  function calculatePlayerTotal(table, playerIndex) {
    let total = 0;
    let hasScore = false;

    table.rounds.forEach((round) => {
      if (
        round.scores[playerIndex] !== null &&
        !isNaN(round.scores[playerIndex])
      ) {
        total += round.scores[playerIndex];
        hasScore = true;
      }
    });

    return hasScore ? total : null;
  }

  // Calculate player's grand total across all tables
  function calculatePlayerGrandTotal(playerIndex) {
    let grandTotal = 0;
    let hasScore = false;

    gameState.tables.forEach((table) => {
      const total = calculatePlayerTotal(table, playerIndex);
      if (total !== null) {
        grandTotal += total;
        hasScore = true;
      }
    });

    return hasScore ? grandTotal : null;
  }

  // Calculate payments based on scores
  function calculatePayments() {
    const scores = gameState.players.map((_, playerIndex) => {
      return {
        player: playerIndex,
        score: calculatePlayerGrandTotal(playerIndex) || 0,
      };
    });

    // Sort by score (ascending - lowest is best)
    scores.sort((a, b) => a.score - b.score);

    const payments = Array(4).fill(0);

    // 4th pays 1st
    const payment1 =
      (scores[3].score - scores[0].score) * gameState.betAmount;
    payments[scores[3].player] -= payment1;
    payments[scores[0].player] += payment1;

    // 3rd pays 2nd
    const payment2 =
      (scores[2].score - scores[1].score) * gameState.betAmount;
    payments[scores[2].player] -= payment2;
    payments[scores[1].player] += payment2;

    return payments;
  }

  // Update status bar
  function updateStatusBar() {
    const payments = calculatePayments();
    statusBarBody.innerHTML = "";

    gameState.players.forEach((player, index) => {
      const total = calculatePlayerGrandTotal(index);
      const paymentClass =
        payments[index] > 0
          ? "payment-positive"
          : payments[index] < 0
          ? "payment-negative"
          : "";
      const paymentText =
        payments[index] > 0
          ? `+${payments[index]}`
          : payments[index] < 0
          ? `${payments[index]}`
          : "0";

      const row = document.createElement("tr");
      row.innerHTML = `
                <td>${player}</td>
                <td>${total !== null ? total : "-"}</td>
                <td class="${paymentClass}">${paymentText}</td>
            `;
      statusBarBody.appendChild(row);
    });
  }

  // Toggle menu
  function toggleMenu() {
    if (menuDropdown.style.display === "block") {
      menuDropdown.style.display = "none";
    } else {
      menuDropdown.style.display = "block";
    }
  }

  // Add a new table
  function addTable() {
    menuDropdown.style.display = "none";

    gameState.tables.push({
      id: generateId(),
      rounds: Array(10)
        .fill()
        .map(() => ({
          scores: [null, null, null, null],
        })),
    });

    renderGame();
  }

  // Export session
  function exportSession() {
    menuDropdown.style.display = "none";

    let output = `ScoreTracker Session\n`;
    output += `Players: ${gameState.players.join(", ")}\n`;
    output += `Bet Amount: ${gameState.betAmount}\n\n`;

    gameState.tables.forEach((table, tableIndex) => {
      output += `=== TABLE ${tableIndex + 1} ===\n`;

      // Header row
      output += `Round | ${gameState.players.join(" | ")}\n`;
      output += `-----${"|------".repeat(gameState.players.length)}\n`;

      // Data rows
      table.rounds.forEach((round, roundIndex) => {
        output += `R${roundIndex + 1} | `;
        output += round.scores
          .map((score) => (score !== null ? score : "-"))
          .join(" | ");
        output += "\n";
      });

      // Total row
      output += `-----${"|------".repeat(gameState.players.length)}\n`;
      output += `Total | `;
      output += gameState.players
        .map((_, playerIndex) => {
          const total = calculatePlayerTotal(table, playerIndex);
          return total !== null ? total : "-";
        })
        .join(" | ");
      output += "\n\n";
    });

    // Grand total and payments
    output += `=== SUMMARY ===\n`;
    output += `Player | Grand Total | Payment\n`;
    output += `-------|------------|--------\n`;

    const payments = calculatePayments();
    gameState.players.forEach((player, index) => {
      const total = calculatePlayerGrandTotal(index);
      const paymentText =
        payments[index] > 0
          ? `+${payments[index]}`
          : payments[index] < 0
          ? `${payments[index]}`
          : "0";
      output += `${player} | ${
        total !== null ? total : "-"
      } | ${paymentText}\n`;
    });

    exportContent.textContent = output;
    exportOverlay.style.display = "flex";
  }

  // Close export modal
  function closeExportModal() {
    exportOverlay.style.display = "none";
  }

  // Copy export content
  function copyExportContent() {
    const text = exportContent.textContent;
    navigator.clipboard.writeText(text).then(() => {
      copyBtn.textContent = "Copied!";
      setTimeout(() => {
        copyBtn.textContent = "Copy";
      }, 2000);
    });
  }

  // Confirm new session
  function confirmNewSession() {
    menuDropdown.style.display = "none";
    if (
      confirm(
        "Are you sure you want to start a new session? All current data will be lost."
      )
    ) {
      // Clear local storage
      localStorage.removeItem("scoreTrackerState");

      // Show setup form
      appContainer.style.display = "none";
      setupForm.style.display = "block";
    }
  }

  // Generate a unique ID
  function generateId() {
    return "id" + Math.random().toString(36).substr(2, 9);
  }

  // Save game state to local storage
  function saveGameState() {
    localStorage.setItem("scoreTrackerState", JSON.stringify(gameState));
  }

  // Service Worker for PWA functionality
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("ServiceWorker registration successful");
        })
        .catch((error) => {
          console.log("ServiceWorker registration failed: ", error);
        });
    });
  }