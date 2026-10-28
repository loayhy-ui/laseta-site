(function () {
  "use strict";
  const ids = ["quotes", "reach", "close", "value", "margin"];
  const get = (id) => {
    const element = document.getElementById(id);
    const number = Number(element.value);
    return Number.isFinite(number) ? Math.max(Number(element.min || 0), Math.min(Number(element.max || Infinity), number)) : 0;
  };
  const money = (amount) => new Intl.NumberFormat("en-SA", {
    style: "currency", currency: "SAR", maximumFractionDigits: 0
  }).format(amount);
  function calculate() {
    const reengaged = get("quotes") * get("reach") / 100;
    const wins = reengaged * get("close") / 100;
    const sales = wins * get("value");
    document.getElementById("sales").textContent = money(sales);
    document.getElementById("profit").textContent = money(sales * get("margin") / 100);
    document.getElementById("annual").textContent = money(sales * 12);
  }
  ids.forEach((id) => document.getElementById(id).addEventListener("input", calculate));
  calculate();
})();