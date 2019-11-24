import * as Comlink from "comlink";
import * as faceapi from 'face-api.js';

const avg = (stat, _label) => {
    const range = stat.filter(st => st.label == _label).length + 1;
    let mrakvachi_sum = 0;
    stat.filter(st => st.label == _label).forEach((st => {
        mrakvachi_sum += st.distance
    }));
    return (mrakvachi_sum * 100 /range)
}

const App = {
    test: () => console.log(1111),
    whoIs: (data) => {
        const t = new Date();
        const last_Data = data.filter(dt => dt.timestamp >= new Date(t.getTime() - 1000));
        
        if (last_Data.length > 0) {
            const className = {};
            last_Data.forEach((ld => {
                if (className[ld.label]) {
                    className[ld.label] += 1;
                } else {
                    className[ld.label] = 1
                }
            }))
            // console.log(last_Data, className);
            return {
                className,
                total: last_Data.length,
            }
        }

        return {
            className: {},
            total: 0,
        }
    },
    statDom: (data, _labels) => {
        data = JSON.parse(data); 
        const TOTAL = data.length;
        const stat_per_label = _labels.map((lbText) => {
            const data_focus = data.filter(da => da.label == lbText);
            const avg_val = Number(avg(data_focus, lbText));
            const found = data_focus.length;

            return {
                label: lbText,
                distanceAVG: avg_val,
                found: found,
            }
        })

        
        return {
            total: TOTAL,
            stat_per_label,
        };
    },
    makeDescription: async (label) => {
        const response = await fetch("/asset/"+label);
        const myJson = await response.json();
        const faceDescriptors = [];
      
        // const LIMIT = myJson.length;
        const LIMIT = 1;
      
        for (let index = 0; index < LIMIT; index++) {
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
          const {descriptor} = fullFaceDescription;
          console.log(JSON.parse(JSON.stringify([descriptor])));
          faceDescriptors.push(descriptor)
        }

        return faceDescriptors;
    }
}

Comlink.expose(App);
