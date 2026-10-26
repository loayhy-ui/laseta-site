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

  // Return the greatest two-decimal currency amount not exceeding the supplied cap.
  // String slicing avoids a binary-float multiplication boundary rounding a cap upward.
  function floorToCents(value) {
    if (!Number.isFinite(value)) {
      throw new RangeError("Currency cap must be finite.");
    }
    if (value <= 0 || value < 0.01) {
      return 0;
    }
    var decimal = String(value);
    var point = decimal.indexOf(".");
    if (point === -1) {
      return value;
    }
    var fraction = (decimal.slice(point + 1, point + 3) + "00").slice(0, 2);
    return Number(decimal.slice(0, point) + "." + fraction);
  }

  function roundWithinCap(value, cap) {
    return Math.min(round(value), floorToCents(cap));
  }

  function scenario(input, scale) {
    var cashRecovery = Math.min(input.receivables, input.receivables * input.recoveryRate * scale);
    var contractValue = Math.min(input.pipeline, input.pipeline * input.reactivationRate * input.closeRate * scale);
    var roundedCashRecovery = roundWithinCap(cashRecovery, input.receivables);
    var roundedContractValue = roundWithinCap(contractValue, input.pipeline);
    var grossContribution = Math.min(roundedContractValue, round(contractValue * input.grossMargin));
    var roundedFollowUpCost = round(input.followUpCost);
    return {
      receivablesCashRecovery: roundedCashRecovery,
      expectedContractValue: roundedContractValue,
      potentialGrossContribution: grossContribution,
      followUpCost: roundedFollowUpCost,
      modeledNetContribution: round(grossContribution - roundedFollowUpCost)
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
