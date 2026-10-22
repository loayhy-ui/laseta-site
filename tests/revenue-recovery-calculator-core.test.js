const test = require("node:test");
const assert = require("node:assert/strict");
const { calculateBase, calculateAll } = require("../revenue-recovery-calculator-core.js");
const example = { receivables: 100000, recoveryRate: 10, pipeline: 200000, reactivationRate: 20, closeRate: 25, grossMargin: 30, followUpCost: 2500 };

test("base case separates potential receivables recovery from expected contract value", () => {
  assert.deepEqual(calculateBase(example), { receivablesCashRecovery: 10000, expectedContractValue: 10000, potentialGrossContribution: 3000, followUpCost: 2500, modeledNetContribution: 500 });
});

test("scenario range applies conservative/base/upside multipliers and preserves fixed follow-up cost", () => {
  const result = calculateAll(example);
  assert.deepEqual(result.conservative, { receivablesCashRecovery: 5000, expectedContractValue: 5000, potentialGrossContribution: 1500, followUpCost: 2500, modeledNetContribution: -1000 });
  assert.equal(result.base.modeledNetContribution, 500);
  assert.deepEqual(result.upside, { receivablesCashRecovery: 15000, expectedContractValue: 15000, potentialGrossContribution: 4500, followUpCost: 2500, modeledNetContribution: 2000 });
});

test("upside is capped at supplied receivables and pipeline", () => {
  const result = calculateAll({ receivables: 1000, recoveryRate: 100, pipeline: 1000, reactivationRate: 100, closeRate: 100, grossMargin: 100, followUpCost: 0 });
  assert.equal(result.upside.receivablesCashRecovery, 1000);
  assert.equal(result.upside.expectedContractValue, 1000);
});

test("zero values are valid", () => {
  assert.deepEqual(calculateBase({ receivables: 0, recoveryRate: 0, pipeline: 0, reactivationRate: 0, closeRate: 0, grossMargin: 0, followUpCost: 0 }), { receivablesCashRecovery: 0, expectedContractValue: 0, potentialGrossContribution: 0, followUpCost: 0, modeledNetContribution: 0 });
});

test("numeric strings from HTML controls are accepted", () => {
  assert.equal(calculateBase({ receivables: "100000", recoveryRate: "10", pipeline: "200000", reactivationRate: "20", closeRate: "25", grossMargin: "30", followUpCost: "2500" }).modeledNetContribution, 500);
});

test("negative, blank, non-finite and out-of-range inputs are rejected", () => {
  const invalid = [
    [{ ...example, receivables: -1 }, RangeError],
    [{ ...example, pipeline: "-1" }, RangeError],
    [{ ...example, followUpCost: -1 }, RangeError],
    [{ ...example, recoveryRate: 101 }, RangeError],
    [{ ...example, reactivationRate: -0.1 }, RangeError],
    [{ ...example, closeRate: 101 }, RangeError],
    [{ ...example, grossMargin: " " }, TypeError],
    [{ ...example, receivables: "" }, TypeError],
    [{ ...example, pipeline: Infinity }, TypeError],
    [{ ...example, recoveryRate: NaN }, TypeError]
  ];
  for (const [input, ErrorType] of invalid) assert.throws(() => calculateBase(input), ErrorType);
});

test("missing fields and invalid top-level inputs are rejected", () => {
  assert.throws(() => calculateBase({ ...example, followUpCost: undefined }), TypeError);
  assert.throws(() => calculateBase(null), TypeError);
  assert.throws(() => calculateBase([]), TypeError);
});

test("follow-up cost may make modeled net contribution negative", () => {
  assert.equal(calculateBase({ ...example, followUpCost: 9000 }).modeledNetContribution, -6000);
});
