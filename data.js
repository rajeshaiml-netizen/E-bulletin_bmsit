// data.js
let users = [
    { id: 1, username: 'admin', password: 'password123', role: 'admin' },
    { id: 2, username: 'hod', password: 'password123', role: 'hod' },
    { id: 3, username: 'principal', password: 'password123', role: 'principal' }
];

let notices = [
    {
        id: 1,
        title: 'Vision & Mission',
        content: 'Vision\nTo emerge as one of the finest technical institutions of higher learning, to develop engineering professionals who are technically competent, ethical and environment friendly for betterment of the society.\n\nMission\nAccomplish stimulating learning environment through high quality academic instruction, innovation and industry-institute interface.',
        author: 'BMSIT&M',
        date: '01/01/2025',
        section: 'vision-mission',
        imageUrl: null,
        isStatic: true
    },
    {
        id: 2,
        title: 'Placement Training Class Schedule',
        content: 'The placement training class is scheduled for 18th May 2025. All final year students are required to attend. \nPlace: Auditorium.',
        author: 'Placement Cell',
        date: '15/08/2025',
        section: 'placement',
        imageUrl: 'https://via.placeholder.com/400x200.png?text=Training+Session',
        isStatic: false
    },
    {
        id: 3,
        title: 'Department of CSE Update',
        content: 'Computer Science & Engineering deals with the theoretical foundations of information and computation along with practical techniques for implementation and application.',
        author: 'HOD, CSE',
        date: '14/08/2025',
        section: 'announcement',
        imageUrl: null,
        isStatic: false
    },
    {
        id: 4,
        title: 'Welcome to BMSIT&M',
        content: 'The B.M.S. Institute of Technology and Management (abbreviated as BMSIT&M), is a private engineering college in Bangalore, Karnataka, India affiliated to the Visvesvaraya Technological University, Belgaum.',
        author: 'Principal',
        date: '12/08/2025',
        section: 'announcement',
        imageUrl: null,
        isStatic: false
    }
];

module.exports = { users, notices };