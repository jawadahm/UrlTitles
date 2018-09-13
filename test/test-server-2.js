const express = require('express');
const app = express();
const url = require('url');
const request = require('request');
const cheerio = require('cheerio');
const async = require('async');
app.use(express.json());

//Sample URL - http://localhost:8085/I/want/title/?address=http://www.google.com&address=http://www.gmail.com/&address=http://www.dawn.com/events/
app.get('/I/want/title/', (req, res)=>{
    
    async.waterfall([
        function getQueryParametersFromRequest(queryParams){
            var queryStringParams = url.parse(req.url, true).query;
            if(!req.query.address){
                queryParams('query string is empty');
            }
            else{
                queryParams(null, queryStringParams);
            }
        },

        function convertQueryParamsToArray(queryStringParams, addressListCallBack){
            var addressList= [];
            if(typeof queryStringParams.address =='string'){
                queryParamsSize = 1;
                addressList.push(req.query.address);
                addressListCallBack(null, addressList);
            }
            else{
                var queryParamsSize = Object.keys(req.query.address).length;
                queryStringParams.address.forEach(function(address) {
                    addressList.push(address);
                    if(queryParamsSize === addressList.length){
                        addressListCallBack(null, addressList);
                    }
                });
            }
        },

        function getTitles(addressList, titles){
            var queryParamsSize = addressList.length;

            var titleList = [];
            addressList.forEach(function(address) {
                request(address, function (error, response, body) {
                    var title = "";
                    if(!error){
                        const $ = cheerio.load(body);
                        const webpageTitle = $("title").text();
                        title = address + " - " + webpageTitle;
                    }
                    else{
                        title = address + " - No Response";
                    }
                    titleList.push(title);
                    if(titleList.length == queryParamsSize){
                        titles(null, titleList);
                    }
                });
            });
        },

        function renderResponse(titles, callBack){
            res.write('<html><head></head><body>');
            res.write('<h1> Following are the titles of given websites: </h1>');
            res.write('<ul>');
            titles.forEach(function(title) 
            { 
                res.write('<li>'+title+'</li>');
            });
            res.write('</ul>');
            res.write('</body></html>');
            res.end();
            callBack(null);
        }
    ],
    function err(err){
        if(err){
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<html><body><h1>Error 404: ' + req.url +' should not be empty</h1></body></html>');
        }
    });
});

const port = process.env.PORT || 8081;

app.listen(port, ()=> {
    console.log(`listening on port ${port} `);
});