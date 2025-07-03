document.addEventListener('DOMContentLoaded', () => {
    // --- Calendar Elements ---
    const calendarGrid = document.getElementById('calendarGrid');
    const currentMonthYearHeader = document.getElementById('currentMonthYear');
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');
    const currentMonthWorkoutDaysSpan = document.getElementById('currentMonthWorkoutDays');
    const totalCumulativeWorkoutDaysSpan = document.getElementById('totalCumulativeWorkoutDays');
    const resetAllButton = document.getElementById('resetAllButton');

    // --- Timer Elements ---
    const timerDurationInput = document.getElementById('timerDurationInput');
    const targetSetsInput = document.getElementById('targetSetsInput');
    const timerDisplay = document.getElementById('timerDisplay');
    const currentSetsCountSpan = document.getElementById('currentSetsCount');
    const displayTargetSetsSpan = document.getElementById('displayTargetSets');
    const startTimerBtn = document.getElementById('startTimerBtn');
    const stopTimerBtn = document.getElementById('stopTimerBtn');
    const resetTimerBtn = document.getElementById('resetTimerBtn');
    const resetSetsBtn = document.getElementById('resetSetsBtn');
    const timerSound = document.getElementById('timerSound'); // Audio element for sound

    // --- Calendar State ---
    let allWorkoutDates = new Set();
    let currentDate = new Date();
    let currentYear = currentDate.getFullYear();
    let currentMonth = currentDate.getMonth();
    const today = new Date();
    const todayFormatted = formatDate(today);

    const monthNames = [
        "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
        "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];

    // --- Timer State ---
    let timerInterval = null; // Initialize as null
    let remainingTime = 0;
    let initialTimerDuration = 60;
    let completedSets = 0;
    let targetSets = 3;

    // --- Notification State ---
    let notificationPermissionRequested = false; 

    // --- Helper Functions ---
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        const formattedMinutes = String(minutes).padStart(2, '0');
        const formattedSeconds = String(remainingSeconds).padStart(2, '0');
        return `${formattedMinutes}:${formattedSeconds}`;
    }

    // --- Calendar Rendering ---
    function renderCalendar() {
        calendarGrid.innerHTML = '';
        currentMonthYearHeader.textContent = `${monthNames[currentMonth]} ${currentYear}`;

        const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const startDayIndex = firstDayOfMonth.getDay();

        for (let i = 0; i < startDayIndex; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.classList.add('calendar-day', 'other-month');
            calendarGrid.appendChild(emptyDay);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.classList.add('calendar-day');
            dayElement.textContent = day;

            const fullDate = new Date(currentYear, currentMonth, day);
            const formattedDate = formatDate(fullDate);
            dayElement.dataset.date = formattedDate;

            if (formattedDate === todayFormatted) {
                dayElement.classList.add('current-day');
            }

            if (allWorkoutDates.has(formattedDate)) {
                dayElement.classList.add('is-workout');
            }

            dayElement.addEventListener('click', () => {
                dayElement.classList.toggle('is-workout');
                if (dayElement.classList.contains('is-workout')) {
                    allWorkoutDates.add(formattedDate);
                } else {
                    allWorkoutDates.delete(formattedDate);
                }
                saveWorkoutDates();
                updateWorkoutCounts();
            });

            calendarGrid.appendChild(dayElement);
        }

        const totalDaysInGrid = startDayIndex + daysInMonth;
        const remainingCells = 42 - totalDaysInGrid;
        for (let i = 0; i < remainingCells && i < 7; i++) {
             const emptyDay = document.createElement('div');
             emptyDay.classList.add('calendar-day', 'other-month');
             calendarGrid.appendChild(emptyDay);
        }

        updateWorkoutCounts();
    }

    // --- Local Storage Management for Calendar ---
    function saveWorkoutDates() {
        localStorage.setItem('workoutCalendarDates', JSON.stringify(Array.from(allWorkoutDates)));
    }

    function loadWorkoutDates() {
        const savedDates = localStorage.getItem('workoutCalendarDates');
        if (savedDates) {
            allWorkoutDates = new Set(JSON.parse(savedDates));
        }
    }

    // --- Update Display Counts (Calendar) ---
    function updateWorkoutCounts() {
        let currentMonthCount = 0;
        const startOfMonth = new Date(currentYear, currentMonth, 1);
        const endOfMonth = new Date(currentYear, currentMonth + 1, 0);

        allWorkoutDates.forEach(dateStr => {
            const date = new Date(dateStr);
            date.setHours(0,0,0,0);
            startOfMonth.setHours(0,0,0,0);
            endOfMonth.setHours(0,0,0,0);

            if (date >= startOfMonth && date <= endOfMonth) {
                currentMonthCount++;
            }
        });

        const totalCumulativeCount = allWorkoutDates.size;

        currentMonthWorkoutDaysSpan.classList.add('count-pulse');
        currentMonthWorkoutDaysSpan.textContent = currentMonthCount;
        currentMonthWorkoutDaysSpan.addEventListener('animationend', () => {
            currentMonthWorkoutDaysSpan.classList.remove('count-pulse');
        }, { once: true });

        totalCumulativeWorkoutDaysSpan.classList.add('count-pulse');
        totalCumulativeWorkoutDaysSpan.textContent = totalCumulativeCount;
        totalCumulativeWorkoutDaysSpan.addEventListener('animationend', () => {
            totalCumulativeWorkoutDaysSpan.classList.remove('count-pulse');
        }, { once: true });
    }

    // --- Notification Logic ---
    function requestNotificationPermission() {
        if (!("Notification" in window)) {
            console.warn("This browser does not support desktop notification.");
            return;
        }

        if (Notification.permission === "default" && !notificationPermissionRequested) {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    console.log("Notification permission granted!");
                } else {
                    console.warn("Notification permission denied.");
                }
                notificationPermissionRequested = true;
            });
        }
    }

    function showTimerNotification(message) {
        if (Notification.permission === "granted") {
            new Notification("Workout Timer", {
                body: message,
                icon: 'https://cdn-icons-png.flaticon.com/512/1146/1146816.png'
            });
        } else {
            console.log("Cannot show notification: permission not granted.");
        }
    }

    // --- Timer Functions ---
    function updateTimerDisplay() {
        timerDisplay.textContent = formatTime(remainingTime);
    }

    function updateSetDisplay() {
        currentSetsCountSpan.textContent = completedSets;
        displayTargetSetsSpan.textContent = targetSets;

        // เปิด/ปิดปุ่มรีเซ็ตเซ็ต
        resetSetsBtn.disabled = (completedSets === 0);

        // จัดการสถานะปุ่ม Start/Stop และข้อความแสดงผล
        if (completedSets >= targetSets && targetSets > 0) {
            timerDisplay.textContent = "DONE!";
            startTimerBtn.disabled = true;
            stopTimerBtn.disabled = true; // เมื่อทำครบแล้ว ปุ่มหยุดไม่ควรใช้งาน
        } else {
            // ถ้ายังไม่ครบ และ Timer ไม่ได้กำลังทำงานอยู่ (เช่น เพิ่งโหลดหน้า, หรือเซ็ตก่อนหน้าเพิ่งจบ)
            if (!timerInterval) { // timerInterval เป็น null เมื่อไม่มีการจับเวลาทำงาน
                startTimerBtn.disabled = false;
            }
            stopTimerBtn.disabled = true; // ปุ่มหยุดควรถูกปิดใช้งานเมื่อไม่มี Timer ทำงานอยู่
        }
    }

    function startTimer() {
        requestNotificationPermission();

        // Ensure remainingTime is valid before starting
        if (remainingTime <= 0 || timerDisplay.textContent === "DONE!") {
            remainingTime = initialTimerDuration;
        }
        // Make sure initialTimerDuration is always positive
        if (initialTimerDuration <= 0) {
            initialTimerDuration = 1; // Default to 1 second if invalid
            timerDurationInput.value = initialTimerDuration;
        }
        
        if (timerInterval) clearInterval(timerInterval); // Clear old interval if exists
        timerInterval = null; // Ensure it's null before setting a new one

        startTimerBtn.disabled = true;
        stopTimerBtn.disabled = false;
        resetTimerBtn.disabled = false;

        updateTimerDisplay(); // Update display immediately when starting

        timerInterval = setInterval(() => {
            if (remainingTime > 0) {
                remainingTime--;
                updateTimerDisplay();
            } else { // Timer has reached 00:00 for the current set
                console.log("Timer reached 0. Processing set completion."); // DEBUG LOG
                clearInterval(timerInterval); // Stop the current interval
                timerInterval = null; // Mark interval as stopped
                timerSound.play(); // Play sound

                // Increment completed sets if not already at target
                if (completedSets < targetSets) {
                    completedSets++; // นับ 1 เซ็ต
                    saveTimerState();
                    showTimerNotification(`Set ${completedSets} completed!`);
                }
                
                updateSetDisplay(); // Update the UI for sets count and button states

                // Check if all target sets are completed
                if (completedSets >= targetSets && targetSets > 0) {
                    // All sets done, UI already updated by updateSetDisplay()
                    // Buttons handled by updateSetDisplay()
                } else {
                    // Not all sets done, reset time for the next set
                    remainingTime = initialTimerDuration;
                    updateTimerDisplay(); // Show the reset time
                    startTimerBtn.disabled = false; // Enable start button for next set
                }
                stopTimerBtn.disabled = true; // Stop button should be disabled when timer is not running
            }
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
        timerInterval = null; // Set to null to indicate no active interval
        startTimerBtn.disabled = false;
        stopTimerBtn.disabled = true;
        resetTimerBtn.disabled = false;
    }

    function resetTimer() {
        stopTimer(); // This will also handle button states
        remainingTime = initialTimerDuration;
        updateTimerDisplay();
        // Buttons handled by stopTimer() and updateSetDisplay()
    }

    function resetSets() {
        if (confirm('คุณแน่ใจหรือไม่ที่จะรีเซ็ตจำนวนเซ็ตที่ทำไปแล้ว?')) {
            completedSets = 0;
            resetTimer(); // รีเซ็ตเวลาด้วย
            saveTimerState();
            updateSetDisplay(); // อัปเดต UI ให้แสดง 0 เซ็ต
        }
    }

    // --- Local Storage Management for Timer ---
    function saveTimerState() {
        const timerState = {
            initialDuration: initialTimerDuration,
            targetSets: targetSets,
            completedSets: completedSets
        };
        localStorage.setItem('workoutTimerState', JSON.stringify(timerState));
    }

    function loadTimerState() {
        const savedState = localStorage.getItem('workoutTimerState');
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            initialTimerDuration = parsedState.initialDuration || 60;
            targetSets = parsedState.targetSets || 3;
            completedSets = parsedState.completedSets || 0;
        }

        timerDurationInput.value = initialTimerDuration;
        targetSetsInput.value = targetSets;

        // กำหนด remainingTime ให้ถูกต้องตามสถานะ completedSets
        if (completedSets >= targetSets && targetSets > 0) {
            remainingTime = 0; // ถ้าทำครบแล้ว ให้เวลาเป็น 0 เพื่อแสดง DONE!
        } else {
            remainingTime = initialTimerDuration; // ถ้ายังไม่ครบ ให้เป็นเวลาเริ่มต้นของเซ็ต
        }
        
        updateTimerDisplay();
        updateSetDisplay(); // ต้องเรียกเพื่อตั้งค่าปุ่ม disabled และข้อความ "DONE!" ให้ถูกต้องตั้งแต่โหลด
    }

    // --- Event Listeners ---
    prevMonthBtn.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar();
    });

    timerDurationInput.addEventListener('change', () => {
        const newDuration = parseInt(timerDurationInput.value);
        if (newDuration > 0) {
            initialTimerDuration = newDuration;
            // ถ้า Timer ไม่ได้กำลังทำงาน หรือเวลาหมด ให้รีเซ็ตเวลาที่แสดงผลทันที
            if (!timerInterval || remainingTime <= 0 || timerDisplay.textContent === "DONE!") {
                remainingTime = initialTimerDuration;
                updateTimerDisplay();
            }
            saveTimerState();
        } else {
            timerDurationInput.value = initialTimerDuration;
        }
    });

    targetSetsInput.addEventListener('change', () => {
        const newTargetSets = parseInt(targetSetsInput.value);
        if (newTargetSets > 0) {
            targetSets = newTargetSets;
            // ถ้าเซ็ตที่ทำไปแล้วเกินเป้าหมายใหม่ ให้ปรับให้เท่ากับเป้าหมาย
            if (completedSets > targetSets) {
                completedSets = targetSets;
            }
            saveTimerState();
            updateSetDisplay();
            // ตรวจสอบสถานะปุ่มหลังจากเปลี่ยนเป้าหมาย
            if (completedSets >= targetSets && targetSets > 0) {
                stopTimer(); // ตรวจสอบให้แน่ใจว่าหยุด
                timerDisplay.textContent = "DONE!";
                startTimerBtn.disabled = true;
            } else if (!timerInterval) { // ถ้าไม่ได้อยู่ในสถานะ DONE และไม่ได้จับเวลาอยู่
                startTimerBtn.disabled = false; // เปิดปุ่มเริ่ม
            }
        } else {
            targetSetsInput.value = targetSets;
        }
    });

    startTimerBtn.addEventListener('click', startTimer);
    stopTimerBtn.addEventListener('click', stopTimer);
    resetTimerBtn.addEventListener('click', resetTimer);
    resetSetsBtn.addEventListener('click', resetSets);

    resetAllButton.addEventListener('click', () => {
        if (confirm('คุณแน่ใจหรือไม่ที่จะรีเซ็ตข้อมูลทั้งหมด? ทั้งปฏิทินและตัวจับเวลาจะถูกรีเซ็ตและหายไปอย่างถาวร')) {
            localStorage.removeItem('workoutCalendarDates');
            allWorkoutDates.clear();
            renderCalendar();

            localStorage.removeItem('workoutTimerState');
            initialTimerDuration = 60;
            targetSets = 3;
            completedSets = 0;
            resetTimer(); // รีเซ็ตเวลา
            updateSetDisplay(); // อัปเดตเซ็ตและปุ่ม
        }
    });

    // --- Initialization ---
    loadWorkoutDates();
    renderCalendar();

    loadTimerState();
});
