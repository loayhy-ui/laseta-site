(function (root) {
  "use strict";

  var MAX_AMOUNT = 1000000000000;
  var DECIMAL_NUMBER = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;

  function readNumber(value, name, min, max) {
    var number;

    if (typeof value === "number") {
      number = value;
    } else if (typeof value === "string") {
      var text = value.trim();
      if (text === "" || !DECIMAL_NUMBER.test(text)) {
        throw new TypeError(name + " must be a number or decimal numeric string.");
      }
      number = Number(text);
    } else {
      throw new TypeError(name + " must be a number or decimal numeric string.");
    }

    if (!Number.isFinite(number)) {
      throw new TypeError(name + " must be finite.");
    }
    if (number < min || number > max) {
      throw new RangeError(name + " is out of range.");
    }
    return number;
  }

  function normalize(input) {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      throw new TypeError("Input object required.");
    }
    return {
      receivables: readNumber(input.receivables, "receivables", 0, MAX_AMOUNT),
      recoveryRate: readNumber(input.recoveryRate, "recoveryRate", 0, 100) / 100,
      pipeline: readNumber(input.pipeline, "pipeline", 0, MAX_AMOUNT),
      reactivationRate: readNumber(input.reactivationRate, "reactivationRate", 0, 100) / 100,
      closeRate: readNumber(input.closeRate, "closeRate", 0, 100) / 100,
      grossMargin: readNumber(input.grossMargin, "grossMargin", 0, 100) / 100,
      followUpCost: readNumber(input.followUpCost, "followUpCost", 0, MAX_AMOUNT)
    };
  }

  function round(value) {
    if (!Number.isFinite(value)) {
      throw new RangeError("Calculation exceeds supported numeric range.");
    }
    var rounded = Math.round((value + Number.EPSILON) * 100) / 100;
    if (!Number.isFinite(rounded)) {
      throw new RangeError("Calculation exceeds supported numeric range.");
    }
    return rounded;
  }

  function scenario(input, scale) {
    var cashRecovery = Math.min(input.receivables, input.receivables * input.recoveryRate * scale);
    var contractValue = Math.min(input.pipeline, input.pipeline * input.reactivationRate * input.closeRate * scale);
    var grossContribution = contractValue * input.grossMargin;
    return {
      receivablesCashRecovery: round(cashRecovery),
      expectedContractValue: round(contractValue),
      potentialGrossContribution: round(grossContribution),
      followUpCost: round(input.followUpCost),
      modeledNetContribution: round(grossContribution - input.followUpCost)
    };
  }

  function calculateBase(input) {
    return scenario(normalize(input), 1);
  }

  function calculateAll(input) {
    var normalized = normalize(input);
    return {
      conservative: scenario(normalized, 0.5),
      base: scenario(normalized, 1),
      upside: scenario(normalized, 1.5)
    };
  }

  var api = {
    calculateBase: calculateBase,
    calculateAll: calculateAll,
    maxAmount: MAX_AMOUNT
  };

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.LasetaRecoveryCalculator = api;
})(typeof window !== "undefined" ? window : globalThis);
