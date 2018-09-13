const express = require('express');
const app = express();
const url = require('url');
const request = require('request');
const cheerio = require('cheerio');
const async = require('async');
const rsvp = require('rsvp');
app.use(express.json());

//Sample URL - http://localhost:8085/I/want/title/?address=http://www.google.com&address=http://www.gmail.com/&address=http://www.dawn.com/events/
app.get('/I/want/title/', (req, res)=>{
    var getQueryParametersFromRequest = function(urlString) {
        var promise = new rsvp.Promise(function(resolve, reject){
            var queryStringParams = url.parse(req.url, true).query;
            if(!queryStringParams.address){
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<html><body><h1>Error 404: ' + urlString +' should not be empty</h1></body></html>');
                
                reject('<html><body><h1>Error 404: ' + urlString +' should not be empty</h1></body></html>');
                return;
            }
            
            resolve(queryStringParams);
        });
        return promise;
    };

    var convertQueryParamsToArray = function(queryStringParams){
        var promise = new rsvp.Promise(function(resolve, reject){
            var addressList= [];
            if(typeof queryStringParams.address =='string'){
                queryParamsSize = 1;
                addressList.push(req.query.address);
                resolve(addressList);
            }
            else{
                var queryParamsSize = Object.keys(req.query.address).length;
                queryStringParams.address.forEach(function(address) {
                    addressList.push(address);
                    if(queryParamsSize === addressList.length){
                        resolve(addressList);
                    }
                });
            }
        });

        return promise;
    };

    var getTitles = function(addressList){
        var promise = new rsvp.Promise(function(resolve, reject){
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
                        resolve(titleList);
                    }
                });
            });
        });

        return promise;
    };

    var renderResponse = function(titles){
        var promise = new rsvp.Promise(function(resolve, reject){
            var htmlString = "";
            htmlString+='<html><head></head><body>';
            htmlString+='<h1> Following are the titles of given websites: </h1>';
            htmlString+='<ul>';
            titles.forEach(function(title) 
            { 
                htmlString+='<li>'+title+'</li>';
            });
            htmlString+='</ul>';
            htmlString+='</body></html>';
            resolve(htmlString);
        });

        return promise;
    };

    getQueryParametersFromRequest(req.url)
    .then(function(queryStringParams){
            return convertQueryParamsToArray(queryStringParams);
    }).then(function(addressList){
            return getTitles(addressList);
    }).then(function(titles){
            return renderResponse(titles);
    }).then(function(htmlString){
            res.write(htmlString);
            res.end();
    }).catch(function(error) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('Resolving url failed: ' + error.message);
        });

});

const port = process.env.PORT || 8081;

app.listen(port, ()=> {
    console.log(`listening on port ${port} `);
});