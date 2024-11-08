function calculateANOVA() {
  const dataInput = document.getElementById('dataInput').value.trim();
  const groups = dataInput.split('\n').map(line => line.split(',').map(Number));
  
  const tValue = parseFloat(document.getElementById('tValueInput').value);

  if (groups.some(group => group.some(isNaN)) || isNaN(tValue)) {
    document.getElementById('output').textContent = "Invalid input. Please enter valid numbers for the data and t-value.";
    return;
  }

  const mean = arr => arr.reduce((a, b) => a + b, 0) / arr.length;

  const groupMeans = groups.map(mean);
  const grandMean = mean(groups.flat());

  let SSTR = 0, SSE = 0;
  for (let i = 0; i < groups.length; i++) {
    SSTR += groups[i].length * Math.pow(groupMeans[i] - grandMean, 2);
    for (let j = 0; j < groups[i].length; j++) {
      SSE += Math.pow(groups[i][j] - groupMeans[i], 2);
    }
  }

  const dfB = groups.length - 1;
  const totalObservations = groups.reduce((sum, group) => sum + group.length, 0);
  const dfW = totalObservations - groups.length;
  const MSTR = SSTR / dfB;
  const MSE = SSE / dfW;
  const F = MSTR / MSE;

  let outputText = `Means for each group: ${groupMeans.map(m => m.toFixed(3)).join(', ')}\n`;
  outputText += `Y..: ${grandMean.toFixed(3)}\n`;
  outputText += `SSTR: ${SSTR.toFixed(3)}, SSE: ${SSE.toFixed(3)}\n`;
  outputText += `SSE: ${SSE.toFixed(3)}\n`;
  outputText += `Degrees of Freedom (dfB): ${dfB}, (dfW): ${dfW}\n`;
  outputText += `MSTR: ${MSTR.toFixed(3)}\n`;
  outputText += `MSE: ${MSE.toFixed(3)}\n`;
  outputText += `F-Statistic: ${F.toFixed(3)}\n\n`;

  outputText += "Confidence Intervals for Each Group Mean:\n";
  for (let i = 0; i < groups.length; i++) {
    const marginError = tValue * Math.sqrt(MSE / groups[i].length);
    const lowerCI = groupMeans[i] - marginError;
    const upperCI = groupMeans[i] + marginError;
    outputText += `Group ${i + 1}: Mean = ${groupMeans[i].toFixed(3)}, CI = [${lowerCI.toFixed(3)}, ${upperCI.toFixed(3)}]\n`;
  }
  
  document.getElementById('output').textContent = outputText;
  
  drawTDistributionChart(tValue, dfW);
}













function drawTDistributionChart(tValue, dfW) {
  const ctx = document.getElementById('tChart').getContext('2d');

  const xValues = [];
  const yValues = [];
  for (let x = -5; x <= 5; x += 0.1) {
    xValues.push(x);
    yValues.push(jStat.studentt.pdf(x, dfW));
  }

  const acceptedData = yValues.map((y, i) => Math.abs(xValues[i]) < Math.abs(tValue) ? y : null);
  const rejectedData = yValues.map((y, i) => Math.abs(xValues[i]) >= Math.abs(tValue) ? y : null);

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: xValues,
      datasets: [
        {
          label: 'Accepted Region',
          data: acceptedData,
          fill: true,
          borderColor: 'blue',
          backgroundColor: 'rgba(0, 0, 255, 0.2)',
          borderWidth: 1,
        },
        {
          label: 'Rejected Region',
          data: rejectedData,
          fill: true,
          borderColor: 'red',
          backgroundColor: 'rgba(255, 0, 0, 0.2)',
          borderWidth: 1,
        }
      ]
    },
    options: {
      scales: {
        x: { title: { display: true, text: 't-value' } },
        y: { title: { display: true, text: 'Probability Density' } }
      },
      plugins: {
        legend: { display: true }
      }
    }
  });
}

