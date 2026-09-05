/** Option labels matching original dashboard.html (en-dash for Sobo) */
export const DASHBOARD_ROADS = [
  { value: 'All roads', label: 'All roads' },
  { value: 'Science City', label: 'Science City' },
  { value: 'CG Road', label: 'CG Road' },
  { value: 'Makarba', label: 'Makarba' },
  { value: 'Sobo – Marigold', label: 'Sobo – Marigold' },
  { value: 'Sindhu Bhavan Road', label: 'Sindhu Bhavan Road' },
]

export const FLEET = {
  total: '1,000',
  caption: 'devices installed across 5 roads · 91.7% currently operational',
  stamp: 'Live device status, refreshed every 5 minutes',
  bar: [
    { className: 'seg-ok', width: '91.7%' },
    { className: 'seg-warn', width: '4.1%' },
    { className: 'seg-bad', width: '4.2%' },
  ],
  ariaLabel: '917 working, 41 under repair, 42 not working',
  legend: [
    {
      dot: 'seg-ok',
      to: '/devices',
      value: '917',
      label: 'Working',
    },
    {
      dot: 'seg-warn',
      to: '/tickets',
      value: '41',
      label: 'Under repair',
      tip: 'Technician assigned',
    },
    {
      dot: 'seg-bad',
      to: '/tickets',
      value: '42',
      label: 'Not working',
      tip: 'Ticket open, not yet attended',
    },
    {
      to: '/tickets',
      value: '11',
      label: 'Open more than 3 days',
    },
  ],
}

export const DOWN_REASONS = [
  { name: 'Vehicle hit, flap bent', category: 'External damage', width: '100%', hot: true, n: 16 },
  { name: 'Motor or gearbox failure', category: 'Mechanical', width: '81%', hot: true, n: 13 },
  { name: 'Power supply / SMPS failure', category: 'Power', width: '69%', hot: false, n: 11 },
  { name: 'Controller board failure', category: 'Electrical', width: '56%', hot: false, n: 9 },
  { name: 'Sensor not detecting vehicle', category: 'Sensor', width: '50%', hot: false, n: 8 },
  { name: 'Network cable disconnected', category: 'Communication', width: '44%', hot: false, n: 7 },
  { name: 'QR plate damaged or missing', category: 'QR / payment', width: '38%', hot: false, n: 6 },
  { name: 'Water ingress in pit', category: 'Civil', width: '31%', hot: false, n: 5 },
  { name: 'Mains supply cut', category: 'Power', width: '25%', hot: false, n: 4 },
  { name: 'Foundation loose', category: 'Civil', width: '25%', hot: false, n: 4 },
]

export const ROAD_STATUS = [
  {
    name: 'Science City',
    stretch: 'Sector 1 – 4',
    total: 595,
    working: 548,
    repair: 24,
    down: 23,
  },
  {
    name: 'CG Road',
    stretch: 'Panchvati to Swastik',
    total: 150,
    working: 133,
    repair: 8,
    down: 9,
  },
  {
    name: 'Makarba',
    stretch: 'Police HQ to Sarkhej Highway',
    total: 130,
    working: 122,
    repair: 4,
    down: 4,
  },
  {
    name: 'Sobo – Marigold',
    stretch: 'Sobo Circle to Marigold Circle',
    total: 75,
    working: 68,
    repair: 3,
    down: 4,
  },
  {
    name: 'Sindhu Bhavan Road',
    stretch: 'Pakwan to Ratnaakar',
    total: 50,
    working: 46,
    repair: 2,
    down: 2,
  },
]
