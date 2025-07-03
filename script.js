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
    // ตัวแปรเพื่อติดตามว่าเคยพยายามขออนุญาตแจ้งเตือนไปแล้วหรือไม่
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
        calendarGrid.innerHTML = ''; // ล้าง grid เดิม
        currentMonthYearHeader.textContent = `${monthNames[currentMonth]} ${currentYear}`;

        const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        // firstDayOfMonth.getDay() ให้ 0=อาทิตย์, 1=จันทร์...
        const startDayIndex = firstDayOfMonth.getDay(); // วันแรกของเดือนคือวันอะไรในสัปดาห์ (0=อาทิตย์, 6=เสาร์)

        // เพิ่มวันจากเดือนก่อนหน้า (placeholder)
        // เพื่อให้วันแรกของเดือนเริ่มต้นถูกตำแหน่งที่ถูกต้องใน grid
        for (let i = 0; i < startDayIndex; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.classList.add('calendar-day', 'other-month');
            calendarGrid.appendChild(emptyDay);
        }

        // เพิ่มวันในเดือนปัจจุบัน
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.classList.add('calendar-day');
            dayElement.textContent = day;

            const fullDate = new Date(currentYear, currentMonth, day);
            const formattedDate = formatDate(fullDate);
            dayElement.dataset.date = formattedDate; // เก็บวันที่เต็มรูปแบบใน dataset

            // ตรวจสอบว่าวันนี้คือวันปัจจุบันหรือไม่
            if (formattedDate === todayFormatted) {
                dayElement.classList.add('current-day');
            }

            // ตรวจสอบว่าวันนี้เคยออกกำลังกายหรือไม่
            if (allWorkoutDates.has(formattedDate)) {
                dayElement.classList.add('is-workout');
            }

            // เพิ่ม Event Listener สำหรับการคลิก
            dayElement.addEventListener('click', () => {
                dayElement.classList.toggle('is-workout');
                if (dayElement.classList.contains('is-workout')) {
                    allWorkoutDates.add(formattedDate); // เพิ่มวันที่จริงลงใน Set
                } else {
                    allWorkoutDates.delete(formattedDate); // ลบวันที่จริงออกจาก Set
                }
                saveWorkoutDates();
                updateWorkoutCounts();
            });

            calendarGrid.appendChild(dayElement);
        }

        // เพิ่มวันจากเดือนถัดไป (placeholder) เพื่อให้ grid เต็ม
        const totalDaysInGrid = startDayIndex + daysInMonth;
        const remainingCells = 42 - totalDaysInGrid; // 42 cells = 6 rows * 7 days (typical max for calendar)
        for (let i = 0; i < remainingCells && i < 7; i++) { // เพิ่มไม่เกิน 7 วันถัดไป (สำหรับกรณีที่เดือนสั้นและเริ่มกลางสัปดาห์)
             const emptyDay = document.createElement('div');
             emptyDay.classList.add('calendar-day', 'other-month');
             calendarGrid.appendChild(emptyDay);
        }

        updateWorkoutCounts(); // อัปเดตตัวนับหลังจาก render ปฏิทิน
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
        // 1. นับจำนวนวันของเดือนปัจจุบันที่แสดงผล
        let currentMonthCount = 0;
        const startOfMonth = new Date(currentYear, currentMonth, 1);
        const endOfMonth = new Date(currentYear, currentMonth + 1, 0);

        allWorkoutDates.forEach(dateStr => {
            const date = new Date(dateStr);
            // เพื่อให้การเปรียบเทียบวันที่ทำงานถูกต้อง ควรตั้งเวลาเป็นเที่ยงคืนสำหรับทุกวันที่นำมาเปรียบเทียบ
            date.setHours(0,0,0,0);
            startOfMonth.setHours(0,0,0,0);
            endOfMonth.setHours(0,0,0,0);

            if (date >= startOfMonth && date <= endOfMonth) {
                currentMonthCount++;
            }
        });

        // 2. นับยอดรวมทั้งหมด
        const totalCumulativeCount = allWorkoutDates.size;

        // อัปเดต UI พร้อม Animation
        // สำหรับเดือนปัจจุบัน
        currentMonthWorkoutDaysSpan.classList.add('count-pulse');
        currentMonthWorkoutDaysSpan.textContent = currentMonthCount;
        currentMonthWorkoutDaysSpan.addEventListener('animationend', () => {
            currentMonthWorkoutDaysSpan.classList.remove('count-pulse');
        }, { once: true });

        // สำหรับยอดรวมทั้งหมด
        totalCumulativeWorkoutDaysSpan.classList.add('count-pulse');
        totalCumulativeWorkoutDaysSpan.textContent = totalCumulativeCount;
        totalCumulativeWorkoutDaysSpan.addEventListener('animationend', () => {
            totalCumulativeWorkoutDaysSpan.classList.remove('count-pulse');
        }, { once: true });
    }

    // --- Notification Logic ---
    function requestNotificationPermission() {
        // ตรวจสอบว่าเบราว์เซอร์รองรับ Notifications หรือไม่
        if (!("Notification" in window)) {
            console.warn("This browser does not support desktop notification.");
            return;
        }

        // ถ้ายังไม่ได้ขออนุญาต ให้ขอเลย
        if (Notification.permission === "default" && !notificationPermissionRequested) {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    console.log("Notification permission granted!");
                } else {
                    console.warn("Notification permission denied.");
                }
                notificationPermissionRequested = true; // บันทึกว่าได้ขอไปแล้ว
            });
        }
    }

    function showTimerNotification(message) {
        // ตรวจสอบว่าได้รับอนุญาตให้แสดงแจ้งเตือนหรือไม่
        if (Notification.permission === "granted") {
            new Notification("Workout Timer", {
                body: message,
                icon: 'https://cdn-icons-png.flaticon.com/512/1146/1146816.png' // ไอคอนสำหรับการแจ้งเตือน
                // คุณสามารถเปลี่ยนเป็น URL ของรูปไอคอนของคุณเอง หรือใช้ path ในเครื่อง เช่น './images/workout_icon.png'
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
        if (completedSets > 0 || (completedSets === targetSets && targetSets > 0)) { // หากทำได้มากกว่า 0 เซ็ต หรือครบเป้าหมายแล้ว ให้เปิดปุ่ม
            resetSetsBtn.disabled = false;
        } else {
            resetSetsBtn.disabled = true;
        }

        // ถ้าทำครบเซ็ตเป้าหมายแล้ว ให้หยุดเวลาและ disable ปุ่มเริ่ม
        if (completedSets >= targetSets && targetSets > 0) {
            stopTimer(); // หยุดเวลา
            startTimerBtn.disabled = true;
            timerDisplay.textContent = "DONE!"; // แสดงข้อความทำเสร็จ
            // ไม่ต้องแจ้งเตือนซ้ำตรงนี้ เพราะจะแจ้งเตือนตอนที่ทำเซ็ตสุดท้ายครบแล้วใน startTimer
        } else {
            startTimerBtn.disabled = false; // ถ้ายังไม่ครบ ให้เปิดปุ่มเริ่มได้
        }
    }

    function startTimer() {
        // ขออนุญาตแจ้งเตือนเมื่อเริ่มจับเวลาครั้งแรกในเซสชัน
        requestNotificationPermission();

        // ตรวจสอบว่าต้องตั้งเวลาเริ่มต้นใหม่หรือไม่
        if (remainingTime <= 0 && completedSets < targetSets) {
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
            } else { // Time's up for current set!
                clearInterval(timerInterval); // หยุดจับเวลา
                timerSound.play(); // เล่นเสียงเมื่อเวลาหมด

                if (completedSets < targetSets) {
                    completedSets++; // นับ 1 เซ็ต
                    saveTimerState(); // บันทึกสถานะเซ็ต
                    showTimerNotification(`Set ${completedSets} completed!`); // แจ้งเตือนเมื่อแต่ละเซ็ตเสร็จสิ้น
                }
                updateSetDisplay(); // อัปเดตการแสดงผลเซ็ต

                // เมื่อเวลาหมด ให้หยุด และพร้อมให้เริ่มเซ็ตต่อไป หรือเสร็จสิ้น
                stopTimerBtn.disabled = true; // หยุดแล้ว ให้ปุ่มหยุด disabled
                resetTimerBtn.disabled = false; // สามารถรีเซ็ตเวลาได้
                // startTimerBtn.disabled จะถูกจัดการใน updateSetDisplay
                updateTimerDisplay(); // เพื่อแสดง 00:00 หรือ DONE!
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
        stopTimerBtn.disabled = true; // หยุดไปแล้ว ปุ่ม Stop ควร disabled
        resetTimerBtn.disabled = false; // รีเซ็ตไปแล้ว ปุ่มรีเซ็ตก็ยังอยู่
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

        // อัปเดตค่าใน input fields
        timerDurationInput.value = initialTimerDuration;
        targetSetsInput.value = targetSets;

        // อัปเดต UI เริ่มต้น
        remainingTime = initialTimerDuration; // ตั้งเวลาเริ่มต้นให้ตรงกับค่าที่โหลดมา
        updateTimerDisplay();
        updateSetDisplay(); // ต้องเรียกเพื่อตั้งค่าปุ่ม disabled ให้ถูกต้อง
    }

    // --- Event Listeners ---
    // Calendar Navigation
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

    // Timer Controls
    timerDurationInput.addEventListener('change', () => {
        const newDuration = parseInt(timerDurationInput.value);
        if (newDuration > 0) {
            initialTimerDuration = newDuration;
            if (!timerInterval) { // ถ้า Timer ไม่ได้กำลังทำงาน ให้รีเซ็ตเวลาที่แสดงผล
                remainingTime = initialTimerDuration;
                updateTimerDisplay();
            }
            saveTimerState();
        } else {
            timerDurationInput.value = initialTimerDuration; // ถ้าค่าไม่ถูกต้อง ให้กลับไปใช้ค่าเดิม
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
        } else {
            targetSetsInput.value = targetSets; // ถ้าค่าไม่ถูกต้อง ให้กลับไปใช้ค่าเดิม
        }
    });

    startTimerBtn.addEventListener('click', startTimer);
    stopTimerBtn.addEventListener('click', stopTimer);
    resetTimerBtn.addEventListener('click', resetTimer);
    resetSetsBtn.addEventListener('click', resetSets);

    // Global Reset Button
    resetAllButton.addEventListener('click', () => {
        if (confirm('คุณแน่ใจหรือไม่ที่จะรีเซ็ตข้อมูลทั้งหมด? ทั้งปฏิทินและตัวจับเวลาจะถูกรีเซ็ตและหายไปอย่างถาวร')) {
            // Reset Calendar Data
            localStorage.removeItem('workoutCalendarDates');
            allWorkoutDates.clear();
            renderCalendar(); // Rerender calendar to clear UI

            // Reset Timer Data
            localStorage.removeItem('workoutTimerState');
            initialTimerDuration = 60;
            targetSets = 3;
            completedSets = 0;
            resetTimer(); // Reset timer to initial state
            updateSetDisplay(); // Update set count display
        }
    });

    // --- Initialization ---
    loadWorkoutDates(); // โหลดข้อมูลปฏิทิน
    renderCalendar(); // แสดงปฏิทินเริ่มต้น

    loadTimerState(); // โหลดข้อมูลตัวจับเวลา
});
