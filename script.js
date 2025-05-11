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
    const tablePayments = calculateTablePayments(table);
    
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
                    <tr class="payment-row">
                        <td>Payment</td>
                        ${Array(4)
                          .fill()
                          .map((_, playerIndex) => {
                            const payment = tablePayments[playerIndex];
                            const paymentClass = payment > 0
                              ? "payment-positive"
                              : payment < 0
                              ? "payment-negative"
                              : "";
                            const paymentText = payment > 0
                              ? `+${payment}`
                              : payment < 0
                              ? `${payment}`
                              : "0";
                            return `<td class="${paymentClass}">${paymentText}</td>`;
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

      // Update totals and payments
      updateTableTotals(tableId);
      updateTablePayments(tableId);
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

  // Update table payments
  function updateTablePayments(tableId) {
    const table = gameState.tables.find((t) => t.id === tableId);
    if (!table) return;

    const tablePayments = calculateTablePayments(table);
    const paymentRow = document.querySelector(`#tableBody${tableId} .payment-row`);
    
    if (paymentRow) {
        const cells = paymentRow.querySelectorAll('td:not(:first-child)');
        cells.forEach((cell, index) => {
            const payment = tablePayments[index];
            const paymentClass = payment > 0
                ? "payment-positive"
                : payment < 0
                ? "payment-negative"
                : "";
            const paymentText = payment > 0
                ? `+${payment}`
                : payment < 0
                ? `${payment}`
                : "0";
            
            cell.className = paymentClass;
            cell.textContent = paymentText;
        });
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

  // Calculate payments for a single table
  function calculateTablePayments(table) {
    const scores = gameState.players.map((_, playerIndex) => {
      return {
        player: playerIndex,
        score: calculatePlayerTotal(table, playerIndex) || 0,
      };
    });

    // Sort by score (ascending - lowest is best)
    scores.sort((a, b) => a.score - b.score);

    const payments = Array(4).fill(0);

    // 4th pays 1st
    const payment1 = (scores[3].score - scores[0].score) * gameState.betAmount;
    payments[scores[3].player] -= payment1;
    payments[scores[0].player] += payment1;

    // 3rd pays 2nd
    const payment2 = (scores[2].score - scores[1].score) * gameState.betAmount;
    payments[scores[2].player] -= payment2;
    payments[scores[1].player] += payment2;

    return payments;
  }

  // Calculate accumulated payments across all tables
  function calculateAccumulatedPayments() {
    const accumulatedPayments = Array(4).fill(0);
    
    gameState.tables.forEach(table => {
      const tablePayments = calculateTablePayments(table);
      tablePayments.forEach((payment, index) => {
        accumulatedPayments[index] += payment;
      });
    });

    return accumulatedPayments;
  }

  // Update status bar
  function updateStatusBar() {
    const accumulatedPayments = calculateAccumulatedPayments();
    
    statusBarBody.innerHTML = "";

    gameState.players.forEach((player, index) => {
      const accumulatedPaymentClass = accumulatedPayments[index] > 0
        ? "payment-positive"
        : accumulatedPayments[index] < 0
        ? "payment-negative"
        : "";

      const accumulatedPaymentText = accumulatedPayments[index] > 0
        ? `+${accumulatedPayments[index]}`
        : accumulatedPayments[index] < 0
        ? `${accumulatedPayments[index]}`
        : "0";

      const row = document.createElement("tr");
      row.innerHTML = `
        <td><span class="player-name">${player}:</span> <span class="${accumulatedPaymentClass}">${accumulatedPaymentText}</span></td>
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

    let output = `Mataan Session\n`;
    output += `Players: ${gameState.players.join(", ")}\n`;
    output += `Bet Amount: ${gameState.betAmount}\n\n`;

    // Table summaries
    gameState.tables.forEach((table, tableIndex) => {
        output += `=== TABLE ${tableIndex + 1} ===\n`;
        const tablePayments = calculateTablePayments(table);
        
        // Get player rankings for this table
        const scores = gameState.players.map((_, playerIndex) => ({
            player: playerIndex,
            score: calculatePlayerTotal(table, playerIndex) || 0,
        }));
        scores.sort((a, b) => a.score - b.score);

        // Show payments for this table
        gameState.players.forEach((player, index) => {
            const payment = tablePayments[index];
            const paymentText = payment > 0
                ? `+${payment}`
                : payment < 0
                ? `${payment}`
                : "0";
            
            // Add congratulatory messages
            let message = "";
            if (scores[0].player === index) {
                message = " 🏆 Congratulations!";
            } else if (scores[3].player === index) {
                message = " 👎 Boo!";
            }
            
            output += `${player}: ${paymentText}${message}\n`;
        });
        output += "\n";
    });

    // Grand total and accumulated payments
    output += `=== FINAL SUMMARY ===\n`;
    const accumulatedPayments = calculateAccumulatedPayments();
    
    // Get final rankings
    const finalScores = gameState.players.map((_, playerIndex) => ({
        player: playerIndex,
        score: calculatePlayerGrandTotal(playerIndex) || 0,
    }));
    finalScores.sort((a, b) => a.score - b.score);

    gameState.players.forEach((player, index) => {
        const payment = accumulatedPayments[index];
        const paymentText = payment > 0
            ? `+${payment}`
            : payment < 0
            ? `${payment}`
            : "0";
        
        // Add congratulatory messages for final standings
        let message = "";
        if (finalScores[0].player === index) {
            message = " 🏆";
        } else if (finalScores[3].player === index) {
            message = " 👎";
        }
        
        output += `${player}: ${paymentText}${message}\n`;
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