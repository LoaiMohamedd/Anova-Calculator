// Function to calculate Satterthwaite Procedure
function calculateSatterthwaite() {
  const alpha = parseFloat(document.getElementById("tValueInput").value);
  if (isNaN(alpha)) {
    alert("Please provide a valid alpha value.");
    return;
  }
  let { MSTR, MSE, df1, df2, lol } = calculateANOVA();
  if (!MSTR || !MSE || !df1 || !df2) {
    alert("ANOVA calculation failed. Please check your data.");
    return;
  }

  if (lol === 0) {
    alert("You can not solve this matrix by this method");
  } else {
    const r = df1 + 1;
    const n = (df2 + r) / r;

    const c1 = 1 / n;
    const c2 = -1 / n;
    const L_hat = c1 * MSTR + c2 * MSE;

    const sm1 = (MSTR - MSE) / n;
    const sm2 = sm1.toFixed(3);
    const numerator = Math.pow(sm2 * n, 2);
    const denominator1 = Math.pow(MSTR, 2) / (r - 1);
    const denominator2 = Math.pow(MSE, 2) / (r * (n - 1));
    const denominator = denominator1 + denominator2;
    const dff = Math.round(numerator / denominator);
    const df = dff.toFixed(3);

    const alphachi = 1 - alpha;
    const chi2Lower = jStat.chisquare.inv(alphachi.toFixed(3) / 2, df);
    const chi2Upper = jStat.chisquare.inv(1 - alphachi.toFixed(3) / 2, df);

    const lowerBound = (df * sm2) / chi2Upper.toFixed(3);
    const upperBound = (df * sm2) / chi2Lower.toFixed(3);

    // Output results
    const output = `Satterthwaite Procedure Results:

Point Estimate for S²μ: ${L_hat.toFixed(2)}
Degrees of Freedom: ${dff}
Confidence Interval : ${lowerBound.toFixed(2)} ≤ σ² ≤ ${upperBound.toFixed(4)}`;
    document.getElementById("output").textContent += "\n" + output;
  }
}

// ----------------------------------------------------------
function calculateTukey() {
  calculateANOVA();

  const dataInput = document.getElementById("dataInput").value.trim();
  const groups = dataInput
    .split("\n")
    .map((line) => line.split(",").map(Number));

  const alpha = 0.05; // Significance level
  const MSE = parseFloat(document.getElementById("tValueInput").value); // Mean Square Error (MSE)
  const n = parseInt(document.getElementById("qValueInput").value); // Sample size of each group (assuming equal sizes)

  if (groups.some((group) => group.some(isNaN)) || isNaN(MSE) || isNaN(n)) {
    document.getElementById("output").textContent =
      "Invalid input. Please enter valid numbers for the data, MSE, and sample size.";
    return;
  }

  const groupMeans = groups.map(
    (group) => group.reduce((sum, val) => sum + val, 0) / group.length
  );
  const totalGroups = groups.length;

  const dfW = groups.flat().length - totalGroups;

  const criticalQ = parseFloat(document.getElementById("qValueInput").value);

  const results = [];

  // Perform pairwise comparisons between groups
  for (let i = 0; i < totalGroups; i++) {
    for (let j = i + 1; j < totalGroups; j++) {
      const mean1 = groupMeans[i];
      const mean2 = groupMeans[j];

      const HSD = Math.abs(mean1 - mean2) / Math.sqrt(MSE / n);

      const significant = HSD > criticalQ;

      results.push({
        group1: i + 1,
        group2: j + 1,
        HSD: HSD.toFixed(4),
        criticalQ: criticalQ.toFixed(4),
        significant: significant ? "Yes" : "No",
      });
    }
  }

  // Output results
  let outputText = `Tukey's HSD Procedure Results (Critical q-value = ${criticalQ.toFixed(
    4
  )}):\n\n`;
  results.forEach((result) => {
    outputText += `Group ${result.group1} vs Group ${result.group2}: HSD = ${result.HSD}, Critical q = ${result.criticalQ},\n Significant = ${result.significant}\n`;
  });

  document.getElementById("output").textContent += "\n" + outputText;
}

// Function to calculate Bonferroni Procedure

function calculateBonferroni() {
  calculateANOVA();
  const dataInput = document.getElementById("dataInput").value.trim();
  const groups = dataInput
    .split("\n")
    .map((line) => line.split(",").map(Number));
  const alpha = 0.05; // Original significance level
  const MSE = parseFloat(document.getElementById("tValueInput").value); // Mean Square Error (MSE)

  if (groups.some((group) => group.some(isNaN)) || isNaN(MSE)) {
    document.getElementById("output").textContent =
      "Invalid input. Please enter valid numbers for the data and MSE.";
    return;
  }

  const groupMeans = groups.map(
    (group) => group.reduce((sum, val) => sum + val, 0) / group.length
  );
  const groupSizes = groups.map((group) => group.length);
  const totalGroups = groups.length;

  // Total number of pairwise comparisons (nC2)
  const numComparisons = (totalGroups * (totalGroups - 1)) / 2;

  // Adjusted alpha for Bonferroni correction
  const adjustedAlpha = alpha / numComparisons;

  const results = [];

  // Perform pairwise comparisons between groups
  for (let i = 0; i < totalGroups; i++) {
    for (let j = i + 1; j < totalGroups; j++) {
      const mean1 = groupMeans[i];
      const mean2 = groupMeans[j];
      const size1 = groupSizes[i];
      const size2 = groupSizes[j];

      // Calculate the standard error (SE)
      const SE = Math.sqrt(MSE * (1 / size1 + 1 / size2));

      // Calculate the t-statistic
      const t = Math.abs(mean1 - mean2) / SE;

      // Get the degrees of freedom for the error term (dfW)
      const dfW = groups.flat().length - totalGroups;

      // Critical t-value based on the adjusted alpha
      const criticalT = jStat.studentt.inv(1 - adjustedAlpha / 2, dfW); // Two-tailed test

      // Determine if the difference is significant
      const significant = t > criticalT;

      results.push({
        group1: i + 1, // Group numbers start from 1 for display
        group2: j + 1,
        t: t.toFixed(4),
        criticalT: criticalT.toFixed(4),
        significant: significant,
      });
    }
  }

  // Output results
  let outputText = `Bonferroni Procedure Results (Adjusted alpha = ${adjustedAlpha.toFixed(
    4
  )}):\n`;
  results.forEach((result) => {
    outputText += `Group ${result.group1} vs Group ${result.group2}: t = ${
      result.t
    }, Critical t = ${result.criticalT},\n Significant = ${
      result.significant ? "Yes" : "No"
    }\n`;
  });

  document.getElementById("output").textContent += "\n" + outputText;
}

//  Scheffe
function calculateScheffe() {
  calculateANOVA();
  const dataInput = document.getElementById("dataInput").value.trim();
  const groups = dataInput
    .split("\n")
    .map((line) => line.split(",").map(Number));
  const MSE = parseFloat(document.getElementById("tValueInput").value);
  const alpha = 0.05;

  if (groups.some((group) => group.some(isNaN)) || isNaN(MSE)) {
    document.getElementById("output").textContent =
      "Invalid input. Please enter valid numbers for the data and MSE.";
    return;
  }

  const groupMeans = groups.map(
    (group) => group.reduce((sum, val) => sum + val, 0) / group.length
  );
  const groupSizes = groups.map((group) => group.length);
  const results = [];

  // Perform pairwise comparisons between groups
  for (let i = 0; i < groups.length; i++) {
    for (let j = i + 1; j < groups.length; j++) {
      const mean1 = groupMeans[i];
      const mean2 = groupMeans[j];
      const size1 = groupSizes[i];
      const size2 = groupSizes[j];

      const F = Math.pow(mean1 - mean2, 2) / (MSE * (1 / size1 + 1 / size2));

      const dfBetween = groups.length - 1;
      const dfError = groups.flat().length - groups.length;
      const criticalValue = jStat.centralF.inv(1 - alpha, dfBetween, dfError);

      const significant = F > criticalValue;

      results.push({
        group1: i + 1,
        group2: j + 1,
        F: F.toFixed(4),
        criticalValue: criticalValue.toFixed(4),
        significant: significant,
      });
    }
  }

  // Output results
  let outputText = "Scheffe's Procedure Results:\n";
  results.forEach((result) => {
    outputText += `Group ${result.group1} vs Group ${result.group2}: F = ${
      result.F
    }, Critical Value = ${result.criticalValue}, \n Significant = ${
      result.significant ? "Yes" : "No"
    }\n`;
  });

  document.getElementById("output").textContent += "\n" + outputText;
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
  const ay7aga = groups[0].length;
  let koks = 1;
  for (let i = 1; i < groups.length; i++) {
    // Validate each row
    if (groups[i].length !== ay7aga) {
      koks = 0; // Mark as invalid
      break; // Stop checking further
    }
  }

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
  outputText += `F-Statistic: ${F.toFixed(3)}\n`;

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

  // Calculate pairwise confidence intervals
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
      )}, ${upper.toFixed(3)}] \n`;
    }
    `\n`;
  }

  document.getElementById("output").textContent = outputText;

  // Draw interval call
  drawIntervalChart(groupMeans, lowerCI, upperCI);
  return { MSTR, MSE, df1: dfB, df2: dfW, lol: koks };
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

            ctx.beginPath();
            ctx.moveTo(xValue, yMin);
            ctx.lineTo(xValue, yMax);
            ctx.stroke();

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
