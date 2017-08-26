const loadData = async () => {
  const response = await fetch('http://localhost:8000/repos/systemd/out.jsonl')
  const rawData = await response.text()
  return rawData.split('\n').map(row => JSON.parse(row))
}

const toMs = ts => parseInt(moment(ts, 'YYYY-MM').format('x'))

const getCommitsPerMonth = data => _(data)
  .countBy(row => moment.unix(row.timestamp).format('YYYY-MM'))
  .map((count, time) => [toMs(time), count])
  .sortBy(arr => arr[0])
  .value()

const getAuthorsPerMonth = data => _(data)
  .groupBy(row => moment.unix(row.timestamp).format('YYYY-MM'))
  .map((rows, time) => {
    const authorCount = _(rows)
      .map(row => row.email)
      .uniq()
      .value()
      .length
    return [toMs(time), authorCount]
  })
  .sortBy(arr => arr[0])
  .value()

const addMonthlyNumbers = monthly => {
  let previous = 0
  return monthly.map(([time, count]) => {
    const current = previous + count
    previous = current
    return [time, current]
  })
}

const renderChart = (text, htmlId, chartData) => {
  Highcharts.stockChart(htmlId, {
    title: {
      text,
    },
    yAxis: {
      title: {
        text,
      }
    },
    series: [{
      name: text,
      data: chartData,
    }]
  })
}

loadData().then( data => {
  renderChart('Commits per month', 'chart1', getCommitsPerMonth(data))
  renderChart('Total commits', 'chart2', addMonthlyNumbers(getCommitsPerMonth(data)))
  renderChart('Authors per month', 'chart3', getAuthorsPerMonth(data))
  renderChart('Total authors', 'chart4', addMonthlyNumbers(getAuthorsPerMonth(data)))
})
