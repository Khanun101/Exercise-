// --- ส่วนควบคุมการแสดงผลส่วนต่างๆ (เมนูและ Section) ---
let currentVisibleSection = 'calendarSection'; // ตั้งค่าส่วนที่แสดงอยู่ปัจจุบัน

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
        resetTimer();
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

function updateTimerDisplay() {
    currentTimeEl.textContent = remainingTime.toString().padStart(2, '0');
    currentSetEl.textContent = currentSetCount;
    displayTotalSetsEl.textContent = totalSetsToComplete;
}

function startTimer() {
    if (timerActive && !isPaused) return;

    if (currentSetCount === 0 || totalSetsToComplete === 0) {
        initialSetDuration = parseInt(setDurationInput.value);
        totalSetsToComplete = parseInt(totalSetsInput.value);

        if (isNaN(initialSetDuration) || initialSetDuration <= 0 ||
            isNaN(totalSetsToComplete) || totalSetsToComplete <= 0) {
            alert("กรุณากำหนดเวลาและจำนวนเซ็ตที่มากกว่า 0 ให้ถูกต้อง!");
            resetTimer();
            return;
        }
        currentSetCount = 1; // เริ่มต้นที่เซ็ต 1 สำหรับการแสดงผลทันที
        remainingTime = initialSetDuration;
        updateTimerDisplay(); // อัปเดตการแสดงผลทันทีหลังกำหนดค่าเริ่มต้น
    }
    
    // หากถูกหยุดชั่วคราว ให้ใช้เวลาที่เหลืออยู่ (ไม่ต้องปรับ remainingTime)
    // แต่ถ้าไม่ใช่การหยุดชั่วคราวและ remainingTime เป็น 0 (หมายถึงเซ็ตก่อนหน้าจบไปแล้ว) 
    // เราจะให้ remainingTime ถูกตั้งค่าโดยการตรวจจับใน `if (remainingTime <= 0)` ใน setInterval
    // จึงไม่จำเป็นต้องเซ็ต remainingTime = initialSetDuration ตรงนี้ซ้ำอีก
    
    timerActive = true;
    isPaused = false;

    startButton.disabled = true;
    pauseButton.disabled = false;
    resetTimerButton.disabled = false;
    setDurationInput.disabled = true;
    totalSetsInput.disabled = true;

    // *** updateTimerDisplay() ถูกเรียกไปแล้วด้านบนสำหรับเริ่มเซ็ตแรก ***
    // *** และจะถูกเรียกภายใน setInterval ด้วย ***

    timerInterval = setInterval(() => {
        remainingTime--;
        updateTimerDisplay();

        if (remainingTime <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            timerActive = false;
            
            alert(`เซ็ตที่ ${currentSetCount} จบแล้ว!`); 
            
            if (currentSetCount < totalSetsToComplete) {
                // ถ้ายังไม่ครบเซ็ตทั้งหมด:
                currentSetCount++; // <<<<< เพิ่มจำนวนเซ็ตทันทีที่เวลาหมด
                remainingTime = initialSetDuration; // รีเซ็ตเวลาสำหรับเซ็ตใหม่
                updateTimerDisplay(); // <<<<< อัปเดตการแสดงผลทันทีเพื่อให้เซ็ตใหม่ปรากฏ
                
                // ตั้งค่าปุ่มเพื่อรอการกด "เริ่ม" ใหม่
                startButton.disabled = false; 
                pauseButton.disabled = true;
                resetTimerButton.disabled = false;

            } else {
                // ครบทุกเซ็ตแล้ว
                alert("เยี่ยมมาก! คุณทำครบทุกเซ็ตแล้ว!");
                // ตั้งค่าปุ่มเมื่อจบครบทุกเซ็ต
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

function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    timerActive = false;
    isPaused = false;
    
    initialSetDuration = parseInt(setDurationInput.value) || 60;
    totalSetsToComplete = parseInt(totalSetsInput.value) || 3;
    
    // currentSetCount = 0; // ถูกต้องแล้ว: เมื่อรีเซ็ต ให้เป็น 0
    remainingTime = initialSetDuration; // เวลาที่เหลือถูกตั้งเป็นเวลาเริ่มต้น
    
    // *** อัปเดตค่า initialSetDuration และ totalSetsToComplete ในหน้าจอทันที ***
    // currentSetEl.textContent = currentSetCount; // จะแสดง 0
    // displayTotalSetsEl.textContent = totalSetsToComplete; // แสดงจำนวนเซ็ตทั้งหมด
    updateTimerDisplay(); // เรียกใช้เพื่อให้ค่า 0/N และเวลาที่ตั้งไว้แสดงผล

    startButton.disabled = false;
    pauseButton.disabled = true;
    resetTimerButton.disabled = true;
    setDurationInput.disabled = false;
    totalSetsInput.disabled = false;
}

// Event Listeners
startButton.addEventListener('click', startTimer);
pauseButton.addEventListener('click', pauseTimer);
resetTimerButton.addEventListener('click', resetTimer);

// Initial load
document.addEventListener('DOMContentLoaded', function() {
    showSection('calendarSection');
    renderCalendar();
    resetTimer(); // ให้ Timer แสดงค่าเริ่มต้นทันทีเมื่อเข้าหน้า
});
