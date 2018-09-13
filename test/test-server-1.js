const express = require('express');
const app = express();
var url = require('url');
var request = require('request');
var cheerio = require('cheerio');
app.use(express.json());

//Sample URL - http://localhost:8081/I/want/title/?address=http://www.google.com&address=http://www.gmail.com/&address=http://www.dawn.com/events/
app.get('/I/want/title/', (req, res)=>{
    
    var queryParams = url.parse(req.url, true).query;
    var queryParamsSize = Object.keys(req.query.address).length;

    if(!queryParams.address){
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<html><body><h1>Error 404: ' + req.url +' should not be empty</h1></body></html>');
        return;
    }

    var titleList = [];
    res.write('<html><head></head><body>');
    res.write('<h1> Following are the titles of given websites: </h1>');
    res.write('<ul>');
    if(typeof req.query.address =='string'){
        request(req.query.address, function (error, response, body) {
            var title = "";
            if(!error){
                const $ = cheerio.load(body);
                const webpageTitle = $("title").text();
                title = req.query.address + " - " + webpageTitle;
            }
            else{
                title = req.query.address + " - No Response";
            }

            res.write('<li>'+title+'</li>');
            titleList.push(title);
            if(titleList.length == queryParamsSize){
                res.write('</ul>');
                res.write('</body></html>');
                res.end();
            }
        });
    }
    else{
        queryParams.address.forEach(function(address) {
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

                res.write('<li>'+title+'</li>');
                titleList.push(title);
                if(titleList.length == queryParamsSize){
                    res.write('</ul>');
                    res.write('</body></html>');
                    res.end();
                }
            });
        });
    }
});

const port = process.env.PORT || 8081;

app.listen(port, ()=> {
    console.log(`listening on port ${port} `);
});