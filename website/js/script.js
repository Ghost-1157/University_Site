const universitiesList = document.getElementById("universitiesList");
const resultsCount = document.getElementById("resultsCount");
const filterError = "Не удалось загрузить данные о стоимости из базы данных.";

let costCards = [];

function findValueByNameHints(row, hints) {
  const keys = Object.keys(row);
  const matchedKey = keys.find((key) => {
    const lowerKey = key.toLowerCase();
    return hints.some((hint) => lowerKey.includes(hint));
  });

  if (!matchedKey) {
    return "";
  }

  return row[matchedKey] ?? "";
}

function getValueByPosition(row, position) {
  return Object.values(row)[position] ?? "";
}

function pickValue(row, hints, position) {
  const hintedValue = findValueByNameHints(row, hints);
  if (String(hintedValue).trim() !== "") {
    return hintedValue;
  }

  return getValueByPosition(row, position);
}

function normalizeUrl(value) {
  const text = String(value || "").trim();
  if (!text) {
    return "";
  }

  if (/^https?:\/\//i.test(text)) {
    return text;
  }

  return `https://${text}`;
}

function formatList(values) {
  const uniqueValues = [...new Set(values.filter((value) => String(value).trim() !== ""))];
  if (uniqueValues.length === 0) {
    return "Не указано";
  }

  if (uniqueValues.length <= 3) {
    return uniqueValues.join(", ");
  }

  return `${uniqueValues.slice(0, 3).join(", ")} и еще ${uniqueValues.length - 3}`;
}

function toNumber(value) {
  const numericValue = Number.parseFloat(String(value).replace(/[^\d.]/g, ""));
  return Number.isFinite(numericValue) ? numericValue : NaN;
}

function formatMoneyValue(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `${value.toLocaleString("ru-RU")} ₸`;
  }

  const parsed = toNumber(value);
  if (Number.isFinite(parsed)) {
    return `${parsed.toLocaleString("ru-RU")} ₸`;
  }

  return value || "Не указано";
}

function priceBucketFromTotal(value) {
  const parsed = toNumber(value);
  if (!Number.isFinite(parsed)) {
    return "";
  }

  if (parsed <= 300000) {
    return "low";
  }

  if (parsed <= 450000) {
    return "mid";
  }

  return "high";
}

function normalizeCostRow(row) {
  const university = pickValue(row, ["university", "университет", "name", "title"], 0);
  const transport = pickValue(row, ["transport", "транспорт"], 1);
  const apartment = pickValue(row, ["apartment", "flat", "room", "квартир", "1-комнатная"], 2);
  const food = pickValue(row, ["food", "питание"], 3);
  const dormitory = pickValue(row, ["dorm", "hostel", "общежит"], 4);
  const leisure = pickValue(row, ["leisure", "досуг"], 5);
  const total = pickValue(row, ["sum", "total", "сумма"], 6);
  const detailParts = [transport, apartment, food, dormitory, leisure].filter((value) => String(value).trim() !== "");

  return {
    university: String(university || "Без названия"),
    transport: formatMoneyValue(transport),
    apartment: formatMoneyValue(apartment),
    food: formatMoneyValue(food),
    dormitory: formatMoneyValue(dormitory),
    leisure: formatMoneyValue(leisure),
    total: formatMoneyValue(total),
    totalValue: toNumber(total),
    price: priceBucketFromTotal(total),
    summary: detailParts.length > 0 ? detailParts.join(" • ") : "Описание отсутствует"
  };
}

function bucketLabel(bucket) {
  if (bucket === "low") {
    return "До 300 000 ₸";
  }

  if (bucket === "mid") {
    return "300 000 – 450 000 ₸";
  }

  if (bucket === "high") {
    return "Выше 450 000 ₸";
  }

  return "Не указано";
}

async function loadCostsFromApi() {
  const response = await fetch("/api/university-transport-food-home?limit=1000&offset=0");
  if (!response.ok) {
    throw new Error(`API status ${response.status}`);
  }

  const payload = await response.json();
  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  costCards = rows.map(normalizeCostRow);
  return costCards;
}

function renderCosts(list) {
  universitiesList.innerHTML = "";

  if (list.length === 0) {
    universitiesList.innerHTML = `<p>По вашему запросу ничего не найдено.</p>`;
    resultsCount.textContent = "Найдено: 0";
    return;
  }

  list.forEach((facultyCard) => {
    const card = document.createElement("div");
    card.className = "university-card";

    card.innerHTML = `
      <h4>${facultyCard.university}</h4>
      <p><strong>Транспорт:</strong> ${facultyCard.transport}</p>
      <p><strong>1-комнатная кв.:</strong> ${facultyCard.apartment}</p>
      <p><strong>Питание:</strong> ${facultyCard.food}</p>
      <p><strong>Общежитие в год:</strong> ${facultyCard.dormitory}</p>
      <p><strong>Досуг:</strong> ${facultyCard.leisure}</p>
      <p><strong>Сумма:</strong> ${facultyCard.total}</p>
      <span class="tag">${bucketLabel(facultyCard.price)}</span>
    `;

    universitiesList.appendChild(card);
  });

  resultsCount.textContent = `Найдено: ${list.length}`;
}

function filterCosts() {
  const priceValue = document.getElementById("price").value;
  const searchValue = document.getElementById("ent").value.trim().toLowerCase();

  const filtered = costCards.filter((facultyCard) => {
    const matchPrice = !priceValue || facultyCard.price === priceValue;
    const matchSearch =
      !searchValue ||
      [facultyCard.university, facultyCard.summary, facultyCard.total].some((value) =>
        String(value).toLowerCase().includes(searchValue)
      );

    return matchPrice && matchSearch;
  });

  renderCosts(filtered);
}

function resetFilters() {
  document.getElementById("price").value = "";
  document.getElementById("ent").value = "";

  renderCosts(costCards);
}

document.getElementById("applyFilters").addEventListener("click", filterCosts);
document.getElementById("resetFilters").addEventListener("click", resetFilters);

loadCostsFromApi()
  .then(() => {
    renderCosts(costCards);
  })
  .catch(() => {
    universitiesList.innerHTML = `<p>${filterError}</p>`;
    resultsCount.textContent = "Найдено: 0";
  });

/* CAROUSEL */
const slides = document.querySelectorAll(".carousel-slide");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

let currentSlide = 0;

function showSlide(index) {
  slides.forEach((slide) => slide.classList.remove("active"));
  slides[index].classList.add("active");
}

function nextSlide() {
  currentSlide = (currentSlide + 1) % slides.length;
  showSlide(currentSlide);
}

function prevSlideFunc() {
  currentSlide = (currentSlide - 1 + slides.length) % slides.length;
  showSlide(currentSlide);
}

nextBtn.addEventListener("click", nextSlide);
prevBtn.addEventListener("click", prevSlideFunc);

setInterval(nextSlide, 5000);