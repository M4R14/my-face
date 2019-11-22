const clock = document.getElementById('clock');
const startDate = new Date();

setInterval(() =>  {
    const endDate   = new Date();
    const diff = (endDate.getTime() - startDate.getTime()) / 1000;
    clock.innerText = `${diff} s`;
}, 100);