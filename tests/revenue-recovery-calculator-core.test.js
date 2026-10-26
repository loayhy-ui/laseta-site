const test = require("node:test");
const assert = require("node:assert/strict");
const { calculateBase, calculateAll, maxAmount } = require("../revenue-recovery-calculator-core.js");

const example = {
  receivables: 100000,
  recoveryRate: 10,
  pipeline: 200000,
  reactivationRate: 20,
  closeRate: 25,
  grossMargin: 30,
  followUpCost: 2500
};

test("base case separates modeled receivables recovery from dormant pipeline contribution", () => {
  assert.deepEqual(calculateBase(example), {
    receivablesCashRecovery: 10000,
    expectedContractValue: 10000,
    potentialGrossContribution: 3000,
    followUpCost: 2500,
    modeledNetContribution: 500
  });
});

test("conservative, base and upside scenarios are deterministic", () => {
  const result = calculateAll(example);
  assert.equal(result.conservative.receivablesCashRecovery, 5000);
  assert.equal(result.conservative.expectedContractValue, 5000);
  assert.equal(result.conservative.modeledNetContribution, -1000);
  assert.equal(result.base.modeledNetContribution, 500);
  assert.equal(result.upside.receivablesCashRecovery, 15000);
  assert.equal(result.upside.expectedContractValue, 15000);
  assert.equal(result.upside.modeledNetContribution, 2000);
});

test("upside is capped at the supplied receivables and pipeline", () => {
  const result = calculateAll({
    receivables: 1000, recoveryRate: 100, pipeline: 1000,
    reactivationRate: 100, closeRate: 100, grossMargin: 100, followUpCost: 0
  });
  assert.equal(result.upside.receivablesCashRecovery, 1000);
  assert.equal(result.upside.expectedContractValue, 1000);
});

test("rounded currency outputs never exceed fractional monetary caps", () => {
  const result = calculateAll({
    receivables: 100.006, recoveryRate: 100, pipeline: 100.006,
    reactivationRate: 100, closeRate: 100, grossMargin: 100, followUpCost: 0
  });
  for (const scenario of Object.values(result)) {
    assert.ok(scenario.receivablesCashRecovery <= 100.006);
    assert.ok(scenario.expectedContractValue <= 100.006);
    assert.ok(scenario.potentialGrossContribution <= scenario.expectedContractValue);
  }
  assert.equal(result.upside.receivablesCashRecovery, 100);
  assert.equal(result.upside.expectedContractValue, 100);
  assert.equal(result.upside.potentialGrossContribution, 100);
});

test("modeled net reconciles to the displayed rounded follow-up cost", () => {
  const result = calculateBase({
    receivables: 100, recoveryRate: 10, pipeline: 100,
    reactivationRate: 100, closeRate: 100, grossMargin: 10, followUpCost: 2.345
  });
  assert.equal(result.potentialGrossContribution, 10);
  assert.equal(result.followUpCost, 2.35);
  assert.equal(result.modeledNetContribution, 7.65);
});

test("zero values are valid", () => {
  assert.deepEqual(calculateBase({
    receivables: 0, recoveryRate: 0, pipeline: 0,
    reactivationRate: 0, closeRate: 0, grossMargin: 0, followUpCost: 0
  }), {
    receivablesCashRecovery: 0, expectedContractValue: 0,
    potentialGrossContribution: 0, followUpCost: 0, modeledNetContribution: 0
  });
});

test("numeric strings from browser controls are accepted", () => {
  assert.equal(calculateBase({
    receivables: "100000", recoveryRate: "10", pipeline: "200000",
    reactivationRate: "20", closeRate: "25", grossMargin: "30", followUpCost: "2500"
  }).modeledNetContribution, 500);
  assert.equal(calculateBase({
    receivables: " 100.5 ", recoveryRate: "1e1", pipeline: "200",
    reactivationRate: "20", closeRate: "25", grossMargin: "30", followUpCost: "0"
  }).receivablesCashRecovery, 10.05);
});

test("booleans, arrays, objects, non-finite numbers and non-decimal strings are rejected", () => {
  const keys = [
    "receivables", "recoveryRate", "pipeline", "reactivationRate",
    "closeRate", "grossMargin", "followUpCost"
  ];
  const invalidValues = [
    true, false, [], [10], {}, null, undefined, Symbol("not numeric"),
    Infinity, -Infinity, NaN, "0x10", "Infinity", "NaN", "1,000", " "
  ];

  for (const key of keys) {
    for (const value of invalidValues) {
      assert.throws(
        () => calculateBase({ ...example, [key]: value }),
        TypeError,
        `${key} must reject ${String(value)}`
      );
    }
  }
});

test("negative, blank and out-of-range values are rejected", () => {
  const invalid = [
    [{ ...example, receivables: -1 }, RangeError],
    [{ ...example, pipeline: maxAmount + 1 }, RangeError],
    [{ ...example, followUpCost: -1 }, RangeError],
    [{ ...example, recoveryRate: 101 }, RangeError],
    [{ ...example, reactivationRate: -0.1 }, RangeError],
    [{ ...example, closeRate: 101 }, RangeError],
    [{ ...example, grossMargin: 101 }, RangeError],
    [{ ...example, grossMargin: " " }, TypeError],
    [{ ...example, receivables: "" }, TypeError]
  ];
  for (const [input, ErrorType] of invalid) {
    assert.throws(() => calculateBase(input), ErrorType);
  }
});

test("deterministic numeric-input sweep preserves caps, finiteness and scenario ordering", () => {
  let seed = 0x12345678;
  function rand() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 0x100000000;
  }

  for (let i = 0; i < 5000; i++) {
    const input = {
      receivables: rand() * maxAmount,
      recoveryRate: rand() * 100,
      pipeline: rand() * maxAmount,
      reactivationRate: rand() * 100,
      closeRate: rand() * 100,
      grossMargin: rand() * 100,
      followUpCost: rand() * maxAmount
    };
    const { conservative: c, base: b, upside: u } = calculateAll(input);

    for (const scenario of [c, b, u]) {
      for (const value of Object.values(scenario)) assert.ok(Number.isFinite(value));
      assert.ok(scenario.receivablesCashRecovery >= 0 && scenario.receivablesCashRecovery <= input.receivables);
      assert.ok(scenario.expectedContractValue >= 0 && scenario.expectedContractValue <= input.pipeline);
      assert.ok(scenario.potentialGrossContribution >= 0 && scenario.potentialGrossContribution <= scenario.expectedContractValue);
      assert.ok(Math.abs(scenario.modeledNetContribution - (scenario.potentialGrossContribution - scenario.followUpCost)) < 0.001);
    }

    assert.ok(c.receivablesCashRecovery <= b.receivablesCashRecovery && b.receivablesCashRecovery <= u.receivablesCashRecovery);
    assert.ok(c.expectedContractValue <= b.expectedContractValue && b.expectedContractValue <= u.expectedContractValue);
    assert.ok(c.potentialGrossContribution <= b.potentialGrossContribution && b.potentialGrossContribution <= u.potentialGrossContribution);
    assert.ok(c.modeledNetContribution <= b.modeledNetContribution && b.modeledNetContribution <= u.modeledNetContribution);
  }
});

test("invalid top-level inputs and missing fields are rejected", () => {
  assert.throws(() => calculateBase(null), TypeError);
  assert.throws(() => calculateBase([]), TypeError);
  assert.throws(() => calculateBase({ ...example, followUpCost: undefined }), TypeError);
});

test("net contribution may be negative and is not forced to zero", () => {
  assert.equal(calculateBase({ ...example, followUpCost: 9000 }).modeledNetContribution, -6000);
});
