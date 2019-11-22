require('./script.js');
const faceapi = require('../node_modules/face-api.js/dist/face-api');
import { loadModels, getFullFaceDescription, getFullFaceDescription2 } from './api/face';

let labeledDescriptors;
let faceMatcher;

const labels = [
  'mark',
  'nick',
  'dao',
  'ink',
]

const makeDescription = async (label) => {
  const response = await fetch("/asset/"+label);
  const myJson = await response.json();
  const faceDescriptors = [];

  for (let index = 0; index < myJson.length; index++) {
    const imgUrl = myJson[index];
    const img = await faceapi.fetchImage(imgUrl)
    // console.log(img);
    const fullFaceDescription = await faceapi
            .detectSingleFace(img, new faceapi.SsdMobilenetv1Options() )
            .withFaceLandmarks()
            .withFaceDescriptor()

    if (!fullFaceDescription) {
      throw new Error(`no faces detected for ${label}. ${imgUrl}`)
    }
    faceDescriptors.push(fullFaceDescription.descriptor)
  }

  return faceDescriptors;
}


const run = async () => {
    console.info('loadModels --- 1');
    await loadModels();
    console.info('done');

    labeledDescriptors = await Promise.all(
        labels.map(async label => {
          const faceDescriptors = await makeDescription(label)

          return new faceapi.LabeledFaceDescriptors(label, faceDescriptors)
        })
      )

    console.info('done');
    
    console.log(labeledDescriptors);
    faceMatcher = new faceapi.FaceMatcher(labeledDescriptors)

    startVideo();
}

run();

function startVideo() {
    navigator.getUserMedia(
        { video: {} },
        stream => video.srcObject = stream,
        err => console.error(err)
    )
}

const stat = [];

const avg = (stat, _label) => {
    const range = stat.filter(st => st.label == _label).length + 1;
    let mrakvachi_sum = 0;
    stat.filter(st => st.label == _label).forEach((st => {
        mrakvachi_sum += st.distance
    }));
    return (mrakvachi_sum * 100 /range)
}

const videoplay = () => {
    const canvas = faceapi.createCanvasFromMedia(video)
    document.getElementById('section-video').append(canvas)
    const displaySize = { width: video.width, height: video.height }
    faceapi.matchDimensions(canvas, displaySize)

    setInterval(async () => {
      const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors()
      // .withFaceExpressions()

      const resizedDetections = faceapi.resizeResults(detections, displaySize)

      // console.log(resizedDetections);
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
      faceapi.draw.drawDetections(canvas, resizedDetections)
      // faceapi.matchDimensions(canvas, resizedDetections)
      // faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
      // faceapi.draw.drawFaceExpressions(canvas, resizedDetections)
      const maxDescriptorDistance = 0.6
      resizedDetections.forEach(res => {
          const bestMatch = faceMatcher.findBestMatch(res.descriptor, maxDescriptorDistance)
          stat.push(bestMatch);
          new faceapi.draw.DrawTextField([
              bestMatch.toString(),
          ], res.detection.box.bottomRight).draw(canvas)
      });

      statDom(stat, labels)
    }, 100)
};

const video = document.getElementById('video')
video.addEventListener('play', videoplay)


const statDom = (data, _labels) => {
  const $stat = document.getElementById('stat');
  $stat.innerHTML = '';
  _labels.forEach((lbText) => {
    const li = document.createElement('li')
    const avg_val = avg(data, lbText)
    li.innerText = `${lbText}: ${avg_val}`;
    $stat.appendChild(li)
  })
}; 
