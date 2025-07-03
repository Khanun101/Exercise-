// --- ส่วนควบคุมการแสดงผลส่วนต่างๆ (เมนูและ Section) ---
let currentVisibleSection = 'calendarSection'; // ตั้งค่าส่วนที่แสดงอยู่ปัจจุบัน

function toggleMenu() {
    const menu = document.getElementById('mainMenu');
    // ตรวจสอบว่าเมนูถูกซ่อนด้วย display: none หรือไม่
    // ถ้า display เป็น 'none' ให้เปลี่ยนเป็น 'block'
    // ถ้า display เป็น 'block' (หรืออื่นๆ) ให้เปลี่ยนเป็น 'none'
    // วิธีนี้ทำให้ transition ทำงานได้ดีขึ้นเมื่อเปลี่ยนจาก display: none -> block
    if (menu.style.display === 'block') {
        menu.style.display = 'none'; // ซ่อนทันที
        menu.classList.remove('active'); // เอา class active ออก
    } else {
        menu.style.display = 'block'; // แสดงทันที
        setTimeout(() => { // รอเล็กน้อยเพื่อให้ display: block มีผลก่อนเพิ่ม class active
            menu.classList.add('active'); // เพิ่ม class active เพื่อให้ transition ทำงาน
        }, 10); // หน่วงเวลาเล็กน้อย
    }
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

    // ปิดเมนูหลังจากเลือก (ใช้ toggleMenu อีกครั้งเพื่อปิด)
    if (document.getElementById('mainMenu').classList.contains('active')) {
        toggleMenu(); 
    }

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
    // ป้องกันการกดเริ่มซ้ำขณะทำงาน หรือเมื่อหยุดชั่วคราวแต่ไม่ได้กด "เริ่ม" ต่อ
    if (timerActive && !isPaused) return; 

    // ดึงค่าจาก input เมื่อเริ่ม Timer ครั้งแรก หรือเมื่อมีการเปลี่ยนค่า
    if (currentSetCount === 0 || totalSetsToComplete === 0) { // ตรวจสอบว่าเป็นการเริ่มครั้งแรก
        initialSetDuration = parseInt(setDurationInput.value);
        totalSetsToComplete = parseInt(totalSetsInput.value);

        if (isNaN(initialSetDuration) || initialSetDuration <= 0 ||
            isNaN(totalSetsToComplete) || totalSetsToComplete <= 0) {
            alert("กรุณากำหนดเวลาและจำนวนเซ็ตที่มากกว่า 0 ให้ถูกต้อง!");
            resetTimer(); // รีเซ็ตทุกอย่างหากข้อมูลไม่ถูกต้อง
            return;
        }
        currentSetCount = 1; // เริ่มต้นที่เซ็ต 1 สำหรับการแสดงผลทันที
        remainingTime = initialSetDuration; // ตั้งเวลาเริ่มต้นสำหรับเซ็ตแรก
        updateTimerDisplay(); // อัปเดตการแสดงผลทันทีหลังกำหนดค่าเริ่มต้น
    } 
    // หากถูกหยุดชั่วคราว ให้ใช้เวลาที่เหลืออยู่
    if (isPaused) {
        // เวลา remainingTime ยังคงเป็นค่าที่หยุดไว้
    } else if (currentSetCount > 0 && remainingTime === initialSetDuration) {
        // กรณีที่ผู้ใช้กด Start เพื่อเริ่มเซ็ตถัดไป (หลังจากเซ็ตก่อนหน้าจบและเวลารีเซ็ตแล้ว)
        // หรือกรณีเริ่มเซ็ตแรก
        // ไม่ต้องทำอะไร เพราะ remainingTime ถูกตั้งค่าแล้ว
    }
    
    timerActive = true;
    isPaused = false;

    // ตั้งค่าสถานะปุ่มและ input
    startButton.disabled = true;
    pauseButton.disabled = false;
    resetTimerButton.disabled = false; 
    setDurationInput.disabled = true;
    totalSetsInput.disabled = true;

    // *** ย้าย updateTimerDisplay() มาตรงนี้ เพื่อให้แน่ใจว่าค่าล่าสุดแสดงผลก่อนเริ่มจับเวลา ***
    updateTimerDisplay(); 

    timerInterval = setInterval(() => {
        remainingTime--;
        updateTimerDisplay();

        if (remainingTime <= 0) {
            clearInterval(timerInterval);
            timerInterval = null; // เคลียร์ interval
            timerActive = false; // ตัวจับเวลาหยุด

            // เล่นเสียงแจ้งเตือน (สามารถเพิ่มได้ถ้าต้องการ)
            // const audio = new Audio('path/to/your/sound.mp3');
            // audio.play();
            
            alert(`เซ็ตที่ ${currentSetCount} จบแล้ว!`); 
            
            if (currentSetCount < totalSetsToComplete) {
                // ถ้ายังไม่ครบเซ็ตทั้งหมด ให้เพิ่มเซ็ตและรีเซ็ตเวลา
                currentSetCount++; // *** ตรงนี้คือการเพิ่มจำนวนเซ็ต ***
                remainingTime = initialSetDuration; // รีเซ็ตเวลาสำหรับเซ็ตใหม่
                updateTimerDisplay(); // อัปเดตการแสดงผล (เซ็ตใหม่, เวลารีเซ็ต)
                
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
                // หากต้องการให้แสดงเวลาเป็น 00 เมื่อจบครบทุกเซ็ต
                remainingTime = 0;
                updateTimerDisplay();
            }
        }
    }, 1000); // ทุก 1 วินาที
}

function pauseTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        timerActive = false;
        isPaused = true;
        
        startButton.disabled = false; // ให้กดเริ่มต่อได้
        pauseButton.disabled = true;
        resetTimerButton.disabled = false; // อนุญาตให้ Reset ได้ตลอดเวลาที่หยุด
    }
}

function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    timerActive = false;
    isPaused = false;
    
    // ตั้งค่าเริ่มต้นใหม่ทั้งหมด
    initialSetDuration = parseInt(setDurationInput.value) || 60; // ใช้ค่าจาก input หรือ 60 เป็น default
    totalSetsToComplete = parseInt(totalSetsInput.value) || 3; // ใช้ค่าจาก input หรือ 3 เป็น default
    remainingTime = initialSetDuration; // เวลาเริ่มต้นของเซ็ตแรก
    currentSetCount = 0; // ตั้งเป็น 0 เมื่อรีเซ็ต ให้เป็นค่าว่างก่อนเริ่ม

    // รีเซ็ตปุ่มและ input
    startButton.disabled = false;
    pauseButton.disabled = true;
    resetTimerButton.disabled = true; // ปิดปุ่มรีเซ็ตเมื่อยังไม่เริ่ม
    setDurationInput.disabled = false;
    totalSetsInput.disabled = false;

    updateTimerDisplay(); // อัปเดตการแสดงผลให้เป็นค่าเริ่มต้น
}

// Event Listeners สำหรับปุ่ม Timer
startButton.addEventListener('click', startTimer);
pauseButton.addEventListener('click', pauseTimer);
resetTimerButton.addEventListener('click', resetTimer);

// เรียกใช้ฟังก์ชันเริ่มต้นเมื่อ DOM โหลดเสร็จ
document.addEventListener('DOMContentLoaded', function() {
    showSection('calendarSection'); // แสดงปฏิทินเป็นหน้าแรก
    renderCalendar(); // Render ปฏิทินครั้งแรก
    resetTimer(); // รีเซ็ต Timer เพื่อตั้งค่าเริ่มต้นทั้งหมด
});
