(function () {
  "use strict";

  var isArabic = (document.documentElement.lang || "").toLowerCase().indexOf("ar") === 0;
  var form = document.getElementById("recoveryCalc");
  if (!form) return;

  var ids = ["leads", "currentRate", "targetRate", "dealValue", "margin", "gapRecovery"];
  var el = {};
  ids.forEach(function (id) { el[id] = document.getElementById(id); });

  var out = {
    wins: document.getElementById("incrementalWins"),
    revenue: document.getElementById("monthlyRevenue"),
    profit: document.getElementById("monthlyProfit"),
    annual: document.getElementById("annualRevenue"),
    note: document.getElementById("scenarioNote"),
    summary: document.getElementById("estimateSummary"),
    status: document.getElementById("copyStatus")
  };

  var currency = new Intl.NumberFormat(isArabic ? "ar-SA" : "en-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0
  });
  var number = new Intl.NumberFormat(isArabic ? "ar-SA" : "en-SA", {
    maximumFractionDigits: 1
  });

  function value(id) {
    var n = Number(el[id].value);
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  }

  function calculate() {
    var leads = value("leads");
    var current = Math.min(100, value("currentRate"));
    var target = Math.min(100, value("targetRate"));
    var deal = value("dealValue");
    var margin = Math.min(100, value("margin"));
    var recovery = Math.min(100, value("gapRecovery"));
    var gap = Math.max(0, target - current);
    var wins = leads * (gap / 100) * (recovery / 100);
    var revenue = wins * deal;
    var profit = revenue * (margin / 100);
    var annual = revenue * 12;

    out.wins.textContent = number.format(wins);
    out.revenue.textContent = currency.format(revenue);
    out.profit.textContent = currency.format(profit);
    out.annual.textContent = currency.format(annual);

    if (target <= current) {
      out.note.textContent = isArabic
        ? "نسبة التحويل المستهدفة لا تتجاوز النسبة الحالية؛ لذلك يعرض النموذج فرصة إضافية قدرها صفر حتى تغيّر الافتراضات."
        : "The target conversion rate is not above the current rate, so this scenario shows zero incremental opportunity until the assumptions change.";
    } else {
      out.note.textContent = isArabic
        ? "هذا سيناريو افتراضي مبني بالكامل على المدخلات التي أدخلتها، وليس توقعًا أو ضمانًا للمبيعات. افحص النتائج الفعلية والتحصيلات قبل اعتماد أي قرار."
        : "This is an illustrative scenario based entirely on your inputs, not a forecast or sales guarantee. Check actual outcomes and collected cash before making decisions.";
    }

    var rows = [
      [isArabic ? "الطلبات المؤهلة شهريًا" : "Qualified leads per month", leads],
      [isArabic ? "نسبة التحويل الحالية (%)" : "Current conversion rate (%)", current],
      [isArabic ? "نسبة التحويل المستهدفة (%)" : "Target conversion rate (%)", target],
      [isArabic ? "متوسط قيمة الصفقة (ر.س)" : "Average deal value (SAR)", deal],
      [isArabic ? "هامش الربح الإجمالي (%)" : "Gross margin (%)", margin],
      [isArabic ? "النسبة المفترضة من فجوة التحويل التي يمكن استعادتها (%)" : "Assumed share of conversion gap recovered (%)", recovery],
      [isArabic ? "الصفقات الإضافية الافتراضية شهريًا" : "Illustrative incremental wins per month", wins.toFixed(1)],
      [isArabic ? "الإيراد الإضافي الافتراضي شهريًا (ر.س)" : "Illustrative incremental monthly revenue (SAR)", revenue.toFixed(0)],
      [isArabic ? "الربح الإجمالي الإضافي الافتراضي شهريًا (ر.س)" : "Illustrative incremental monthly gross profit (SAR)", profit.toFixed(0)],
      [isArabic ? "الإيراد السنوي المكافئ (ر.س)" : "Annualized equivalent revenue (SAR)", annual.toFixed(0)]
    ];
    out.summary.value = rows.map(function (row) {
      return row[0] + ": " + row[1];
    }).join("\n");
    out.status.textContent = "";
    return { rows: rows, wins: wins, revenue: revenue, profit: profit, annual: annual };
  }

  function downloadCsv() {
    var result = calculate();
    var lines = result.rows.map(function (row) {
      return '"' + String(row[0]).replace(/"/g, '""') + '","' + String(row[1]).replace(/"/g, '""') + '"';
    });
    var blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "laseta-revenue-recovery-scenario.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  form.addEventListener("input", calculate);
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    calculate();
  });

  var copyButton = document.getElementById("copyEstimate");
  if (copyButton) {
    copyButton.addEventListener("click", function () {
      out.summary.focus();
      out.summary.select();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(out.summary.value).then(function () {
          out.status.textContent = isArabic ? "تم نسخ ملخص السيناريو." : "Scenario summary copied.";
        }).catch(function () {
          out.status.textContent = isArabic ? "تم تحديد النص؛ انسخه يدويًا." : "Text selected; copy it manually.";
        });
      } else {
        out.status.textContent = isArabic ? "تم تحديد النص؛ انسخه يدويًا." : "Text selected; copy it manually.";
      }
    });
  }

  var downloadButton = document.getElementById("downloadEstimate");
  if (downloadButton) downloadButton.addEventListener("click", downloadCsv);
  calculate();
}());
