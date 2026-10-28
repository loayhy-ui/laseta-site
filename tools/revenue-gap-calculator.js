(function () {
  "use strict";
  const ids = ["quotes", "reach", "close", "value", "margin"];
  let language = "en";
  const get = (id) => {
    const element = document.getElementById(id);
    const number = Number(element.value);
    return Number.isFinite(number) ? Math.max(Number(element.min || 0), Math.min(Number(element.max || Infinity), number)) : 0;
  };
  const numberFormat = (value) => new Intl.NumberFormat(language === "ar" ? "ar-SA" : "en-SA", {
    maximumFractionDigits: 1
  }).format(value);
  const money = (amount) => new Intl.NumberFormat(language === "ar" ? "ar-SA" : "en-SA", {
    style: "currency", currency: "SAR", maximumFractionDigits: 0
  }).format(amount);
  function calculate() {
    const reengaged = get("quotes") * get("reach") / 100;
    const wins = reengaged * get("close") / 100;
    const sales = wins * get("value");
    document.getElementById("eligible").textContent = numberFormat(reengaged);
    document.getElementById("wins").textContent = numberFormat(wins);
    document.getElementById("sales").textContent = money(sales);
    document.getElementById("profit").textContent = money(sales * get("margin") / 100);
    document.getElementById("annual").textContent = money(sales * 12);
  }
  function setLanguage(next) {
    language = next;
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.querySelectorAll("[data-en][data-ar]").forEach((element) => {
      element.textContent = element.dataset[language];
    });
    const button = document.getElementById("langToggle");
    button.textContent = language === "ar" ? "English" : "العربية";
    button.setAttribute("aria-label", language === "ar" ? "Switch to English" : "التبديل إلى العربية");
    document.getElementById("fitCheckCta").href = language === "ar"
      ? "https://tally.so/r/LD1NO2"
      : "https://tally.so/r/Me0EPE";
    calculate();
  }
  ids.forEach((id) => document.getElementById(id).addEventListener("input", calculate));
  document.getElementById("langToggle").addEventListener("click", () => {
    setLanguage(language === "en" ? "ar" : "en");
  });
  calculate();
})();