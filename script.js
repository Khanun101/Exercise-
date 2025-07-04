// 1. กำหนดค่า Supabase (แทนที่ด้วย Project URL และ Anon Key ของคุณ)
// **สำคัญมาก: ควรเก็บคีย์เหล่านี้ไว้ใน Environment Variables เมื่อ Deploy จริง**
//    แต่สำหรับการทดสอบบน localhost, การใส่ตรงๆ แบบนี้ก็ทำได้
const SUPABASE_URL = 'https://xoscoszdlzchwyisvxbp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhvc2Nvc3pkbHpjaHd5aXN2eGJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NDIwNzIsImV4cCI6MjA2NzExODA3Mn0.nZhld0oB8vmwvLzwhxhISuD6D-inHP7UVKhYzDfr6KY';

// ตรวจสอบว่า Supabase Client library ถูกโหลดแล้ว
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. ตัวแปรสำหรับ DOM Elements
const currentMonthYearEl = document.getElementById('currentMonthYear');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const calendarGridEl = document.querySelector('.calendar-grid');
const workoutCompletedCheckbox = document.getElementById('workoutCompleted');
const completedDaysCountEl = document.getElementById('completedDaysCount');

// Timer elements
const setTimeInput = document.getElementById('setTime');
const totalSetsInput = document.getElementById('totalSets');
const currentSetDisplay = document.getElementById('currentSet');
const displayTotalSets = document.getElementById('displayTotalSets');
const minutesEl = document.getElementById('minutes');
const secondsEl = document.getElementById('seconds');
const startTimerBtn = document.getElementById('startTimer');
const pauseTimerBtn = document.getElementById('pauseTimer');
const resetTimerBtn = document.getElementById('resetTimer');

// 3. ตัวแปรสถานะปฏิทิน
let currentDate = new Date(); // วันที่ปัจจุบัน
let selectedDate = new Date(); // วันที่ที่ถูกเลือกในปฏิทิน (เริ่มต้นที่วันปัจจุบัน)
let completedWorkouts = {}; // เก็บสถานะวันที่ออกกำลังกายแล้ว { 'YYYY-MM-DD': true }

// 4. ตัวแปรสถานะ Timer
let timerInterval;
let timeLeft = 0;
let isTimerRunning = false;
let currentSet = 0;
let totalSets = parseInt(totalSetsInput.value); // ดึงค่าเริ่มต้นจาก input
let defaultSetTime = parseInt(setTimeInput.value); // ดึงค่าเริ่มต้นจาก input

// เสียงแจ้งเตือน (ต้องมีไฟล์ notification.mp3 ในโฟลเดอร์เดียวกัน)
const notificationSound = new Audio('notification.mp3');

// --- ฟังก์ชันเกี่ยวกับการจัดการปฏิทิน ---

/**
 * แปลงวันที่เป็น String ในรูปแบบYYYY-MM-DD
 * @param {Date} dateObj
 * @returns {string}
 */
function formatDateToYYYYMMDD(dateObj) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * ดึงข้อมูลการออกกำลังกายจาก Supabase
 */
async function fetchWorkouts() {
    console.log("Fetching workouts...");
    const { data, error } = await supabase
        .from('workouts')
        .select('workout_date, is_completed');

    if (error) {
        console.error('Error fetching workouts:', error.message);
        return;
    }

    completedWorkouts = {};
    let count = 0;
    data.forEach(row => {
        if (row.is_completed) {
            completedWorkouts[row.workout_date] = true;
            count++;
        }
    });
    completedDaysCountEl.textContent = count;
    console.log("Workouts fetched:", completedWorkouts);
    renderCalendar(); // Render calendar again to reflect changes
}

/**
 * อัปเดตสถานะการออกกำลังกายใน Supabase
 * @param {string} dateString -YYYY-MM-DD format
 * @param {boolean} isCompleted
 */
async function updateWorkoutStatus(dateString, isCompleted) {
    const { data: existingData, error: fetchError } = await supabase
        .from('workouts')
        .select('id')
        .eq('workout_date', dateString)
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = No rows found
        console.error('Error checking existing workout:', fetchError.message);
        return;
    }

    let error = null;

    if (existingData) {
        const { error: updateError } = await supabase
            .from('workouts')
            .update({ is_completed: isCompleted })
            .eq('id', existingData.id);
        error = updateError;
    } else {
        const { error: insertError } = await supabase
            .from('workouts')
            .insert({ workout_date: dateString, is_completed: isCompleted });
        error = insertError;
    }

    if (error) {
        console.error('Error updating workout status:', error.message);
        alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่!');
    } else {
        console.log(`Workout for ${dateString} updated to ${isCompleted}`);
        completedWorkouts[dateString] = isCompleted; // อัปเดตสถานะใน local
        fetchWorkouts(); // เรียก fetch อีกครั้งเพื่ออัปเดตจำนวนวันและ render ใหม่
    }
}

/**
 * แสดงปฏิทินสำหรับเดือนและปีที่กำหนด
 */
function renderCalendar() {
    calendarGridEl.innerHTML = ''; // ล้าง grid เดิม

    // เพิ่มชื่อวันในสัปดาห์
    const dayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
    dayNames.forEach(name => {
        const dayNameDiv = document.createElement('div');
        dayNameDiv.classList.add('day-name');
        dayNameDiv.textContent = name;
        calendarGridEl.appendChild(dayNameDiv);
    });

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); // 0-11

    // แสดงเดือนและปี
    currentMonthYearEl.textContent = new Date(year, month).toLocaleString('th-TH', {
        month: 'long',
        year: 'numeric'
    });

    // หาวันแรกของเดือน (0 = อาทิตย์, 1 = จันทร์, ...)
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    // หาวันสุดท้ายของเดือน
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const todayYYYYMMDD = formatDateToYYYYMMDD(today);
    const selectedYYYYMMDD = formatDateToYYYYMMDD(selectedDate);

    // เพิ่มช่องว่างสำหรับวันก่อนหน้าของเดือน
    for (let i = 0; i < firstDayOfMonth; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.classList.add('calendar-day', 'empty');
        calendarGridEl.appendChild(emptyDiv);
    }

    // เพิ่มวันที่ในเดือน
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('calendar-day');
        dayDiv.textContent = day;

        const currentDayInLoop = new Date(year, month, day);
        const currentDayYYYYMMDD = formatDateToYYYYMMDD(currentDayInLoop);

        // ตรวจสอบว่าเป็นวันปัจจุบันหรือไม่
        if (currentDayYYYYMMDD === todayYYYYMMDD) {
            dayDiv.classList.add('current-day');
        }

        // ตรวจสอบว่าเป็นวันที่ถูกเลือกหรือไม่
        if (currentDayYYYYMMDD === selectedYYYYMMDD) {
            dayDiv.classList.add('selected-day');
        }

        // ตรวจสอบว่าออกกำลังกายเสร็จแล้วหรือไม่
        if (completedWorkouts[currentDayYYYYMMDD]) {
            dayDiv.classList.add('completed-day');
        }

        // Event Listener สำหรับคลิกวันที่: จะ toggle สถานะ "ออกกำลังกายแล้ว" และเลือกวันนี้
        dayDiv.addEventListener('click', async () => {
            const clickedDayDate = new Date(year, month, day);
            const clickedDayYYYYMMDD = formatDateToYYYYMMDD(clickedDayDate);

            // 1. อัปเดตวันที่ถูกเลือกให้เป็นวันที่คลิก
            selectedDate = clickedDayDate;

            // 2. ตรวจสอบสถานะปัจจุบันและสลับสถานะ
            const currentCompletionStatus = !!completedWorkouts[clickedDayYYYYMMDD];
            const newCompletionStatus = !currentCompletionStatus;

            // 3. อัปเดตสถานะใน Supabase
            await updateWorkoutStatus(clickedDayYYYYMMDD, newCompletionStatus);

            // 4. อัปเดต checkbox ให้ตรงกับสถานะใหม่ของวันที่ถูกเลือก
            workoutCompletedCheckbox.checked = newCompletionStatus;

            // renderCalendar() จะถูกเรียกโดย fetchWorkouts() ใน updateWorkoutStatus() อยู่แล้ว
            // แต่เรียกอีกครั้งตรงนี้เพื่อให้ UI อัปเดตทันที (เช่น ไฮไลต์ selected-day)
            // ก่อนที่ fetchWorkouts จะโหลดข้อมูลเสร็จและ render อีกครั้ง
            renderCalendar();
        });

        calendarGridEl.appendChild(dayDiv);
    }

    // อัปเดตสถานะ checkbox สำหรับวันที่ถูกเลือกในปัจจุบัน
    workoutCompletedCheckbox.checked = !!completedWorkouts[selectedYYYYMMDD];
}

// --- ฟังก์ชันเกี่ยวกับการจัดการ Timer ---

/**
 * อัปเดตค่าเวลาที่แสดงบนหน้าจอ
 */
function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    minutesEl.textContent = String(minutes).padStart(2, '0');
    secondsEl.textContent = String(seconds).padStart(2, '0');
}

/**
 * เริ่ม Timer
 */
function startTimer() {
    if (isTimerRunning) return; // ป้องกันการเริ่มซ้ำ

    // ตรวจสอบและตั้งค่าเริ่มต้นหาก Timer ยังไม่เคยถูกเริ่มมาก่อน หรือรีเซ็ตไปแล้ว
    if (timeLeft <= 0 && currentSet === 0) {
        defaultSetTime = parseInt(setTimeInput.value);
        totalSets = parseInt(totalSetsInput.value);
        if (isNaN(defaultSetTime) || defaultSetTime <= 0) defaultSetTime = 60;
        if (isNaN(totalSets) || totalSets <= 0) totalSets = 5;

        timeLeft = defaultSetTime;
        currentSet = 1; // เริ่มเซ็ตแรก
        displayTotalSets.textContent = totalSets; // อัปเดตจำนวนเซ็ตทั้งหมด
    } else if (timeLeft <= 0) { // กรณีหมดเวลาและจะเริ่มเซ็ตถัดไป
        timeLeft = defaultSetTime;
    }

    isTimerRunning = true;
    updateTimerDisplay(); // อัปเดตครั้งแรกทันที

    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            notificationSound.play(); // เล่นเสียงแจ้งเตือน

            if (currentSet < totalSets) {
                // ถ้ายังไม่ครบทุกเซ็ต:
                currentSet++; // ไปยังเซ็ตถัดไป
                timeLeft = defaultSetTime; // รีเซ็ตเวลาสำหรับเซ็ตใหม่
                updateTimerDisplay(); // อัปเดตหน้าจอ
                isTimerRunning = false; // หยุด Timer ชั่วคราว เพื่อให้ผู้ใช้กด "เริ่ม" ใหม่
            } else {
                // ถ้าจบทุกเซ็ตแล้ว:
                alert('ออกกำลังกายครบทุกเซ็ตแล้ว!');
                resetTimer(); // เรียก resetTimer() เพื่อรีเซ็ตค่าทั้งหมดและเตรียมพร้อมสำหรับการเริ่มใหม่
            }
        }
        currentSetDisplay.textContent = currentSet;
    }, 1000);
}

/**
 * หยุด Timer ชั่วคราว
 */
function pauseTimer() {
    clearInterval(timerInterval);
    isTimerRunning = false;
}

/**
 * รีเซ็ต Timer
 */
function resetTimer() {
    clearInterval(timerInterval);
    isTimerRunning = false;
    
    // ดึงค่าจาก input อีกครั้งเมื่อรีเซ็ต (เผื่อผู้ใช้เปลี่ยนค่าขณะ Timer หยุด)
    defaultSetTime = parseInt(setTimeInput.value); 
    if (isNaN(defaultSetTime) || defaultSetTime < 1) {
        defaultSetTime = 60; // ค่าเริ่มต้น
        setTimeInput.value = 60;
    }
    timeLeft = defaultSetTime; // กำหนดค่า timeLeft เป็นค่าเริ่มต้นที่ตั้งไว้

    currentSet = 0; // รีเซ็ตเซ็ตปัจจุบันเป็น 0
    totalSets = parseInt(totalSetsInput.value); // ดึงค่าจำนวนเซ็ตทั้งหมด
    if (isNaN(totalSets) || totalSets < 1) {
        totalSets = 1; // ค่าเริ่มต้น
        totalSetsInput.value = 1;
    }

    displayTotalSets.textContent = totalSets;
    currentSetDisplay.textContent = currentSet;
    updateTimerDisplay(); // อัปเดต UI ให้แสดงค่าเวลาเริ่มต้น
}


// --- Event Listeners ---

// ปฏิทิน
prevMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});

nextMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});

// Checkbox สำหรับการออกกำลังกาย (ยังคงอยู่เพื่อให้สามารถ toggle ได้จาก checkbox ด้วย)
workoutCompletedCheckbox.addEventListener('change', async (event) => {
    const isChecked = event.target.checked;
    const dateToUpdate = formatDateToYYYYMMDD(selectedDate);
    await updateWorkoutStatus(dateToUpdate, isChecked);
});


// Timer
startTimerBtn.addEventListener('click', startTimer);
pauseTimerBtn.addEventListener('click', pauseTimer);
resetTimerBtn.addEventListener('click', resetTimer);

// อัปเดต display ของ Total Sets เมื่อผู้ใช้เปลี่ยนค่าใน input
totalSetsInput.addEventListener('change', () => {
    totalSets = parseInt(totalSetsInput.value);
    if (isNaN(totalSets) || totalSets < 1) {
        totalSets = 1; // ค่าเริ่มต้น
        totalSetsInput.value = 1;
    }
    displayTotalSets.textContent = totalSets;
    // ถ้า Timer ไม่ได้กำลังทำงานและยังไม่เริ่มเซ็ตแรก ให้ปรับ currentSetDisplay ด้วย
    if (!isTimerRunning && currentSet === 0) {
        currentSetDisplay.textContent = 0;
    }
});

// อัปเดต defaultSetTime เมื่อผู้ใช้เปลี่ยนค่าใน input
setTimeInput.addEventListener('change', () => {
    defaultSetTime = parseInt(setTimeInput.value);
    if (isNaN(defaultSetTime) || defaultSetTime < 1) {
        defaultSetTime = 60; // ค่าเริ่มต้น
        setTimeInput.value = 60;
    }
    // ถ้า Timer ยังไม่เริ่ม หรือถูก reset ให้ตั้งค่าเวลาเริ่มต้นใหม่
    if (!isTimerRunning && currentSet === 0) {
        timeLeft = defaultSetTime;
        updateTimerDisplay();
    }
});


// --- การเริ่มต้น (Initialization) ---
document.addEventListener('DOMContentLoaded', async () => {
    // ตั้งค่าเริ่มต้น Timer display
    currentSetDisplay.textContent = currentSet;
    displayTotalSets.textContent = totalSets;
    timeLeft = defaultSetTime; // กำหนดเวลาเริ่มต้นตามค่า input
    updateTimerDisplay();

    // กำหนด selectedDate เริ่มต้นเป็นวันปัจจุบันเสมอ
    selectedDate = new Date();

    await fetchWorkouts(); // ดึงข้อมูลการออกกำลังกายครั้งแรก
    // renderCalendar() ถูกเรียกภายใน fetchWorkouts() อยู่แล้ว
});
