// --- ส่วนควบคุมการแสดงผลส่วนต่างๆ (เมนูและ Section) ---
let currentVisibleSection = 'calendarSection';

function toggleMenu() {
    const menu = document.getElementById('mainMenu');
    if (menu.style.display === 'block') {
        menu.style.display = 'none';
        menu.classList.remove('active');
    } else {
        menu.style.display = 'block';
        setTimeout(() => {
            menu.classList.add('active');
        }, 10);
    }
}

function showSection(sectionId) {
    if (currentVisibleSection) {
        document.getElementById(currentVisibleSection).classList.remove('active');
        document.getElementById(currentVisibleSection).classList.add('hidden');
    }

    const newSection = document.getElementById(sectionId);
    newSection.classList.remove('hidden');
    newSection.classList.add('active');
    currentVisibleSection = sectionId;

    if (document.getElementById('mainMenu').classList.contains('active')) {
        toggleMenu();
    }

    if (sectionId === 'calendarSection') {
        renderCalendar();
    } else if (sectionId === 'timerSection') {
        resetTimer(); // สำคัญ: รีเซ็ต Timer เมื่อเข้าสู่หน้า Timer เพื่อตั้งค่าเริ่มต้น
    }
}

// --- ส่วนปฏิทิน (ไม่มีการเปลี่ยนแปลง) ---
const calendarGridEl = document.getElementById('calendar-grid');
const currentMonthYearEl = document.getElementById('currentMonthYear');
const totalWorkoutDaysEl = document.getElementById('totalWorkoutDays');

let currentCalendarDate = new Date();
let workoutDays = JSON.parse(localStorage.getItem('workoutDays')) || {};

function renderCalendar() {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    const monthNames = [
        "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
        "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];
    currentMonthYearEl.textContent = `${monthNames[month]} ${year}`;

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const startDayOfWeek = firstDayOfMonth.getDay();

    let html = `
        <div class="day-header">อา</div>
        <div class="day-header">จ</div>
        <div class="day-header">อ</div>
        <div class="day-header">พ</div>
        <div class="day-header">พฤ</div>
        <div class="day-header">ศ</div>
        <div class="day-header">ส</div>
    `;

    for (let i = 0; i < startDayOfWeek; i++) {
        html += `<div class="day-cell empty"></div>`;
    }

    let totalCheckedDays = 0;
    const today = new Date();
    const todayString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

    for (let i = 1; i <= lastDayOfMonth; i++) {
        const dateString = `${year}-${month + 1}-${i}`;
        let classes = 'day-cell';

        if (dateString === todayString) {
            classes += ' today';
        }

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

    document.querySelectorAll('#calendar-grid .day-cell:not(.empty)').forEach(cell => {
        cell.addEventListener('click', function() {
            const date = this.dataset.date;
            if (workoutDays[date]) {
                delete workoutDays[date];
            } else {
                workoutDays[date] = true;
            }
            localStorage.setItem('workoutDays', JSON.stringify(workoutDays));
            renderCalendar();
        });
    });
}

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
let initialSetDuration;
let remainingTime;
let currentSetCount;
let totalSetsToComplete;
let timerActive = false;
let isPaused = false;

// ฟังก์ชันสำหรับอัปเดตการแสดงผลของตัวจับเวลา
function updateTimerDisplay() {
    // ตรวจสอบให้แน่ใจว่า element มีอยู่จริงก่อนอัปเดต
    if (!currentTimeEl || !currentSetEl || !displayTotalSetsEl) {
        console.error("Error: Timer display elements not found in HTML!");
        return;
    }

    currentTimeEl.textContent = remainingTime.toString().padStart(2, '0');
    currentSetEl.textContent = currentSetCount; // อัปเดตค่าเซ็ตปัจจุบัน
    displayTotalSetsEl.textContent = totalSetsToComplete; // อัปเดตค่าจำนวนเซ็ตทั้งหมด
}

function startTimer() {
    if (timerActive && !isPaused) return;

    // ดึงค่าจาก input เมื่อเริ่ม Timer ครั้งแรก หรือเมื่อมีการเปลี่ยนค่าหลังจากรีเซ็ต
    // ตรวจสอบว่า currentSetCount เป็น 0 หรือยังไม่ได้กำหนดค่าเริ่มต้น
    if (currentSetCount === 0 || initialSetDuration === undefined || totalSetsToComplete === undefined) {
        initialSetDuration = parseInt(setDurationInput.value);
        totalSetsToComplete = parseInt(totalSetsInput.value);

        // ตรวจสอบความถูกต้องของค่าที่ป้อน
        if (isNaN(initialSetDuration) || initialSetDuration <= 0 ||
            isNaN(totalSetsToComplete) || totalSetsToComplete <= 0) {
            alert("กรุณากำหนดเวลาและจำนวนเซ็ตที่มากกว่า 0 ให้ถูกต้อง!");
            resetTimer(); // รีเซ็ตหากค่าไม่ถูกต้อง
            return;
        }
        currentSetCount = 1; // เริ่มต้นที่เซ็ต 1 สำหรับการแสดงผลเมื่อกดเริ่ม
        remainingTime = initialSetDuration;
        updateTimerDisplay(); // อัปเดตการแสดงผลทันทีหลังกำหนดค่าเริ่มต้น
    }
    
    timerActive = true;
    isPaused = false;

    // ตั้งค่าสถานะปุ่มและ input
    startButton.disabled = true;
    pauseButton.disabled = false;
    resetTimerButton.disabled = false;
    setDurationInput.disabled = true;
    totalSetsInput.disabled = true;

    timerInterval = setInterval(() => {
        remainingTime--;
        updateTimerDisplay(); // อัปเดตทุกวินาที

        if (remainingTime <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            timerActive = false;
            
            alert(`เซ็ตที่ ${currentSetCount} จบแล้ว!`); 
            
            if (currentSetCount < totalSetsToComplete) {
                // ถ้ายังไม่ครบเซ็ตทั้งหมด:
                currentSetCount++; // เพิ่มจำนวนเซ็ตทันทีที่เวลาหมด
                remainingTime = initialSetDuration; // รีเซ็ตเวลาสำหรับเซ็ตใหม่
                updateTimerDisplay(); // อัปเดตการแสดงผลทันทีเพื่อให้เซ็ตใหม่ปรากฏ
                
                // ตั้งค่าปุ่มเพื่อรอการกด "เริ่ม" ใหม่
                startButton.disabled = false; 
                pauseButton.disabled = true;
                resetTimerButton.disabled = false;

            } else {
                // ครบทุกเซ็ตแล้ว
                alert("เยี่ยมมาก! คุณทำครบทุกเซ็ตแล้ว!");
                resetTimerButton.disabled = false;
                startButton.disabled = true; 
                pauseButton.disabled = true;
                remainingTime = 0; // แสดงเวลาเป็น 00 เมื่อจบครบทุกเซ็ต
                updateTimerDisplay();
            }
        }
    }, 1000);
}

function pauseTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        timerActive = false;
        isPaused = true;
        
        startButton.disabled = false;
        pauseButton.disabled = true;
        resetTimerButton.disabled = false;
    }
}

// ฟังก์ชันรีเซ็ตตัวจับเวลาให้เป็นค่าเริ่มต้น
function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    timerActive = false;
    isPaused = false;
    
    // ดึงค่าจาก input ทันทีเมื่อรีเซ็ตเพื่อนำมาแสดงผลเป็นค่าตั้งต้น
    // ใช้ || เพื่อให้มีค่า default หาก input ว่างหรือเป็น NaN
    initialSetDuration = parseInt(setDurationInput.value) || 60;
    totalSetsToComplete = parseInt(totalSetsInput.value) || 3;
    
    remainingTime = initialSetDuration;
    currentSetCount = 0; // สำคัญ: ตั้งเป็น 0 เมื่อรีเซ็ต เพื่อให้แสดง "0 / จำนวนเซ็ตทั้งหมด"

    // อัปเดตหน้าจอด้วยค่าเริ่มต้นใหม่ทันที
    updateTimerDisplay(); 

    // ตั้งค่าสถานะปุ่มและ input
    startButton.disabled = false;
    pauseButton.disabled = true;
    resetTimerButton.disabled = true;
    setDurationInput.disabled = false;
    totalSetsInput.disabled = false;
}

// Event Listeners สำหรับปุ่ม Timer
startButton.addEventListener('click', startTimer);
pauseButton.addEventListener('click', pauseTimer);
resetTimerButton.addEventListener('click', resetTimer);

// Event Listeners สำหรับ input fields เพื่อให้อัปเดตค่า Total Sets ทันที
// เมื่อมีการเปลี่ยนแปลงค่าในช่อง input ให้เรียก resetTimer เพื่ออัปเดตการแสดงผล
setDurationInput.addEventListener('input', resetTimer); 
totalSetsInput.addEventListener('input', resetTimer); 

// เรียกใช้ฟังก์ชันเริ่มต้นเมื่อ DOM โหลดเสร็จ
document.addEventListener('DOMContentLoaded', function() {
    showSection('calendarSection'); // แสดงปฏิทินเป็นหน้าแรก
    renderCalendar(); // Render ปฏิทินครั้งแรก
    resetTimer(); // สำคัญ: เรียก resetTimer เพื่อให้ Timer แสดงค่าเริ่มต้นทันทีเมื่อโหลดหน้า
});
