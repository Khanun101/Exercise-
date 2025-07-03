// ... (ส่วนอื่นๆ ของโค้ด) ...

let timerInterval;
let initialSetDuration;     // เก็บเวลาเริ่มต้นของแต่ละเซ็ต (จาก input)
let remainingTime;          // เวลาที่เหลือในเซ็ตปัจจุบัน
let currentSetCount;        // จำนวนเซ็ตที่กำลังทำอยู่ (1, 2, 3...)
let totalSetsToComplete;    // จำนวนเซ็ตทั้งหมดที่ผู้ใช้กำหนด
let timerActive = false;    // สถานะว่าตัวจับเวลากำลังทำงานอยู่หรือไม่
let isPaused = false;       // สถานะว่าตัวจับเวลาถูกหยุดชั่วคราวหรือไม่

function updateTimerDisplay() {
    currentTimeEl.textContent = remainingTime.toString().padStart(2, '0');
    currentSetEl.textContent = currentSetCount; // ตรงนี้คือที่แสดงผลจำนวนเซ็ต
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
    // ... (ส่วนอื่นๆ ของเงื่อนไขการเริ่ม) ...
    
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

// ... (ส่วนอื่นๆ ของโค้ด) ...

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

// ... (ส่วนอื่นๆ ของโค้ด) ...
