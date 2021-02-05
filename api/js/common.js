async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  }

module.exports.asyncForEach = asyncForEach
module.exports.waitFor = (ms) => new Promise(r => setTimeout(r, ms));