// Shared navigation
function openSystem(id) {
    document.getElementById("home").classList.add("hidden");
    document.getElementById("travel").classList.add("hidden");
    document.getElementById("population").classList.add("hidden");
    document.getElementById(id).classList.remove("hidden");
    window.scrollTo(0, 0);
}
function goHome() {
    document.getElementById("travel").classList.add("hidden");
    document.getElementById("population").classList.add("hidden");
    document.getElementById("home").classList.remove("hidden");
    window.scrollTo(0, 0);
}

// Travel Expenses Tracker
const rates = {
    PHP: 1,
    USD: 58.5,
    EUR: 63.4,
    GBP: 74,
    JPY: 0.38,
    AUD: 38.8,
    CAD: 43.2,
    SGD: 43.1,
};
const travelDefaults = {
    destination: "Japan",
    tripLength: 30,
    homeCurrency: "PHP",
    localCurrency: "JPY",
    budget: 32000,
    expenses: [
        { id: 1, name: "Flight", category: "Flight", amount: 850 },
        {
            id: 2,
            name: "Apartment rent",
            category: "Accommodation",
            amount: 600,
        },
        { id: 3, name: "Food & daily needs", category: "Food", amount: 320 },
    ],
};
let travelState = loadTravel();
function loadTravel() {
    try {
        const saved = JSON.parse(localStorage.getItem("fe2TravelBudget"));
        return saved && Array.isArray(saved.expenses)
            ? saved
            : structuredClone(travelDefaults);
    } catch (e) {
        return structuredClone(travelDefaults);
    }
}
function saveTravel() {
    localStorage.setItem("fe2TravelBudget", JSON.stringify(travelState));
}
function money(value, currency) {
    try {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency,
            maximumFractionDigits: 0,
        }).format(value);
    } catch (e) {
        return value.toFixed(0) + " " + currency;
    }
}
function exchangeRate() {
    return (
        (rates[travelState.localCurrency] || 1) /
        (rates[travelState.homeCurrency] || 1)
    );
}
function syncTravelInputs() {
    [
        "destination",
        "tripLength",
        "homeCurrency",
        "localCurrency",
        "budgetInput",
    ].forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        const key = { budgetInput: "budget" }[id] || id;
        el.value = travelState[key];
    });
}
function updateTravelFromInputs() {
    travelState.destination =
        document.getElementById("destination").value.trim() ||
        "Your destination";
    travelState.tripLength = Math.max(
        1,
        Number(document.getElementById("tripLength").value) || 1,
    );
    travelState.homeCurrency =
        document.getElementById("homeCurrency").value;
    travelState.localCurrency =
        document.getElementById("localCurrency").value;
    travelState.budget = Math.max(
        0,
        Number(document.getElementById("budgetInput").value) || 0,
    );
    saveTravel();
    renderTravel();
}
function renderTravel() {
    const total = travelState.expenses.reduce(
        (s, x) => s + Number(x.amount || 0),
        0,
    ),
        remaining = travelState.budget - total,
        daily = travelState.budget / Math.max(1, travelState.tripLength),
        rate = exchangeRate(),
        pct = travelState.budget > 0 ? (total / travelState.budget) * 100 : 0;
    const home = travelState.homeCurrency,
        local = travelState.localCurrency;
    document.getElementById("budgetTotal").textContent = money(
        travelState.budget,
        home,
    );
    document.getElementById("remainingBudget").textContent = money(
        remaining,
        home,
    );
    document.getElementById("plannedSpend").textContent = money(
        total,
        home,
    );
    document.getElementById("dailyAllowance").textContent = money(
        daily,
        home,
    );
    document.getElementById("emergencyFund").textContent = money(
        travelState.budget * 0.15,
        home,
    );
    document.getElementById("currencyRate").textContent = rate.toFixed(2);
    document.getElementById("spentPercent").textContent =
        Math.max(0, pct).toFixed(0) + "%";
    document.getElementById("budgetProgress").style.width =
        Math.min(100, Math.max(0, pct)) + "%";
    document.getElementById("exchangeRateValue").textContent =
        rate.toFixed(2) + " " + local;
    document.getElementById("budgetLocalValue").textContent = money(
        travelState.budget * rate,
        local,
    );
    document.getElementById("dailyBudgetLocalValue").textContent = money(
        daily * rate,
        local,
    );
    const list = document.getElementById("expenseList");
    list.innerHTML = "";
    if (!travelState.expenses.length) {
        list.innerHTML =
            '<li class="empty">No expenses have been added yet.</li>';
        return;
    }
    travelState.expenses.forEach((item) => {
        const li = document.createElement("li");
        li.className = "expense-item";
        const left = document.createElement("div");
        const name = document.createElement("strong");
        name.textContent = item.name;
        const meta = document.createElement("div");
        meta.className = "expense-meta";
        meta.textContent = item.category;
        left.append(name, meta);
        const right = document.createElement("div");
        right.style.display = "flex";
        right.style.alignItems = "center";
        right.style.gap = "10px";
        const amount = document.createElement("strong");
        amount.textContent = money(item.amount, home);
        const del = document.createElement("button");
        del.className = "delete";
        del.textContent = "Delete";
        del.onclick = () => {
            travelState.expenses = travelState.expenses.filter(
                (x) => x.id !== item.id,
            );
            saveTravel();
            renderTravel();
        };
        right.append(amount, del);
        li.append(left, right);
        list.append(li);
    });
}
document.getElementById("addExpenseBtn").addEventListener("click", () => {
    const name = document.getElementById("expenseName").value.trim(),
        amount = Number(document.getElementById("expenseAmount").value),
        category = document.getElementById("expenseCategory").value;
    if (!name || !Number.isFinite(amount) || amount <= 0) {
        alert(
            "Please enter a valid expense name and an amount greater than zero.",
        );
        return;
    }
    travelState.expenses.push({ id: Date.now(), name, category, amount });
    document.getElementById("expenseName").value = "";
    document.getElementById("expenseAmount").value = "";
    saveTravel();
    renderTravel();
});
[
    "destination",
    "tripLength",
    "homeCurrency",
    "localCurrency",
    "budgetInput",
].forEach((id) =>
    document
        .getElementById(id)
        .addEventListener("input", updateTravelFromInputs),
);
function resetTravel() {
    if (!confirm("Reset the whole travel budget plan?")) return;
    travelState = structuredClone(travelDefaults);
    saveTravel();
    syncTravelInputs();
    renderTravel();
}
syncTravelInputs();
renderTravel();

// Population Simulation Model
function fmt(n) {
    return Number(n).toFixed(2);
}
function runSimulation() {
    const p0 = Number(document.getElementById("initialPop").value),
        rate = Number(document.getElementById("popRate").value) / 100,
        years = Number(document.getElementById("years").value),
        K = Number(document.getElementById("capacity").value);
    if (
        !Number.isFinite(p0) ||
        p0 <= 0 ||
        !Number.isFinite(rate) ||
        rate < 0 ||
        rate > 1 ||
        !Number.isInteger(years) ||
        years < 1 ||
        years > 50 ||
        !Number.isFinite(K) ||
        K <= 0
    ) {
        alert(
            "Enter a positive initial population and carrying capacity, a rate from 0 to 100, and 1 to 50 whole years.",
        );
        return;
    }
    if (K <= p0) {
        alert(
            "For the constrained-growth model, carrying capacity must be greater than the initial population.",
        );
        return;
    }
    const rows = [];
    for (let t = 1; t <= years; t++) {
        const growth = p0 * Math.exp(rate * t),
            decay = p0 * Math.exp(-rate * t),
            constrained = K / (1 + ((K - p0) / p0) * Math.exp(-rate * t)),
            constrainedDecay = p0 * Math.exp(-rate * 0.9 * t);
        rows.push({ t, growth, decay, constrained, constrainedDecay });
    }
    document.getElementById("summaryInitial").textContent = fmt(p0);
    document.getElementById("summaryGrowth").textContent = fmt(
        rows.at(-1).growth,
    );
    document.getElementById("summaryDecay").textContent = fmt(
        rows.at(-1).decay,
    );
    document.getElementById("populationRows").innerHTML = rows
        .map(
            (r) =>
                `<tr><td>${r.t}</td><td>${fmt(r.growth)}</td><td>${fmt(r.decay)}</td><td>${fmt(r.constrained)}</td><td>${fmt(r.constrainedDecay)}</td></tr>`,
        )
        .join("");
    drawChart(
        [
            { key: "growth", color: "#6ee7b7" },
            { key: "decay", color: "#7dd3fc" },
            { key: "constrained", color: "#fbbf24" },
            { key: "constrainedDecay", color: "#fb7185" },
        ],
        rows,
        p0,
    );
}
function drawChart(series, rows, p0) {
    const svg = document.getElementById("populationChart"),
        W = 760,
        H = 280,
        L = 55,
        R = 18,
        T = 18,
        B = 35;
    const vals = [p0, ...rows.flatMap((r) => series.map((s) => r[s.key]))],
        max = Math.max(...vals) * 1.08 || 1,
        min = 0,
        x = (i) => L + (i / rows.length) * (W - L - R),
        y = (v) => H - B - (v / max) * (H - T - B);
    let out = "";
    for (let i = 0; i <= 4; i++) {
        const val = (max * i) / 4,
            yy = y(val);
        out += `<line x1="${L}" y1="${yy}" x2="${W - R}" y2="${yy}" stroke="rgba(255,255,255,.12)" stroke-dasharray="4 5"/><text x="${L - 9}" y="${yy + 4}" fill="#9aacc8" font-size="11" text-anchor="end">${val.toFixed(0)}</text>`;
    }
    out += `<text x="${L}" y="${H - 8}" fill="#9aacc8" font-size="11">Year 0</text>`;
    rows.forEach((r, i) => {
        out += `<text x="${x(i + 1)}" y="${H - 8}" fill="#9aacc8" font-size="11" text-anchor="middle">${r.t}</text>`;
    });
    series.forEach((s) => {
        const pts = [
            { t: 0, v: p0 },
            ...rows.map((r) => ({ t: r.t, v: r[s.key] })),
        ]
            .map((p) => `${x(p.t)},${y(p.v)}`)
            .join(" ");
        out += `<polyline points="${pts}" fill="none" stroke="${s.color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
        [
            { t: 0, v: p0 },
            ...rows.map((r) => ({ t: r.t, v: r[s.key] })),
        ].forEach((p) => {
            out += `<circle cx="${x(p.t)}" cy="${y(p.v)}" r="3.5" fill="${s.color}"/>`;
        });
    });
    svg.innerHTML = out;
}
function resetSimulation() {
    document.getElementById("initialPop").value = 100;
    document.getElementById("popRate").value = 10;
    document.getElementById("years").value = 5;
    document.getElementById("capacity").value = 500;
    runSimulation();
}
runSimulation();