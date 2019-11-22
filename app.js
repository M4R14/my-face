const express = require('express');
const app = express();
const path = require('path');
const router = express.Router();

//add the router
app.use('/dist', express.static('dist'));
//Store all HTML files in view folder.
app.use('/public', express.static(__dirname + '/public'));
//Store all JS and CSS in Scripts folder.
app.use('/weights', express.static(__dirname + '/weights'));

router.get('/',function(req,res){
    res.sendFile(path.join(__dirname+'/index.html'));
    //__dirname : It will resolve to your project folder.
});

var fs = require('fs');
router.get('/asset/:name',function(req,res){
    const directoryPath = path.join(__dirname, '/asset/'+req.params.name);
    fs.readdir(directoryPath, function (err, files) {
        //handling error
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        } 
        //listing all files using forEach
        files.forEach(function (file) {
            // Do whatever you want to do with the file
            console.log(file); 
        });
        res.json(files.map(fi => '/asset/'+req.params.name+"/"+fi));
    });
});

router.get('/asset/:name/:file',function(req,res){
    res.sendFile(path.join(__dirname, `/asset/${req.params.name}/${req.params.file}`));
});

router.get('/test-', async function(req,res){
    const faceapi = require(path.join(__dirname,'/node_modules/face-api.js/dist/face-api'));
    const imgBuffer = fs.readFileSync(path.join(__dirname, `/asset/mark/1.jpg`))
    console.log(imgBuffer);
    const img = await faceapi.bufferToImage(imgBuffer)
    console.log(img);
    const fullFaceDescription = await faceapi
            .detectSingleFace(img, new faceapi.SsdMobilenetv1Options() )
            .withFaceLandmarks()
            .withFaceDescriptor()

    res.send(fullFaceDescription);
});

const axios = require('axios')
router.get('/test-axios', async function(req,res){
    ax = await axios.get('localhost:3000/asset/mark')
    .then(res => {
        console.log(res);
        return res
    })
    res.send(ax);
});

//add the router
app.use('/', router);
app.listen(process.env.port || 3000);

console.log('Running at Port 3000');