const fromExponential = require("from-exponential");

const oneYearInSeconds = 31536000;

// Count decimals of a given number
const countDecimals = (number) => {
  if (Math.floor(number) === number) return 0;

  let str = number.toString();
  //console.log("string: ", str);

  if (str.includes("e")) {
    str = fromExponential(str);
  }

  const splitted = str.split(".");
  console.log(`decimals: 0.${splitted[1]}`);
  return splitted[1].length;
};

// Get the numbers (attributes) of a given object
const extractNumberTypes = (object) => {
  // extract object keys
  const keys = Object.keys(object);

  let numbers = [];
  keys.forEach((key) => {
    console.log(`key ${key}: ${object[key]} - type: ${typeof object[key]}`);
    if (typeof object[key] === "number") {
      //console.log("number found: ", object[key]);
      numbers.push(object[key]);
    }
  });

  return numbers;
};

const extractMaxDecimals = (numbers) => {
  let maxDecimals = 0;
  numbers.forEach((number) => {
    if (number.toString().includes("e")) {
      number = fromExponential(number);
    }
    let currentDecimals = countDecimals(number);
    if (currentDecimals > maxDecimals) maxDecimals = currentDecimals;
  });

  console.log("max decimals: ", maxDecimals);
  if (maxDecimals > 10) {
    maxDecimals = 10;
  }

  return maxDecimals;
};

// Converts an array of objects to an array of arrays,
//  as solidity handles arrays of structs this way!
// ej: [{a, b, c}], {d, e, f}] -> [[a, b, c], [d, e, f]]
const convertSpeciesToArray = (species, landSize) => {
  let speciesAsArrays = [];
  console.log("species from convert: ", species);

  species.map((specie) => {
    //console.log("before refactor: ", specie);
    specie = refactorSpecie(specie, landSize);
    //console.log("refactored...: ", specie);
    let {
      speciesAlias,
      scientificName,
      initialTCO2perYear,
      size,
      TCO2perSecond,
      density,
    } = specie;

    const decimals = maxDecimalsOf(specie);
    //console.log("specie decimals done: ", decimals);

    let specieAsArray = [];
    specieAsArray.push(
      speciesAlias,
      scientificName,
      normalizeNumber(density, decimals), // Array normalized to count decimals on solidity
      normalizeNumber(size, decimals), // As solidity only handle numbers as integers!
      decimals,
      normalizeNumber(TCO2perSecond, decimals),
      normalizeNumber(initialTCO2perYear, decimals),
      0,
      0,
      0
    );

    speciesAsArrays.push(specieAsArray);
  });

  return speciesAsArrays;
};

// Converts a set of objects inside an array to an
// array of arrays, as solidity handles arrays of structs this way!
// ej: [{a, b, c}], {d, e, f}] -> [[a, b, c], [d, e, f]]
const convertPointsToArray = (points) => {
  let pointsAsArrays = [];

  points.map((coordinate) => {
    coordinate = refactorPoints(coordinate);

    let { latitude, longitude } = coordinate;

    const decimals = maxDecimalsOf(coordinate);

    let coordinateAsArray = [];
    coordinateAsArray.push(
      normalizeNumber(latitude),
      normalizeNumber(longitude),
      decimals,
      0,
      0
    );

    pointsAsArrays.push(coordinateAsArray);
  });

  return pointsAsArrays;
};

// Convert numbers from strings to numbers
const refactorPoints = (points) => {
  points.latitude = Number(points.latitude);
  points.longitude = Number(points.longitude);

  return points;
};

// Convert numbers from strings to numbers
const refactorSpecie = (specie, landSize) => {
  specie.initialTCO2perYear = Number(Math.round(specie.initialTCO2perYear));
  specie.size = Number(landSize / specie.density);
  specie.density = Number(specie.density);
  specie.TCO2perSecond = Number(specie.TCO2perSecond);

  console.log("specie from refactor: ", specie);
  return specie;
};

// Extract the max decimals of an object with different
// floating point numbers (decimal part)
const maxDecimalsOf = (object) => {
  const numbers = extractNumberTypes(object);

  const maxDecimals = extractMaxDecimals(numbers);

  //console.log("max decimals: ", maxDecimals);
  return maxDecimals;
};

// This function normalize a number to account for decimals
// given that solidity only work with integer numbers
const normalizeNumber = (number, decimals = 0, round = true) => {
  // number = Number(number);
  // decimals = Number(decimals);

  let result = number * Math.pow(10, decimals);
  //console.log(result);

  result = result.toString();

  if (result.includes("e")) {
    result = fromExponential(result);
  }

  if (round) return Math.round(result);

  decimals = decimals.toString();
  let rounded = roundValue(result, decimals * -1).toString();

  if (rounded.includes("e")) {
    rounded = fromExponential(rounded);
  }
  return rounded;
};

const roundValue = (value, decimals) => {
  value = value.toString();
  console.log("decimals: ", decimals);
  if (value.includes("e")) {
    console.log("value includes e: ", value);
    value = fromExponential(value);
    console.log("after from exponential: ", value);
  }

  const result = Number(Math.round(value + "e+" + decimals) + "e-" + decimals);
  console.log("result: ", result);

  return result;
};

// Get the CO2 that a given specie offsets in five years
const getInitialTCO2perYear = (species) => {
  let initialTCO2perYear = 0;

  species.map((specie) => {
    initialTCO2perYear += Number(specie.initialTCO2perYear);
    console.log("initial tco2 now: ", initialTCO2perYear);
  });

  return Math.round(initialTCO2perYear);
};

module.exports = {
  maxDecimalsOf,
  normalizeNumber,
  convertSpeciesToArray,
  convertPointsToArray,
  getInitialTCO2perYear,
  oneYearInSeconds,
  roundValue,
};
