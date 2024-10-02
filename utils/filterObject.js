module.exports = function(obj, ...allowedFields) {
  const newObject = {};
  Object.keys(obj).forEach((item) => {
    if (allowedFields.includes(item)) newObject[item] = obj[item];
  });
  return newObject;
};
