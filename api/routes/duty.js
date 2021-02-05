//requires
const express = require('express');
const fs = require('fs');
const mongoose = require('mongoose')

//create router
const router = express.Router();

//modules
const scrape = require('../js/scrape');
const common = require('../js/common')

//config
const config = require('../config/config');

//model
const Duty = require('../models/duty')

//GET default - gets all duties
router.get('/', (req, res, next) => {

    mongoose.connect('mongodb+srv://' + config.db_config.user + ':'+ config.db_config.pass + '@' + config.db_config.cluster + '/' + config.db_config.db + '?retryWrites=true&w=majority', { useNewUrlParser: true }, (err) =>{

        if(err)
            throw err;

        Duty.find({}, (err, duties) =>{
                res.status(200).json(duties);
        })
    })  
});



//GET reload - reloads the duty loot tables for duty with id <dutyID>
router.get('/reload/:dutyID', (req, res, next) => {

    const id = req.params.dutyID
    console.log('connecting to db...');

    mongoose.connect('mongodb+srv://' + config.db_config.user + ':'+ config.db_config.pass + '@' + config.db_config.cluster + '/' + config.db_config.db + '?retryWrites=true&w=majority', { useNewUrlParser: true }, (err) =>{
        if(err)
            throw err;
 
        //remove existing entry if it exists
        Duty.deleteMany({$or: [{lodestone_id : id},{id : id}]}, (err, data) => {
            if(!err) {
                console.log("Item Removed");
              }
        });

        const directory = 'api/data';

        fs.readdir(directory, (err, files) => {
    
            if (err) 
                throw err;
            
            scrape.readFiles(files, directory, fs, (duties) => duties.filter(d => d.lodestone_id == id || d.id == id));
         
        });
    });

    res.status(200).json({
        Message : "Reloading..."
    })
});

//GET reload - reloads the duty loot tables
router.get('/reload', (req, res, next) => {

    console.log('connecting to db...');

    mongoose.connect('mongodb+srv://' + config.db_config.user + ':'+ config.db_config.pass + '@' + config.db_config.cluster + '/' + config.db_config.db + '?retryWrites=true&w=majority', { useNewUrlParser: true }, (err) =>{
        if(err)
            throw err;

        //clear collection
        mongoose.connection.db.dropCollection(scrape.dutyCollectionName, function (err, result) {
            if (err && !(err.message === "ns not found")) 
                throw err;
        });

        const directory = 'api/data';

        fs.readdir(directory, (err, files) => {
    
            if (err) 
                throw err;
            
            scrape.readFiles(files, directory, fs);
         
        });
    });

    res.status(200).json({
        Message : "Reloading..."
    })
});

//GET /dungeon - gets all dungeon duties
router.get('/dungeon', (req, res, next) => {
    mongoose.connect('mongodb+srv://' + config.db_config.user + ':'+ config.db_config.pass + '@' + config.db_config.cluster + '/' + config.db_config.db + '?retryWrites=true&w=majority', { useNewUrlParser: true }, (err) =>{

        if(err)
            throw err;

        Duty.find({type : 'dungeon'}, (err, duties) =>{
                res.status(200).json(duties);
        })
    })

});

//GET /dungeon - gets all trial duties
router.get('/trial', (req, res, next) => {
    mongoose.connect('mongodb+srv://' + config.db_config.user + ':'+ config.db_config.pass + '@' + config.db_config.cluster + '/' + config.db_config.db + '?retryWrites=true&w=majority', { useNewUrlParser: true }, (err) =>{

        if(err)
            throw err;

        Duty.find({type : 'trial'}, (err, duties) =>{
                res.status(200).json(duties);
        })
    })

});

//GET /dungeon - gets all raid duties
router.get('/raid', (req, res, next) => {
    mongoose.connect('mongodb+srv://' + config.db_config.user + ':'+ config.db_config.pass + '@' + config.db_config.cluster + '/' + config.db_config.db + '?retryWrites=true&w=majority', { useNewUrlParser: true }, (err) =>{

        if(err)
            throw err;

        Duty.find({type : 'raid'}, (err, duties) =>{
                res.status(200).json(duties);
        })
    })

});

//GET {dutyID} - gets all duty where lodestone_id is {dutyID}
router.get('/:dutyID', (req, res, next) => {
    const id = req.params.dutyID
    mongoose.connect('mongodb+srv://' + config.db_config.user + ':'+ config.db_config.pass + '@' + config.db_config.cluster + '/' + config.db_config.db + '?retryWrites=true&w=majority', { useNewUrlParser: true }, (err) =>{

        if(err)
            throw err;

        Duty.findOne({$or: [{lodestone_id : id},{id : id}]}, (err, duty) =>{
                res.status(200).json(duty);
        })
    })

});

//GET dungeon/{dutyID} - gets all dungeons where lodestone_id or id is {dutyID}
router.get('/dungeon/:dutyID', (req, res, next) => {
    const id = req.params.dutyID
    mongoose.connect('mongodb+srv://' + config.db_config.user + ':'+ config.db_config.pass + '@' + config.db_config.cluster + '/' + config.db_config.db + '?retryWrites=true&w=majority', { useNewUrlParser: true }, (err) =>{

        if(err)
            throw err;

        Duty.findOne({$or: [{lodestone_id : id, type : 'dungeon'},{id : id, type : 'dungeon'}]}, (err, duty) =>{
                res.status(200).json(duty);
        })
    })

});


//GET trial/{dutyID} - gets all trials where lodestone_id or id is {dutyID}
router.get('/trial/:dutyID', (req, res, next) => {
    const id = req.params.dutyID
    mongoose.connect('mongodb+srv://' + config.db_config.user + ':'+ config.db_config.pass + '@' + config.db_config.cluster + '/' + config.db_config.db + '?retryWrites=true&w=majority', { useNewUrlParser: true }, (err) =>{

        if(err)
            throw err;

        Duty.findOne({$or: [{lodestone_id : id, type : 'trial'},{id : id, type : 'trial'}]}, (err, duty) =>{
                res.status(200).json(duty);
        })
    })

});

//GET raid/{dutyID} - gets all raids where lodestone_id or id is {dutyID}
router.get('/raid/:dutyID', (req, res, next) => {
    const id = req.params.dutyID
    mongoose.connect('mongodb+srv://' + config.db_config.user + ':'+ config.db_config.pass + '@' + config.db_config.cluster + '/' + config.db_config.db + '?retryWrites=true&w=majority', { useNewUrlParser: true }, (err) =>{

        if(err)
            throw err;

        Duty.findOne({$or: [{lodestone_id : id, type : 'raid'},{id : id, type : 'raid'}]}, (err, duty) =>{
                res.status(200).json(duty);
        })
    })

});








module.exports = router;