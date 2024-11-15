// Function to calculate Tukey
function calculateTukey(groups, qValue, MSE) {
  const groupMeans = groups.map(
    (group) => group.reduce((sum, val) => sum + val, 0) / group.length
  );
  const groupSizes = groups.map((group) => group.length);
  const results = [];

  for (let i = 0; i < groupMeans.length; i++) {
    for (let j = i + 1; j < groupMeans.length; j++) {
      const meanDiff = Math.abs(groupMeans[i] - groupMeans[j]);
      const SE = Math.sqrt(MSE * (1 / groupSizes[i] + 1 / groupSizes[j]));
      const criticalValue = qValue * SE;
      const significant = meanDiff > criticalValue;

      results.push({
        group1: i + 1,
        group2: j + 1,
        meanDiff: meanDiff.toFixed(3),
        criticalValue: criticalValue.toFixed(3),
        significant,
      });
    }
  }
  return results;
}


// Function to calculate Scheffé's procedure
function calculateScheffe(groups, MSE, alpha = 0.05) {
  const groupMeans = groups.map(
    (group) => group.reduce((sum, val) => sum + val, 0) / group.length
  );
  const groupSizes = groups.map((group) => group.length);

  const dfB = groups.length - 1; // Between-group degrees of freedom
  const dfW = groups.reduce((sum, group) => sum + group.length, 0) - groups.length; // Within-group degrees of freedom

  const criticalValue = jStat.centralF.inv(1 - alpha, dfB, dfW); // F-distribution critical value

  const results = [];

  // Perform pairwise comparison for all group pairs
  for (let i = 0; i < groupMeans.length; i++) {
    for (let j = i + 1; j < groupMeans.length; j++) {
      const meanDiff = Math.abs(groupMeans[i] - groupMeans[j]);
      const SE = Math.sqrt(MSE * (1 / groupSizes[i] + 1 / groupSizes[j]));
      const Fscheffe = Math.pow(meanDiff, 2) / (MSE * (1 / groupSizes[i] + 1 / groupSizes[j]));

      const significant = Fscheffe > criticalValue;

      results.push({
        group1: i + 1,
        group2: j + 1,
        meanDiff: meanDiff.toFixed(3),
        Fscheffe: Fscheffe.toFixed(3),
        criticalValue: criticalValue.toFixed(3),
        significant,
      });
    }
  }

  return results;
}


function calculateANOVA() {
  const dataInput = document.getElementById("dataInput").value.trim();
  const groups = dataInput
    .split("\n")
    .map((line) => line.split(",").map(Number));
  const tValue = parseFloat(document.getElementById("tValueInput").value);
  const qValue = parseFloat(document.getElementById("qValueInput").value);

  if (
    groups.some((group) => group.some(isNaN)) ||
    isNaN(tValue) ||
    isNaN(qValue)
  ) {
    document.getElementById("output").textContent =
      "Invalid input. Please enter valid numbers for the data, t-value, and q-value.";
    return;
  }

  const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

  const groupMeans = groups.map(mean);
  const grandMean = mean(groups.flat());

  let SSTR = 0,
    SSE = 0;
  for (let i = 0; i < groups.length; i++) {
    SSTR += groups[i].length * Math.pow(groupMeans[i] - grandMean, 2);
    for (let j = 0; j < groups[i].length; j++) {
      SSE += Math.pow(groups[i][j] - groupMeans[i], 2);
    }
  }

  const dfB = groups.length - 1;
  const totalObservations = groups.reduce(
    (sum, group) => sum + group.length,
    0
  );
  const dfW = totalObservations - groups.length;
  const MSTR = SSTR / dfB;
  const MSE = SSE / dfW;
  const F = MSTR / MSE;

  let outputText = `Means for each group: ${groupMeans
    .map((m) => m.toFixed(3))
    .join(", ")}\n`;
  outputText += `Degrees of Freedom (dfB): ${dfB}\n`;
  outputText += `Degrees of Freedom (dfW): ${dfW}\n`;
  outputText += `Degrees of Freedom (dft): ${totalObservations - 1}\n`;
  outputText += `Y..: ${grandMean.toFixed(3)}\n`;
  outputText += `SSTR: ${SSTR.toFixed(3)}\n`;
  outputText += `SSE: ${SSE.toFixed(3)}\n`;
  outputText += `SSTO: ${(SSE + SSTR).toFixed(3)}\n`;
  outputText += `MSTR: ${MSTR.toFixed(3)}\n`;
  outputText += `MSE: ${MSE.toFixed(3)}\n`;
  outputText += `F-Statistic: ${F.toFixed(3)}\n\n`;
  
  // Calculate Confidence Intervals for each group
  const marginsOfError = [];
  const lowerCI = [];
  const upperCI = [];
  for (let i = 0; i < groups.length; i++) {
    const marginError = tValue * Math.sqrt(MSE / groups[i].length);
    marginsOfError.push(marginError);
    lowerCI.push(groupMeans[i] - marginError);
    upperCI.push(groupMeans[i] + marginError);
    outputText += `Group ${i + 1}: Mean = ${groupMeans[i].toFixed(3)}\n`;
  }

  // Calculate pairwise confidence intervals for group comparisons
  outputText += `\nPairwise Confidence Intervals (q-value = ${qValue}):\n`;
  const pairwiseCI = [];
  for (let i = 0; i < groups.length; i++) {
    for (let j = i + 1; j < groups.length; j++) {
      const SD = Math.sqrt(MSE * (1 / groups[i].length + 1 / groups[j].length));
      const t = (1 / Math.sqrt(2)) * qValue;
      const upper = t * SD + (groupMeans[j] - groupMeans[i]);
      const lower = -t * SD + (groupMeans[j] - groupMeans[i]);
      pairwiseCI.push({
        pair: `[Group ${i + 1}, Group ${j + 1}]`,
        lower,
        upper,
      });
      outputText += `Pair ${i + 1}-${j + 1}: CI = [${lower.toFixed(
        3
      )}, ${upper.toFixed(3)}]\n`;
    }
  }




  // tukey call 
  const tukeyResults = calculateTukey(groups, qValue, MSE);

  // Display Tukey results
  outputText += `\nTukey's HSD Results (q-value = ${qValue}):\n`;
  tukeyResults.forEach((result) => {
    outputText += `Group ${result.group1} vs Group ${result.group2}: Mean Diff = ${result.meanDiff}, Critical Value = ${result.criticalValue},
     Significant = ${result.significant ? "Yes" : "No"}\n`;
  });

  // sheff call 
  const scheffeResults = calculateScheffe(groups, MSE);

  // Display Scheffé results
  outputText += `\nScheffé's Test Results:\n`;
  scheffeResults.forEach((result) => {
    outputText += `Group ${result.group1} vs Group ${result.group2}: F = ${
      result.Fscheffe
    }, Critical Value = ${result.criticalValue}, Significant = ${
      result.significant ? "Yes" : "No"
    }\n`;
  });






  document.getElementById("output").textContent = outputText;
  // Draw the interval chart
  drawIntervalChart(groupMeans, lowerCI, upperCI);
}


// Draw Bar Chart with Confidence Intervals
function drawIntervalChart(groupMeans, lowerCI, upperCI) {
  const ctx = document.getElementById("intervalChart").getContext("2d");

  const labels = groupMeans.map((_, i) => `Group ${i + 1}`);
  const data = {
    labels: labels,
    datasets: [
      {
        label: "Group Means",
        data: groupMeans,
        backgroundColor: "maroon",
        borderColor: "maroon",
        borderWidth: 1,
      },
    ],
  };

  // Remove any previous chart instance
  if (window.intervalChartInstance) {
    window.intervalChartInstance.destroy();
  }

  window.intervalChartInstance = new Chart(ctx, {
    type: "bar",
    data: data,
    options: {
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Mean Value",
          },
        },
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              return `Mean: ${context.raw.toFixed(3)}\nCI: [${lowerCI[
                context.dataIndex
              ].toFixed(3)}, ${upperCI[context.dataIndex].toFixed(3)}]`;
            },
          },
        },
      },
    },
    plugins: [
      {
        id: "errorBars",
        afterDatasetsDraw(chart) {
          const {
            ctx,
            chartArea: { top, bottom },
            scales: { x, y },
          } = chart;

          ctx.save();
          ctx.strokeStyle = "black";
          ctx.lineWidth = 2;

          groupMeans.forEach((_, index) => {
            const xValue = x.getPixelForValue(index);
            const yMin = y.getPixelForValue(lowerCI[index]);
            const yMax = y.getPixelForValue(upperCI[index]);

            // Draw vertical error bar line
            ctx.beginPath();
            ctx.moveTo(xValue, yMin);
            ctx.lineTo(xValue, yMax);
            ctx.stroke();

            // Draw top and bottom caps of the error bars
            ctx.beginPath();
            ctx.moveTo(xValue - 5, yMin);
            ctx.lineTo(xValue + 5, yMin);
            ctx.moveTo(xValue - 5, yMax);
            ctx.lineTo(xValue + 5, yMax);
            ctx.stroke();
          });

          ctx.restore();
        },
      },
    ],
  });
}
