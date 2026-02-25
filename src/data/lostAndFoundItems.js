// adminStatus: 'Pending' | 'Received' | 'Delivered' (for admin dashboard)
export const mockItems = [
  {
    id: 1,
    title: 'Student ID Card',
    location: 'Cafeteria - Near Entrance',
    category: 'Documents',
    status: 'Active',
    adminStatus: 'Received',
    daysAgo: 79,
    description: 'ADA University student ID card. Found on table near main entrance.',
    referenceNumber: 'LF-000001',
    datePosted: 'Jan 15, 2026',
    image: '/images/lost-and-found/notebooks.png'
  },
  {
    id: 2,
    title: 'Navy Blue Jacket',
    location: 'Sports Complex - Locker Room',
    category: 'Clothing',
    status: 'Active',
    adminStatus: 'Delivered',
    daysAgo: 80,
    description: 'Navy blue jacket with ADA logo on left chest.',
    referenceNumber: 'LF-000002',
    datePosted: 'Jan 14, 2026',
    image: null
  },
  {
    id: 3,
    title: 'Black Leather Wallet',
    location: 'Library - Study Area',
    category: 'Other',
    status: 'Pending Verification',
    adminStatus: 'Pending',
    daysAgo: 2,
    description: 'Black leather wallet found near study area. Contains some cards but no ID.',
    referenceNumber: 'LF-000003',
    datePosted: 'Jan 28, 2026',
    image: '/images/lost-and-found/ring.png'
  },
  {
    id: 4,
    title: 'iPhone 14 Pro',
    location: 'Main Building - Room A120',
    category: 'Electronics',
    status: 'Pending Verification',
    adminStatus: 'Pending',
    daysAgo: 5,
    description: 'Blue iPhone 14 Pro with cracked screen protector. Has a sticker on the back.',
    referenceNumber: 'LF-000004',
    datePosted: 'Nov 11, 2025',
    image: '/images/lost-and-found/laptop.png'
  },
  {
    id: 5,
    title: 'Wireless Earbuds',
    location: 'Cafeteria',
    category: 'Electronics',
    status: 'Active',
    adminStatus: 'Received',
    daysAgo: 15,
    description: 'White wireless earbuds in a small case.',
    referenceNumber: 'LF-000005',
    datePosted: 'Jan 11, 2026',
    image: '/images/lost-and-found/earbuds.png'
  }
]

export function getItemById(id) {
  const numId = parseInt(id, 10)
  return mockItems.find((item) => item.id === numId) || null
}
