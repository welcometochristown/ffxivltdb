const mongoose = require('mongoose');
const dutySchema = require('../schema/duty')

module.exports = mongoose.model('Duty', new mongoose.Schema(dutySchema));