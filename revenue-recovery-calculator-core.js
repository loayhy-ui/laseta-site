(function (root) {
  "use strict";
  function amount(value) {
    var n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }
  function percent(value) {
    var n = Number(value);
    return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) / 100 : 0;
  }
  function round(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
  function calculateBase(input) {
    var receivables = amount(input.receivables);
    var pipeline = amount(input.pipeline);
    var recovery = receivables * percent(input.recoveryRate);
    var contracts = pipeline * percent(input.reactivationRate) * percent(input.closeRate);
    var margin = percent(input.grossMargin);
    return {
      receivablesCashRecovery: round(Math.min(receivables, recovery)),
      expectedContractValue: round(Math.min(pipeline, contracts)),
      potentialGrossContribution: round(Math.min(pipeline, contracts) * margin)
    };
  }
  function calculateAll(input) {
    var base = calculateBase(input);
    var receivables = amount(input.receivables);
    var pipeline = amount(input.pipeline);
    var margin = percent(input.grossMargin);
    var lowCash = Math.min(receivables, base.receivablesCashRecovery * 0.5);
    var lowContracts = Math.min(pipeline, base.expectedContractValue * 0.5);
    var highCash = Math.min(receivables, base.receivablesCashRecovery * 1.5);
    var highContracts = Math.min(pipeline, base.expectedContractValue * 1.5);
    return {
      conservative: {
        receivablesCashRecovery: round(lowCash),
        expectedContractValue: round(lowContracts),
        potentialGrossContribution: round(lowContracts * margin)
      },
      base: base,
      upside: {
        receivablesCashRecovery: round(highCash),
        expectedContractValue: round(highContracts),
        potentialGrossContribution: round(highContracts * margin)
      }
    };
  }
  var api = { calculateBase: calculateBase, calculateAll: calculateAll };
  if (typeof module === "object" && module.exports) module.exports = api;
  root.LasetaRecoveryCalculator = api;
})(typeof window !== "undefined" ? window : global);