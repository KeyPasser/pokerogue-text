//httpserver.js
import http from 'http';
import url from "url";
import util from 'util';
import fs from 'fs';
import Busboy from 'busboy';
import querystring from 'querystring';
import mime from 'mime-types';
const port = 8000;

let saveTime = ""
http.createServer((req, res) => {
    res.statusCode = 200,
    res.setHeader('Content-Type', 'text/plain;charset=utf-8');
    if(req.method === 'GET') {
        toGet(req, res);
    }else if(req.method === 'POST') {
        toPost(req, res);
    }
}).listen(port, () => {
    console.log(`Server listening on: http://localhost:${port}`);
});
 
//获取GET请求内容 
function toGet(req, res){
    let url = req.url == "/" ? "/index.html" : req.url;
    url = decodeURI(url);

    if(fs.existsSync('./'+ url)){
        res.setHeader('Content-Type', mime.lookup(url));
        res.end(fs.readFileSync('./'+url));
    }else{
        res.writeHead(404, { 'Connection': 'close' }); 
        res.end("not found");   
    }
}
 
//获取POST请求内容、cookie 
function toPost(req, res){
    const busboy = Busboy ({ headers: req.headers });  
				
    console.log(new Date().toString().substring(16,25));

    const fileContents = {}
	busboy.on('file', (fieldname, file, filename, encoding, mimetype) => { 
		file.on('data', data => {
            if(!fileContents[fieldname])
                fileContents[fieldname] = [];
            fileContents[fieldname].push(data);
        });  
		file.on('end', () => {
            if(fs.existsSync("./"+fieldname))
            fs.truncateSync("./"+fieldname);
            fs.writeFileSync("./"+fieldname, Buffer.concat(fileContents[fieldname]),{
                flag: 'a'
            })
            console.log(`File [${fieldname}] Finished`)
        });  
	});  
			
	busboy.on('finish', () => {  
		res.writeHead(200, { 'Connection': 'close' });  
		res.end("That's all folks!"); 
         
	});  
			
	return req.pipe(busboy); 
}