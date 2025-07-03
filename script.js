document.addEventListener('DOMContentLoaded', () => {
    const calendarGrid = document.getElementById('calendarGrid');
    const currentMonthYearHeader = document.getElementById('currentMonthYear');
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');
    const currentMonthWorkoutDaysSpan = document.getElementById('currentMonthWorkoutDays');
    const totalCumulativeWorkoutDaysSpan = document.getElementById('totalCumulativeWorkoutDays');
    const resetAllButton = document.getElementById('resetAllButton');

    // เก็บวันที่ออกกำลังกายทั้งหมดในรูปแบบ YYYY-MM-DD
    let allWorkoutDates = new Set();

    let currentDate = new Date(); // วันที่ปัจจุบันที่ใช้ในการแสดงผลปฏิทิน
    let currentYear = currentDate.getFullYear();
    let currentMonth = currentDate.getMonth(); // 0-11 สำหรับ ม.ค.-ธ.ค.

    const monthNames = [
        "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
        "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];

    // --- Helper Functions ---
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // --- Calendar Rendering ---
    function renderCalendar() {
        calendarGrid.innerHTML = ''; // ล้าง grid เดิม
        currentMonthYearHeader.textContent = `${monthNames[currentMonth]} ${currentYear}`;

        const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        // firstDayOfMonth.getDay() ให้ 0=อาทิตย์, 1=จันทร์...
        // เราต้องการให้ปฏิทินเริ่มต้นที่วันอาทิตย์ (index 0)
        const startDayIndex = firstDayOfMonth.getDay(); // วันแรกของเดือนคือวันอะไรในสัปดาห์ (0=อาทิตย์, 6=เสาร์)

        // เพิ่มวันจากเดือนก่อนหน้า (placeholder)
        // เพื่อให้วันแรกของเดือนเริ่มต้นถูกตำแหน่งที่ถูกต้องใน grid
        for (let i = 0; i < startDayIndex; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.classList.add('calendar-day', 'other-month');
            // สามารถคำนวณและแสดงวันที่ของเดือนก่อนหน้าได้ ถ้าต้องการ
            // เช่น: const prevMonthDay = new Date(currentYear, currentMonth, 0).getDate() - (startDayIndex - 1 - i);
            // emptyDay.textContent = prevMonthDay;
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

            // ตรวจสอบว่าวันนี้เคยออกกำลังกายหรือไม่
            if (allWorkoutDates.has(formattedDate)) {
                dayElement.classList.add('is-workout');
            }

            // เพิ่ม Event Listener สำหรับการคลิก
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

        // เพิ่มวันจากเดือนถัดไป (placeholder) เพื่อให้ grid เต็ม
        const totalDaysInGrid = startDayIndex + daysInMonth;
        const remainingCells = 42 - totalDaysInGrid; // 42 cells = 6 rows * 7 days (typical max for calendar)
        for (let i = 0; i < remainingCells && i < 7; i++) { // เพิ่มไม่เกิน 7 วันถัดไป (สำหรับกรณีที่เดือนสั้นและเริ่มกลางสัปดาห์)
             const emptyDay = document.createElement('div');
             emptyDay.classList.add('calendar-day', 'other-month');
             // emptyDay.textContent = i + 1; // สามารถแสดงวันที่ของเดือนถัดไปได้
             calendarGrid.appendChild(emptyDay);
        }


        updateWorkoutCounts(); // อัปเดตตัวนับหลังจาก render ปฏิทิน
    }

    // --- Local Storage Management ---
    function saveWorkoutDates() {
        localStorage.setItem('workoutCalendarDates', JSON.stringify(Array.from(allWorkoutDates)));
    }

    function loadWorkoutDates() {
        const savedDates = localStorage.getItem('workoutCalendarDates');
        if (savedDates) {
            allWorkoutDates = new Set(JSON.parse(savedDates));
        }
    }

    // --- Update Display Counts ---
    function updateWorkoutCounts() {
        // 1. นับจำนวนวันของเดือนปัจจุบันที่แสดงผล
        let currentMonthCount = 0;
        const startOfMonth = new Date(currentYear, currentMonth, 1);
        const endOfMonth = new Date(currentYear, currentMonth + 1, 0);

        allWorkoutDates.forEach(dateStr => {
            const date = new Date(dateStr);
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

    // ปุ่มรีเซ็ตข้อมูลทั้งหมด
    resetAllButton.addEventListener('click', () => {
        if (confirm('คุณแน่ใจหรือไม่ที่จะรีเซ็ตข้อมูลการออกกำลังกายทั้งหมด? ข้อมูลที่บันทึกไว้จะหายไป')) {
            localStorage.removeItem('workoutCalendarDates');
            allWorkoutDates.clear(); // ล้างข้อมูลใน Set
            renderCalendar(); // Render ใหม่เพื่อล้างการติ๊กบน UI
        }
    });

    // --- Initialization ---
    loadWorkoutDates(); // โหลดข้อมูลที่บันทึกไว้
    renderCalendar(); // แสดงปฏิทินเริ่มต้น
});
