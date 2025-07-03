// --- ส่วนควบคุมการแสดงผลส่วนต่างๆ (เมนูและ Section) ---
let currentVisibleSection = 'calendarSection'; // ตั้งค่าส่วนที่แสดงอยู่ปัจจุบัน

function toggleMenu() {
    const menu = document.getElementById('mainMenu');
    menu.classList.toggle('active');
}

function showSection(sectionId) {
    // ซ่อน Section ที่กำลังแสดงอยู่
    if (currentVisibleSection) {
        document.getElementById(currentVisibleSection).classList.remove('active');
        document.getElementById(currentVisibleSection).classList.add('hidden');
    }

    // แสดง Section ที่ต้องการ
    const newSection = document.getElementById(sectionId);
    newSection.classList.remove('hidden');
    newSection.classList.add('active');
    currentVisibleSection = sectionId; // อัปเดต Section ที่กำลังแสดง

    // ปิดเมนูหลังจากเลือก
    toggleMenu();

    // หากเป็นส่วนปฏิทิน ให้ render ใหม่
    if (sectionId === 'calendarSection') {
        renderCalendar();
    } else if (sectionId === 'timerSection') {
        resetTimer(); // รีเซ็ต Timer เมื่อเข้าสู่หน้า Timer
    }
}

// --- ส่วนปฏิทิน ---
const calendarGridEl = document.getElementById('calendar-grid');
const currentMonthYearEl = document.getElementById('currentMonthYear');
const totalWorkoutDaysEl = document.getElementById('totalWorkoutDays');

let currentCalendarDate = new Date(); // วันที่ปัจจุบันของปฏิทินที่แสดงอยู่
let workoutDays = JSON.parse(localStorage.getItem('workoutDays')) || {}; // เก็บวันที่ออกกำลังกายไว้ใน localStorage

function renderCalendar() {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth(); // 0-11
    
    // ตั้งชื่อเดือนเป็นภาษาไทย
    const monthNames = [
        "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
        "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];
    currentMonthYearEl.textContent = `${monthNames[month]} ${year}`;

    // หาข้อมูลวันในเดือน
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = อาทิตย์, 1 = จันทร์...

    let html = `
        <div class="day-header">อา</div>
        <div class="day-header">จ</div>
        <div class="day-header">อ</div>
        <div class="day-header">พ</div>
        <div class="day-header">พฤ</div>
        <div class="day-header">ศ</div>
        <div class="day-header">ส</div>
    `;

    // เพิ่มช่องว่างสำหรับวันก่อนหน้าวันที่ 1 ของเดือน
    for (let i = 0; i < startDayOfWeek; i++) {
        html += `<div class="day-cell empty"></div>`;
    }

    // เพิ่มวันในปฏิทิน
    let totalCheckedDays = 0;
    const today = new Date();
    const todayString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`; // รูปแบบYYYY-M-D ของวันปัจจุบัน

    for (let i = 1; i <= lastDayOfMonth; i++) {
        const dateString = `${year}-${month + 1}-${i}`; // รูปแบบYYYY-M-D สำหรับแต่ละวันในปฏิทิน
        let classes = 'day-cell';

        // ไฮไลต์วันปัจจุบัน
        if (dateString === todayString) {
            classes += ' today';
        }

        // ตรวจสอบว่าวันนี้มีการติ๊กถูกหรือไม่
        if (workoutDays[dateString]) {
            classes += ' checked';
            totalCheckedDays++;
        }

        html += `
            <div class="${classes}" data-date="${dateString}">
                ${i}
                <span class="checkmark">&#10003;</span>
            </div>
        `;
    }
    calendarGridEl.innerHTML = html;
    totalWorkoutDaysEl.textContent = totalCheckedDays;

    // เพิ่ม Event Listener ให้แต่ละวัน (ไม่ใช่วันว่าง)
    document.querySelectorAll('#calendar-grid .day-cell:not(.empty)').forEach(cell => {
        cell.addEventListener('click', function() {
            const date = this.dataset.date;
            if (workoutDays[date]) {
                delete workoutDays[date]; // ยกเลิกติ๊กถูก
            } else {
                workoutDays[date] = true; // ติ๊กถูก
            }
            localStorage.setItem('workoutDays', JSON.stringify(workoutDays)); // บันทึกข้อมูล
            renderCalendar(); // อัปเดตปฏิทิน
        });
    });
}

// ฟังก์ชันเปลี่ยนเดือนในปฏิทิน
function changeMonth(delta) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + delta);
    renderCalendar();
}

// --- ส่วนตัวจับเวลา ---
const setDurationInput = document.getElementById('setDuration');
const totalSetsInput = document.getElementById('totalSets');
const startButton = document.getElementById('startButton');
const pauseButton = document.getElementById('pauseButton');
const resetTimerButton = document.getElementById('resetTimerButton');
const currentTimeEl = document.getElementById('currentTime');
const currentSetEl = document.getElementById('currentSet');
const displayTotalSetsEl = document.getElementById('displayTotalSets');

let timerInterval;
let initialSetDuration;     // เก็บเวลาเริ่มต้นของแต่ละเซ็ต (จาก input)
let remainingTime;          // เวลาที่เหลือในเซ็ตปัจจุบัน
let currentSetCount;        // จำนวนเซ็ตที่กำลังทำอยู่ (1, 2, 3...)
let totalSetsToComplete;    // จำนวนเซ็ตทั้งหมดที่ผู้ใช้กำหนด
let timerActive = false;    // สถานะว่าตัวจับเวลากำลังทำงานอยู่หรือไม่
let isPaused = false;       // สถานะว่าตัวจับเวลาถูกหยุดชั่วคราวหรือไม่

function updateTimerDisplay() {
    currentTimeEl.textContent = remainingTime.toString().padStart(2, '0');
    currentSetEl.textContent = currentSetCount;
    displayTotalSetsEl.textContent = totalSetsToComplete;
}

function startTimer() {
    if (timerActive && !isPaused) return; // ป้องกันการกดเริ่มซ้ำขณะทำงาน

    // ดึงค่าจาก input เมื่อเริ่ม Timer ครั้งแรก หรือเมื่อมีการเปลี่ยนค่า
    if (currentSetCount === 0 || initialSetDuration === 0) { // Check if initial setup is needed
        initialSetDuration = parseInt(setDurationInput.value);
        totalSetsToComplete = parseInt(totalSetsInput.value);

        if (isNaN(initialSetDuration) || initialSetDuration <= 0 ||
            isNaN(totalSetsToComplete) || totalSetsToComplete <= 0) {
            alert("กรุณากำหนดเวลาและจำนวนเซ็ตที่มากกว่า 0 ให้ถูกต้อง!");
            resetTimer(); // รีเซ็ตทุกอย่างหากข้อมูลไม่ถูกต้อง
            return;
        }
        currentSetCount = 1; // เริ่มต้นที่เซ็ต 1
        remainingTime = initialSetDuration;
    } else if (!isPaused) { // If not paused, and not initial start (meaning previous set just finished)
        // This block handles automatic progression to the next set.
        // remainingTime is already set to initialSetDuration at the end of the previous set.
    }
    
    // หากถูกหยุดชั่วคราว ให้ใช้เวลาที่เหลืออยู่
