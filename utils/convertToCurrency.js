module.exports = function convertToCurrency(amount, factor = 100) {
  return Math.round(amount * factor);
};

