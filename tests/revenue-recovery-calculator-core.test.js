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
});

test("negative, blank, non-finite and out-of-range values are rejected", () => {
  const invalid = [
    [{ ...example, receivables: -1 }, RangeError],
    [{ ...example, pipeline: maxAmount + 1 }, RangeError],
    [{ ...example, followUpCost: -1 }, RangeError],
    [{ ...example, recoveryRate: 101 }, RangeError],
    [{ ...example, reactivationRate: -0.1 }, RangeError],
    [{ ...example, closeRate: 101 }, RangeError],
    [{ ...example, grossMargin: " " }, TypeError],
    [{ ...example, receivables: "" }, TypeError],
    [{ ...example, pipeline: Infinity }, TypeError],
    [{ ...example, recoveryRate: NaN }, TypeError]
  ];
  for (const [input, ErrorType] of invalid) {
    assert.throws(() => calculateBase(input), ErrorType);
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