// ====== ส่วนของ Supabase Initialization ======
// ไม่ต้องใช้ import statements ที่ด้านบนสุดแล้ว เพราะใช้ CDN ใน index.html
// const { createClient } = supabase; // นี่คือวิธีดึง client ถ้าใช้ CDN

// Your Supabase configuration (นำมาจาก Supabase Dashboard ของคุณ)
const SUPABASE_URL = "https://xoscoszdlzchwyisvxbp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhvc2Nvc3pkbHpjaHd5aXN2eGJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NDIwNzIsImV4cCI6MjA2NzExODA3Mn0.nZhld0bB8vmwvLzwhxhISuD6D-inHP7UVKhYzDfr6KY";

const supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// ==========================================================

// --- ส่วนควบคุมการแสดงผลส่วนต่างๆ (เมนูและ Section) ---
let currentVisibleSection = 'calendarSection';

function toggleMenu() {
    const menu = document.getElementById('mainMenu');
    if (menu.classList.contains('active')) {
        menu.classList.remove('active');
        // เพิ่ม setTimeout เพื่อให้ animation การหายไปทำงานก่อนที่จะซ่อน display
        setTimeout(() => {
            menu.style.display = 'none';
        }, 300); // ต้องตรงกับ transition-duration ใน CSS
    } else {
        menu.style.display = 'block';
        // เพิ่ม setTimeout เพื่อให้ display: block ทำงานก่อนที่จะเพิ่ม class 'active'
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
        toggleMenu(); // ปิดเมนูหลังจากเลือก Section
    }

    if (sectionId === 'calendarSection') {
        renderCalendar(); // เรียก renderCalendar เพื่อแสดงปฏิทินเมื่อเปลี่ยน Section
    } else if (sectionId === 'timerSection') {
        resetTimer(); // รีเซ็ต Timer เมื่อเข้าสู่หน้า Timer
    }
}

// --- ส่วนปฏิทิน ---
const calendarGridEl = document.getElementById('calendar-grid');
const currentMonthYearEl = document.getElementById('currentMonthYear');
const totalWorkoutDaysEl = document.getElementById('totalWorkoutDays');

let currentCalendarDate = new Date();

// *** สำคัญ: ID ผู้ใช้สำหรับเก็บข้อมูลใน Supabase ***
// ในตอนนี้เราใช้ ID แบบตายตัว "user1"
// ถ้าต้องการหลายผู้ใช้ ต้องใช้ Supabase Authentication เพื่อได้ UID ของผู้ใช้จริง
const USER_ID = "user1";

// ฟังก์ชันสำหรับดึงข้อมูลวันที่ออกกำลังกายจาก Supabase
async function fetchWorkoutDays() {
    try {
        // ดึงข้อมูลจากตาราง 'user_workouts' ที่มี 'user_id' ตรงกับ USER_ID
        // เลือกคอลัมน์ 'workout_dates'
        let { data, error } = await supabase
            .from('user_workouts')
            .select('workout_dates')
            .eq('user_id', USER_ID) // กรองข้อมูลตาม user_id
            .single(); // คาดหวังว่าจะมีแค่ 1 row สำหรับ user นี้

        // Supabase จะคืน error.code 'PGRST116' ถ้าไม่พบ row (ซึ่งปกติสำหรับ user ใหม่)
        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        if (data) {
            // ถ้ามีข้อมูล ให้คืนค่าในฟิลด์ 'workout_dates' (ซึ่งเป็น jsonb)
            return data.workout_dates || {};
        } else {
            console.log("No workout data found for this user in Supabase. Starting fresh.");
            return {}; // ไม่มีข้อมูล ให้คืนค่าเป็น Object ว่างเปล่า
        }
    } catch (error) {
        console.error("Error fetching workout days from Supabase:", error.message);
        return {}; // คืนค่าว่างเปล่าหากเกิดข้อผิดพลาด
    }
}

// ฟังก์ชันสำหรับบันทึกข้อมูลวันที่ออกกำลังกายไปยัง Supabase
async function saveWorkoutDays(data) {
    try {
        // ใช้ upsert เพื่ออัปเดตถ้ามี user_id นี้อยู่แล้ว หรือ insert ถ้ายังไม่มี
        // { onConflict: 'user_id' } บอกว่าถ้ามี user_id นี้อยู่แล้ว ให้อัปเดต row นั้น
        const { error } = await supabase
            .from('user_workouts')
            .upsert({ user_id: USER_ID, workout_dates: data }, { onConflict: 'user_id' });

        if (error) {
            throw error;
        }
        console.log("Workout days saved to Supabase successfully!");
    } catch (error) {
        console.error("Error saving workout days to Supabase:", error.message);
    }
}

async function renderCalendar() {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    const monthNames = [
        "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
        "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];
    currentMonthYearEl.textContent = `${monthNames[month]} ${year}`;

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.

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

    // *** ดึงข้อมูลจาก Supabase ก่อน Render ***
    const workoutDaysFromSupabase = await fetchWorkoutDays();
    let totalCheckedDays = 0;
    const today = new Date();
    const todayString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

    for (let i = 1; i <= lastDayOfMonth; i++) {
        const dateString = `${year}-${month + 1}-${i}`;
        let classes = 'day-cell';

        if (dateString === todayString) {
            classes += ' today';
        }

        // ตรวจสอบกับข้อมูลที่ดึงมาจาก Supabase
        if (workoutDaysFromSupabase[dateString]) {
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
        cell.addEventListener('click', async function() { // เปลี่ยนเป็น async function
            const date = this.dataset.date;
            // ดึงข้อมูลปัจจุบันจาก Supabase ก่อนแก้ไข
            let currentWorkoutDays = await fetchWorkoutDays();

            if (currentWorkoutDays[date]) {
                delete currentWorkoutDays[date]; // ยกเลิกติ๊กถูก
            } else {
                currentWorkoutDays[date] = true; // ติ๊กถูก
            }

            // บันทึกข้อมูลที่แก้ไขแล้วกลับไปยัง Supabase
            await saveWorkoutDays(currentWorkoutDays);
            renderCalendar(); // อัปเดตปฏิทินอีกครั้งเพื่อแสดงผลลัพธ์
        });
    });
}

function changeMonth(delta) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + delta);
    renderCalendar();
}

// --- ส่วนตัวจับเวลา (ยังคงเหมือนเดิม) ---
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
    if (!currentTimeEl || !currentSetEl || !displayTotalSetsEl) {
        console.error("Error: Timer display elements not found in HTML!");
        return;
    }

    currentTimeEl.textContent = remainingTime.toString().padStart(2, '0');
    currentSetEl.textContent = currentSetCount !== undefined && currentSetCount !== null ? currentSetCount : '';
    displayTotalSetsEl.textContent = totalSetsToComplete !== undefined && totalSetsToComplete !== null ? totalSetsToComplete : '';
}

function startTimer() {
    if (timerActive && !isPaused) return;

    if (currentSetCount === 0 || initialSetDuration === undefined || totalSetsToComplete === undefined) {
        initialSetDuration = parseInt(setDurationInput.value);
        totalSetsToComplete = parseInt(totalSetsInput.value);

        if (isNaN(initialSetDuration) || initialSetDuration <= 0 ||
            isNaN(totalSetsToComplete) || totalSetsToComplete <= 0) {
            alert("กรุณากำหนดเวลาและจำนวนเซ็ตที่มากกว่า 0 ให้ถูกต้อง!");
            resetTimer();
            return;
        }
        currentSetCount = 1;
        remainingTime = initialSetDuration;
        updateTimerDisplay();
    }

    timerActive = true;
    isPaused = false;

    startButton.disabled = true;
    pauseButton.disabled = false;
    resetTimerButton.disabled = false;
    setDurationInput.disabled = true;
    totalSetsInput.disabled = true;

    timerInterval = setInterval(() => {
        remainingTime--;
        updateTimerDisplay();

        if (remainingTime <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            timerActive = false;

            alert(`เซ็ตที่ ${currentSetCount} จบแล้ว!`);

            if (currentSetCount < totalSetsToComplete) {
                currentSetCount++;
                remainingTime = initialSetDuration;
                updateTimerDisplay();

                startButton.disabled = false;
                pauseButton.disabled = true;
                resetTimerButton.disabled = false;

            } else {
                alert("เยี่ยมมาก! คุณทำครบทุกเซ็ตแล้ว!");
                resetTimerButton.disabled = false;
                startButton.disabled = true;
                pauseButton.disabled = true;
                remainingTime = 0;
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

    remainingTime = initialSetDuration;
    currentSetCount = 0;

    updateTimerDisplay();

    startButton.disabled = false;
    pauseButton.disabled = true;
    resetTimerButton.disabled = true;
    setDurationInput.disabled = false;
    totalSetsInput.disabled = false;
}

// ====== เพิ่ม Event Listeners ที่นี่ ======
// --- Event Listeners สำหรับปุ่ม Timer ---
startButton.addEventListener('click', startTimer);
pauseButton.addEventListener('click', pauseTimer);
resetTimerButton.addEventListener('click', resetTimer);

setDurationInput.addEventListener('input', resetTimer);
totalSetsInput.addEventListener('input', resetTimer);

// --- Event Listeners สำหรับปุ่มปฏิทิน (ปุ่ม "ก่อนหน้า" และ "ถัดไป") ---
document.getElementById('prevMonthBtn').addEventListener('click', () => changeMonth(-1));
document.getElementById('nextMonthBtn').addEventListener('click', () => changeMonth(1));

// --- Event Listeners สำหรับเมนูด้านบน (Hamburger icon และลิงก์ในเมนู) ---
document.getElementById('menuIcon').addEventListener('click', toggleMenu);

document.querySelectorAll('#mainMenu ul li a').forEach(item => {
    item.addEventListener('click', function(event) {
        event.preventDefault(); // ป้องกันการเลื่อนขึ้นไปข้างบนเมื่อคลิกลิงก์
        const sectionId = this.dataset.section;
        if (sectionId) {
            showSection(sectionId);
        }
    });
});

document.addEventListener('DOMContentLoaded', function() {
    showSection('calendarSection');
    // renderCalendar() จะถูกเรียกใน showSection('calendarSection') อยู่แล้ว
});
