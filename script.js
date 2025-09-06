// --- Medicine Themed Particle Animation Script ---
const canvas = document.getElementById('particle-canvas-main');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let particlesArray;

class Particle {
    constructor(x, y, directionX, directionY, size, type) {
        this.x = x;
        this.y = y;
        this.directionX = directionX;
        this.directionY = directionY;
        this.size = size;
        this.type = type; // 'pill', 'cross', or 'syringe'
        this.angle = Math.random() * 360;
        this.spin = (Math.random() - 0.5) * 0.5;
        
        if (this.type === 'pill') {
            this.color1 = Math.random() > 0.5 ? 'rgba(255, 255, 255, 0.7)' : 'rgba(173, 216, 230, 0.7)'; // White or Light Blue
            this.color2 = Math.random() > 0.5 ? 'rgba(255, 105, 97, 0.7)' : 'rgba(144, 238, 144, 0.7)'; // Light Red or Light Green
        } else {
            this.color = 'rgba(255, 255, 255, 0.7)'; // White for cross and syringe
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle * Math.PI / 180);
        
        if (this.type === 'pill') {
            const width = this.size * 2.5;
            const height = this.size;
            
            ctx.fillStyle = this.color1;
            ctx.beginPath();
            ctx.arc(-width / 4, 0, height / 2, Math.PI / 2, -Math.PI / 2, false);
            ctx.fillRect(-width / 4, -height / 2, width / 4, height);
            ctx.fill();

            ctx.fillStyle = this.color2;
            ctx.beginPath();
            ctx.arc(width / 4, 0, height / 2, -Math.PI / 2, Math.PI / 2, false);
            ctx.fillRect(0, -height / 2, width / 4, height);
            ctx.fill();

        } else if (this.type === 'cross') {
            ctx.fillStyle = this.color;
            const armLength = this.size * 1.5;
            const armWidth = this.size / 2;
            ctx.fillRect(-armLength / 2, -armWidth / 2, armLength, armWidth);
            ctx.fillRect(-armWidth / 2, -armLength / 2, armWidth, armLength);
        
        } else if (this.type === 'syringe') {
            ctx.fillStyle = this.color;
            const bodyHeight = this.size * 3;
            const bodyWidth = this.size * 0.6;
            const needleHeight = this.size * 1.5;
            const needleWidth = this.size * 0.15;
            const plungerWidth = this.size * 1.2;
            const plungerHeight = this.size * 0.3;

            // Barrel
            ctx.fillRect(-bodyWidth / 2, -bodyHeight / 2, bodyWidth, bodyHeight);
            // Plunger
            ctx.fillRect(-plungerWidth / 2, -bodyHeight / 2 - plungerHeight, plungerWidth, plungerHeight);
            // Needle
            ctx.fillRect(-needleWidth / 2, bodyHeight / 2, needleWidth, needleHeight);
        }
        
        ctx.restore();
    }

    update() {
        if (this.y > canvas.height + this.size * 2) {
            this.y = 0 - this.size * 2;
            this.x = Math.random() * canvas.width;
        }
        
        this.angle += this.spin;
        this.x += this.directionX;
        this.y += this.directionY;
        this.draw();
    }
}

function initParticles() {
    particlesArray = [];
    let numberOfParticles = (canvas.height * canvas.width) / 15000;
    for (let i = 0; i < numberOfParticles; i++) {
        let size = (Math.random() * 5) + 4;
        let x = Math.random() * canvas.width;
        let y = Math.random() * canvas.height;
        let directionX = (Math.random() - 0.5) * 0.2;
        let directionY = Math.random() * 0.4 + 0.2; // Fall downwards
        
        const rand = Math.random();
        let type;
        if (rand > 0.8) {
            type = 'syringe';
        } else if (rand > 0.4) {
            type = 'cross';
        } else {
            type = 'pill';
        }
        
        particlesArray.push(new Particle(x, y, directionX, directionY, size, type));
    }
}

function animateParticles() {
    requestAnimationFrame(animateParticles);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
    }
}

window.addEventListener('resize', () => {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    initParticles();
});

initParticles();
animateParticles();

// --- 1. FIREBASE SETUP ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, onSnapshot, addDoc, doc, setDoc, deleteDoc, serverTimestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBiiXFhlwYdfC7IddBcBu-Sq3vJanTQNR0",
    authDomain: "utth-shift.firebaseapp.com",
    databaseURL: "https://utth-shift-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "utth-shift",
    storageBucket: "utth-shift.appspot.com",
    messagingSenderId: "615647177323",
    appId: "1:615647177323:web:e905ef70f223d898285f2e",
    measurementId: "G-RYDN5M4PLB"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const shiftsCollection = collection(db, 'shifts');
const remindersCollection = collection(db, 'reminders');

// --- 2. APPLICATION CONSTANTS & STATE ---
const MAKE_WEBHOOK_URL = "https://hook.us2.make.com/76i25nftjg91mvpv2civ5e4r7j4ikajv"; 

let allShiftsData = {}; 
let allRemindersData = {};
let fullSummaryData = [];
let currentPage = 1; 
const itemsPerPage = 10; 
let shiftChartInstance = null; 
let visiblePersons = []; 
let showCancelled = false;
let showDawnShifts = true;

let currentYearForView = new Date().getFullYear();
let isYearViewActive = false;

const SHIFTS = {
    'รุ่งอรุณ': { name: 'รุ่งอรุณ', time: '07.00-08.30' },
    'เช้า': { name: 'เช้า', time: '08.30-16.30' },
    'บ่าย': { name: 'บ่าย', time: '16.30-23.59' },
    'ดึก': { name: 'ดึก', time: '23.55-08.30' }
};

const PERSONS = { 'A': { name: 'A', color: '#1E90FF', icon: '👨‍⚕️' }, 'Nanti': { name: 'Nanti', color: '#DB7093', icon: '👩‍⚕️' } };
const ALL_ROOMS = ['ER', 'MED', 'OPD', 'SURG', 'Extend', 'CHEMO', 'SMC'];

let THAI_HOLIDAYS = new Map();


// --- 3. FULLCALENDAR SETUP ---
const calendarEl = document.getElementById('calendar');
const summaryListEl = document.getElementById('summary-list');
const paginationContainer = document.getElementById('pagination-container');
const yearViewContainer = document.getElementById('year-view-container');

const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth', 
    locale: 'th',
    headerToolbar: false,
    navLinks: false,
    dateClick: handleDateClick, eventClick: handleEventClick,
    events: [], eventDisplay: 'block',
    dayMaxEvents: 3,
    eventOrder: 'order',
    moreLinkText: (num) => `+ ${num} เพิ่มเติม`,
    dayCellDidMount: function(arg) {
        const year = arg.date.getFullYear();
        const month = String(arg.date.getMonth() + 1).padStart(2, '0');
        const day = String(arg.date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        const dayOfWeek = arg.date.getDay();
        if (isHoliday(dateStr)) { 
            arg.el.classList.add('holiday-cell'); 
        } 
        else if (dayOfWeek === 0 || dayOfWeek === 6) { arg.el.classList.add('weekend-cell'); }
    },
    datesSet: function(info) {
        const titleEl = document.getElementById('calendar-title');
        if (titleEl && !isYearViewActive) { 
            titleEl.textContent = info.view.title;
        }
    }
});

// --- 4. MAKE.COM INTEGRATION ---
function createMakePayload(data, actionType, documentId = null) {
    if (actionType === 'delete') {
        return { firebaseKey: documentId, person: data.person, actionType: actionType };
    }
    
    let shiftTime;
    if (data.shift === 'เช้า' && data.room === 'Extend') {
        shiftTime = '09.00-13.00';
    } else if (data.shift === 'เช้า' && data.room === 'CHEMO') {
        shiftTime = '08.30-12.30';
    } else if (data.shift === 'บ่าย' && (data.room === 'Extend' || data.room === 'SMC')) {
        shiftTime = '16.30-20.30';
    } else {
        const shiftInfo = SHIFTS[data.shift];
        if (!shiftInfo) {
            console.error("Cannot create payload: shiftInfo not found for shift:", data.shift);
            return null;
        }
        shiftTime = shiftInfo.time;
    }
    
    const [start, end] = shiftTime.split('-');
    const startTimeStr = `${data.date}T${start.replace('.',':')}:00`;
    
    let endDateTime = new Date(`${data.date}T${end.replace('.',':')}:00`);
    if (data.shift === 'ดึก' || end < start) {
        endDateTime.setDate(endDateTime.getDate() + 1);
    }
    
    const timeZone = 'Asia/Bangkok';

    const formattedStartTime = new Date(startTimeStr).toISOString();
    const formattedEndTime = endDateTime.toISOString();

    const summary = `${PERSONS[data.person]?.icon || ''} ${PERSONS[data.person]?.name || data.person} - เวร${data.shift} (${data.room})`;
    let description = '';
    if (data.medOption) { description += `สถานะ: ${data.medOption}\n`; }
    if (data.notes) { description += `หมายเหตุ: ${data.notes}`; }


    return {
        ...data,
        summary: summary,
        description: description,
        startTime: formattedStartTime,
        endTime: formattedEndTime,
        timeZone: timeZone,
        firebaseKey: documentId,
        actionType: actionType
    };
}

async function sendToMakeWebhook(payload) {
    if (!MAKE_WEBHOOK_URL || !MAKE_WEBHOOK_URL.startsWith('https://')) {
        console.log("Make Webhook URL is not set. Skipping.");
        return;
    }
    if (!payload) {
        console.log("Invalid payload for Make. Skipping.");
        return;
    }

    try {
        const response = await fetch(MAKE_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            console.error('Failed to send data to Make.com:', response.statusText);
        } else {
            console.log('Successfully sent data to Make.com:', payload);
        }
    } catch (error) {
        console.error('Error sending data to Make.com:', error);
    }
}


// --- 5. HELPER & RENDER FUNCTIONS ---
function toYYYYMMDD(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function isHoliday(dateString) { return THAI_HOLIDAYS.has(dateString); }
function isSpecialDay(dateString) {
    const date = new Date(dateString);
    const dayOfWeek = date.getDay();
    return (dayOfWeek === 0 || dayOfWeek === 6) || isHoliday(dateString);
}

function isPersonPostNightShift(person, dateStr) {
    const currentDate = new Date(dateStr + "T00:00:00");
    currentDate.setDate(currentDate.getDate() - 1);
    const yesterdayStr = toYYYYMMDD(currentDate);
    return Object.values(allShiftsData).some(s => s.date === yesterdayStr && s.person === person && s.shift === 'ดึก' && !s.isCancelled);
}

function saveShiftToFirebase(data) {
    const dataToSave = { ...data, createdAt: serverTimestamp() };
    
    addDoc(shiftsCollection, dataToSave)
        .then((docRef) => { 
            Swal.fire('สำเร็จ!', 'บันทึกข้อมูลเวรเรียบร้อยแล้ว', 'success');
            const payload = createMakePayload(dataToSave, 'create', docRef.id);
            sendToMakeWebhook(payload);
        })
        .catch(error => Swal.fire('ผิดพลาด!', `ไม่สามารถบันทึกข้อมูลได้: ${error.message}`, 'error'));
}

function renderSummaryList(itemsToRender) {
    summaryListEl.innerHTML = '';
    if (itemsToRender.length > 0) {
         itemsToRender.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'summary-item';
            let itemColor, mainInfo;
            let notesHTML = '';
            let timestampHTML = '';

            if(item.createdAt && item.createdAt.toDate){
                const timestamp = item.createdAt.toDate().toLocaleString('th-TH', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                });
                timestampHTML = `<span class="timestamp">| ${timestamp}</span>`;
            }

            const personIcon = PERSONS[item.person]?.icon || '🧑‍⚕️';

            if (item.isPostNightShift) {
                itemColor = 'var(--post-night-shift-color)';
                mainInfo = `⬇️ <strong>${item.person}</strong> | 📅 ${new Date(item.date).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric'})} | <strong>ลงดึก</strong>`;
                notesHTML = `<div class="notes">พักผ่อนลงเวรดึก</div>`;
            } else if (item.isCancelled) {
                itemColor = 'var(--cancelled-color)';
                mainInfo = `❌ <strong style="color: #7f8c8d;">ยกเลิกเวร</strong> ของ <strong>${item.person}</strong> | 📅 ${new Date(item.date).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric'})} | <span style="text-decoration: line-through;">${item.shift} / ${item.room}</span> | เหตุผล: <strong>${item.notes || ''}</strong>`;
            } else {
                itemColor = PERSONS[item.person]?.color || '#777777';
                
                let displayTime;
                if (item.shift === 'เช้า' && item.room === 'Extend') {
                    displayTime = '09.00-13.00';
                } else if (item.shift === 'เช้า' && item.room === 'CHEMO') {
                    displayTime = '08.30-12.30';
                } else if (item.shift === 'บ่าย' && (item.room === 'Extend' || item.room === 'SMC')) {
                    displayTime = '16.30-20.30';
                } else {
                    displayTime = SHIFTS[item.shift]?.time || 'N/A';
                }

                mainInfo = `${personIcon} <strong>${item.person}</strong> | 📅 ${new Date(item.date).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric'})} | <strong>${item.shift}</strong> (${displayTime}) ที่ห้อง <strong>${item.room}</strong>`;
                if(item.medOption){ mainInfo += ` | <strong style="color: #c0392b;">สถานะ: ${item.medOption}</strong>`; }
                if (item.notes) { notesHTML = `<div class="notes"><strong>หมายเหตุ:</strong> ${item.notes}</div>`; }
            }
            itemEl.innerHTML = `<div><span>${mainInfo}</span>${timestampHTML}${notesHTML}</div>`;
            itemEl.style.borderLeftColor = itemColor;
            summaryListEl.appendChild(itemEl);
        });
    } else {
         summaryListEl.innerHTML = '<p style="text-align:center; color:#888; padding: 20px 0;">เมี๊ยววว~ ไม่เจอข้อมูลเลยนะ</p>';
    }
}

function renderPaginationControls(totalPages) {
    paginationContainer.innerHTML = '';
    if (totalPages <= 1) return;

    const createButton = (text, page, isDisabled = false, isActive = false) => {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.className = 'pagination-btn';
        if (isDisabled) btn.classList.add('disabled');
        if (isActive) btn.classList.add('active');
        btn.addEventListener('click', () => {
            if (!isDisabled && page) {
                currentPage = page;
                applyAndRenderFilters();
            }
        });
        return btn;
    };

    const createEllipsis = () => {
         const ellipsis = document.createElement('span');
         ellipsis.textContent = '...';
         ellipsis.className = 'pagination-btn disabled';
         return ellipsis;
    }

    paginationContainer.appendChild(createButton('«', currentPage - 1, currentPage === 1));

    const pagesToShow = [];
    if (totalPages <= 5) {
        for (let i = 1; i <= totalPages; i++) {
            pagesToShow.push(i);
        }
    } else {
         if (currentPage <= 3) {
            pagesToShow.push(1, 2, 3, '...', totalPages);
        } else if (currentPage >= totalPages - 2) {
            pagesToShow.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
        } else {
            pagesToShow.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
        }
    }

    [...new Set(pagesToShow)].forEach(page => {
         if (page === '...') {
             paginationContainer.appendChild(createEllipsis());
         } else {
             paginationContainer.appendChild(createButton(page, page, false, page === currentPage));
         }
    });

    paginationContainer.appendChild(createButton('»', currentPage + 1, currentPage === totalPages));
}

function updateChartAndSummary(data) {
    const dataSummaryEl = document.getElementById('data-summary');
    const personFilter = document.getElementById('filter-person').value;
    const validShifts = data.filter(item => !item.isCancelled && !item.isPostNightShift);

    let chartLabels, chartData, chartColors;
    let summaryHTML = '<h3>ข้อมูลสรุป</h3>';

    const REMUNERATION_RATES = {
        'ER': 780, 'MED': 780, 'SURG': 780, 'Extend': 540,
        'SMC': 900, 'CHEMO': 390, 'รุ่งอรุณ': 202.5
    };
    let totalRemuneration = 0;

    if (personFilter === 'all') {
        const personCounts = {};
        const shiftTypeCounts = {};

        validShifts.forEach(item => {
            personCounts[item.person] = (personCounts[item.person] || 0) + 1;
            shiftTypeCounts[item.shift] = (shiftTypeCounts[item.shift] || 0) + 1;
            const rate = item.shift === 'รุ่งอรุณ' ? REMUNERATION_RATES['รุ่งอรุณ'] : REMUNERATION_RATES[item.room];
            if (rate) totalRemuneration += rate;
        });

        summaryHTML += `<p><span>เวรทั้งหมด:</span> <strong>${validShifts.length} เวร</strong></p><hr>`;
        for(const person in PERSONS) {
             const count = personCounts[person] || 0;
             const percentage = validShifts.length > 0 ? (count / validShifts.length * 100).toFixed(1) : 0;
            summaryHTML += `<p><span>${PERSONS[person].name}:</span> <strong>${count} เวร (${percentage}%)</strong></p>`;
        }
        summaryHTML += `<hr>`;
        for(const shift in SHIFTS) {
            summaryHTML += `<p><span>${SHIFTS[shift].name}:</span> <strong>${shiftTypeCounts[shift] || 0} เวร</strong></p>`;
        }
        summaryHTML += `<hr style="margin: 15px 0;"><p><span><strong>รวมค่าตอบแทนทั้งหมด:</strong></span> <strong>${totalRemuneration.toLocaleString()} บาท</strong></p>`;

        chartLabels = Object.keys(personCounts);
        chartData = Object.values(personCounts);
        chartColors = chartLabels.map(label => PERSONS[label]?.color || '#cccccc');

    } else {
        const roomCounts = {};
        const personShifts = validShifts.filter(item => item.person === personFilter);
        
        personShifts.forEach(item => {
            const countKey = item.shift === 'รุ่งอรุณ' ? 'รุ่งอรุณ' : item.room;
            roomCounts[countKey] = (roomCounts[countKey] || 0) + 1;
            const rate = item.shift === 'รุ่งอรุณ' ? REMUNERATION_RATES['รุ่งอรุณ'] : REMUNERATION_RATES[item.room];
            if (rate) totalRemuneration += rate;
        });

        summaryHTML += `<p><span>เวรทั้งหมดของ ${PERSONS[personFilter].name}:</span> <strong>${personShifts.length} เวร</strong></p><hr>`;
         for(const room in roomCounts) {
             const count = roomCounts[room];
             const percentage = personShifts.length > 0 ? (count / personShifts.length * 100).toFixed(1) : 0;
             const remuneration = REMUNERATION_RATES[room] ? `(฿${(count * REMUNERATION_RATES[room]).toLocaleString()})` : '';
            summaryHTML += `<p><span>${room}:</span> <strong>${count} เวร (${percentage}%) ${remuneration}</strong></p>`;
        }
        summaryHTML += `<hr style="margin: 15px 0;"><p><span><strong>รวมค่าตอบแทน:</strong></span> <strong>${totalRemuneration.toLocaleString()} บาท</strong></p>`;

        chartLabels = Object.keys(roomCounts);
        chartData = Object.values(roomCounts);
        chartColors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF'];
    }
    
    dataSummaryEl.innerHTML = summaryHTML;

    const ctx = document.getElementById('shift-chart').getContext('2d');
    if (shiftChartInstance) {
        shiftChartInstance.destroy();
    }
    
    const centerText = {
        id: 'centerText',
        afterDraw(chart, args, options) {
            const { ctx, chartArea: { top, right, bottom, left, width, height } } = chart;
            ctx.save();
            const total = chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
            ctx.font = 'bold 2.5em Sarabun, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'var(--text-color)';
            ctx.fillText(total, width / 2, top + (height / 2) - 10);
            
            ctx.font = '1em Sarabun, sans-serif';
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillText('เวร', width / 2, top + (height / 2) + 20);
            ctx.restore();
        }
    };

    shiftChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: chartLabels,
            datasets: [{
                label: 'จำนวนเวร',
                data: chartData,
                backgroundColor: chartColors,
                borderColor: 'var(--container-bg)',
                borderWidth: 5,
                hoverOffset: 20,
                hoverBorderColor: '#fff',
                hoverBorderWidth: 3,
                borderRadius: 8,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { family: 'Sarabun, sans-serif', size: 14 },
                        boxWidth: 20,
                        padding: 20
                    }
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    titleFont: { family: 'Sarabun, sans-serif', size: 16 },
                    bodyFont: { family: 'Sarabun, sans-serif', size: 14 },
                    padding: 10,
                    cornerRadius: 10,
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed !== null) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
                                label += `${context.raw} เวร (${percentage}%)`;
                            }
                            return label;
                        }
                    }
                }
            },
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 1200,
                easing: 'easeInOutQuart'
            }
        },
        plugins: [centerText]
    });
}


function applyAndRenderFilters() {
    const personFilter = document.getElementById('filter-person').value;
    const startDateFilter = document.getElementById('filter-start-date').value;
    const endDateFilter = document.getElementById('filter-end-date').value;
    const shiftFilter = document.getElementById('filter-shift').value;
    const roomFilter = document.getElementById('filter-room').value;

    let filteredData = fullSummaryData.filter(item => {
        if (item.isCancelled && !showCancelled) {
            return false;
        }
        if (item.shift === 'รุ่งอรุณ' && !showDawnShifts) {
            return false;
        }
        
        let effectiveDate = new Date(item.date);
        if (item.shift === 'ดึก' && !item.isCancelled) {
            effectiveDate.setDate(effectiveDate.getDate() + 1);
        }
        
        const startDate = startDateFilter ? new Date(startDateFilter + "T00:00:00") : null;
        const endDate = endDateFilter ? new Date(endDateFilter + "T00:00:00") : null;
        if(startDate) startDate.setHours(0,0,0,0);
        if(endDate) endDate.setHours(23,59,59,999);

        const personMatch = personFilter === 'all' || item.person === personFilter;
        const startDateMatch = !startDate || effectiveDate >= startDate;
        const endDateMatch = !endDate || effectiveDate <= endDate;
        const roomMatch = roomFilter === 'all' || item.room === roomFilter || item.isPostNightShift;
        let shiftMatch = shiftFilter === 'all' || (shiftFilter === 'post_night' ? item.isPostNightShift : item.shift === shiftFilter);
        
        return personMatch && startDateMatch && endDateMatch && shiftMatch && roomMatch;
    });

    if (roomFilter !== 'all') {
        filteredData = filteredData.filter(item => !item.isPostNightShift);
    }

    updateChartAndSummary(filteredData);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    if (currentPage > totalPages && totalPages > 0) {
        currentPage = totalPages;
    } else if (totalPages === 0) {
        currentPage = 1;
    }
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    renderSummaryList(paginatedData);
    renderPaginationControls(totalPages);
}

function renderCalendarAndSummary() {
    const allEvents = [];

    const sortedShifts = Object.entries(allShiftsData).sort(([, a], [, b]) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return timeB - timeA;
    });

    for (const [key, shiftData] of sortedShifts) {
        if (!visiblePersons.includes(shiftData.person)) continue;
        if (shiftData.isCancelled && !showCancelled) continue;
        if (shiftData.shift === 'รุ่งอรุณ' && !showDawnShifts) continue;

        let title, eventColor, order;
        if (shiftData.isCancelled) {
            title = `[ยกเลิก] ${shiftData.person}: ${shiftData.shift}`;
            eventColor = 'var(--cancelled-color)';
            order = 2;
        } else {
            title = `${PERSONS[shiftData.person].name}, ${shiftData.shift}, ${shiftData.room}`;
            if (shiftData.medOption) { title += ` (${shiftData.medOption})`; }
            if (shiftData.notes) { title += ' 📝'; }
            eventColor = PERSONS[shiftData.person]?.color || '#777777';
            order = 1;
        }
        allEvents.push({ id: key, title, start: shiftData.date, backgroundColor: eventColor, borderColor: eventColor, extendedProps: { ...shiftData }, order });

        if (shiftData.shift === 'ดึก' && !shiftData.isCancelled) {
            const nightShiftDate = new Date(shiftData.date + "T00:00:00");
            nightShiftDate.setDate(nightShiftDate.getDate() + 1);
            const nextDayStr = toYYYYMMDD(nightShiftDate);
            allEvents.push({
                id: `${key}_off`, title: `⬇️ ${PERSONS[shiftData.person].name} (ลงดึก)`, start: nextDayStr, allDay: true,
                backgroundColor: 'var(--post-night-shift-color)', borderColor: 'var(--post-night-shift-color)', classNames: ['post-night-shift-event'], order: 3
            });
        }
    }

    for (let key in allRemindersData) {
        const reminderData = allRemindersData[key];
        allEvents.push({
            id: key, title: `📌 ${reminderData.note}`, start: reminderData.startDate,
            classNames: ['reminder-event'], extendedProps: { ...reminderData, isReminder: true }, order: 0
        });

        const startDate = new Date(reminderData.startDate + "T00:00:00");
        const endDate = reminderData.endDate ? new Date(reminderData.endDate + "T00:00:00") : startDate;
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            allEvents.push({
                id: `${key}_bg_${toYYYYMMDD(d)}`, display: 'background',
                start: toYYYYMMDD(d), backgroundColor: 'var(--reminder-bg)',
            });
        }
    }
    
    if (isYearViewActive) {
        calendar.getEvents().forEach(event => event.remove());
        calendar.addEventSource(allEvents);
        renderYearView(currentYearForView);
        return;
    }

    fullSummaryData = [];
    Object.entries(allShiftsData).forEach(([key, shiftData]) => {
        if (!visiblePersons.includes(shiftData.person)) return;
        if (shiftData.isCancelled && !showCancelled) return;
        if (shiftData.shift === 'รุ่งอรุณ' && !showDawnShifts) return;

        fullSummaryData.push({ ...shiftData, key });
        if (shiftData.shift === 'ดึก' && !shiftData.isCancelled) {
            const nightShiftDate = new Date(shiftData.date + "T00:00:00");
            nightShiftDate.setDate(nightShiftDate.getDate() + 1);
            const nextDayStr = toYYYYMMDD(nightShiftDate);
            fullSummaryData.push({ key: `${key}_off`, isPostNightShift: true, date: nextDayStr, person: shiftData.person, createdAt: shiftData.createdAt });
        }
    });

    fullSummaryData.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        if (dateA > dateB) return -1;
        if (dateA < dateB) return 1;
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return timeB - timeA;
    });
    
    calendar.getEvents().forEach(event => event.remove());
    calendar.addEventSource(allEvents);
    applyAndRenderFilters();
}

// --- 6. EVENT HANDLER FUNCTIONS ---
async function promptAddShift(dateStr) {
    const clickedDate = new Date(dateStr + "T00:00:00");
    const reminderOnDay = Object.values(allRemindersData).find(r => {
        const startDate = new Date(r.startDate + "T00:00:00");
        const endDate = r.endDate ? new Date(r.endDate + "T00:00:00") : startDate;
        return clickedDate >= startDate && clickedDate <= endDate;
    });

    if (reminderOnDay) {
        const confirmation = await Swal.fire({
            title: 'เดี๋ยวก่อนนะ!',
            html: `วันนี้มีบันทึกว่า: "<b>${reminderOnDay.note}</b>"<br>จะเพิ่มเวรจริงๆ เหรอ?`,
            icon: 'warning', showCancelButton: true,
            confirmButtonText: 'ใช่, เพิ่มเวรเลย', cancelButtonText: 'ไม่ดีกว่า',
        });
        if (!confirmation.isConfirmed) return;
    }
    
    const dateIsSpecial = isSpecialDay(dateStr);
    const availableShifts = {...SHIFTS};
    if(dateIsSpecial) { 
        delete availableShifts['รุ่งอรุณ'];
    } else {
        delete availableShifts['เช้า'];
    }

    const { value: formValues } = await Swal.fire({
        title: `เพิ่มเวรวันที่ ${new Date(dateStr).toLocaleDateString('th-TH', { dateStyle: 'long' })}`,
        html: `
            <label class="swal2-input-label">เภสัชกร</label>
            <div class="radio-group-horizontal">
                ${Object.keys(PERSONS).map((p, index) => `
                    <label class="radio-option">
                        <input type="radio" name="swal-person" value="${p}" ${index === 0 ? 'checked' : ''}>
                        <span style="background-color:${PERSONS[p].color};">${PERSONS[p].name}</span>
                    </label>
                `).join('')}
            </div>
            <label for="swal-shift" class="swal2-input-label">เลือกช่วงเวลา</label>
            <select id="swal-shift" class="swal2-select">${Object.keys(availableShifts).map(s => `<option value="${s}">${availableShifts[s].name}</option>`).join('')}</select>
            <label for="swal-room" class="swal2-input-label">เวร</label>
            <select id="swal-room" class="swal2-select"></select>
            <div id="med-options-container" style="display: none; margin-top: 1em;">
                <label for="swal-med-option" class="swal2-input-label">ตัวเลือก (MED เช้าวันหยุด)</label>
                <select id="swal-med-option" class="swal2-select"><option value="Cont">Cont</option><option value="D/C">D/C</option></select>
            </div>
            <label for="swal-notes" class="swal2-input-label">หมายเหตุ</label>
            <input type="text" id="swal-notes" class="swal2-input" placeholder="ไม่บังคับ">
        `,
        focusConfirm: false,
        didOpen: () => {
            const shiftSelect = document.getElementById('swal-shift');
            const roomSelect = document.getElementById('swal-room');
            const medContainer = document.getElementById('med-options-container');
            
            const updateFormFields = () => {
                if (!shiftSelect || !roomSelect) return;
                const selectedShift = shiftSelect.value;
                const currentRoomValue = roomSelect.value;
                let availableRooms = [];
                const dayOfWeek = new Date(dateStr).getDay();

                if (selectedShift === 'รุ่งอรุณ') {
                    if (dayOfWeek === 1) { // Monday
                        availableRooms = ['OPD'];
                    } else {
                        availableRooms = ['ER', 'OPD'];
                    }
                } else if (selectedShift === 'เช้า') {
                    availableRooms = ['ER', 'MED', 'SURG', 'Extend', 'CHEMO'];
                } else if (selectedShift === 'บ่าย') {
                    if (isSpecialDay(dateStr)) {
                        availableRooms = ['ER', 'MED'];
                    } else if (dayOfWeek === 5) { // Friday
                        availableRooms = ['ER', 'MED', 'Extend'];
                    } else {
                        availableRooms = ['ER', 'MED', 'Extend', 'SMC'];
                    }
                } else if (selectedShift === 'ดึก') {
                    availableRooms = ['ER'];
                }
                
                roomSelect.innerHTML = availableRooms.map(r => `<option value="${r}" ${r === currentRoomValue ? 'selected' : ''}>${r}</option>`).join('');
                if (!availableRooms.includes(roomSelect.value)) roomSelect.value = availableRooms[0] || '';
                
                const showMedField = isSpecialDay(dateStr) && selectedShift === 'เช้า' && roomSelect.value === 'MED';
                medContainer.style.display = showMedField ? 'block' : 'none';
            };

            if (shiftSelect) {
                shiftSelect.addEventListener('change', updateFormFields);
            }
            if (roomSelect) {
                roomSelect.addEventListener('change', updateFormFields);
            }
            
            updateFormFields();
        },
        preConfirm: () => {
            const person = document.querySelector('input[name="swal-person"]:checked').value;
            const shift = document.getElementById('swal-shift').value;
            for (const key in allShiftsData) {
                const existingShift = allShiftsData[key];
                if (existingShift.date === dateStr && existingShift.person === person && existingShift.shift === shift && !existingShift.isCancelled) {
                    Swal.showValidationMessage(`เพิ่มไม่ได้นะ! ${person} มีเวร ${shift} ที่โซน ${existingShift.room} อยู่แล้ว`);
                    return false;
                }
            }
            return {
                person, shift, room: document.getElementById('swal-room').value,
                notes: document.getElementById('swal-notes').value.trim(),
                medOption: document.getElementById('med-options-container').style.display === 'block' ? document.getElementById('swal-med-option').value : null
            }
        },
        showCancelButton: true, confirmButtonText: 'บันทึก', cancelButtonText: 'ยกเลิก'
    });

    if (formValues) {
        const personToAdd = formValues.person;
        if (isPersonPostNightShift(personToAdd, dateStr)) {
            const confirmation = await Swal.fire({
                title: 'แน่ใจนะ?', html: `<strong>${personToAdd}</strong> เพิ่งลงเวรดึกมานะ<br>จะให้เพิ่มเวรอีกเหรอ?`,
                icon: 'warning', showCancelButton: true, confirmButtonText: 'จัดไป!',
                cancelButtonText: 'โอ๊ะ ไม่ดีกว่า', confirmButtonColor: '#28a745',
            });
            if (confirmation.isConfirmed) { saveShiftToFirebase({ date: dateStr, ...formValues }); }
        } else {
            saveShiftToFirebase({ date: dateStr, ...formValues });
        }
    }
}

async function showRemindersForDate(dateStr) {
    const clickedDate = new Date(dateStr + "T00:00:00");
    
    const remindersOnDay = Object.entries(allRemindersData).filter(([key, reminder]) => {
        const startDate = new Date(reminder.startDate + "T00:00:00");
        const endDate = reminder.endDate ? new Date(reminder.endDate + "T00:00:00") : startDate;
        return clickedDate >= startDate && clickedDate <= endDate;
    });

    let reminderHtml = '<ul class="reminder-list">';
    if (remindersOnDay.length > 0) {
        remindersOnDay.forEach(([key, reminder]) => {
            reminderHtml += `
                <li class="reminder-item-in-list" data-id="${key}">
                    <span class="reminder-text">${reminder.note}</span>
                    <span class="reminder-actions">
                        <button class="edit-btn" data-id="${key}">แก้ไข</button>
                        <button class="delete-btn" data-id="${key}">ลบ</button>
                    </span>
                </li>`;
        });
    } else {
        reminderHtml += '<li>ยังไม่มีบันทึกช่วยเตือนในวันนี้</li>';
    }
    reminderHtml += '</ul>';

    const result = await Swal.fire({
        title: `บันทึกช่วยเตือนวันที่ ${new Date(dateStr).toLocaleDateString('th-TH', {dateStyle: 'long'})}`,
        html: reminderHtml,
        showCancelButton: true,
        confirmButtonText: 'เพิ่มบันทึกใหม่',
        cancelButtonText: 'ปิด',
        didOpen: () => {
            document.querySelectorAll('.edit-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const reminderId = e.target.dataset.id;
                    Swal.close();
                    promptEditReminder(reminderId);
                });
            });
            document.querySelectorAll('.delete-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const reminderId = e.target.dataset.id;
                    Swal.close();
                    promptDeleteReminder(reminderId);
                });
            });
        }
    });

    if (result.isConfirmed) {
        promptAddReminder(dateStr);
    }
}

async function promptAddReminder(dateStr) {
    const { value: formValues } = await Swal.fire({
        title: 'เพิ่มบันทึกช่วยเตือนใหม่',
        html: `
            <label for="swal-reminder-note" class="swal2-input-label">หมายเหตุ</label>
            <input id="swal-reminder-note" class="swal2-input" placeholder="ไปเที่ยว, ลาพักร้อน...">
            <label for="swal-reminder-start" class="swal2-input-label">วันที่เริ่มต้น</label>
            <input type="date" id="swal-reminder-start" class="swal2-input" value="${dateStr}">
            <label for="swal-reminder-end" class="swal2-input-label">วันที่สิ้นสุด (ไม่บังคับ)</label>
            <input type="date" id="swal-reminder-end" class="swal2-input">
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'บันทึก',
        cancelButtonText: 'ยกเลิก',
        preConfirm: () => {
            const note = document.getElementById('swal-reminder-note').value;
            const startDate = document.getElementById('swal-reminder-start').value;
            let endDate = document.getElementById('swal-reminder-end').value;
            if (!note) { Swal.showValidationMessage('ต้องใส่หมายเหตุก่อนนะ'); return false; }
            if (!startDate) { Swal.showValidationMessage('ต้องใส่วันที่เริ่มต้นด้วยนะ'); return false; }
            if (endDate && endDate < startDate) { Swal.showValidationMessage('วันที่สิ้นสุดจะอยู่ก่อนวันเริ่มต้นไม่ได้นะ'); return false; }
            if (endDate === startDate) { endDate = ''; }
            return { note: note.trim(), startDate: startDate, endDate: endDate || null };
        }
    });

    if (formValues) {
        addDoc(remindersCollection, formValues)
            .then(() => Swal.fire('สำเร็จ', 'บันทึกเรียบร้อย', 'success'))
            .catch(e => Swal.fire('ผิดพลาด', e.message, 'error'));
    }
}

async function promptEditReminder(reminderId) {
    const existingReminder = allRemindersData[reminderId];
    if (!existingReminder) return;

    const { value: formValues } = await Swal.fire({
        title: 'แก้ไขบันทึกช่วยเตือน',
        html: `
            <label for="swal-reminder-note" class="swal2-input-label">หมายเหตุ</label>
            <input id="swal-reminder-note" class="swal2-input" value="${existingReminder.note}" placeholder="ไปเที่ยว, ลาพักร้อน...">
            <label for="swal-reminder-start" class="swal2-input-label">วันที่เริ่มต้น</label>
            <input type="date" id="swal-reminder-start" class="swal2-input" value="${existingReminder.startDate}">
            <label for="swal-reminder-end" class="swal2-input-label">วันที่สิ้นสุด (ไม่บังคับ)</label>
            <input type="date" id="swal-reminder-end" class="swal2-input" value="${existingReminder.endDate || ''}">
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'อัปเดต',
        cancelButtonText: 'ยกเลิก',
        preConfirm: () => {
            const note = document.getElementById('swal-reminder-note').value;
            const startDate = document.getElementById('swal-reminder-start').value;
            let endDate = document.getElementById('swal-reminder-end').value;
            if (!note) { Swal.showValidationMessage('ต้องใส่หมายเหตุก่อนนะ'); return false; }
            if (!startDate) { Swal.showValidationMessage('ต้องใส่วันที่เริ่มต้นด้วยนะ'); return false; }
            if (endDate && endDate < startDate) { Swal.showValidationMessage('วันที่สิ้นสุดจะอยู่ก่อนวันเริ่มต้นไม่ได้นะ'); return false; }
            if (endDate === startDate) { endDate = ''; }
            return { note: note.trim(), startDate: startDate, endDate: endDate || null };
        }
    });

    if (formValues) {
        setDoc(doc(db, 'reminders', reminderId), formValues)
            .then(() => Swal.fire('สำเร็จ', 'อัปเดตเรียบร้อย', 'success'))
            .catch(e => Swal.fire('ผิดพลาด', e.message, 'error'));
    }
}

async function promptDeleteReminder(reminderId) {
    const result = await Swal.fire({
        title: 'แน่ใจนะว่าจะลบ?',
        text: "ลบแล้วจะเอากลับมาไม่ได้นะ!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'ใช่, ลบเลย!',
        cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
        deleteDoc(doc(db, 'reminders', reminderId))
            .then(() => Swal.fire('ลบแล้ว!', 'บันทึกของคุณถูกลบแล้ว', 'success'))
            .catch(e => Swal.fire('ผิดพลาด', e.message, 'error'));
    }
}

async function handleDateClick(arg) {
    const holidayName = THAI_HOLIDAYS.get(arg.dateStr);
    if (holidayName) {
        await Swal.fire({
            title: `🎉 วันหยุด: ${holidayName}`,
            icon: 'info',
            confirmButtonText: 'รับทราบ!',
            confirmButtonColor: 'var(--primary-color)',
        });
    }

    const { value: action } = await Swal.fire({
        title: `วันที่ ${new Date(arg.dateStr).toLocaleDateString('th-TH', {dateStyle: 'long'})}`,
        text: 'จะทำอะไรดีน้าา?',
        showDenyButton: true, confirmButtonText: 'เพิ่มเวร',
        denyButtonText: 'บันทึกช่วยเตือน',
        confirmButtonColor: 'var(--primary-color)', denyButtonColor: '#28a745'
    });
    if (action) { 
        promptAddShift(arg.dateStr); 
    } else if (action === false) { 
        showRemindersForDate(arg.dateStr); 
    }
}

async function handleEventClick(arg) {
    const shiftId = arg.event.id;
    if (arg.event.extendedProps.isReminder) {
        showRemindersForDate(arg.event.startStr);
        return;
    }
    if (shiftId.endsWith('_off')) { return; }

    const originalProps = allShiftsData[shiftId]; 
    const { person, shift, room, notes, medOption, isCancelled } = originalProps;
    const eventDateStr = arg.event.startStr.split('T')[0];
    
    if(isCancelled){
        const result = await Swal.fire({
            title: 'เวรนี้ถูกยกเลิกแล้ว',
            html: `<p>เวรเดิมของ: <strong>${person}</strong></p><p>ช่วงเวลา: <strong>${shift} (${SHIFTS[shift]?.time || 'N/A'})</strong></p><p>ห้อง: <strong>${room}</strong></p><p>เหตุผล: ${notes || 'ไม่มี'}</p><hr><p>ต้องการลบข้อมูลนี้ถาวรหรือไม่?</p>`,
            icon: 'info', showCancelButton: true, confirmButtonText: 'ลบถาวร',
            cancelButtonText: 'ปิด', confirmButtonColor: '#d33'
        });
        if (result.isConfirmed) {
            deleteDoc(doc(db, 'shifts', shiftId))
                .then(() => {
                    Swal.fire('ลบแล้ว!', 'ข้อมูลถูกลบออกจากระบบแล้ว', 'success');
                })
                .catch((error) => Swal.fire('ผิดพลาด!', `ไม่สามารถลบข้อมูลได้: ${error.message}`, 'error'));
        }
        return;
    }

    const dateIsSpecial = isSpecialDay(eventDateStr);
    const availableShifts = {...SHIFTS};
    if(dateIsSpecial) {
        delete availableShifts['รุ่งอรุณ'];
    } else {
        delete availableShifts['เช้า'];
    }

    const result = await Swal.fire({
        title: `แก้ไข/ลบเวร`,
        html: `
            <p style="margin-bottom: 20px;">วันที่ ${new Date(eventDateStr).toLocaleDateString('th-TH', { dateStyle: 'long' })}</p>
            <label class="swal2-input-label">เภสัชกร</label>
            <div class="radio-group-horizontal">
                ${Object.keys(PERSONS).map(p => `
                    <label class="radio-option">
                        <input type="radio" name="swal-person-edit" value="${p}" ${p === person ? 'checked' : ''}>
                        <span style="background-color:${PERSONS[p].color};">${PERSONS[p].name}</span>
                    </label>
                `).join('')}
            </div>
            <label for="swal-shift-edit" class="swal2-input-label">ช่วงเวลา</label>
            <select id="swal-shift-edit" class="swal2-select">${Object.keys(availableShifts).map(s => `<option value="${s}" ${s === shift ? 'selected' : ''}>${availableShifts[s].name}</option>`).join('')}</select>
            <label for="swal-room-edit" class="swal2-input-label">เวร</label>
            <select id="swal-room-edit" class="swal2-select"></select>
            <div id="med-options-container-edit" style="display: none; margin-top: 1em;">
                <label for="swal-med-option-edit" class="swal2-input-label">ตัวเลือก (MED เช้าวันหยุด)</label>
                <select id="swal-med-option-edit" class="swal2-select"><option value="Cont" ${medOption === 'Cont' ? 'selected' : ''}>Cont</option><option value="D/C" ${medOption === 'D/C' ? 'selected' : ''}>D/C</option></select>
            </div>
            <label for="swal-notes-edit" class="swal2-input-label">หมายเหตุ</label>
            <input type="text" id="swal-notes-edit" class="swal2-input" placeholder="ไม่บังคับ" value="${notes || ''}">`,
        focusConfirm: false,
        didOpen: () => {
            const shiftSelect = document.getElementById('swal-shift-edit');
            const roomSelect = document.getElementById('swal-room-edit');
            const medContainer = document.getElementById('med-options-container-edit');
            
            const updateFormFields = () => {
                if (!shiftSelect || !roomSelect) return;
                const selectedShift = shiftSelect.value;
                const currentRoom = roomSelect.value || room;
                let availableRooms = [];
                const dayOfWeek = new Date(eventDateStr).getDay();
                if (selectedShift === 'รุ่งอรุณ') {
                   if (dayOfWeek === 1) { 
                       availableRooms = ['OPD'];
                   } else {
                       availableRooms = ['ER', 'OPD'];
                   }
                } else if (selectedShift === 'เช้า') {
                   availableRooms = ['ER', 'MED', 'SURG', 'Extend', 'CHEMO'];
                } else if (selectedShift === 'บ่าย') {
                    if (isSpecialDay(eventDateStr)) {
                        availableRooms = ['ER', 'MED'];
                    } else if (dayOfWeek === 5) { // Friday
                        availableRooms = ['ER', 'MED', 'Extend'];
                    } else {
                        availableRooms = ['ER', 'MED', 'Extend', 'SMC'];
                    }
                } else if (selectedShift === 'ดึก') {
                   availableRooms = ['ER'];
                }
                roomSelect.innerHTML = availableRooms.map(r => `<option value="${r}" ${r === currentRoom ? 'selected' : ''}>${r}</option>`).join('');
                if (!availableRooms.includes(roomSelect.value)) roomSelect.value = availableRooms[0] || '';
                
                const showMedField = dateIsSpecial && selectedShift === 'เช้า' && roomSelect.value === 'MED';
                medContainer.style.display = showMedField ? 'block' : 'none';
            };

            if(shiftSelect) {
                shiftSelect.addEventListener('change', updateFormFields);
            }
            if(roomSelect) {
                roomSelect.addEventListener('change', updateFormFields);
            }
            updateFormFields();
        },
        preConfirm: () => {
            const newPerson = document.querySelector('input[name="swal-person-edit"]:checked').value;
            const newShift = document.getElementById('swal-shift-edit').value;
            for (const key in allShiftsData) {
                if (key === shiftId) continue; 
                const existingShift = allShiftsData[key];
                if (existingShift.date === eventDateStr && existingShift.person === newPerson && existingShift.shift === newShift && !existingShift.isCancelled) {
                    Swal.showValidationMessage(`อัปเดตไม่ได้นะ! ${newPerson} มีเวร ${newShift} ที่ห้อง ${existingShift.room} อยู่แล้ว`);
                    return false;
                }
            }
            return {
                person: newPerson, shift: newShift,
                room: document.getElementById('swal-room-edit').value,
                notes: document.getElementById('swal-notes-edit').value.trim(),
                medOption: document.getElementById('med-options-container-edit').style.display === 'block' ? document.getElementById('swal-med-option-edit').value : null
            }
        },
        showCancelButton: true, showDenyButton: true,
        confirmButtonText: 'อัปเดต', denyButtonText: `ลบ/ยกเลิกเวร`,
        cancelButtonText: 'ยกเลิก', denyButtonColor: '#d33',
    });
    
    if (result.isDenied) {
        const { value: reason } = await Swal.fire({
            title: 'จะยกเลิกเวรเหรอ?', input: 'text',
            inputPlaceholder: 'บอกเหตุผลหน่อยสิ (ถ้าไม่บอกจะลบถาวรนะ)', showCancelButton: true,
            confirmButtonText: 'ยืนยัน', cancelButtonText: 'ยกเลิก'
        });
        if (reason !== undefined) { 
            if (reason) { 
                const cancelledData = { ...originalProps, notes: reason, isCancelled: true };
                setDoc(doc(db, 'shifts', shiftId), cancelledData)
                    .then(() => {
                        Swal.fire('บันทึกการยกเลิกแล้ว', '', 'info');
                        const payload = createMakePayload(cancelledData, 'cancel', shiftId);
                        sendToMakeWebhook(payload);
                    })
                    .catch((error) => Swal.fire('ผิดพลาด!', `บันทึกไม่ได้: ${error.message}`, 'error'));
            } else { 
                const deleteConfirmation = await Swal.fire({ title: 'แน่ใจนะว่าจะลบถาวร?', text: 'ข้อมูลนี้จะหายไปเลยนะ!', icon: 'warning', showCancelButton: true, confirmButtonText: 'ใช่, ลบเลย!', cancelButtonText: 'ยกเลิก' });
                if(deleteConfirmation.isConfirmed){
                    const dataToDelete = allShiftsData[shiftId];
                    deleteDoc(doc(db, 'shifts', shiftId))
                        .then(() => {
                            Swal.fire('ลบแล้ว!', 'ข้อมูลถูกลบออกจากระบบแล้ว', 'success');
                            const payload = createMakePayload(dataToDelete, 'delete', shiftId);
                            sendToMakeWebhook(payload);
                        })
                        .catch((error) => Swal.fire('ผิดพลาด!', `ไม่สามารถลบข้อมูลได้: ${error.message}`, 'error'));
                }
            }
        }
    } else if (result.isConfirmed) {
        const formValues = result.value;
        if(formValues) {
            const updateConfirmation = await Swal.fire({ title: 'จะอัปเดตข้อมูลแน่นะ?', icon: 'question', showCancelButton: true, confirmButtonText: 'ใช่, อัปเดตเลย!', cancelButtonText: 'ยกเลิก', confirmButtonColor: '#28a745' });
            if (updateConfirmation.isConfirmed) {
                const updatedData = { ...originalProps, ...formValues, date: eventDateStr };
                setDoc(doc(db, 'shifts', shiftId), updatedData)
                    .then(() => {
                        Swal.fire('สำเร็จ!', 'อัปเดตข้อมูลเวรเรียบร้อยแล้ว', 'success');
                        const payload = createMakePayload(updatedData, 'update', shiftId);
                        sendToMakeWebhook(payload);
                    })
                    .catch((error) => Swal.fire('ผิดพลาด!', `อัปเดตไม่ได้: ${error.message}`, 'error'));
            }
        }
    }
}

// --- 7. INITIALIZATION & APP LOGIC ---

function renderYearView(year) {
    yearViewContainer.innerHTML = ''; 
    const titleEl = document.getElementById('calendar-title');
    titleEl.textContent = `ปี ${year + 543}`;
    const today = new Date();
    const allEvents = calendar.getEvents();
    const thaiMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

    for (let month = 0; month < 12; month++) {
        const miniCalContainer = document.createElement('div');
        miniCalContainer.className = 'mini-calendar-container';
        
        const headerEl = document.createElement('div');
        headerEl.className = 'mini-calendar-header';
        headerEl.textContent = thaiMonths[month];
        miniCalContainer.appendChild(headerEl);

        const miniCalEl = document.createElement('div');
        miniCalEl.className = 'mini-calendar';
        
        miniCalContainer.appendChild(miniCalEl);
        yearViewContainer.appendChild(miniCalContainer);

        const miniCalendar = new FullCalendar.Calendar(miniCalEl, {
            initialView: 'dayGridMonth',
            initialDate: new Date(year, month, 1),
            locale: 'th',
            headerToolbar: false,
            dayCellDidMount: function(arg) {
                if (arg.date.toDateString() === today.toDateString()) {
                    arg.el.style.backgroundColor = 'var(--today-bg-tint)';
                }
            },
            events: allEvents,
            showNonCurrentDates: true
        });

        miniCalendar.render();

        miniCalContainer.addEventListener('click', () => {
            isYearViewActive = false;
            calendarEl.style.display = 'block';
            yearViewContainer.style.display = 'none';

            calendar.changeView('dayGridMonth');
            calendar.gotoDate(new Date(year, month, 1));
            
            document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
            document.getElementById('view-month').classList.add('active');
        });
    }
}

function initializeCustomCalendarControls() {
    const prevBtn = document.getElementById('calendar-prev');
    const nextBtn = document.getElementById('calendar-next');
    const todayBtn = document.getElementById('calendar-today');
    
    const dayViewBtn = document.getElementById('view-day');
    const weekViewBtn = document.getElementById('view-week');
    const monthViewBtn = document.getElementById('view-month');
    const yearViewBtn = document.getElementById('view-year');
    const viewButtons = [dayViewBtn, weekViewBtn, monthViewBtn, yearViewBtn];

    prevBtn.addEventListener('click', () => {
        if (isYearViewActive) {
            currentYearForView--;
            renderYearView(currentYearForView);
        } else {
            calendar.prev();
        }
    });

    nextBtn.addEventListener('click', () => {
        if (isYearViewActive) {
            currentYearForView++;
            renderYearView(currentYearForView);
        } else {
            calendar.next();
        }
    });

    todayBtn.addEventListener('click', () => {
        if (isYearViewActive) {
            currentYearForView = new Date().getFullYear();
            renderYearView(currentYearForView);
        } else {
            calendar.today();
        }
    });
    
    function setActiveButton(activeBtn) {
        viewButtons.forEach(btn => btn.classList.remove('active'));
        activeBtn.classList.add('active');
    }

    function showMainCalendar() {
        if (isYearViewActive) {
            isYearViewActive = false;
            calendarEl.style.display = 'block';
            yearViewContainer.style.display = 'none';
            calendar.render(); 
        }
    }

    dayViewBtn.addEventListener('click', () => {
        showMainCalendar();
        calendar.changeView('timeGridDay');
        setActiveButton(dayViewBtn);
    });

    weekViewBtn.addEventListener('click', () => {
        showMainCalendar();
        calendar.changeView('timeGridWeek');
        setActiveButton(weekViewBtn);
    });
    
    monthViewBtn.addEventListener('click', () => {
        showMainCalendar();
        calendar.changeView('dayGridMonth');
        setActiveButton(monthViewBtn);
    });

    yearViewBtn.addEventListener('click', () => {
        isYearViewActive = true;
        calendarEl.style.display = 'none';
        yearViewContainer.style.display = 'grid';
        currentYearForView = calendar.getDate().getFullYear(); 
        renderYearView(currentYearForView);
        setActiveButton(yearViewBtn);
    });
}

function initializeAppUI() {
    const personFilterEl = document.getElementById('filter-person');
    const shiftFilterEl = document.getElementById('filter-shift');
    const roomFilterEl = document.getElementById('filter-room');
    const clearButtonEl = document.getElementById('clear-filters-btn');
    const dateStartEl = document.getElementById('filter-start-date');
    const dateEndEl = document.getElementById('filter-end-date');
    const backupButton = document.getElementById('backup-btn');
    const exportExcelButton = document.getElementById('export-excel-btn');
    const calendarPersonFilterEl = document.getElementById('calendar-person-filter');
    const showCancelledCheckbox = document.getElementById('show-cancelled-checkbox');
    const showDawnCheckbox = document.getElementById('show-dawn-checkbox');

    personFilterEl.innerHTML = '<option value="all">ทั้งหมด</option>' + Object.keys(PERSONS).map(p => `<option value="${p}">${PERSONS[p].name}</option>`).join('');
    shiftFilterEl.innerHTML = '<option value="all">ทุกช่วงเวลา</option>' + Object.keys(SHIFTS).map(s => `<option value="${s}">${SHIFTS[s].name}</option>`).join('');
    roomFilterEl.innerHTML = '<option value="all">ทุกเวร</option>' + ALL_ROOMS.map(r => `<option value="${r}">${r}</option>`).join('');

    const allPersonKeys = Object.keys(PERSONS);
    visiblePersons = [...allPersonKeys]; 

    allPersonKeys.forEach(key => {
        calendarPersonFilterEl.innerHTML += `
            <div class="person-filter-option">
                <input type="checkbox" id="filter-person-${key}" value="${key}" class="person-checkbox" checked>
                <label for="filter-person-${key}">${PERSONS[key].name}</label>
            </div>
        `;
    });

    const personCheckboxes = document.querySelectorAll('.person-checkbox');

    personCheckboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            updateVisiblePersons();
        });
    });

    function updateVisiblePersons() {
        visiblePersons = [...personCheckboxes]
            .filter(cb => cb.checked)
            .map(cb => cb.value);
        renderCalendarAndSummary();
    }

    showCancelledCheckbox.addEventListener('change', () => {
        showCancelled = showCancelledCheckbox.checked;
        renderCalendarAndSummary();
    });

    showDawnCheckbox.addEventListener('change', () => {
        showDawnShifts = showDawnCheckbox.checked;
        renderCalendarAndSummary();
    });

    [personFilterEl, shiftFilterEl, roomFilterEl, dateStartEl, dateEndEl].forEach(el => {
        el.addEventListener('change', () => {
            currentPage = 1; 
            applyAndRenderFilters();
        });
    });
    clearButtonEl.addEventListener('click', () => {
        personFilterEl.value = 'all'; shiftFilterEl.value = 'all'; roomFilterEl.value = 'all';
        dateStartEl.value = ''; dateEndEl.value = '';
        currentPage = 1;
        applyAndRenderFilters();
    });
    
    backupButton.addEventListener('click', () => {
        const backupData = { shifts: allShiftsData, reminders: allRemindersData };
        const jsonString = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `utth-schedule-backup-${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
    
    exportExcelButton.addEventListener('click', () => {
        const dataToExport = fullSummaryData
            .filter(item => !item.isPostNightShift)
            .map(shift => {
                let cancelledInfo = shift.isCancelled ? `ใช่, เหตุผล: ${shift.notes || ''}` : 'ไม่';
                let regularNotes = !shift.isCancelled ? (shift.notes || '') : '';

                return {
                    'วันที่': shift.date,
                    'เภสัชกร': PERSONS[shift.person]?.name || shift.person,
                    'ช่วงเวลา': SHIFTS[shift.shift]?.name || shift.shift,
                    'เวร': shift.room,
                    'สถานะ(MED)': shift.medOption || '',
                    'หมายเหตุ': regularNotes,
                    'ยกเลิก': cancelledInfo
                };
            });
        
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "ตารางเวร");
        XLSX.writeFile(wb, `utth-schedule-${new Date().toISOString().slice(0,10)}.xlsx`);
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    
    try {
        const response = await fetch('holidays.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const holidayData = await response.json();
        THAI_HOLIDAYS = new Map(Object.entries(holidayData));
        console.log("Successfully loaded holiday data.");
    } catch (error) {
        console.error("Could not load holiday data:", error);
        Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลวันหยุดได้', 'error');
    }

    initializeAppUI();
    initializeCustomCalendarControls(); 
    calendar.render();
    
    const shiftsQuery = query(shiftsCollection, orderBy('createdAt', 'desc'));
    onSnapshot(shiftsQuery, (snapshot) => {
        const newShiftsData = {};
        snapshot.forEach(doc => {
            newShiftsData[doc.id] = doc.data();
        });
        allShiftsData = newShiftsData;
        renderCalendarAndSummary();
    });

    onSnapshot(remindersCollection, (snapshot) => {
        const newRemindersData = {};
        snapshot.forEach(doc => {
            newRemindersData[doc.id] = doc.data();
        });
        allRemindersData = newRemindersData;
        renderCalendarAndSummary();
    });
    
    document.getElementById('copyright-year').textContent = new Date().getFullYear();
});