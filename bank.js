const STORAGE_KEY = "finex-state-v1";
const DEFAULT_CATEGORIES = [
  "Food",
  "Transport",
  "Housing",
  "Education",
  "Healthcare",
  "Internet and communication",
  "Entertainment",
  "Clothing",
  "Utilities",
  "Shopping",
  "Other"
];

const DEFAULT_INCOME_CATEGORIES = [
  "Salary",
  "Business",
  "Freelance",
  "Bonus",
  "Other"
];

const CURRENCY_LIST = ["XAF", "EUR", "USD"];
const CURRENCY_SYMBOLS = {
  XAF: "FCFA",
  EUR: "€",
  USD: "$"
};

const chartRegistry = {};

function createId(prefix = "id") {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function safeJSONParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

function getSampleState() {
  const today = new Date();
  const offsetDays = (days) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };

  return {
    selectedCurrency: "XAF",
    currentPeriod: "month",
    customStart: "",
    customEnd: "",
    categories: [...DEFAULT_CATEGORIES],
    incomeCategories: [...DEFAULT_INCOME_CATEGORIES],
    accounts: [
      { id: "cash", name: "Cash", currency: "XAF", balance: 320000, type: "Cash" },
      { id: "orange", name: "Orange Money", currency: "XAF", balance: 180000, type: "Mobile Money" },
      { id: "bank", name: "Main Bank", currency: "XAF", balance: 940000, type: "Bank" },
      { id: "savings", name: "Savings Wallet", currency: "XAF", balance: 520000, type: "Savings" }
    ],
    transactions: [
      { id: "txn-1", type: "income", title: "Monthly salary", amount: 650000, currency: "XAF", amountXaf: 650000, category: "Salary", date: offsetDays(-18), time: "09:00", accountId: "bank", description: "Main salary deposit", source: "Salary" },
      { id: "txn-2", type: "income", title: "Freelance design", amount: 240000, currency: "XAF", amountXaf: 240000, category: "Freelance", date: offsetDays(-7), time: "18:45", accountId: "orange", description: "Website redesign retainer", source: "Freelance" },
      { id: "txn-3", type: "expense", title: "Groceries", amount: 78000, currency: "XAF", amountXaf: 78000, category: "Food", date: offsetDays(-10), time: "17:30", accountId: "cash", description: "Monthly food supplies", paymentMethod: "Cash" },
      { id: "txn-4", type: "expense", title: "Transport", amount: 35000, currency: "XAF", amountXaf: 35000, category: "Transport", date: offsetDays(-9), time: "08:15", accountId: "cash", description: "Fuel and taxi spend", paymentMethod: "Cash" },
      { id: "txn-5", type: "expense", title: "Rent", amount: 220000, currency: "XAF", amountXaf: 220000, category: "Housing", date: offsetDays(-5), time: "10:00", accountId: "bank", description: "Apartment rent", paymentMethod: "Bank transfer" },
      { id: "txn-6", type: "expense", title: "Internet", amount: 26000, currency: "XAF", amountXaf: 26000, category: "Internet and communication", date: offsetDays(-3), time: "09:30", accountId: "bank", description: "Bundle and data", paymentMethod: "Bank card" },
      { id: "txn-7", type: "income", title: "Bonus", amount: 150000, currency: "XAF", amountXaf: 150000, category: "Bonus", date: offsetDays(-1), time: "15:00", accountId: "bank", description: "Performance bonus", source: "Bonus" },
      { id: "txn-8", type: "expense", title: "School fees", amount: 110000, currency: "XAF", amountXaf: 110000, category: "Education", date: offsetDays(-2), time: "12:15", accountId: "bank", description: "Course payment", paymentMethod: "Bank transfer" }
    ],
    budgets: [
      { id: "budget-1", name: "Monthly essentials", amount: 600000, currency: "XAF", category: "all", periodType: "monthly", alertThreshold: 75, startDate: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10), endDate: new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10) },
      { id: "budget-2", name: "Food budget", amount: 220000, currency: "XAF", category: "Food", periodType: "monthly", alertThreshold: 80, startDate: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10), endDate: new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10) }
    ],
    goals: [
      { id: "goal-1", name: "Emergency fund", targetAmount: 4000000, currency: "XAF", savedAmount: 2100000, deadline: offsetDays(180) },
      { id: "goal-2", name: "Travel plan", targetAmount: 2500000, currency: "XAF", savedAmount: 880000, deadline: offsetDays(240) }
    ],
    transfers: [],
    exchangeRates: { XAF: 1, EUR: null, USD: null },
    exchangeRateUpdatedAt: null,
    exchangeRateSource: "Manual fallback",
    lastActionMessage: ""
  };
}

function loadState() {
  const saved = safeJSONParse(localStorage.getItem(STORAGE_KEY), null);

  if (!saved) {
    const initialState = getSampleState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));
    return initialState;
  }

  const fallbackState = getSampleState();
  return {
    ...fallbackState,
    ...saved,
    accounts: Array.isArray(saved.accounts) ? saved.accounts : fallbackState.accounts,
    transactions: Array.isArray(saved.transactions) ? saved.transactions : fallbackState.transactions,
    budgets: Array.isArray(saved.budgets) ? saved.budgets : fallbackState.budgets,
    goals: Array.isArray(saved.goals) ? saved.goals : fallbackState.goals,
    transfers: Array.isArray(saved.transfers) ? saved.transfers : fallbackState.transfers,
    categories: Array.isArray(saved.categories) && saved.categories.length ? saved.categories : fallbackState.categories,
    incomeCategories: Array.isArray(saved.incomeCategories) && saved.incomeCategories.length ? saved.incomeCategories : fallbackState.incomeCategories,
    exchangeRates: { ...fallbackState.exchangeRates, ...(saved.exchangeRates || {}) }
  };
}

const state = loadState();

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getIdleSettings() {
  return {
    XAF: 1,
    EUR: Number(state.exchangeRates.EUR) || null,
    USD: Number(state.exchangeRates.USD) || null
  };
}

function getRateValue(currency) {
  if (currency === "XAF") return 1;
  const value = Number(state.exchangeRates[currency]);
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function convertAmount(amount, fromCurrency, toCurrency) {
  if (!Number.isFinite(amount)) return 0;
  if (fromCurrency === toCurrency) return amount;

  const fromRate = getRateValue(fromCurrency);
  const toRate = getRateValue(toCurrency);

  if (fromCurrency === "XAF") return amount / toRate;
  if (toCurrency === "XAF") return amount * fromRate;

  return amount * fromRate / toRate;
}

function formatAmount(value, currency = state.selectedCurrency) {
  const numeric = Number.isFinite(value) ? value : 0;
  const numberFormatter = new Intl.NumberFormat("fr-CM", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  return `${symbol} ${numberFormatter.format(numeric)}`;
}

function formatShortDate(dateText) {
  if (!dateText) return "—";
  const date = new Date(dateText + "T00:00:00");
  if (Number.isNaN(date.getTime())) return dateText;
  return new Intl.DateTimeFormat("fr-CM", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function formatCurrencyLabel(value, currency = state.selectedCurrency) {
  const formatted = new Intl.NumberFormat("fr-CM", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(Number(value || 0));

  if (currency === "XAF") return `${formatted} FCFA`;
  if (currency === "EUR") return `${formatted} €`;
  return `${formatted} $`;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeDate(dateString) {
  if (!dateString) return new Date();
  const parsed = new Date(dateString + "T00:00:00");
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function getPeriodRange(period) {
  const today = new Date();
  const end = new Date(today);
  end.setHours(23, 59, 59, 999);

  if (period === "today") {
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }

  if (period === "week") {
    const start = new Date(today);
    const day = start.getDay();
    const diff = (day === 0 ? -6 : 1 - day);
    start.setDate(today.getDate() + diff);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }

  if (period === "year") {
    const start = new Date(today.getFullYear(), 0, 1);
    return { start, end };
  }

  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  return { start, end };
}

function getCustomRange() {
  const start = state.customStart ? normalizeDate(state.customStart) : new Date();
  const end = state.customEnd ? normalizeDate(state.customEnd) : new Date();
  const safeEnd = new Date(end);
  safeEnd.setHours(23, 59, 59, 999);
  const safeStart = new Date(start);
  safeStart.setHours(0, 0, 0, 0);
  return { start: safeStart, end: safeEnd };
}

function getRangeForCurrentPeriod() {
  if (state.currentPeriod === "custom") {
    return getCustomRange();
  }
  return getPeriodRange(state.currentPeriod || "month");
}

function inDateRange(dateText, startDate, endDate) {
  if (!dateText) return false;
  const date = normalizeDate(dateText);
  return date >= startDate && date <= endDate;
}

function filterTransactionsByPeriod(list) {
  const { start, end } = getRangeForCurrentPeriod();
  return list.filter((item) => inDateRange(item.date, start, end));
}

function renderSelectOptions() {
  const expenseSelect = document.getElementById("expenseCategorySelect");
  const incomeSelect = document.getElementById("incomeCategorySelect");
  const accountExpenseSelect = document.getElementById("expenseAccountSelect");
  const accountIncomeSelect = document.getElementById("incomeAccountSelect");

  expenseSelect.innerHTML = state.categories
    .map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
    .join("");

  incomeSelect.innerHTML = state.incomeCategories
    .map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
    .join("");

  accountExpenseSelect.innerHTML = state.accounts
    .map((account) => `<option value="${account.id}">${escapeHtml(account.name)}</option>`)
    .join("");

  accountIncomeSelect.innerHTML = state.accounts
    .map((account) => `<option value="${account.id}">${escapeHtml(account.name)}</option>`)
    .join("");

  const transferFrom = document.getElementById("transferFrom");
  const transferTo = document.getElementById("transferTo");
  const goalSelect = document.getElementById("goalSelect");

  transferFrom.innerHTML = state.accounts
    .map((account) => `<option value="${account.id}">${escapeHtml(account.name)}</option>`)
    .join("");

  transferTo.innerHTML = state.accounts
    .map((account) => `<option value="${account.id}">${escapeHtml(account.name)}</option>`)
    .join("");

  goalSelect.innerHTML = state.goals
    .map((goal) => `<option value="${goal.id}">${escapeHtml(goal.name)}</option>`)
    .join("");

  if (state.accounts.length > 1 && transferFrom.value === transferTo.value) {
    transferTo.value = state.accounts.find((account) => account.id !== transferFrom.value)?.id || state.accounts[0].id;
  }

  const currentGoal = state.goals[0]?.id;
  if (currentGoal) {
    goalSelect.value = currentGoal;
  }
}

function getSelectedCurrencyAmount(amountXaf) {
  return convertAmount(amountXaf, "XAF", state.selectedCurrency);
}

function getExpensesForBudget(budget) {
  const expenses = state.transactions.filter((item) => item.type === "expense");
  const range = budget.startDate && budget.endDate ? { start: normalizeDate(budget.startDate), end: normalizeDate(budget.endDate) } : null;

  return expenses.filter((item) => {
    if (budget.category !== "all" && item.category !== budget.category) return false;
    if (!range) return true;
    return inDateRange(item.date, range.start, range.end);
  });
}

function renderDashboard() {
  const filtered = filterTransactionsByPeriod(state.transactions);
  const incomes = filtered.filter((item) => item.type === "income");
  const expenses = filtered.filter((item) => item.type === "expense");

  const totalIncome = incomes.reduce((sum, item) => sum + Number(item.amountXaf || 0), 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amountXaf || 0), 0);

  document.getElementById("totalIncomeValue").textContent = formatCurrencyLabel(getSelectedCurrencyAmount(totalIncome), state.selectedCurrency);
  document.getElementById("totalExpensesValue").textContent = formatCurrencyLabel(getSelectedCurrencyAmount(totalExpenses), state.selectedCurrency);
  document.getElementById("availableBalanceValue").textContent = formatCurrencyLabel(getSelectedCurrencyAmount(totalIncome - totalExpenses), state.selectedCurrency);

  const monthlyBudget = state.budgets.reduce((sum, budget) => {
    const budgetAmount = Number(budget.amount || 0);
    const allBudgetValue = convertAmount(budgetAmount, budget.currency || "XAF", state.selectedCurrency);
    return sum + allBudgetValue;
  }, 0);

  const unusedBudget = monthlyBudget - getSelectedCurrencyAmount(totalExpenses);
  document.getElementById("monthlyBudgetValue").textContent = formatCurrencyLabel(monthlyBudget, state.selectedCurrency);
  document.getElementById("remainingBudgetValue").textContent = formatCurrencyLabel(unusedBudget, state.selectedCurrency);

  const savingsTotal = state.goals.reduce((sum, goal) => sum + Number(goal.savedAmount || 0), 0);
  document.getElementById("savingsValue").textContent = formatCurrencyLabel(getSelectedCurrencyAmount(savingsTotal), state.selectedCurrency);

  renderRecentTransactions();
  renderIncomeExpenseChart(incomes, expenses);
  renderCategoryChart(expenses);
}

function renderRecentTransactions() {
  const tbody = document.getElementById("recentTransactionsTable");
  const filtered = [...state.transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 7);

  tbody.innerHTML = filtered.map((item) => {
    const displayAmount = formatCurrencyLabel(getSelectedCurrencyAmount(Number(item.amountXaf || 0)), state.selectedCurrency);
    return `
      <tr>
        <td><span class="badge ${item.type === "income" ? "income" : "expense"}">${escapeHtml(item.type)}</span></td>
        <td>${escapeHtml(item.title)}</td>
        <td>${escapeHtml(item.category || "General")}</td>
        <td>${escapeHtml(formatShortDate(item.date))}</td>
        <td>${escapeHtml(displayAmount)}</td>
      </tr>
    `;
  }).join("") || '<tr><td colspan="5">No transactions</td></tr>';
}

function renderIncomeExpenseChart(incomes, expenses) {
  const ctx = document.getElementById("incomeExpenseChart");
  const incomeValue = incomes.reduce((sum, item) => sum + Number(item.amountXaf || 0), 0);
  const expenseValue = expenses.reduce((sum, item) => sum + Number(item.amountXaf || 0), 0);

  if (chartRegistry.incomeExpenseChart) {
    chartRegistry.incomeExpenseChart.destroy();
  }

  chartRegistry.incomeExpenseChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Income", "Expenses"],
      datasets: [{
        label: "Amount",
        data: [
          getSelectedCurrencyAmount(incomeValue),
          getSelectedCurrencyAmount(expenseValue)
        ],
        backgroundColor: ["#16a34a", "#dc2626"],
        borderRadius: 10
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

function renderCategoryChart(expenses) {
  const ctx = document.getElementById("categoryChart");
  const totals = {};

  expenses.forEach((item) => {
    const category = item.category || "Other";
    totals[category] = (totals[category] || 0) + Number(item.amountXaf || 0);
  });

  const labels = Object.keys(totals);
  const values = labels.map((label) => getSelectedCurrencyAmount(totals[label]));

  if (chartRegistry.categoryChart) {
    chartRegistry.categoryChart.destroy();
  }

  chartRegistry.categoryChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: ["#2563eb", "#f59e0b", "#22c55e", "#ef4444", "#06b6d4", "#8b5cf6", "#ec4899", "#84cc16", "#f97316", "#14b8a6"]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } }
    }
  });
}

function renderAnalytics() {
  const allExpenses = state.transactions.filter((item) => item.type === "expense");
  const avgDaily = allExpenses.length
    ? allExpenses.reduce((sum, item) => sum + Number(item.amountXaf || 0), 0) / Math.max(allExpenses.length, 1)
    : 0;

  const categoryMap = {};
  allExpenses.forEach((item) => {
    const category = item.category || "Other";
    categoryMap[category] = (categoryMap[category] || 0) + Number(item.amountXaf || 0);
  });

  const highestCategory = Object.entries(categoryMap).sort((a, b) => b[1] - a[1])[0];
  const monthMap = {};
  state.transactions.forEach((item) => {
    const date = new Date(item.date + "T00:00:00");
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (item.type === "expense") {
      monthMap[key] = (monthMap[key] || 0) + Number(item.amountXaf || 0);
    }
  });

  const monthLabels = Object.keys(monthMap).sort();
  const monthlyValues = monthLabels.map((key) => getSelectedCurrencyAmount(monthMap[key]));
  document.getElementById("avgDailySpendingValue").textContent = formatCurrencyLabel(getSelectedCurrencyAmount(avgDaily), state.selectedCurrency);
  document.getElementById("highestCategoryValue").textContent = highestCategory ? `${highestCategory[0]} (${formatCurrencyLabel(getSelectedCurrencyAmount(highestCategory[1]), state.selectedCurrency)})` : "—";

  const trendDelta = monthlyValues.length > 1 ? monthlyValues[monthlyValues.length - 1] - monthlyValues[0] : 0;
  document.getElementById("monthlyTrendValue").textContent = `${trendDelta >= 0 ? "+" : ""}${formatCurrencyLabel(trendDelta, state.selectedCurrency)}`;

  if (chartRegistry.monthlyEvolutionChart) {
    chartRegistry.monthlyEvolutionChart.destroy();
  }

  chartRegistry.monthlyEvolutionChart = new Chart(document.getElementById("monthlyEvolutionChart"), {
    type: "line",
    data: {
      labels: monthLabels.length ? monthLabels : ["No data"],
      datasets: [{
        label: "Monthly spending",
        data: monthlyValues.length ? monthlyValues : [0],
        fill: false,
        borderColor: "#2563eb",
        tension: 0.35
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true } }
    }
  });

  const incomeValues = [];
  const expenseValues = [];
  const trendLabels = [];
  const monthSet = new Set();

  state.transactions.forEach((item) => {
    const date = new Date(item.date + "T00:00:00");
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthSet.add(key);
  });

  [...monthSet].sort().forEach((key) => {
    const monthDate = new Date(`${key}-01T00:00:00`);
    trendLabels.push(new Intl.DateTimeFormat("fr-CM", { month: "short", year: "2-digit" }).format(monthDate));
    const monthTransactions = state.transactions.filter((item) => {
      const d = new Date(item.date + "T00:00:00");
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === key;
    });

    incomeValues.push(
      monthTransactions
        .filter((item) => item.type === "income")
        .reduce((sum, item) => sum + Number(item.amountXaf || 0), 0)
    );

    expenseValues.push(
      monthTransactions
        .filter((item) => item.type === "expense")
        .reduce((sum, item) => sum + Number(item.amountXaf || 0), 0)
    );
  });

  if (chartRegistry.trendChart) {
    chartRegistry.trendChart.destroy();
  }

  chartRegistry.trendChart = new Chart(document.getElementById("trendChart"), {
    type: "bar",
    data: {
      labels: trendLabels.length ? trendLabels : ["No data"],
      datasets: [{
        label: "Income",
        data: incomeValues.length ? incomeValues.map((value) => getSelectedCurrencyAmount(value)) : [0],
        backgroundColor: "#16a34a",
        borderRadius: 6
      }, {
        label: "Expenses",
        data: expenseValues.length ? expenseValues.map((value) => getSelectedCurrencyAmount(value)) : [0],
        backgroundColor: "#dc2626",
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true } }
    }
  });
}

function renderTransactionTable() {
  const tableBody = document.getElementById("transactionTableBody");
  const searchText = document.getElementById("transactionSearch").value.trim().toLowerCase();
  const filterType = document.getElementById("transactionFilterType").value;

  const rows = [...state.transactions]
    .filter((item) => filterType === "all" || item.type === filterType)
    .filter((item) => !searchText || `${item.title} ${item.category} ${item.description}`.toLowerCase().includes(searchText))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  tableBody.innerHTML = rows.map((item) => `
    <tr>
      <td><span class="badge ${item.type === "income" ? "income" : "expense"}">${escapeHtml(item.type)}</span></td>
      <td>${escapeHtml(item.title)}</td>
      <td>${escapeHtml(item.category || "General")}</td>
      <td>${escapeHtml(state.accounts.find((account) => account.id === item.accountId)?.name || "—")}</td>
      <td>${escapeHtml(formatShortDate(item.date))}</td>
      <td>${escapeHtml(formatCurrencyLabel(getSelectedCurrencyAmount(Number(item.amountXaf || 0)), state.selectedCurrency))}</td>
      <td><button class="secondary-btn" data-delete-transaction="${item.id}">Delete</button></td>
    </tr>
  `).join("") || '<tr><td colspan="7">No transactions found</td></tr>';

  document.querySelectorAll("[data-delete-transaction]").forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.getAttribute("data-delete-transaction");
      state.transactions = state.transactions.filter((item) => item.id !== targetId);
      saveState();
      renderAll();
    });
  });
}

function renderBudgetTable() {
  const tableBody = document.getElementById("budgetTableBody");

  tableBody.innerHTML = state.budgets.map((budget) => {
    const spent = getExpensesForBudget(budget).reduce((sum, item) => sum + Number(item.amountXaf || 0), 0);
    const amountInSelectedCurrency = convertAmount(Number(budget.amount || 0), budget.currency || "XAF", state.selectedCurrency);
    const spentInSelectedCurrency = getSelectedCurrencyAmount(spent);
    const progress = budget.amount ? Math.min((spent / Number(budget.amount || 0)) * 100, 100) : 0;
    const thresholdExceeded = progress >= (Number(budget.alertThreshold || 75));

    return `
      <tr>
        <td>${escapeHtml(budget.name)}</td>
        <td>${escapeHtml(budget.category === "all" ? "All" : budget.category)}</td>
        <td>${escapeHtml(formatCurrencyLabel(amountInSelectedCurrency, state.selectedCurrency))}</td>
        <td>${escapeHtml(formatCurrencyLabel(spentInSelectedCurrency, state.selectedCurrency))}</td>
        <td>
          <div class="progress-box">
            <div class="progress"><span style="width:${Math.max(progress, 0)}%"></span></div>
            <small>${Math.round(progress)}%</small>
          </div>
        </td>
        <td><span class="badge ${thresholdExceeded ? "warning" : "income"}">${thresholdExceeded ? `${budget.alertThreshold}% reached` : "On track"}</span></td>
        <td><button class="secondary-btn" data-delete-budget="${budget.id}">Delete</button></td>
      </tr>
    `;
  }).join("") || '<tr><td colspan="7">No budgets yet</td></tr>';

  document.querySelectorAll("[data-delete-budget]").forEach((button) => {
    button.addEventListener("click", () => {
      const budgetId = button.getAttribute("data-delete-budget");
      state.budgets = state.budgets.filter((budget) => budget.id !== budgetId);
      saveState();
      renderAll();
    });
  });
}

function renderAccountsTable() {
  const tbody = document.getElementById("accountTableBody");

  tbody.innerHTML = state.accounts.map((account) => {
    const transactionCount = state.transactions.filter((item) => item.accountId === account.id).length;
    return `
      <tr>
        <td>${escapeHtml(account.name)}</td>
        <td>${escapeHtml(account.currency)}</td>
        <td>${escapeHtml(formatCurrencyLabel(Number(account.balance || 0), account.currency))}</td>
        <td>${escapeHtml(formatCurrencyLabel(Number(account.balance || 0), account.currency))}</td>
        <td>${transactionCount}</td>
      </tr>
    `;
  }).join("") || '<tr><td colspan="5">No accounts</td></tr>';
}

function renderGoalsTable() {
  const tbody = document.getElementById("goalsTableBody");

  tbody.innerHTML = state.goals.map((goal) => {
    const target = Number(goal.targetAmount || 0);
    const saved = Number(goal.savedAmount || 0);
    const percentage = target ? Math.min((saved / target) * 100, 100) : 0;
    return `
      <tr>
        <td>${escapeHtml(goal.name)}</td>
        <td>${escapeHtml(formatCurrencyLabel(convertAmount(target, goal.currency || "XAF", state.selectedCurrency), state.selectedCurrency))}</td>
        <td>${escapeHtml(formatCurrencyLabel(convertAmount(saved, goal.currency || "XAF", state.selectedCurrency), state.selectedCurrency))}</td>
        <td>
          <div class="progress-box">
            <div class="progress"><span style="width:${percentage}%"></span></div>
            <small>${Math.round(percentage)}%</small>
          </div>
        </td>
        <td>${escapeHtml(formatShortDate(goal.deadline))}</td>
      </tr>
    `;
  }).join("") || '<tr><td colspan="5">No goals</td></tr>';
}

function handleExpenseSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const rawCategory = String(formData.get("customCategory") || "").trim();
  const category = rawCategory || String(formData.get("category") || "Other");

  if (!state.categories.includes(category)) {
    state.categories.push(category);
  }

  const amount = Number(formData.get("amount"));
  const currency = String(formData.get("currency") || "XAF");
  const accountId = String(formData.get("accountId") || state.accounts[0]?.id);
  const account = state.accounts.find((item) => item.id === accountId);

  if (!account) {
    alert("Please create an account before adding an expense.");
    return;
  }

  const accountBalance = Number(account.balance || 0);
  const converted = convertAmount(amount, currency, account.currency);
  if (accountBalance < converted) {
    alert("This account does not have enough funds for this expense.");
    return;
  }

  account.balance = accountBalance - converted;

  state.transactions.push({
    id: createId("expense"),
    type: "expense",
    title: String(formData.get("title") || "Expense"),
    amount,
    currency,
    amountXaf: convertAmount(amount, currency, "XAF"),
    category,
    date: String(formData.get("date") || new Date().toISOString().slice(0, 10)),
    time: String(formData.get("time") || "00:00"),
    accountId,
    description: String(formData.get("description") || ""),
    paymentMethod: String(formData.get("paymentMethod") || "Cash"),
    receiptRef: String(formData.get("receiptRef") || "")
  });

  saveState();
  form.reset();
  renderSelectOptions();
  renderAll();
}

function handleIncomeSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const category = String(formData.get("category") || "Other");

  if (!state.incomeCategories.includes(category)) {
    state.incomeCategories.push(category);
  }

  const amount = Number(formData.get("amount"));
  const currency = String(formData.get("currency") || "XAF");
  const accountId = String(formData.get("accountId") || state.accounts[0]?.id);
  const account = state.accounts.find((item) => item.id === accountId);

  if (!account) {
    alert("Please create an account before adding income.");
    return;
  }

  const converted = convertAmount(amount, currency, account.currency);
  account.balance = Number(account.balance || 0) + converted;

  state.transactions.push({
    id: createId("income"),
    type: "income",
    title: String(formData.get("title") || "Income"),
    amount,
    currency,
    amountXaf: convertAmount(amount, currency, "XAF"),
    category,
    date: String(formData.get("date") || new Date().toISOString().slice(0, 10)),
    time: String(formData.get("time") || "00:00"),
    accountId,
    description: String(formData.get("description") || ""),
    source: String(formData.get("source") || "Income")
  });

  saveState();
  form.reset();
  renderSelectOptions();
  renderAll();
}

function handleBudgetSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const startDate = String(formData.get("startDate") || new Date().toISOString().slice(0, 10));
  const endDate = String(formData.get("endDate") || startDate);

  state.budgets.push({
    id: createId("budget"),
    name: String(formData.get("name") || "Custom budget"),
    amount: Number(formData.get("amount") || 0),
    currency: String(formData.get("currency") || "XAF"),
    category: String(formData.get("category") || "all"),
    periodType: String(formData.get("periodType") || "monthly"),
    alertThreshold: Number(formData.get("alertThreshold") || 75),
    startDate,
    endDate
  });

  saveState();
  form.reset();
  renderAll();
}

function handleAccountSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const name = String(formData.get("name") || "New Account");
  const currency = String(formData.get("currency") || "XAF");
  const initialBalance = Number(formData.get("initialBalance") || 0);

  state.accounts.push({
    id: createId("account"),
    name,
    currency,
    balance: initialBalance,
    type: "Custom"
  });

  saveState();
  form.reset();
  renderAll();
}

function handleTransferSubmit(event) {
  event.preventDefault();
  const fromId = document.getElementById("transferFrom").value;
  const toId = document.getElementById("transferTo").value;
  const amount = Number(document.getElementById("transferAmount").value || 0);
  const currency = document.getElementById("transferCurrency").value;

  if (fromId === toId) {
    alert("Select two different accounts for the transfer.");
    return;
  }

  const fromAccount = state.accounts.find((item) => item.id === fromId);
  const toAccount = state.accounts.find((item) => item.id === toId);

  if (!fromAccount || !toAccount) {
    alert("Missing account information.");
    return;
  }

  const convertedFrom = convertAmount(amount, currency, fromAccount.currency);
  if (Number(fromAccount.balance || 0) < convertedFrom) {
    alert("Insufficient funds for this transfer.");
    return;
  }

  const convertedTo = convertAmount(amount, currency, toAccount.currency);
  fromAccount.balance = Number(fromAccount.balance || 0) - convertedFrom;
  toAccount.balance = Number(toAccount.balance || 0) + convertedTo;

  state.transfers.push({
    id: createId("transfer"),
    fromId,
    toId,
    amount,
    currency,
    date: new Date().toISOString().slice(0, 10)
  });

  saveState();
  document.getElementById("transferForm").reset();
  renderAll();
}

function handleGoalSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);

  state.goals.push({
    id: createId("goal"),
    name: String(formData.get("name") || "New Goal"),
    targetAmount: Number(formData.get("targetAmount") || 0),
    currency: String(formData.get("currency") || "XAF"),
    savedAmount: 0,
    deadline: String(formData.get("deadline") || new Date().toISOString().slice(0, 10))
  });

  saveState();
  form.reset();
  renderAll();
}

function handleGoalContributionSubmit(event) {
  event.preventDefault();
  const goalId = document.getElementById("goalSelect").value;
  const amount = Number(document.getElementById("goalAmount").value || 0);
  const type = document.getElementById("goalContributionType").value;
  const goal = state.goals.find((item) => item.id === goalId);

  if (!goal) return;
  if (!amount || amount <= 0) {
    alert("Please enter a valid amount.");
    return;
  }

  if (type === "contribution") {
    goal.savedAmount = Number(goal.savedAmount || 0) + amount;
  } else {
    goal.savedAmount = Math.max(0, Number(goal.savedAmount || 0) - amount);
  }

  saveState();
  document.getElementById("goalContributionForm").reset();
  renderAll();
}

function updateExchangeRateFields() {
  const eurInput = document.getElementById("rateEUR");
  const usdInput = document.getElementById("rateUSD");
  const updateInput = document.getElementById("lastRateUpdate");
  const sourceInput = document.getElementById("rateSource");

  eurInput.value = Number(state.exchangeRates.EUR || 0) || "";
  usdInput.value = Number(state.exchangeRates.USD || 0) || "";
  updateInput.value = state.exchangeRateUpdatedAt ? new Intl.DateTimeFormat("fr-CM", { dateStyle: "medium", timeStyle: "short" }).format(new Date(state.exchangeRateUpdatedAt)) : "Not set";
  sourceInput.value = state.exchangeRateSource || "Manual";
}

function handleExchangeRateSubmit(event) {
  event.preventDefault();
  const eurValue = Number(document.getElementById("rateEUR").value || 0);
  const usdValue = Number(document.getElementById("rateUSD").value || 0);

  state.exchangeRates = {
    XAF: 1,
    EUR: eurValue > 0 ? eurValue : null,
    USD: usdValue > 0 ? usdValue : null
  };
  state.exchangeRateUpdatedAt = new Date().toISOString();
  state.exchangeRateSource = "Manual configuration";

  saveState();
  updateExchangeRateFields();
  renderAll();
}

async function refreshExchangeRates() {
  try {
    const [eurResponse, usdResponse] = await Promise.all([
      fetch("https://api.frankfurter.app/latest?from=EUR&to=XAF"),
      fetch("https://api.frankfurter.app/latest?from=USD&to=XAF")
    ]);

    if (!eurResponse.ok || !usdResponse.ok) {
      throw new Error("Rate fetch failed");
    }

    const eurData = await eurResponse.json();
    const usdData = await usdResponse.json();
    const eurRate = Number(eurData.rates?.XAF);
    const usdRate = Number(usdData.rates?.XAF);

    if (Number.isFinite(eurRate) && Number.isFinite(usdRate) && eurRate > 0 && usdRate > 0) {
      state.exchangeRates = { XAF: 1, EUR: eurRate, USD: usdRate };
      state.exchangeRateUpdatedAt = new Date().toISOString();
      state.exchangeRateSource = "Frankfurter API";
    }
  } catch (error) {
    if (!state.exchangeRates.EUR && !state.exchangeRates.USD) {
      state.exchangeRates = { XAF: 1, EUR: null, USD: null };
      state.exchangeRateSource = "Manual only";
    }
  }

  saveState();
  updateExchangeRateFields();
  renderAll();
}

function renderAll() {
  renderSelectOptions();
  updateExchangeRateFields();
  renderDashboard();
  renderTransactionTable();
  renderBudgetTable();
  renderAccountsTable();
  renderGoalsTable();
  renderAnalytics();

  document.getElementById("currencySelector").value = state.selectedCurrency;
  document.getElementById("customStart").value = state.customStart || "";
  document.getElementById("customEnd").value = state.customEnd || "";
  document.getElementById("customRangeWrap").classList.toggle("hidden", state.currentPeriod !== "custom");
}

function activatePanel(targetId) {
  document.querySelectorAll(".panel").forEach((panel) => panel.classList.toggle("active", panel.id === targetId));
  document.querySelectorAll(".nav-link").forEach((button) => button.classList.toggle("active", button.dataset.target === targetId));
}

document.querySelectorAll(".nav-link").forEach((button) => {
  button.addEventListener("click", () => activatePanel(button.dataset.target));
});

document.querySelectorAll(".period-btn").forEach((button) => {
  button.addEventListener("click", () => {
    state.currentPeriod = button.dataset.period;
    document.querySelectorAll(".period-btn").forEach((item) => item.classList.toggle("active", item === button));
    renderAll();
  });
});

document.getElementById("currencySelector").addEventListener("change", (event) => {
  state.selectedCurrency = event.target.value;
  saveState();
  renderAll();
});

document.getElementById("refreshRatesBtn").addEventListener("click", () => {
  refreshExchangeRates();
});

document.getElementById("expenseForm").addEventListener("submit", handleExpenseSubmit);
document.getElementById("incomeForm").addEventListener("submit", handleIncomeSubmit);
document.getElementById("budgetForm").addEventListener("submit", handleBudgetSubmit);
document.getElementById("accountForm").addEventListener("submit", handleAccountSubmit);
document.getElementById("transferForm").addEventListener("submit", handleTransferSubmit);
document.getElementById("goalForm").addEventListener("submit", handleGoalSubmit);
document.getElementById("goalContributionForm").addEventListener("submit", handleGoalContributionSubmit);
document.getElementById("exchangeRateForm").addEventListener("submit", handleExchangeRateSubmit);

document.getElementById("transactionSearch").addEventListener("input", renderTransactionTable);
document.getElementById("transactionFilterType").addEventListener("change", renderTransactionTable);

document.getElementById("applyCustomRangeBtn").addEventListener("click", () => {
  state.customStart = document.getElementById("customStart").value;
  state.customEnd = document.getElementById("customEnd").value;
  saveState();
  renderAll();
});

(function initializeDefaults() {
  const today = new Date().toISOString().slice(0, 10);
  document.querySelector('input[name="date"][type="date"]').value = today;
  document.querySelector('input[name="date"][type="date"]')?.setAttribute('value', today);

  const expenseDateInput = document.querySelector("#expenseForm input[name='date']");
  const incomeDateInput = document.querySelector("#incomeForm input[name='date']");
  if (expenseDateInput) expenseDateInput.value = today;
  if (incomeDateInput) incomeDateInput.value = today;

  const budgetStartDate = new Date();
  const budgetEndDate = new Date();
  budgetEndDate.setMonth(budgetEndDate.getMonth() + 1);

  const budgetStartInput = document.querySelector("#budgetForm input[name='startDate']");
  const budgetEndInput = document.querySelector("#budgetForm input[name='endDate']");
  if (budgetStartInput) budgetStartInput.value = budgetStartDate.toISOString().slice(0, 10);
  if (budgetEndInput) budgetEndInput.value = budgetEndDate.toISOString().slice(0, 10);

  document.getElementById("goalForm").querySelector('input[name="deadline"]').value = new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().slice(0, 10);
})();

if (navigator.serviceWorker) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => console.warn("PWA not available", error));
  });
}

renderAll();
refreshExchangeRates();
