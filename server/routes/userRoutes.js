const express = require("express");
const {
  loginController,
  registerController,
  authController,
  applyDoctorController,
  getAllNotificationController,
  deleteAllNotificationController,
  getAllDoctorsController,      // Corrected typo here
  bookAppointmentController,     // Corrected typo here
  bookingAvailabilityController,
  userAppointmentsController,
  cancelAppointmentController,
  deleteAppointmentController,
  rescheduleAppointmentController,
} = require("../controllers/userCtrl");
const authMiddleware = require("../middlewares/authMiddleware");

// Router object
const router = express.Router();

// Routes
// LOGIN || POST
router.post("/login", loginController);

// REGISTER || POST
router.post("/register", registerController);

// Auth || POST
router.post("/getUserData", authMiddleware, authController);

// Apply Doctor || POST
router.post("/apply-doctor", authMiddleware, applyDoctorController);

// Get All Notifications || POST
router.post("/get-all-notification", authMiddleware, getAllNotificationController);

// Delete All Notifications || POST
router.post("/delete-all-notification", authMiddleware, deleteAllNotificationController);

// Get All Doctors || GET
router.get("/getAllDoctors", authMiddleware, getAllDoctorsController);

// Book Appointment || POST
router.post("/book-appointment", authMiddleware, bookAppointmentController);

// Booking Availability || POST
router.post("/booking-availability", authMiddleware, bookingAvailabilityController);

// Appointments List || GET
router.get("/user-appointments", authMiddleware, userAppointmentsController);

router.post("/cancel-appointment", authMiddleware, cancelAppointmentController);

router.delete("/delete-appointment", authMiddleware, deleteAppointmentController);
router.delete("/reschedule-appointment", authMiddleware, rescheduleAppointmentController);



module.exports = router;
