// ====== ส่วนของ Supabase Initialization ======
// นำมาจาก Supabase Dashboard ของคุณ
const SUPABASE_URL = "https://xoscoszdlzchwyisvxbp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhvc2Nvc3pkbHpjaHd5aXN2eGJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NDIwNzIsImV4cCI6MjA2NzExODA3Mn0.nZhld0bB8vmwvLzwhxhISuD6D-inHP7UVKhYzDfr6KY";

const supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// ==========================================================

// *** สำคัญ: ID ผู้ใช้สำหรับเก็บข้อมูลใน Supabase ***
// ในตอนนี้เราใช้ ID แบบตายตัว "user1"
// ถ้าต้องการหลายผู้ใช้ ต้องใช้ Supabase Authentication เพื่อได้ UID ของผู้ใช้จริง
const USER_ID = "user1";

// --- DOM Elements ---
const calendarGridEl = document.getElementById('calendar-grid');
const currentMonthYearEl = document.getElementById('currentMonthYear');
const totalWorkoutDaysEl = document.getElementById('totalWorkoutDays');
const prevMonthBtn = document.getElementById('prevMonthBtn');
const nextMonthBtn = document.getElementById('nextMonthBtn');

const setDurationInput = document.getElementById('setDuration');
const totalSetsInput = document.getElementById('totalSets');
const startButton = document.getElementById('startButton');
const pauseButton = document.getElementById('pauseButton');
const resetTimerButton = document.getElementById('resetTimerButton');
const currentTimeEl = document.getElementById('currentTime');
const currentSetEl = document.getElementById('currentSet');
const displayTotalSetsEl = document.getElementById('displayTotalSets');

const menuIcon = document.getElementById('menuIcon');
const mainMenu = document.getElementById('mainMenu');
const menuLinks = document.querySelectorAll('#mainMenu ul li a');

// --- Global Calendar State ---
let currentCalendarDate = new Date();
let currentVisibleSection = 'calendarSection'; // Track currently active section

// --- Global Timer State ---
let timerInterval;
let initialSetDuration;
let remainingTime;
let currentSetCount;
let totalSetsToComplete;
let timerActive = false;
let isPaused = false;


// =========================================================================
// ====== ฟังก์ชันที่เกี่ยวข้องกับ Supabase และข้อมูลปฏิทิน ======
// =========================================================================

// ฟังก์ชันสำหรับดึงข้อมูลวันที่ออกกำลังกายจาก Supabase
async function fetchWorkoutDays() {
    try {
        let { data, error } = await supabase
            .from('user_workouts')
            .select('workout_dates')
            .eq('user_id', USER_ID)
            .single();

        if (error && error.code === 'PGRST116') {
            // No row found, which is normal for a new user/first time
            console.log("No workout data found for this user in Supabase. Starting fresh.");
            return {};
        } else if (error) {
            throw error;
        }

        // Return the workout_dates (jsonb field), or an empty object if it's null
        return data.workout_dates || {};
    } catch (error) {
        console.error("Error fetching workout days from Supabase:", error.message);
        // Ensure to return an empty object on error so the app doesn't break
        return {};
    }
}

// ฟังก์ชันสำหรับบันทึกข้อมูลวันที่ออกกำลังกายไปยัง Supabase
async function saveWorkoutDays(data) {
    try {
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

// ฟังก์ชันสำหรับ Render ปฏิทิน
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

    // ดึงข้อมูลจาก Supabase ก่อน Render
    const workoutDaysFromSupabase = await fetchWorkoutDays();
    let totalCheckedDays = 0;
    const today = new Date();
    // Use toISOString for consistent date string without timezone issues for today
    const todayString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`; // Simplified for local matching

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
        cell.addEventListener('click', async function() {
            const date = this.dataset.date;
            let currentWorkoutDays = await fetchWorkoutDays(); // ดึงข้อมูลล่าสุด

            if (currentWorkoutDays[date]) {
                delete currentWorkoutDays[date]; // ยกเลิกติ๊กถูก
            } else {
                currentWorkoutDays[date] = true; // ติ๊กถูก
            }

            await saveWorkoutDays(currentWorkoutDays);
            renderCalendar(); // อัปเดตปฏิทินอีกครั้งเพื่อแสดงผลลัพธ์ใหม่
        });
    });
}

function changeMonth(delta) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + delta);
    renderCalendar();
}


// =========================================================================
// ====== ฟังก์ชันที่เกี่ยวข้องกับ Timer ======
// =========================================================================

function updateTimerDisplay() {
    currentTimeEl.textContent = remainingTime.toString().padStart(2, '0');
    currentSetEl.textContent = currentSetCount !== undefined && currentSetCount !== null ? currentSetCount : '0';
    displayTotalSetsEl.textContent = totalSetsToComplete !== undefined && totalSetsToComplete !== null ? totalSetsToComplete : '0';
}

function startTimer() {
    if (timerActive && !isPaused) return;

    if (!timerInterval) { // Only initialize if starting fresh or after full reset
        initialSetDuration = parseInt(setDurationInput.value);
        totalSetsToComplete = parseInt(totalSetsInput.value);

        if (isNaN(initialSetDuration) || initialSetDuration <= 0 ||
            isNaN(totalSetsToComplete) || totalSetsToComplete <= 0) {
            alert("กรุณากำหนดเวลาและจำนวนเซ็ตที่มากกว่า 0 ให้ถูกต้อง!");
            resetTimer();
            return;
        }

        if (currentSetCount === 0 || currentSetCount > totalSetsToComplete) { // Reset if sets completed or not started
            currentSetCount = 1;
        }

        if (!isPaused) { // If not paused, start with initial duration for new set
            remainingTime = initialSetDuration;
        }
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
            isPaused = false; // Ensure isPaused is false when set ends

            if (currentSetCount < totalSetsToComplete) {
                alert(`เซ็ตที่ ${currentSetCount} จบแล้ว! กำลังเริ่มเซ็ตถัดไป.`);
                currentSetCount++;
                remainingTime = initialSetDuration;
                updateTimerDisplay();
                // Automatically restart for the next set
                startTimer(); // Call startTimer again for the next set
            } else {
                alert("เยี่ยมมาก! คุณทำครบทุกเซ็ตแล้ว!");
                resetTimer(); // Reset fully after all sets
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

    initialSetDuration = parseInt(setDurationInput.value) || 60; // Default to 60 if empty/invalid
    totalSetsToComplete = parseInt(totalSetsInput.value) || 3;   // Default to 3 if empty/invalid

    remainingTime = initialSetDuration;
    currentSetCount = 0; // Reset set count to 0 when completely reset

    updateTimerDisplay();

    startButton.disabled = false;
    pauseButton.disabled = true;
    resetTimerButton.disabled = true;
    setDurationInput.disabled = false;
    totalSetsInput.disabled = false;
}


// =========================================================================
// ====== ส่วนควบคุมการแสดงผลส่วนต่างๆ (เมนูและ Section) ======
// =========================================================================

function toggleMenu() {
    if (mainMenu.classList.contains('active')) {
        mainMenu.classList.remove('active');
        // เพิ่ม setTimeout เพื่อให้ animation การหายไปทำงานก่อนที่จะซ่อน display
        setTimeout(() => {
            mainMenu.style.display = 'none';
        }, 300); // ต้องตรงกับ transition-duration ใน CSS
    } else {
        mainMenu.style.display = 'block';
        // เพิ่ม setTimeout เพื่อให้ display: block ทำงานก่อนที่จะเพิ่ม class 'active'
        setTimeout(() => {
            mainMenu.classList.add('active');
        }, 10);
    }
}

function showSection(sectionId) {
    // Hide current active section
    if (currentVisibleSection) {
        const currentSectionEl = document.getElementById(currentVisibleSection);
        if (currentSectionEl) { // Check if element exists before manipulating
            currentSectionEl.classList.remove('active');
            currentSectionEl.classList.add('hidden');
        }
    }

    // Show new section
    const newSectionEl = document.getElementById(sectionId);
    if (newSectionEl) { // Check if element exists before manipulating
        newSectionEl.classList.remove('hidden');
        newSectionEl.classList.add('active');
    }
    currentVisibleSection = sectionId;

    // Close menu if it's open
    if (mainMenu.classList.contains('active')) {
        toggleMenu();
    }

    // Perform specific actions based on the section
    if (sectionId === 'calendarSection') {
        renderCalendar(); // Re-render calendar when switching to it
    } else if (sectionId === 'timerSection') {
        resetTimer(); // Reset timer when switching to it
    }
}


// =========================================================================
// ====== Event Listeners ทั้งหมด ======
// =========================================================================

document.addEventListener('DOMContentLoaded', function() {
    // Initial display: show calendar section
    showSection('calendarSection'); // This will also call renderCalendar()

    // Add event listeners for calendar navigation buttons
    prevMonthBtn.addEventListener('click', () => changeMonth(-1));
    nextMonthBtn.addEventListener('click', () => changeMonth(1));

    // Add event listeners for timer controls
    startButton.addEventListener('click', startTimer);
    pauseButton.addEventListener('click', pauseTimer);
    resetTimerButton.addEventListener('click', resetTimer);

    // Reset timer when duration or total sets input changes
    setDurationInput.addEventListener('input', resetTimer);
    totalSetsInput.addEventListener('input', resetTimer);

    // Add event listener for menu icon (hamburger)
    menuIcon.addEventListener('click', toggleMenu);

    // Add event listeners for menu links to switch sections
    menuLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault(); // Prevent default link behavior
            const sectionId = this.dataset.section;
            if (sectionId) {
                showSection(sectionId);
            }
        });
    });
});
