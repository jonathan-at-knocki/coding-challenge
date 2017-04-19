//  some common helpers functions
const mongoose = require('mongoose');

//  add error string errArr as appropriate, with error prefixed by
//  appropriate string using itemName
exports.addToErrArr = function addToErrArr(err, itemName, errArr) {
  if (err) errArr.push('Error finding ' + itemName + ': ' + err.toString);
};
const addToErrArr = exports.addToErrArr;

//  findById on model and then append to errArr as necessary.
//  errArr is the current errArr, which might be altered (as well as being
//    passed to callback)
//  itemModel is a mongoose model.
//  itemId is the ID of the item
//  itemName is used in an error message if item not found
//  the callback is: callback(item, errArr)
//
//  if no itemId is given, callback is immediately called with
//    callback(null, errArr)
//
exports.findByIdAndMore = function findByIdAndMore(
  itemModel, itemId, itemName, errArr, callback) {
  if (!itemId) {
    callback(errArr, null);
  } else {
    itemModel.findById(itemId).exec((err, item) => {
      addToErrArr(err, itemName, errArr);
      callback(errArr, item);
    });
  }
};
