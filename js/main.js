
// const groups = [
//     [7.6 , 8.2 , 6.8 , 5.8 , 6.9 , 6.6 , 6.3 , 7.7 ,  6                    ],   
//     [6.7 , 8.1 , 9.4 , 8.6 , 7.8 , 7.7 , 8.9 , 7.9 , 8.3 , 8.7 , 7.1 , 8.4 ],  
//     [8.5 , 9.7 , 10.1, 7.8 , 9.6 , 9.5                                     ],
//   ];


// // const groups = [
// //     [11 , 17 , 16 , 14 , 15],
// //     [12 , 10 , 15 , 19 , 11],
// //     [23 , 20 , 18 , 17     ],
// //     [27 , 33 , 22 , 26 , 28]
// //   ];


//   const mean = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
//   const groupMeans = groups.map(mean);
//   const grandMean = mean(groups.flat());
  

//   let SSTR = 0;
//   for (let i = 0; i < groups.length; i++) {
//     SSTR += groups[i].length * Math.pow(groupMeans[i] - grandMean, 2);
//   }
  

//   let SSE = 0;
//   for (let i = 0; i < groups.length; i++) {
//     for (let j = 0; j < groups[i].length; j++) {
//       SSE += Math.pow(groups[i][j] - groupMeans[i], 2);
//     }
//   }
  
  
//   const dfB = groups.length - 1;
//   const totalObservations = groups.reduce((sum, group) => sum + group.length, 0);
//   const dfW = totalObservations - groups.length;
  
  
//   const MSTR = SSTR / dfB;
//   const MSE = SSE / dfW;
  
  
//   const F = MSTR / MSE;
  
//   console.log("Means for each group:", groupMeans);
//   console.log("Grand Mean:", grandMean);
//   console.log("Sum of Squares Between Treatment (SSTR):", SSTR);
//   console.log("Sum of Squares Within  Treatment (SSE):", SSE);
//   console.log("Total Sum of Squares (SST) :", SSE+SSTR);
//   console.log("Degrees of Freedom Between (dfB):", dfB);
//   console.log("Degrees of Freedom Within (dfW):", dfW);
//   console.log("Degrees of Freedom Total :", totalObservations -1);
//   console.log("Mean Square Between (MSTR) :", MSTR);
//   console.log("Mean Square Within (MSE) :", MSE);
//   console.log("F-Statistic:", F);
  




function calculateANOVA() {
  // Parsing the input data
  const dataInput = document.getElementById('dataInput').value.trim();
  const groups = dataInput.split('\n').map(line => line.split(',').map(Number));
  
  // Get the t-value from user input
  const tValue = parseFloat(document.getElementById('tValueInput').value);

  // Validate user inputs
  if (groups.some(group => group.some(isNaN)) || isNaN(tValue)) {
    document.getElementById('output').textContent = "Invalid input. Please enter valid numbers for the data and t-value.";
    return;
  }

  // Mean calculation helper
  const mean = arr => arr.reduce((a, b) => a + b, 0) / arr.length;

  // Step 1: Calculate group means and grand mean
  const groupMeans = groups.map(mean);
  const grandMean = mean(groups.flat());

  // Step 2: Calculate SSB and SSW
  let SSB = 0, SSW = 0;
  for (let i = 0; i < groups.length; i++) {
    SSB += groups[i].length * Math.pow(groupMeans[i] - grandMean, 2);
    for (let j = 0; j < groups[i].length; j++) {
      SSW += Math.pow(groups[i][j] - groupMeans[i], 2);
    }
  }

  // Step 3: Degrees of Freedom and Mean Squares
  const dfB = groups.length - 1;
  const totalObservations = groups.reduce((sum, group) => sum + group.length, 0);
  const dfW = totalObservations - groups.length;
  const MSB = SSB / dfB;
  const MSW = SSW / dfW;
  const F = MSB / MSW;

  // Step 4: Confidence Intervals for Each Group Mean
  let outputText = `Means for each group: ${groupMeans.map(m => m.toFixed(2)).join(', ')}\n`;
  outputText += `Grand Mean: ${grandMean.toFixed(2)}\n`;
  outputText += `SSB: ${SSB.toFixed(2)}, SSW: ${SSW.toFixed(2)}\n`;
  outputText += `Degrees of Freedom (dfB): ${dfB}, (dfW): ${dfW}\n`;
  outputText += `MSB: ${MSB.toFixed(2)}, MSW: ${MSW.toFixed(2)}\n`;
  outputText += `F-Statistic: ${F.toFixed(2)}\n\n`;

  outputText += "Confidence Intervals for Each Group Mean:\n";
  for (let i = 0; i < groups.length; i++) {
    const marginError = tValue * Math.sqrt(MSW / groups[i].length);
    const lowerCI = groupMeans[i] - marginError;
    const upperCI = groupMeans[i] + marginError;
    outputText += `Group ${i + 1}: Mean = ${groupMeans[i].toFixed(2)}, CI = [${lowerCI.toFixed(2)}, ${upperCI.toFixed(2)}]\n`;
  }

  // Display the output
  document.getElementById('output').textContent = outputText;

  // Generate the T-Distribution Chart
  drawTDistributionChart(tValue, dfW);
}

function drawTDistributionChart(tValue, dfW) {
  const ctx = document.getElementById('tChart').getContext('2d');

  // Generate t-distribution values
  const xValues = [];
  const yValues = [];
  for (let x = -5; x <= 5; x += 0.1) {
    xValues.push(x);
    yValues.push(jStat.studentt.pdf(x, dfW)); // Using jStat library to get pdf for t-distribution
  }

  // Set up data for accepted and rejected regions
  const acceptedData = yValues.map((y, i) => Math.abs(xValues[i]) < Math.abs(tValue) ? y : null);
  const rejectedData = yValues.map((y, i) => Math.abs(xValues[i]) >= Math.abs(tValue) ? y : null);

  // Create Chart
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

