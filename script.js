document.addEventListener('DOMContentLoaded', () => {
    const checkboxes = document.querySelectorAll('.workout-checkbox');
    const currentWeekWorkoutDaysSpan = document.getElementById('currentWeekWorkoutDays');
    const totalCumulativeWorkoutDaysSpan = document.getElementById('totalCumulativeWorkoutDays');
    const resetAllButton = document.getElementById('resetAllButton');

    // เก็บวันที่ออกกำลังกายทั้งหมดในรูปแบบ YYYY-MM-DD
    let allWorkoutDates = new Set(); // ใช้ Set เพื่อให้วันที่ไม่ซ้ำกัน

    // --- Helper Functions ---
    // ได้วันที่ของวันจันทร์ของสัปดาห์ปัจจุบัน
    function getMondayOfCurrentWeek() {
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ...
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // ปรับให้วันจันทร์เป็นวันแรกของสัปดาห์
        const monday = new Date(today.setDate(diff));
        monday.setHours(0, 0, 0, 0); // ตั้งเวลาเป็นเที่ยงคืน
        return monday;
    }

    // ฟังก์ชันสำหรับฟอร์แมตวันที่เป็น YYYY-MM-DD
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // --- Local Storage Management ---
    // บันทึกสถานะการออกกำลังกายทั้งหมด (รวมวันที่) และสถานะ checkbox ปัจจุบัน
    function saveWorkoutState() {
        // บันทึกวันที่ออกกำลังกายทั้งหมด
        localStorage.setItem('allWorkoutDates', JSON.stringify(Array.from(allWorkoutDates)));

        // บันทึกสถานะ checkbox ของสัปดาห์ปัจจุบัน
        const currentWeekCheckboxesState = {};
        checkboxes.forEach(checkbox => {
            currentWeekCheckboxesState[checkbox.dataset.day] = checkbox.checked;
        });
        localStorage.setItem('currentWeekCheckboxes', JSON.stringify(currentWeekCheckboxesState));
    }

    // โหลดสถานะการออกกำลังกายทั้งหมด และตั้งค่า checkbox สำหรับสัปดาห์ปัจจุบัน
    function loadWorkoutState() {
        // โหลดวันที่ออกกำลังกายทั้งหมด
        const savedDates = localStorage.getItem('allWorkoutDates');
        if (savedDates) {
            allWorkoutDates = new Set(JSON.parse(savedDates));
        }

        // โหลดสถานะ checkbox ของสัปดาห์ปัจจุบัน
        const savedCheckboxes = localStorage.getItem('currentWeekCheckboxes');
        if (savedCheckboxes) {
            const currentWeekCheckboxesState = JSON.parse(savedCheckboxes);
            checkboxes.forEach(checkbox => {
                const day = checkbox.dataset.day;
                if (currentWeekCheckboxesState[day]) {
                    checkbox.checked = true;
                    checkbox.closest('.day-card').classList.add('is-checked');
                } else {
                    checkbox.checked = false;
                    checkbox.closest('.day-card').classList.remove('is-checked');
                }
            });
        }
    }

    // --- Update Display ---
    // อัปเดตจำนวนวันออกกำลังกายทั้งสัปดาห์ปัจจุบันและยอดรวมทั้งหมด
    function updateWorkoutCounts() {
        // 1. นับจำนวนวันของสัปดาห์ปัจจุบัน
        let currentWeekCount = 0;
        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                currentWeekCount++;
            }
        });

        // 2. นับยอดรวมทั้งหมด (จาก allWorkoutDates)
        const totalCumulativeCount = allWorkoutDates.size;

        // อัปเดต UI พร้อม Animation
        // สำหรับสัปดาห์ปัจจุบัน
        currentWeekWorkoutDaysSpan.classList.add('count-pulse');
        currentWeekWorkoutDaysSpan.textContent = currentWeekCount;
        currentWeekWorkoutDaysSpan.addEventListener('animationend', () => {
            currentWeekWorkoutDaysSpan.classList.remove('count-pulse');
        }, { once: true });

        // สำหรับยอดรวมทั้งหมด
        totalCumulativeWorkoutDaysSpan.classList.add('count-pulse');
        totalCumulativeWorkoutDaysSpan.textContent = totalCumulativeCount;
        totalCumulativeWorkoutDaysSpan.addEventListener('animationend', () => {
            totalCumulativeWorkoutDaysSpan.classList.remove('count-pulse');
        }, { once: true });
    }

    // --- Event Listeners ---
    // เมื่อมีการเปลี่ยนสถานะของ checkbox
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const dayCard = this.closest('.day-card');
            const dayIndex = Array.from(checkboxes).indexOf(this); // 0 for Monday, 1 for Tuesday...
            const monday = getMondayOfCurrentWeek();
            const workoutDate = new Date(monday);
            workoutDate.setDate(monday.getDate() + dayIndex); // คำนวณวันที่จริงของวันนั้นๆ

            if (this.checked) {
                dayCard.classList.add('is-checked');
                allWorkoutDates.add(formatDate(workoutDate)); // เพิ่มวันที่จริงลงใน Set
            } else {
                dayCard.classList.remove('is-checked');
                allWorkoutDates.delete(formatDate(workoutDate)); // ลบวันที่จริงออกจาก Set
            }
            saveWorkoutState();
            updateWorkoutCounts();
        });
    });

    // ปุ่มรีเซ็ตข้อมูลทั้งหมด
    resetAllButton.addEventListener('click', () => {
        if (confirm('คุณแน่ใจหรือไม่ที่จะรีเซ็ตข้อมูลการออกกำลังกายทั้งหมด? ข้อมูลที่บันทึกไว้จะหายไป')) {
            localStorage.removeItem('allWorkoutDates');
            localStorage.removeItem('currentWeekCheckboxes');
            allWorkoutDates.clear(); // ล้างข้อมูลใน Set
            checkboxes.forEach(checkbox => {
                checkbox.checked = false;
                checkbox.closest('.day-card').classList.remove('is-checked');
            });
            updateWorkoutCounts();
        }
    });

    // --- Initialization ---
    // โหลดสถานะเมื่อหน้าเว็บโหลดเสร็จ และอัปเดตตัวนับเริ่มต้น
    loadWorkoutState();
    updateWorkoutCounts();
});

