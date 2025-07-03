// ====== ส่วนของ Firebase Initialization ======
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics"; // ไม่ได้ใช้ใน Logic นี้ แต่ถ้าต้องการเก็บ Analytics สามารถเปิดใช้งานได้
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore"; // Import Firestore functions

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD5k1WWroGpelDNxkAA8_1Tn-AkqsgxtaQ",
  authDomain: "exercise-f7e39.firebaseapp.com",
  projectId: "exercise-f7e39",
  storageBucket: "exercise-f7e39.firebasestorage.app",
  messagingSenderId: "646977184855",
  appId: "1:646977184855:web:2cc71703d3a694bfaeaf12",
  measurementId: "G-FKJX868XKQ" // คุณสามารถลบออกได้หากไม่ต้องการใช้ Google Analytics
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app); // ถ้าต้องการใช้ Analytics
// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);
// ==========================================================

// --- ส่วนควบคุมการแสดงผลส่วนต่างๆ (เมนูและ Section) ---
let currentVisibleSection = 'calendarSection';

function toggleMenu() {
    const menu = document.getElementById('mainMenu');
    if (menu.style.display === 'block') {
        menu.style.display = 'none';
        menu.classList.remove('active');
    } else {
        menu.style.display = 'block';
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
        toggleMenu();
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
// เราจะไม่ใช้ localStorage.getItem('workoutDays') อีกต่อไป
// แต่จะดึงข้อมูลจาก Firestore เมื่อ renderCalendar ถูกเรียก

// *** สำคัญ: ID ผู้ใช้สำหรับเก็บข้อมูลใน Firestore ***
// ในตอนนี้เราใช้ ID แบบตายตัว "user1"
// ถ้าต้องการหลายผู้ใช้ ต้องใช้ Firebase Authentication เพื่อได้ UID ของผู้ใช้จริง
const USER_ID = "user1"; 

// ฟังก์ชันสำหรับดึงข้อมูลวันที่ออกกำลังกายจาก Firestore
async function fetchWorkoutDays() {
    try {
        const docRef = doc(db, "users", USER_ID); // อ้างอิงถึงเอกสารของผู้ใช้นี้ใน collection 'users'
        const docSnap = await getDoc(docRef); // ดึงข้อมูลเอกสาร

        if (docSnap.exists()) {
            // ถ้าเอกสารมีอยู่ ให้ส่งคืนข้อมูลในฟิลด์ 'workoutDates'
            // ถ้าไม่มีฟิลด์ 'workoutDates' ให้คืนค่าเป็น Object ว่างเปล่า
            return docSnap.data().workoutDates || {}; 
        } else {
            console.log("No workout data found for this user in Firestore. Starting fresh.");
            return {}; // ไม่มีข้อมูล ให้คืนค่าเป็น Object ว่างเปล่า
        }
    } catch (error) {
        console.error("Error fetching workout days from Firestore:", error);
        return {}; // คืนค่าว่างเปล่าหากเกิดข้อผิดพลาด
    }
}

// ฟังก์ชันสำหรับบันทึกข้อมูลวันที่ออกกำลังกายไปยัง Firestore
async function saveWorkoutDays(data) {
    try {
        // ใช้ setDoc เพื่อบันทึกข้อมูลในฟิลด์ 'workoutDates' ของเอกสารผู้ใช้
        // { merge: true } จะอัปเดตเฉพาะฟิลด์ 'workoutDates' โดยไม่ลบฟิลด์อื่นในเอกสาร
        await setDoc(doc(db, "users", USER_ID), { workoutDates: data }, { merge: true });
        console.log("Workout days saved to Firestore successfully!");
    } catch (error) {
        console.error("Error saving workout days to Firestore:", error);
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

    // *** ดึงข้อมูลจาก Firestore ก่อน Render ***
    const workoutDaysFromFirestore = await fetchWorkoutDays(); 
    let totalCheckedDays = 0;
    const today = new Date();
    const todayString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

    for (let i = 1; i <= lastDayOfMonth; i++) {
        const dateString = `${year}-${month + 1}-${i}`;
        let classes = 'day-cell';

        if (dateString === todayString) {
            classes += ' today';
        }

        // ตรวจสอบกับข้อมูลที่ดึงมาจาก Firestore
        if (workoutDaysFromFirestore[dateString]) {
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
            // ดึงข้อมูลปัจจุบันจาก Firestore ก่อนแก้ไข
            let currentWorkoutDays = await fetchWorkoutDays();

            if (currentWorkoutDays[date]) {
                delete currentWorkoutDays[date]; // ยกเลิกติ๊กถูก
            } else {
                currentWorkoutDays[date] = true; // ติ๊กถูก
            }
            
            // บันทึกข้อมูลที่แก้ไขแล้วกลับไปยัง Firestore
            await saveWorkoutDays(currentWorkoutDays);
            renderCalendar(); // อัปเดตปฏิทินอีกครั้งเพื่อแสดงผลลัพธ์
        });
    });
}

function changeMonth(delta) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + delta);
    renderCalendar();
}

// --- ส่วนตัวจับเวลา (ยังคงเหมือนเดิม เพราะไม่เกี่ยวกับ database โดยตรง) ---
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

// ฟังก์ชันสำหรับอัปเดตการแสดงผลของตัวจับเวลา
function updateTimerDisplay() {
    // ตรวจสอบให้แน่ใจว่า element มีอยู่จริงก่อนอัปเดต
    if (!currentTimeEl || !currentSetEl || !displayTotalSetsEl) {
        console.error("Error: Timer display elements not found in HTML!");
        return;
    }

    currentTimeEl.textContent = remainingTime.toString().padStart(2, '0');
    // ตรวจสอบให้แน่ใจว่า currentSetCount เป็นตัวเลขก่อนแสดงผล
    currentSetEl.textContent = currentSetCount !== undefined && currentSetCount !== null ? currentSetCount : ''; 
    displayTotalSetsEl.textContent = totalSetsToComplete !== undefined && totalSetsToComplete !== null ? totalSetsToComplete : '';
}

function startTimer() {
    if (timerActive && !isPaused) return;

    // ดึงค่าจาก input เมื่อเริ่ม Timer ครั้งแรก หรือเมื่อมีการเปลี่ยนค่าหลังจากรีเซ็ต
    // ตรวจสอบว่า currentSetCount เป็น 0 หรือยังไม่ได้กำหนดค่าเริ่มต้น
    if (currentSetCount === 0 || initialSetDuration === undefined || totalSetsToComplete === undefined) {
        initialSetDuration = parseInt(setDurationInput.value);
        totalSetsToComplete = parseInt(totalSetsInput.value);

        // ตรวจสอบความถูกต้องของค่าที่ป้อน
        if (isNaN(initialSetDuration) || initialSetDuration <= 0 ||
            isNaN(totalSetsToComplete) || totalSetsToComplete <= 0) {
            alert("กรุณากำหนดเวลาและจำนวนเซ็ตที่มากกว่า 0 ให้ถูกต้อง!");
            resetTimer(); // รีเซ็ตหากค่าไม่ถูกต้อง
            return;
        }
        currentSetCount = 1; // เริ่มต้นที่เซ็ต 1 สำหรับการแสดงผลเมื่อกดเริ่ม
        remainingTime = initialSetDuration;
        updateTimerDisplay(); // อัปเดตการแสดงผลทันทีหลังกำหนดค่าเริ่มต้น
    }
    
    timerActive = true;
    isPaused = false;

    // ตั้งค่าสถานะปุ่มและ input
    startButton.disabled = true;
    pauseButton.disabled = false;
    resetTimerButton.disabled = false;
    setDurationInput.disabled = true;
    totalSetsInput.disabled = true;

    timerInterval = setInterval(() => {
        remainingTime--;
        updateTimerDisplay(); // อัปเดตทุกวินาที

        if (remainingTime <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            timerActive = false;
            
            alert(`เซ็ตที่ ${currentSetCount} จบแล้ว!`); 
            
            if (currentSetCount < totalSetsToComplete) {
                // ถ้ายังไม่ครบเซ็ตทั้งหมด:
                currentSetCount++; // เพิ่มจำนวนเซ็ตทันทีที่เวลาหมด
                remainingTime = initialSetDuration; // รีเซ็ตเวลาสำหรับเซ็ตใหม่
                updateTimerDisplay(); // อัปเดตการแสดงผลทันทีเพื่อให้เซ็ตใหม่ปรากฏ
                
                // ตั้งค่าปุ่มเพื่อรอการกด "เริ่ม" ใหม่
                startButton.disabled = false; 
                pauseButton.disabled = true;
                resetTimerButton.disabled = false;

            } else {
                // ครบทุกเซ็ตแล้ว
                alert("เยี่ยมมาก! คุณทำครบทุกเซ็ตแล้ว!");
                resetTimerButton.disabled = false;
                startButton.disabled = true; 
                pauseButton.disabled = true;
                remainingTime = 0; // แสดงเวลาเป็น 00 เมื่อจบครบทุกเซ็ต
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

// ฟังก์ชันรีเซ็ตตัวจับเวลาให้เป็นค่าเริ่มต้น
function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    timerActive = false;
    isPaused = false;
    
    // ดึงค่าจาก input ทันทีเมื่อรีเซ็ตเพื่อนำมาแสดงผลเป็นค่าตั้งต้น
    // ใช้ || เพื่อให้มีค่า default หาก input ว่างหรือเป็น NaN
    initialSetDuration = parseInt(setDurationInput.value) || 60;
    totalSetsToComplete = parseInt(totalSetsInput.value) || 3;
    
    remainingTime = initialSetDuration;
    currentSetCount = 0; // สำคัญ: ตั้งเป็น 0 เมื่อรีเซ็ต เพื่อให้แสดง "0 / จำนวนเซ็ตทั้งหมด"

    // อัปเดตหน้าจอด้วยค่าเริ่มต้นใหม่ทันที
    updateTimerDisplay(); 

    // ตั้งค่าสถานะปุ่มและ input
    startButton.disabled = false;
    pauseButton.disabled = true;
    resetTimerButton.disabled = true;
    setDurationInput.disabled = false;
    totalSetsInput.disabled = false;
}

// Event Listeners สำหรับปุ่ม Timer
startButton.addEventListener('click', startTimer);
pauseButton.addEventListener('click', pauseTimer);
resetTimerButton.addEventListener('click', resetTimer);

// Event Listeners สำหรับ input fields เพื่อให้อัปเดตค่า Total Sets ทันที
// เมื่อมีการเปลี่ยนแปลงค่าในช่อง input ให้เรียก resetTimer เพื่ออัปเดตการแสดงผล
setDurationInput.addEventListener('input', resetTimer); 
totalSetsInput.addEventListener('input', resetTimer); 

// เรียกใช้ฟังก์ชันเริ่มต้นเมื่อ DOM โหลดเสร็จ
document.addEventListener('DOMContentLoaded', function() {
    showSection('calendarSection'); // แสดงปฏิทินเป็นหน้าแรก
    // renderCalendar() จะถูกเรียกใน showSection('calendarSection')
    // resetTimer() จะถูกเรียกใน showSection('timerSection')
});
