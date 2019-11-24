require('./script.js');
import * as Comlink from "comlink";
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
console.log('test')

const makeDescription = async (label) => {
  const response = await fetch("/asset/"+label);
  const myJson = await response.json();
  // const LIMIT = myJson.length;

  const faceDescriptors = await Promise.all(myJson.map(async imgUrl => {
    console.log('makeDescription:', imgUrl);
    const img = await faceapi.fetchImage(imgUrl)
    // console.log(img);
    const fullFaceDescription = await faceapi
            .detectSingleFace(img, new faceapi.SsdMobilenetv1Options() )
            .withFaceLandmarks()
            .withFaceDescriptor()

    if (!fullFaceDescription) {
      throw new Error(`no faces detected for ${label}. ${imgUrl}`)
    }
    const {descriptor} = fullFaceDescription;
    // console.log(JSON.parse(JSON.stringify([descriptor])));
    return descriptor
  }))

  return faceDescriptors;
}


const run = async () => {
    console.info('loadModels --- 1');
    await loadModels();
    console.info('done');

    labeledDescriptors = await Promise.all(
        labels.map(async label => {
          console.info('RUN -- labeledDescriptors');
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

const videoplay = () => {
    const canvas = faceapi.createCanvasFromMedia(video)
    document.getElementById('section-video').append(canvas)
    const displaySize = { width: video.width, height: video.height }
    faceapi.matchDimensions(canvas, displaySize)

    setInterval(async () => {
      const detections = await faceapi.detectAllFaces(video, new faceapi.SsdMobilenetv1Options())
        .withFaceLandmarks()
        .withFaceDescriptors()
      // .withFaceExpressions()

      const resizedDetections = faceapi.resizeResults(detections, displaySize)

      // console.log('resizedDetections',resizedDetections);
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
      faceapi.draw.drawDetections(canvas, resizedDetections)
      // faceapi.matchDimensions(canvas, resizedDetections)
      // faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
      // faceapi.draw.drawFaceExpressions(canvas, resizedDetections)
      const maxDescriptorDistance = 0.6
      resizedDetections.forEach(res => {
          const bestMatch = faceMatcher.findBestMatch(res.descriptor, maxDescriptorDistance)
          stat.push({
            label: bestMatch.label,
            distance: bestMatch.distance,
            timestamp: Date.now(),
          });
          new faceapi.draw.DrawTextField([
              bestMatch.toString(),
          ], res.detection.box.bottomLeft).draw(canvas)
      });

      
      statDom(stat, labels)
    }, 100)
};

const video = document.getElementById('video')
video.addEventListener('play', videoplay)

const worker = new Worker("dist/worker.js");
const obj = Comlink.wrap(worker);

const statDom = async (data, _labels) => {
  const $stat = document.getElementById('stat');
  const stat_raw = await obj.statDom(JSON.stringify(data), labels);
  $stat.innerHTML = '';

  const li = document.createElement('li');
  li.innerText = `Total: ${stat_raw.total} pic.`;
  const TOTAL = stat_raw.total;
  $stat.appendChild(li);

  stat_raw.stat_per_label.forEach((sr => {
    const li = document.createElement('li');
    li.innerText = [
      `Label: ${sr.label}`,
      `Distance: ${sr.distanceAVG.toFixed(2)}%`,
      `Found: ${sr.found} face `,
      `${((sr.found/TOTAL) * 100).toFixed(2)} %`
    ].join(', ') ;
    $stat.appendChild(li)
  }))

  const whoIsStat = await obj.whoIs(data);
  if (whoIsStat) {
    const whoIs = document.getElementById('who-is');
    whoIs.innerText = [
      "in 200 ms",
      JSON.stringify(whoIsStat.className),
      "total: " + whoIsStat.total
    ].join(', ');
  }
}; 
