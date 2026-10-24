(function () {
  "use strict";

  var form = document.getElementById("estimatorForm");
  var results = document.getElementById("results");
  var status = document.getElementById("status");
  if (!form || !results || !status || !window.LasetaRecoveryCalculator) return;

  var isArabic = document.documentElement.lang === "ar";
  var formatter = new Intl.NumberFormat(isArabic ? "ar-SA" : "en-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 2
  });
  var messages = {
    error: isArabic ? "تعذر الحساب. تحقق من إدخال أرقام صحيحة ضمن الحدود الموضحة." : "Could not calculate. Check that every value is a valid number within the stated limits.",
    success: isArabic ? "هذه سيناريوهات تقديرية فقط؛ وليست دليلًا على تحصيل نقدي أو ضمانًا للنتائج." : "Illustrative scenarios only; not proof of collected cash or a guarantee of results."
  };

  function value(id) {
    var element = document.getElementById(id);
    return element ? element.value : "";
  }

  function put(id, amount) {
    var element = document.getElementById(id);
    if (element) element.textContent = formatter.format(amount);
  }

  function render(prefix, scenario) {
    put(prefix + "-cash", scenario.receivablesCashRecovery);
    put(prefix + "-contracts", scenario.expectedContractValue);
    put(prefix + "-gross", scenario.potentialGrossContribution);
    put(prefix + "-cost", scenario.followUpCost);
    put(prefix + "-net", scenario.modeledNetContribution);
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    status.textContent = "";
    try {
      var input = {
        receivables: value("receivables"),
        recoveryRate: value("recoveryRate"),
        pipeline: value("pipeline"),
        reactivationRate: value("reactivationRate"),
        closeRate: value("closeRate"),
        grossMargin: value("grossMargin"),
        followUpCost: value("followUpCost")
      };
      var scenarios = window.LasetaRecoveryCalculator.calculateAll(input);
      render("conservative", scenarios.conservative);
      render("base", scenarios.base);
      render("upside", scenarios.upside);
      results.hidden = false;
      status.textContent = messages.success;
    } catch (error) {
      results.hidden = true;
      status.textContent = messages.error;
    }
  });

  form.addEventListener("reset", function () {
    results.hidden = true;
    status.textContent = "";
  });
})();