const faceapi = require('../../node_modules/face-api.js/dist/face-api');

// Load models and weights
export async function loadModels() {
  console.log('run loadModels ');
  console.log(faceapi.nets)
  const MODEL_URL = '/weights';
  await faceapi.loadSsdMobilenetv1Model(MODEL_URL)
  // await faceapi.loadMtcnnModel(MODEL_URL)
  await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
  await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
  await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
  await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
}
