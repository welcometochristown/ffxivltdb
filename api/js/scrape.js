//modules
const axios = require('axios');
const cheerio = require('cheerio');
const common = require('./common')

//db model
const duty_model = require('../models/duty.js')

//config
const config = require('../config/config')

//read files in a directory
async function readFiles(files, directory, fs, dutyfilter)
{
    console.log('reading files...')

    //iterate over each duty file
    await common.asyncForEach(files, async file => {
        
        console.log('reading ' + file)

        await new Promise(release => 
            fs.readFile(directory + '/' + file, 'utf8', async function (err, data) {

                var duties = JSON.parse(data);
                
                if(dutyfilter)
                    duties = dutyfilter(duties);

                if(duties.length > 0)
                    await insertDuties(duties)

                release()
        }));

        //pause 3 seconds between files
        console.log('pausing 3s... ')
        await common.waitFor(3000);
    })

    console.log('finished')
}

//insert array of duties
async function insertDuties(duties)
{ 
    await common.asyncForEach(duties, async function(duty) {

        var d = new duty_model(duty);

        d.name = duty.name;
        d.lodestone_id = duty.lodestone_id;

        d.lodestone_url = config.ffxiv_config.url + '/' + config.ffxiv_config.endpoint + '/' + duty.lodestone_id;

        await insertDuty(d);

        console.log('pausing 2s... ')
        await common.waitFor(2000);

    });
}

//insert a duty
async function insertDuty(duty)
{
    console.log(`scraping ${duty.name}`)

    //iterate each duty and insert into db
    await scrapeRewards(duty.lodestone_url, async (rewards, name, lvl, info, req, desc) => {
                       
         console.log('saving rewards to db for ' + duty.name);

         if(rewards)
         {
            await new Promise(release => {

                  rewards.forEach((reward) =>{
                    duty.rewards.push(reward);
                  }); 

                  duty.name = name; //stored in data but good to update from page
                  duty.level = lvl;
                  duty.requirements = req;
                  duty.description = desc;
                  duty.info = info;

                  duty.save()
                  .then(doc => {
                      console.log(`Inserted ${duty.name} (${duty.type})`);
                      release();
                  })
                  .catch(err => {
                      console.log('Failed to insert ' + duty.name + ' ' + err.message)
                      release();
                  })
            })
        }
    })
}

//scrape url for rewards
async function scrapeRewards(url, callback) { 

    console.log('Connecting to ' + url);
 
    await axios(url)
      .then(async response => {

        const html = response.data;
        const $ = cheerio.load(html);

        var rewards = [];

        var name =  $('.db-view__detail__lname_name').text().replace(/\t/g, '').replace(/\n/g, '');
        var lvl =  $('.db-view__detail__level').text().replace(/\t/g, '').replace(/\n/g, '');

        var info = null;
        var req = null;
        var desc = null;

        $('.db-view__data__content_info', $('.db-view__data')).each((i, outerElement) => {

            if(i == 0)
            {
                //information
                info = $(outerElement).text().replace(/\t/g, '').replace(/\n/g, '');
            }
            if(i == 1)
            {
                //requirements
                req = $(outerElement).text().replace(/\t/g, '').replace(/\n/g, '');
            }
            if(i == 2)
            {
                //description
                desc = $(outerElement).text().replace(/\t/g, '').replace(/\n/g, '');
            }
        })
       
        //iterate over all the reward elements on the page
        $('.db-view__data__inner', $('.db-view__data__title--reward').parent()).each((i, outerElement) => {

              var bosslist = $('.db-view__data__boss_list', outerElement);
              var boss = $('.boss', bosslist).text().replace(/\t/g, '').replace(/\n/g, '');
              var adds = [];
              
              $('li', bosslist).each((i, a) => {
                  if($(a).attr('class') !== 'boss')
                    adds.push($(a).text().replace(/\t/g, '').replace(/\n/g, ''));       
              })
              
              var tomestones = [];
              var coffers = [];
              
              //tomestones (tokens)
              $('.db-view__data__reward__token', outerElement).each((j, innerElement) => {
                  tomestones.push({
                    name : $('.db-view__data__reward__token--name', outerElement).text(),
                    value : $('.db-view__data__reward__token--value', outerElement).text()
                  });
              });

              $('.sys_treasure_box', outerElement).each((j, innerElement) => {

                var coffer_type = $(innerElement).parent().attr('class').replace('sys_treasure_box_tab db-view__data__reward__treasure', '').replace('--', '');
                var coffer_name = $('.db-view__treasure_box_popup__title', innerElement).text().replace(/\t/g, '').replace(/\n/g, '');
                
                if(coffer_type == null || coffer_type.trim() === '')
                    coffer_type = 'default';
                    
                var items = [];

                $('.db-view__treasure_box_popup__treasure_items__box', innerElement).each((i, item_element) => {

                    var tb_text = $('.db-view__treasure_box_popup__treasure_items__box--text', item_element).text()
                    var tb_image = $('.db-view__treasure_box_popup__treasure_items__box--image', item_element).find('img').attr('src')
                    

                    var detail = tb_text.replace(/\t/g, '').split(/\n\n\n/);
                    var item_name = detail[0].replace(/\n/g, '').trim();
                    var item_url = config.ffxiv_config.url + $('a', item_element).attr('href').trim();
                    var item_url_parts = item_url.split('/');
                    var item_level = null;
                    var gear_level = null;

                    if(detail.length > 1)
                    {
                      item_level = detail[1].replace(/\n/g, '').split(' / ')[0].replace('Item Lv. ', '').trim();
                      gear_level = detail[1].replace(/\n/g, '').split(' / ')[1].replace('Gear Lv. ', '').trim()
                    } 

                    //new item
                    items.push({
                      name : item_name,
                      lodestone_url : item_url ,
                      lodestone_id : item_url_parts[item_url_parts.length-2],
                      image_url : tb_image,
                      item_level,
                      gear_level,
                    })
                });
                
                //new coffer
                coffers.push({
                  name : coffer_name,
                  type : coffer_type,
                  items : items
                });
            });

            //new reward
            rewards.push(
            {
              boss,
              adds,
              coffers,
              tomestones
            })
        });

       await callback(rewards, name, lvl, info, req ,desc);

      })
      .catch(console.error);

};

module.exports.readFiles = readFiles;
module.exports.dutyCollectionName = 'duties'