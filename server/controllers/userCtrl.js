const userModel = require("../models/userModels");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const doctorModel = require("../models/doctorModel");
const appointmentModel = require("../models/appointmentModel");
const moment = require("moment");
const sendEmail = require("../utils/email");

// Register Controller
const registerController = async (req, res) => {
  try {
    const existingUser = await userModel.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(200).send({ message: "User Already Exists", success: false });
    }
    const password = req.body.password;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    req.body.password = hashedPassword;
    const newUser = new userModel(req.body);
    await newUser.save();
    res.status(201).send({ message: "Registered Successfully", success: true });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: `Register Controller Error: ${error.message}`,
    });
  }
};

// CheckLoggedInDoctor
const checkDoctorLoginStatusController = async (req, res) => {
  try {
    const userId = req.body.userId; // Get userId from the request body
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).send({ message: "User  not found", success: false });
    }

    if (!user.isDoctor) {
      return res.status(403).send({ message: "Access Denied: Not a Doctor", success: false });
    }

    // If the user is a doctor, respond with success
    res.status(200).send({
      success: true,
      message: "Doctor is logged in",
      data: {
        name: user.name,
        email: user.email,
        isDoctor: user.isDoctor,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error checking doctor login status",
      error: error.message,
    });
  }
};

// Login Controller
const loginController = async (req, res) => {
  // console.log(req.body);
  try {
    const user = await userModel.findOne({ email: req.body.email });
    // console.log(user)
    if (!user) {
      return res.status(200).send({ message: "User Not Found", success: false });
    }
    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) {
      return res.status(200).send({ message: "Invalid Email or Password", success: false });
    }
    // console.log(process.env)
    // console.log("JWT_SECRET:", process.env.JWT_SECRET);

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",

    });
    
    res.status(200).send({ message: "Login Success", success: true, token });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: `Error in Login Controller: ${error.message}` });
  }
};

// Auth Controller
const authController = async (req, res) => {
  try {
    const user = await userModel.findById(req.body.userId);
    // console.log(user)
    if (!user) {
      return res.status(200).send({ message: "User Not Found", success: false });
    }
    user.password = undefined;
    res.status(200).send({ success: true, data: user });
  } catch (error) {
    // console.log(error);
    res.status(500).send({
      message: "Authentication Error",
      success: false,
      error,
    });
  }
};


const getUserDatabyId = async (req, res) => {
  try {
    const user = await userModel.findById(req.body.userId);
    console.log(user)
    if (!user) {
      return res.status(200).send({ message: "User Not Found", success: false });
    }
    // user.password = undefined;
    res.status(200).send({ success: true, data: user });
  } catch (error) {
    // console.log(error);
    res.status(500).send({
      message: "Authentication Error",
      success: false,
      error,
    });
  }
};

// Apply Doctor Controller
const applyDoctorController = async (req, res) => {
  // console.log(res.body)
  console.log(req.body)
  try {
    const { firstName, lastName, phone, email, specialization, experience, timings, userId } = req.body;
    console.log(timings)

    // Validate input
    if (!firstName || !lastName || !phone || !email || !specialization || !experience || !timings) {
      return res.status(400).send({ success: false, message: "All fields are required." });
    }

    // Create a new doctor application
    const newDoctor = new doctorModel({ ...req.body, status: "pending" });
    await newDoctor.save();

    // Find the admin user
    const adminUser  = await userModel.findOne({ isAdmin: true });

    // Check if admin user exists
    if (!adminUser ) {
      return res.status(500).send({ success: false, message: "Admin user not found." });
    }

    // Prepare notification for the admin
    const notification = adminUser .notification || [];
    notification.push({
      type: "apply-doctor-request",
      message: `${newDoctor.firstName} ${newDoctor.lastName} has applied for a Doctor account`,
      data: {
        doctorId: newDoctor._id,
        name: `${newDoctor.firstName} ${newDoctor.lastName}`,
        onClickPath: "/admin/doctors",
      },
    });

    // Update the admin user's notifications
    await userModel.findByIdAndUpdate(adminUser ._id, { notification });

    res.status(201).send({ success: true, message: "Doctor Account Applied Successfully" });
  } catch (error) {
    console.error("Error while applying for doctor:", error); // Log the error
    res.status(500).send({
      success: false,
      message: "Error While Applying For Doctor",
      error: error.message, // Include the error message in the response
    });
  }
};

// Get All Notifications Controller
// const getAllNotificationController = async (req, res) => {
//   try {
//     const user = await userModel.findById(req.body.userId);

//     if (!user) {
//       return res.status(404).send({
//         success: false,
//         message: "User  not found",
//       });
//     }

//     // Move notifications to seen notifications
//     user.seennotification.push(...user.notifcation);
//     user.notifcation = [];

//     // Update the timestamp for marking notifications as read
//     user.notificationReadAt = new Date();
//     await user.save();

//     res.status(200).send({
//       success: true,
//       message: "All notifications marked as read",
//       data: {
//         user,
//         notificationReadAt: user.notificationReadAt,
//       },
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send({
//       success: false,
//       message: "Error in Notification Controller",
//       error,
//     });
//   }
// };


const getAllNotificationController = async (req, res) => {
  console.log(req.body)
  try {
    
    // Find the user by their ID (assuming req.userId contains the logged-in user's ID)
    const user = await userModel.findById(req.body.userId); 
    console.log(user)
    // console.log(user)
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.seennotification.push(...user.notifcation);
    user.notifcation = [];

    // Mark all notifications as read by setting a 'read' flag (assuming each notification has a 'read' field)
    // user.notifcation.forEach(notifcation => {
    //   notifcation.read = true;
    // });

    // Save the updated user data
    await user.save();

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error, please try again later" });
  }

};


// Delete All Notifications Controller
const deleteAllNotificationController = async (req, res) => {
  try {
    const user = await userModel.findById(req.body.userId);
    user.notifcation = [];
    user.seennotification = [];
    await user.save();
    res.status(200).send({
      success: true,
      message: "Notifications deleted successfully",
      data: user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Unable to delete all notifications",
      error,
    });
  }
};

// Delete notification by one
const deleteNotification = async (req, res) => {
  try {
    const { userId, notificationId } = req.body;

    // Log the incoming request body for debugging
    console.log("Delete Notification Request:", req.body);

    // Validate userId and notificationId
    if (!userId || !notificationId) {
      return res.status(400).send({ success: false, message: "User  ID and Notification ID are required." });
    }

    // Find the user
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).send({ success: false, message: "User  not found." });
    }

    // Ensure both arrays exist before accessing them
    const { notifcation = [], seennotification = [] } = user;

    // Helper function to safely compare notification IDs
    const isValidNotificationId = (notif, notificationId) => {
      return notif && notif._id && notif._id.toString() === notificationId;
    };

    // Check if the notification is in the 'notifcation' (unread) array
    const notificationIndex = notifcation.findIndex((notif) => isValidNotificationId(notif, notificationId));

    if (notificationIndex !== -1) {
      // Remove the notification from 'notifcation' (unread)
      notifcation.splice(notificationIndex, 1);
      console.log(`Notification deleted from 'notifcation': ${notificationId}`);
    } else {
      // Check if the notification is in the 'seennotification' (read) array
      const seenNotificationIndex = seennotification.findIndex((notif) => isValidNotificationId(notif, notificationId));

      if (seenNotificationIndex !== -1) {
        // Remove the notification from 'seennotification' (read)
        seennotification.splice(seenNotificationIndex, 1);
        console.log(`Notification deleted from 'seennotification': ${notificationId}`);
      } else {
        return res.status(404).send({ success: false, message: "Notification not found." });
      }
    }

    // Save the updated user data
    await user.save();
    return res.status(200).send({ success: true, message: "Notification deleted successfully." });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return res.status(500).send({
      success: false,
      message: "Failed to delete notification.",
      error: error.message || error,
    });
  }
};

// export default deleteNotification; // Ensure to export the function if needed

// Get All Doctors Controller
const getAllDoctorsController = async (req, res) => {
  // console.log(req.body)
  // console.log(res.body)
  try {
    const doctors = await doctorModel.find({ status: "approved" });
    doctors.forEach((doctor) => {
      console.log(`Doctor: ${doctor.firstName} ${doctor.lastName}`);
      console.log(`Timings: ${doctor.timings[1]} - ${doctor.timings[0]}`);
    });
    
    res.status(200).send({
      success: true,
      message: "Doctor List Fetched Successfully",
      data: doctors,
    });
    // console.log(doctors)
  } catch (error) {
    // console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error While Fetching Doctors",
    });
  }
};

// Book Appointment Controller
const bookAppointmentController = async (req, res) => {
  try {
    const { date, time, doctorInfo, userInfo } = req.body;

    // Validate that date and time are provided
    if (!date || !time) {
      return res.status(400).send({
        success: false,
        message: "Date and time are required",
      });
    }

    // Format the date and time
    const formattedDate = moment(date, "DD-MM-YYYY").toISOString();
    const formattedTime = moment(time, "hh:mm A").toISOString();

    // Check for existing appointments
    const fromTime = moment(formattedTime).subtract(1, "hours").toISOString(); // 1 hour before
    const toTime = moment(formattedTime).add(1, "hours").toISOString(); // 1 hour after

    const existingAppointments = await appointmentModel.find({
      doctorId: doctorInfo.userId,
      date: formattedDate,
      time: { $gte: fromTime, $lte: toTime },
    });

    // If there is already an appointment, return a message
    if (existingAppointments.length > 0) {
      return res.status(200).send({
        success: false,
        message: "Doctor is not available at this time",
      });
    }

    // Create a new appointment
    const newAppointment = new appointmentModel({
      ...req.body,
      date: formattedDate,
      time: formattedTime,
      status: "pending",
    });
    await newAppointment.save();

    // Notify the doctor
    const doctorUser = await userModel.findById(doctorInfo.userId);
    doctorUser.notifcation.push({
      type: "New-appointment-request",
      message: `A new appointment request from ${userInfo.name}`,
      onClickPath: "/user/appointments",
    });
    await doctorUser.save();

    const fullName = `${doctorInfo.firstName} ${doctorInfo.lastName}`;

    // Send an email to the user
    const emailSubject = "Appointment Confirmation";
    const emailBody = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; background-color: #f4f4f9; padding: 20px; border-radius: 8px; max-width: 600px; margin: auto;">
      <div style="text-align: center; padding: 20px;">
        <h2 style="color: #333; font-size: 24px;">Appointment Confirmation</h2>
        <p style="font-size: 16px; color: #666;">Thank you for choosing our clinic!</p>
      </div>
      
      <p style="font-size: 16px; color: #333;">Dear <strong style="color: #2c3e50;">${userInfo.name}</strong>,</p>
      
      <p style="font-size: 16px; color: #333;">Your appointment with <strong style="color: #2c3e50;">Dr. ${fullName} (${doctorInfo.specialization})</strong> has been successfully booked.</p>
      <p style="font-size: 16px; color: #333;">Status is : <strong>"Pennding"</strong> shortly your status will be updated to <strong>"Confirmed"</strong> after the doctor's confirmation.</p>
      
      <p style="font-size: 16px; color: #333;"><strong style="color: #2c3e50;">Appointment Details:</strong></p>
      
      <ul style="list-style-type: none; padding: 0; font-size: 16px; color: #333;">
        <li style="padding: 5px 0;">Date: <span style="font-weight: bold;">${moment(formattedDate).format("DD-MM-YYYY")}</span></li>
        <li style="padding: 5px 0;">Time: <span style="font-weight: bold;">${moment(formattedTime).format("hh:mm A")}</span></li>
      </ul>
      
      <p style="font-size: 16px; color: #333;">Thank you for choosing our service!</p>
      
      <div style="border-top: 2px solid #e0e0e0; margin-top: 20px; padding-top: 20px;">
        <p style="font-size: 16px; color: #333;">Regards, <br><strong>Your Clinic Team</strong></p>
      </div>
    </div>
    `;

    await sendEmail(userInfo.email, emailSubject, emailBody);
    // console.log(emailBody)

    res.status(200).send({
      success: true,
      message: "Appointment booked successfully, and email notification sent",
    });
  } catch (error) {
    console.error("Error while booking appointment:", error);
    res.status(500).send({
      success: false,
      error,
      message: "Error While Booking Appointment",
    });
  }
};

// Booking Availability Controller
const bookingAvailabilityController = async (req, res) => {
  try {
    // Parse date and time from the request body
    const date = moment(req.body.date, "DD-MM-YYYY").toISOString(); // Ensure correct format
    const time = moment(req.body.time, "hh:mm A"); // Parse the time for comparison
    const fromTime = time.clone().subtract(1, "hours").toISOString(); // 1 hour before
    const toTime = time.clone().add(1, "hours").toISOString(); // 1 hour after

    // Query for appointments within the specified time range
    const appointments = await appointmentModel.find({
      doctorId: req.body.doctorId,
      date,
      time: { $gte: fromTime, $lte: toTime },
    });

    // Check if there is at least one appointment
    if (appointments.length >= 1) {
      return res.status(200).send({
        message: "Appointments not available at this time", // Message for not available
        success: false,
      });
    } else {
      return res.status(200).send({
        success: true,
        message: "Appointments available", // Message for available
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error in Booking Availability",
    });
  }
};

// Cancel Appointment Controller
const cancelAppointmentController = async (req, res) => {
  try {
    const appointment = await appointmentModel.findById(req.body.appointmentId);
    if (!appointment) {
      return res.status(404).send({ success: false, message: "Appointment not found" });
    }
    appointment.status = "canceled";
    await appointment.save();

    const userEmail = appointment.userInfo.email; // Assuming user's email is stored in userInfo
    const emailSubject = "Your Appointment Has Been Cancelled";
    const emailBody = `
  <div style="font-family: Arial, sans-serif; background-color: #f4f4f9; padding: 20px; max-width: 600px; margin: auto; border-radius: 8px; line-height: 1.5;">
    <div style="text-align: center; padding: 20px;">
      <h2 style="color: #333; font-size: 24px;">Appointment Cancellation</h2>
    </div>

    <p style="font-size: 16px; color: #333;">Dear <strong style="color: #2c3e50;">${appointment.userInfo.name}</strong>,</p>
    
    <p style="font-size: 16px; color: #333;">
      Your appointment has been cancelled.
    </p>
    
    <p style="font-size: 16px; color: #333;">Please contact us if you have any questions.</p>
    
    <div style="border-top: 2px solid #e0e0e0; margin-top: 20px; padding-top: 20px;">
      <p style="font-size: 16px; color: #333;">Best regards, <br><strong>Your Healthcare Team</strong></p>
    </div>
  </div>
`;


    await sendEmail(userEmail, emailSubject, emailBody);


    res.status(200).send({ success: true, message: "Appointment canceled successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in Cancel Appointment Controller",
      error,
    });
  }
};

// Delete Appointment Controller
const deleteAppointmentController = async (req, res) => {
  try {
    const appointment = await appointmentModel.findByIdAndDelete(req.body.appointmentId);
    if (!appointment) {
      return res.status(404).send({ success: false, message: "Appointment not found" });
    }
    res.status(200).send({ success: true, message: "Appointment deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in Delete Appointment Controller",
      error,
    });
  }
};


// Reschedule Appointment Controller
const rescheduleAppointmentController = async (req, res) => {
  try {
    const { appointmentId, newDate, newTime } = req.body;

    // Validate input
    if (!appointmentId || !newDate || !newTime) {
      return res.status(400).send({ success: false, message: "Appointment ID, new date, and new time are required." });
    }

    // Parse and validate date and time using moment
    const formattedDate = moment(newDate, "DD-MM-YYYY", true).isValid()
      ? moment(newDate, "DD-MM-YYYY").toISOString()
      : null;
    const formattedTime = moment(newTime, "hh:mm A", true).isValid()
      ? moment(newTime, "hh:mm A").toISOString()
      : null;

    if (!formattedDate || !formattedTime) {
      return res.status(400).send({ success: false, message: "Invalid date or time format provided." });
    }

    // Find the appointment
    const appointment = await appointmentModel.findById(appointmentId);
    if (!appointment) {
      return res.status(404).send({ success: false, message: "Appointment not found." });
    }

    // Update the appointment
    appointment.date = formattedDate;
    appointment.time = formattedTime;
    appointment.status = "pending";
    await appointment.save();

    // Notify the doctor
    const doctorUser = await userModel.findById(appointment.doctorInfo.userId);
    if (!doctorUser) {
      return res.status(404).send({ success: false, message: "Doctor not found." });
    }

    // Format date and time for notification
    const notificationDate = moment(formattedDate).format("DD-MM-YYYY");
    const notificationTime = moment(formattedTime).format("hh:mm A");
    const notificationMessage = `Appointment with ${appointment.userInfo.name} has been rescheduled to ${notificationDate} at ${notificationTime}.`;

    // Push notification to the doctor
    doctorUser.notifcation.push({
      type: "appointment-rescheduled",
      message: notificationMessage,
      onClickPath: "/doctor/appointments",
    });
    await doctorUser.save();

    const userEmail = appointment.userInfo.email; // Assuming user's email is stored in userInfo
    const emailSubject = "Your Appointment Has Been Rescheduled";
    const emailBody = `
  <div style="font-family: Arial, sans-serif; background-color: #f4f4f9; padding: 20px; max-width: 600px; margin: auto; border-radius: 8px; line-height: 1.5;">
    <div style="text-align: center; padding: 20px;">
      <h2 style="color: #333; font-size: 24px;">Appointment Rescheduled</h2>
    </div>

    <p style="font-size: 16px; color: #333;">Dear <strong style="color: #2c3e50;">${appointment.userInfo.name}</strong>,</p>
    
    <p style="font-size: 16px; color: #333;">
      Your appointment has been rescheduled to <strong style="color: #2c3e50;">${notificationDate}</strong> at <strong style="color: #2c3e50;">${notificationTime}</strong>.
    </p>
    
    <p style="font-size: 16px; color: #333;">Please contact us if you have any questions.</p>
    
    <div style="border-top: 2px solid #e0e0e0; margin-top: 20px; padding-top: 20px;">
      <p style="font-size: 16px; color: #333;">Best regards, <br><strong>Your Healthcare Team</strong></p>
    </div>
  </div>
`;


    await sendEmail(userEmail, emailSubject, emailBody);

    res.status(200).send({
      success: true,
      message: "Appointment rescheduled successfully.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error in rescheduling appointment.",
      error: error.message,
    });
  }
};



// User Appointments Controller
const userAppointmentsController = async (req, res) => {
  // console.log(req.body)
  try {
    const appointments = await appointmentModel.find({
      userId: req.body.userId });
      // console.log(appointments)
    res.status(200).send({
      success: true,
      message: "User  Appointments Fetched Successfully",
      data: appointments,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error fetching user appointments",
      error,
    });
  }
};

module.exports = {
  loginController,
  registerController,
  authController,
  applyDoctorController,
  getAllNotificationController,
  deleteAllNotificationController,
  getAllDoctorsController,
  bookAppointmentController,
  bookingAvailabilityController,
  userAppointmentsController,
  cancelAppointmentController,
  deleteAppointmentController,
  rescheduleAppointmentController,
  checkDoctorLoginStatusController,
  deleteNotification,
  getUserDatabyId,
};
