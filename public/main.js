async function fetchData() {
    const response = await fetch('/data');
    const data = await response.json();
    return data;
  }
  
  function filterDataByTimeframe(data, timeframe) {
    if (timeframe === 'all') {
      return data;
    }
  
    const now = new Date();
    const hoursAgo = now.getTime() - timeframe * 60 * 60 * 1000;
  
    return data.filter((entry) => new Date(entry.timestamp).getTime() >= hoursAgo);
  }
  
  function createChart(data) {
    const ctx = document.getElementById('tempHumidityChart').getContext('2d');
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'Temperature (°F)',
            data: data.map((entry) => ({
              x: entry.timestamp,
              y: entry.temperature,
            })),
            borderColor: 'rgb(255, 99, 132)',
            yAxisID: 'temperature',
          },
          {
            label: 'Humidity (%)',
            data: data.map((entry) => ({
              x: entry.timestamp,
              y: entry.humidity,
            })),
            borderColor: 'rgb(75, 192, 192)',
            yAxisID: 'humidity',
          },
        ],
      },
      options: {
        scales: {
          x: {
            type: 'time',
            display: true,
            title: {
              display: true,
              text: 'Time',
            },
          },
          temperature: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Temperature (°F)',
            },
            ticks: {
              color: 'rgb(255, 99, 132)',
              font: {
                weight: 'bold',
              },
            },
          },
          humidity: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Humidity (%)',
            },
            grid: {
              drawOnChartArea: false,
            },
            ticks: {
              color: 'rgb(75, 192, 192)',
              font: {
                weight: 'bold',
              },
            },
          },
        },
      },
    });
  
    return chart;
  }
  
  (async () => {
    const data = await fetchData();
    const chart = createChart(data);
  
    const timeframeSelector = document.getElementById('timeframeSelector');
    timeframeSelector.addEventListener('change', async () => {
      const filteredData = filterDataByTimeframe(data, timeframeSelector.value);
      chart.data.datasets[0].data = filteredData.map((entry) => ({
        x: entry.timestamp,
        y: entry.temperature,
      }));
      chart.data.datasets[1].data = filteredData.map((entry) => ({
        x: entry.timestamp,
        y: entry.humidity,
      }));
      chart.update();
    });
  })();
  function refreshPage() {
    setTimeout(() => {
      location.reload();
    }, 60000);
  }
  
  refreshPage();
  