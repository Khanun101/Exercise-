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
    let timerInterval;
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
        if (completedSets > 0 || (completedSets === targetSets && targetSets > 0)) {
            resetSetsBtn.disabled = false;
        } else {
            resetSetsBtn.disabled = true;
        }

        // หากทำครบเซ็ตเป้าหมายแล้ว ให้ตั้งค่า UI และปุ่มให้เหมาะสม
        if (completedSets >= targetSets && targetSets > 0) {
            timerDisplay.textContent = "DONE!";
            startTimerBtn.disabled = true; // ปิดปุ่มเริ่ม
            stopTimer(); // ตรวจสอบให้แน่ใจว่าหยุดแล้ว
        } else {
            // ถ้ายังไม่ครบ ให้เปิดปุ่มเริ่ม
            // startTimerBtn.disabled จะถูกจัดการเมื่อจับเวลาหยุดเองใน setInterval
            if (!timerInterval) { // ถ้า Timer ไม่ได้กำลังทำงานอยู่ ให้เปิดปุ่มเริ่ม
                 startTimerBtn.disabled = false;
            }
        }
    }

    function startTimer() {
        requestNotificationPermission();

        // ถ้าเวลาหมดแล้ว หรือทำครบเซ็ตแล้ว ให้ตั้งค่าเวลาเริ่มต้นใหม่
        if (remainingTime <= 0 || timerDisplay.textContent === "DONE!") {
            remainingTime = initialTimerDuration;
        }
        
        if (timerInterval) clearInterval(timerInterval); // เคลียร์ interval เก่าถ้ามี

        // Disable ปุ่ม Start และ Enable ปุ่ม Stop/Reset
        startTimerBtn.disabled = true;
        stopTimerBtn.disabled = false;
        resetTimerBtn.disabled = false;

        timerInterval = setInterval(() => {
            if (remainingTime > 0) {
                remainingTime--;
                updateTimerDisplay();
            } else { // เวลาของเซ็ตปัจจุบันหมดแล้ว!
                clearInterval(timerInterval); // หยุดจับเวลา
                timerSound.play(); // เล่นเสียงเมื่อเวลาหมด

                // เพิ่มจำนวนเซ็ตที่ทำได้ หากยังไม่ครบเป้าหมาย
                if (completedSets < targetSets) {
                    completedSets++;
                    saveTimerState();
                    showTimerNotification(`Set ${completedSets} completed!`); // แจ้งเตือนเมื่อแต่ละเซ็ตเสร็จสิ้น
                }
                
                // อัปเดตการแสดงผลเซ็ตก่อน
                updateSetDisplay(); 

                // ตรวจสอบว่าครบเซ็ตเป้าหมายแล้วหรือไม่
                if (completedSets >= targetSets && targetSets > 0) {
                    // ถ้าครบแล้ว ให้แสดง "DONE!" และปิดปุ่มเริ่ม
                    // timerDisplay.textContent = "DONE!" และ startTimerBtn.disabled = true; ถูกจัดการใน updateSetDisplay แล้ว
                    showTimerNotification(`Congratulations! All ${targetSets} sets completed!`); // แจ้งเตือนเมื่อครบทุกเซ็ต
                } else {
                    // ถ้ายังไม่ครบ ให้รีเซ็ตเวลาสำหรับเซ็ตถัดไปอัตโนมัติ
                    remainingTime = initialTimerDuration;
                    updateTimerDisplay(); // อัปเดต display ให้เป็นเวลาเริ่มต้นของเซ็ตถัดไป
                    startTimerBtn.disabled = false; // เปิดปุ่มเริ่มสำหรับเซ็ตถัดไป
                }

                stopTimerBtn.disabled = true; // ปุ่มหยุดควรถูกปิดใช้งานเมื่อจับเวลาสิ้นสุดรอบ
                resetTimerBtn.disabled = false; // ปุ่มรีเซ็ตเวลายังคงใช้งานได้
            }
        }, 1000); // ทุก 1 วินาที
    }

    function stopTimer() {
        clearInterval(timerInterval);
        startTimerBtn.disabled = false;
        stopTimerBtn.disabled = true;
        resetTimerBtn.disabled = false;
    }

    function resetTimer() {
        stopTimer();
        remainingTime = initialTimerDuration;
        updateTimerDisplay();
        startTimerBtn.disabled = false;
        stopTimerBtn.disabled = true;
        resetTimerBtn.disabled = false;
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

        // ตั้งเวลาที่เหลือให้เป็นค่าเริ่มต้นของเซ็ตปัจจุบัน หรือเป็น 0 ถ้าครบแล้ว เพื่อให้ updateTimerDisplay แสดงผลถูกต้อง
        if (completedSets >= targetSets && targetSets > 0) {
            remainingTime = 0; // เพื่อให้ updateSetDisplay ตั้งค่าเป็น "DONE!" ได้
        } else {
            remainingTime = initialTimerDuration;
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
            // ถ้าเปลี่ยนเป้าหมายแล้วทำให้ครบเป้าหมายพอดี ให้จัดการสถานะ "DONE!"
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
