import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'
import { Radar } from 'react-chartjs-2'

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

export default function RadarChart({ scores }) {
  const labels = ['People', 'Technology', 'Processes', 'Digital\nFootprint']
  const values = [
    scores.people,
    scores.technology,
    scores.processes,
    scores.digital_footprint,
  ]

  const data = {
    labels,
    datasets: [
      {
        label: 'Risk Score',
        data: values,
        borderColor: '#a3e635',
        backgroundColor: 'rgba(163, 230, 53, 0.1)',
        pointBackgroundColor: '#a3e635',
        pointBorderColor: '#0a0a0a',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#a3e635',
        borderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1a1a1a',
        borderColor: '#2a2a2a',
        borderWidth: 1,
        titleColor: '#a3e635',
        bodyColor: '#e5e5e5',
        callbacks: {
          label: ctx => ` ${ctx.raw}/100`,
        },
      },
    },
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 25,
          color: '#525252',
          backdropColor: 'transparent',
          font: { family: "'JetBrains Mono', monospace", size: 10 },
        },
        grid: { color: '#2a2a2a' },
        angleLines: { color: '#2a2a2a' },
        pointLabels: {
          color: '#a3a3a3',
          font: { family: 'Inter, sans-serif', size: 12, weight: '600' },
        },
      },
    },
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <Radar data={data} options={options} />
    </div>
  )
}
