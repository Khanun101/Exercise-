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
    let allWorkoutDates = new Set(); // เก็บวันที่ออกกำลังกายทั้งหมดในรูปแบบYYYY-MM-DD
    let currentDate = new Date(); // วันที่ปัจจุบันที่ใช้ในการแสดงผลปฏิทิน (จะเปลี่ยนเมื่อกดปุ่มเปลี่ยนเดือน)
    let currentYear = currentDate.getFullYear();
    let currentMonth = currentDate.getMonth(); // 0-11 สำหรับ ม.ค.-ธ.ค.
    const today = new Date(); // วันที่แท้จริงของวันนี้
    const todayFormatted = formatDate(today); // วันที่ปัจจุบันในรูปแบบYYYY-MM-DD

    const monthNames = [
        "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
        "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];

    // --- Timer State ---
    let timerInterval; // ตัวแปรสำหรับเก็บ setInterval ID
    let remainingTime = 0; // เวลาที่เหลือในหน่วยวินาที
    let initialTimerDuration = 60; // เวลาเริ่มต้นสำหรับแต่ละเซ็ต (วินาที)
    let completedSets = 0; // จำนวนเซ็ตที่ทำได้
    let targetSets = 3; // จำนวนเซ็ตเป้าหมาย

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

        if (completedSets > 0 || (completedSets === targetSets && targetSets > 0)) {
            resetSetsBtn.disabled = false;
        } else {
            resetSetsBtn.disabled = true;
        }

        if (completedSets >= targetSets && targetSets > 0) {
            stopTimer();
            startTimerBtn.disabled = true;
            timerDisplay.textContent = "DONE!";
            // แจ้งเตือนเมื่อครบทุกเซ็ต จะถูกเรียกใน startTimer() เมื่อเซ็ตสุดท้ายเสร็จ
        } else {
            startTimerBtn.disabled = false;
        }
    }

    function startTimer() {
        requestNotificationPermission();

        // ถ้าเวลาหมด หรือเพิ่งเริ่มต้น ให้รีเซ็ตเวลาสำหรับเซ็ตใหม่
        if (remainingTime <= 0 || timerDisplay.textContent === "DONE!") { // เพิ่มเงื่อนไข DONE!
            remainingTime = initialTimerDuration;
        }
        
        if (timerInterval) clearInterval(timerInterval);

        startTimerBtn.disabled = true;
        stopTimerBtn.disabled = false;
        resetTimerBtn.disabled = false;

        timerInterval = setInterval(() => {
            if (remainingTime > 0) {
                remainingTime--;
                updateTimerDisplay();
            } else { // เวลาของเซ็ตปัจจุบันหมดแล้ว!
                clearInterval(timerInterval);
                timerSound.play();

                if (completedSets < targetSets) {
                    completedSets++; // นับ 1 เซ็ต
                    saveTimerState();
                    showTimerNotification(`Set ${completedSets} completed!`); // แจ้งเตือนเมื่อแต่ละเซ็ตเสร็จสิ้น

                    // ตรวจสอบว่าครบเซ็ตเป้าหมายแล้วหรือไม่
                    if (completedSets >= targetSets) {
                        // ถ้าครบแล้ว ไม่ต้องรีเซ็ตเวลาอัตโนมัติ
                        timerDisplay.textContent = "DONE!";
                        showTimerNotification(`Congratulations! All ${targetSets} sets completed!`); // แจ้งเตือนเมื่อครบทุกเซ็ต
                        stopTimer(); // หยุดเวลา
                        startTimerBtn.disabled = true; // ปิดปุ่มเริ่ม
                    } else {
                        // ถ้ายังไม่ครบ ให้รีเซ็ตเวลาสำหรับเซ็ตถัดไปอัตโนมัติ
                        remainingTime = initialTimerDuration;
                        updateTimerDisplay();
                        startTimerBtn.disabled = false; // เปิดปุ่มเริ่มสำหรับเซ็ตถัดไป
                    }
                }
                updateSetDisplay(); // อัปเดตการแสดงผลเซ็ต

                stopTimerBtn.disabled = true; // หยุดแล้ว ให้ปุ่มหยุด disabled
                resetTimerBtn.disabled = false; // สามารถรีเซ็ตเวลาได้
            }
        }, 1000);
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
            updateSetDisplay();
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

        // ตั้งเวลาที่เหลือให้เป็นค่าเริ่มต้นของเซ็ตปัจจุบัน หรือเป็น 0 ถ้าครบแล้ว
        if (completedSets >= targetSets && targetSets > 0) {
            remainingTime = 0; // แสดง DONE!
        } else {
            remainingTime = initialTimerDuration;
        }
        
        updateTimerDisplay();
        updateSetDisplay();
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
            // ถ้า Timer ไม่ได้กำลังทำงาน หรือเวลาหมด ให้รีเซ็ตเวลาที่แสดงผล
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
            if (completedSets > targetSets) {
                completedSets = targetSets;
            }
            saveTimerState();
            updateSetDisplay();
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
            resetTimer();
            updateSetDisplay();
        }
    });

    // --- Initialization ---
    loadWorkoutDates();
    renderCalendar();

    loadTimerState();
});
