/* PocketTrack application
   Main ideas: state (transactions array), render functions, event listeners, LocalStorage.
*/
"use strict";

const STORAGE_KEY = "pockettrack_transactions_v1";
const THEME_KEY = "pockettrack_theme_v1";

const CATEGORIES = {
  expense: ["Food & Drink", "Transportation", "Shopping", "Bills & Utilities", "Health", "Entertainment", "Education", "Other"],
  income: ["Salary", "Freelance", "Business", "Allowance", "Investment", "Gift", "Other"]
};

let transactions = loadTransactions();
let toastTimer;

// ---------- DOM references ----------
const $ = (selector) => document.querySelector(selector);
const transactionModal = $("#transactionModal");
const transactionForm = $("#transactionForm");
const transactionTable = $("#transactionTable");
const recentTransactions = $("#recentTransactions");

// ---------- Helpers ----------
function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0
  }).format(value);
}

function formatDate(dateString) {
  if (!dateString) return "—";
  // Add a time component to avoid timezone shifting for date-only values.
  return new Date(`${dateString}T12:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric"
  });
}

function todayString() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  return `tx-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeText(value) {
  // Used only when a string must be included in generated HTML attributes/text.
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

// ---------- LocalStorage ----------
function loadTransactions() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    // Basic shape validation protects the app from malformed stored data.
    return parsed.filter((item) =>
      item && typeof item.id === "string" &&
      ["income", "expense"].includes(item.type) &&
      typeof item.description === "string" &&
      Number.isFinite(Number(item.amount)) && Number(item.amount) > 0 &&
      typeof item.category === "string" &&
      typeof item.date === "string"
    ).map((item) => ({ ...item, amount: Number(item.amount) }));
  } catch (error) {
    console.warn("PocketTrack could not read saved transactions:", error);
    return [];
  }
}

function saveTransactions() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (error) {
    console.error("PocketTrack could not save transactions:", error);
    showToast("Unable to save. Check your browser storage.");
  }
}

// ---------- Calculations ----------
function calculateTotals(list) {
  return list.reduce((totals, transaction) => {
    if (transaction.type === "income") totals.income += transaction.amount;
    else totals.expenses += transaction.amount;
    totals.balance = totals.income - totals.expenses;
    return totals;
  }, { income: 0, expenses: 0, balance: 0 });
}

function getCurrentMonthTransactions() {
  const month = todayString().slice(0, 7);
  return transactions.filter((item) => item.date.slice(0, 7) === month);
}

// ---------- Rendering ----------
function renderSummary() {
  const totals = calculateTotals(transactions);
  $("#totalBalance").textContent = formatCurrency(totals.balance);
  $("#totalIncome").textContent = formatCurrency(totals.income);
  $("#totalExpenses").textContent = formatCurrency(totals.expenses);

  const monthly = calculateTotals(getCurrentMonthTransactions());
  $("#monthIncome").textContent = formatCurrency(monthly.income);
  $("#monthExpenses").textContent = formatCurrency(monthly.expenses);
  $("#monthNet").textContent = formatCurrency(monthly.balance);
}

function transactionIcon(item) {
  if (item.type === "income") return "↗";
  const icons = {
    "Food & Drink": "☕", Transportation: "↗", Shopping: "◇",
    "Bills & Utilities": "⌂", Health: "＋", Entertainment: "♫",
    Education: "▤", Other: "•"
  };
  return icons[item.category] || "•";
}

function renderTransactionItem(item) {
  const sign = item.type === "income" ? "+" : "−";
  const amountClass = item.type === "income" ? "amount-income" : "amount-expense";
  return `
    <div class="transaction-item">
      <div class="transaction-symbol">${transactionIcon(item)}</div>
      <div class="transaction-meta">
        <strong>${escapeText(item.description)}</strong>
        <small>${escapeText(item.category)} · ${formatDate(item.date)}</small>
      </div>
      <span class="transaction-amount ${amountClass}">${sign} ${formatCurrency(item.amount)}</span>
    </div>`;
}

function renderRecentTransactions() {
  const latest = [...transactions].sort((a, b) =>
    b.date.localeCompare(a.date)
  ).slice(0, 5);

  recentTransactions.innerHTML = latest.length
    ? latest.map(renderTransactionItem).join("")
    : `<div class="empty-state"><strong>No transactions yet</strong>Add your first income or expense to see it here.</div>`;
}

function getFilteredTransactions() {
  const search = $("#searchInput").value.trim().toLowerCase();
  const type = $("#typeFilter").value;
  const category = $("#categoryFilter").value;
  const sort = $("#sortSelect").value;

  const filtered = transactions.filter((item) => {
    const matchesSearch = `${item.description} ${item.category}`.toLowerCase().includes(search);
    const matchesType = type === "all" || item.type === type;
    const matchesCategory = category === "all" || item.category === category;
    return matchesSearch && matchesType && matchesCategory;
  });

  return filtered.sort((a, b) => {
    if (sort === "oldest") return a.date.localeCompare(b.date);
    if (sort === "highest") return b.amount - a.amount;
    if (sort === "lowest") return a.amount - b.amount;
    return b.date.localeCompare(a.date);
  });
}

function renderTransactionTable() {
  const filtered = getFilteredTransactions();
  transactionTable.innerHTML = filtered.length ? filtered.map((item) => {
    const sign = item.type === "income" ? "+" : "−";
    const amountClass = item.type === "income" ? "amount-income" : "amount-expense";
    return `
      <tr>
        <td>${escapeText(item.description)}</td>
        <td><span class="category-tag">${escapeText(item.category)}</span></td>
        <td>${formatDate(item.date)}</td>
        <td class="${amountClass}">${sign} ${formatCurrency(item.amount)}</td>
        <td><div class="row-actions">
          <button class="small-action" data-action="edit" data-id="${escapeText(item.id)}" type="button">Edit</button>
          <button class="small-action" data-action="delete" data-id="${escapeText(item.id)}" type="button">Delete</button>
        </div></td>
      </tr>`;
  }).join("") : `<tr><td colspan="5"><div class="empty-state"><strong>No matching transactions</strong>Try changing your search or filters.</div></td></tr>`;

  $("#resultCount").textContent = `${filtered.length} ${filtered.length === 1 ? "transaction" : "transactions"}`;
}

function renderBreakdown(target, list) {
  const expenses = list.filter((item) => item.type === "expense");
  const totalsByCategory = expenses.reduce((result, item) => {
    result[item.category] = (result[item.category] || 0) + item.amount;
    return result;
  }, {});
  const entries = Object.entries(totalsByCategory).sort((a, b) => b[1] - a[1]);
  const grandTotal = expenses.reduce((sum, item) => sum + item.amount, 0);

  target.innerHTML = entries.length ? entries.map(([category, amount]) => {
    const percentage = grandTotal ? (amount / grandTotal) * 100 : 0;
    return `
      <div>
        <div class="category-row-top"><strong>${escapeText(category)}</strong><span>${formatCurrency(amount)} · ${percentage.toFixed(0)}%</span></div>
        <div class="progress-track"><div class="progress-fill" style="width:${percentage.toFixed(2)}%"></div></div>
      </div>`;
  }).join("") : `<div class="empty-state"><strong>No expenses to show</strong>Your expense categories will appear here.</div>`;
}

function populateCategorySelects() {
  const categorySelect = $("#category");
  const currentType = document.querySelector('input[name="type"]:checked').value;
  const previous = categorySelect.value;
  categorySelect.innerHTML = CATEGORIES[currentType]
    .map((category) => `<option value="${escapeText(category)}">${escapeText(category)}</option>`).join("");
  if (CATEGORIES[currentType].includes(previous)) categorySelect.value = previous;

  const filter = $("#categoryFilter");
  const selected = filter.value;
  const allCategories = [...new Set(transactions.map((item) => item.category))].sort();
  filter.innerHTML = `<option value="all">All categories</option>` +
    allCategories.map((category) => `<option value="${escapeText(category)}">${escapeText(category)}</option>`).join("");
  if (allCategories.includes(selected)) filter.value = selected;
}

function renderAll() {
  renderSummary();
  renderRecentTransactions();
  renderTransactionTable();
  renderBreakdown($("#categoryBreakdown"), transactions);
  renderBreakdown($("#reportBreakdown"), getCurrentMonthTransactions());
  populateCategorySelects();
}

// ---------- Modal and form ----------
function openModal(transaction = null) {
  transactionForm.reset();
  $("#formError").textContent = "";
  $("#transactionId").value = transaction ? transaction.id : "";
  document.querySelector(`input[name="type"][value="${transaction ? transaction.type : "expense"}"]`).checked = true;
  populateCategorySelects();
  $("#modalTitle").textContent = transaction ? "Edit transaction" : "Add transaction";
  $("#saveTransaction").textContent = transaction ? "Update transaction" : "Save transaction";
  $("#description").value = transaction ? transaction.description : "";
  $("#amount").value = transaction ? transaction.amount : "";
  $("#transactionDate").value = transaction ? transaction.date : todayString();
  if (transaction) $("#category").value = transaction.category;
  transactionModal.classList.add("open");
  transactionModal.setAttribute("aria-hidden", "false");
  $("#description").focus();
}

function closeModal() {
  transactionModal.classList.remove("open");
  transactionModal.setAttribute("aria-hidden", "true");
  transactionForm.reset();
  $("#formError").textContent = "";
}

function handleFormSubmit(event) {
  event.preventDefault();
  const id = $("#transactionId").value;
  const type = document.querySelector('input[name="type"]:checked').value;
  const description = $("#description").value.trim();
  const amount = Number($("#amount").value);
  const category = $("#category").value;
  const date = $("#transactionDate").value;

  if (!description || !category || !date) {
    $("#formError").textContent = "Please complete all fields.";
    return;
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    $("#formError").textContent = "Please enter an amount greater than zero.";
    return;
  }

  const record = { id: id || createId(), type, description, amount, category, date };
  if (id) {
    transactions = transactions.map((item) => item.id === id ? record : item);
    showToast("Transaction updated.");
  } else {
    transactions.push(record);
    showToast("Transaction added.");
  }

  saveTransactions();
  closeModal();
  renderAll();
}

// ---------- Navigation ----------
function showPage(pageName) {
  const pageMap = {
    overview: { element: $("#overviewPage"), title: "Overview" },
    transactions: { element: $("#transactionsPage"), title: "Transactions" },
    reports: { element: $("#reportsPage"), title: "Reports" }
  };
  if (!pageMap[pageName]) pageName = "overview";

  Object.values(pageMap).forEach((page) => page.element.classList.remove("active-page"));
  pageMap[pageName].element.classList.add("active-page");
  document.querySelectorAll(".nav-link[data-page]").forEach((link) => {
    link.classList.toggle("active", link.dataset.page === pageName);
  });
  $("#pageTitle").textContent = pageMap[pageName].title;
  $("#sidebar").classList.remove("open");
  if (pageName === "transactions") renderTransactionTable();
}

function handleNavigation(event) {
  const link = event.target.closest("[data-page]");
  if (!link) return;
  event.preventDefault();
  showPage(link.dataset.page);
}

function exportTransactions() {
  if (!transactions.length) {
    showToast("There are no transactions to export yet.");
    return;
  }
  const headers = ["id", "type", "description", "amount", "category", "date"];
  const rows = transactions.map((item) => headers.map((key) =>
    `"${String(item[key]).replace(/"/g, '""')}"`
  ).join(","));
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `pockettrack-transactions-${todayString()}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  showToast("CSV export started.");
}

// ---------- Event listeners ----------
$("#openAddModal").addEventListener("click", () => openModal());
$("#openAddModal2").addEventListener("click", () => openModal());
$("#closeModal").addEventListener("click", closeModal);
$("#cancelModal").addEventListener("click", closeModal);
transactionForm.addEventListener("submit", handleFormSubmit);
document.querySelectorAll('input[name="type"]').forEach((radio) =>
  radio.addEventListener("change", populateCategorySelects)
);
transactionModal.addEventListener("click", (event) => {
  if (event.target === transactionModal) closeModal();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && transactionModal.classList.contains("open")) closeModal();
});
$("#sidebar").addEventListener("click", handleNavigation);
document.querySelectorAll("[data-go]").forEach((button) =>
  button.addEventListener("click", () => showPage(button.dataset.go))
);
$("#searchInput").addEventListener("input", renderTransactionTable);
$("#typeFilter").addEventListener("change", renderTransactionTable);
$("#categoryFilter").addEventListener("change", renderTransactionTable);
$("#sortSelect").addEventListener("change", renderTransactionTable);
transactionTable.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const item = transactions.find((transaction) => transaction.id === button.dataset.id);
  if (!item) return;

  if (button.dataset.action === "edit") {
    openModal(item);
  } else if (button.dataset.action === "delete") {
    const confirmed = window.confirm(`Delete "${item.description}"? This cannot be undone.`);
    if (!confirmed) return;
    transactions = transactions.filter((transaction) => transaction.id !== item.id);
    saveTransactions();
    renderAll();
    showToast("Transaction deleted.");
  }
});
$("#exportCsv").addEventListener("click", exportTransactions);
$("#menuToggle").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
$("#themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem(THEME_KEY, document.body.classList.contains("dark") ? "dark" : "light");
});

// ---------- Initial setup ----------
function initializeApp() {
  if (localStorage.getItem(THEME_KEY) === "dark") document.body.classList.add("dark");
  $("#todayLabel").textContent = new Date().toLocaleDateString("en-US", {
    weekday: "short", day: "numeric", month: "short", year: "numeric"
  });
  $("#year").textContent = new Date().getFullYear();
  $("#transactionDate").value = todayString();
  populateCategorySelects();
  renderAll();
}
initializeApp();
