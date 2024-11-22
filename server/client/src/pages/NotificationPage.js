import React, { useEffect, useState } from "react";
import Layout from "./../components/Layout";
import { message, Tabs, Modal } from "antd"; // Import Modal
import { useSelector, useDispatch } from "react-redux";
import { showLoading, hideLoading } from "../redux/features/alertSlice";
import axios from "axios";
import moment from "moment"; // Import moment.js
import "../styles/NotificationPage.css";

const NotificationPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);

  // State to store the selected notification for modal
  const [selectedNotification, setSelectedNotification] = useState(null);

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    try {
      dispatch(showLoading());
      const res = await axios.post(
        "http://localhost:7000/api/v1/user/get-all-notification",
        { userId: user._id },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      dispatch(hideLoading());
      if (res.data.success) {
        message.success(res.data.message);
        window.location.reload();

      } else {
        message.error(res.data.message);
      }
    } catch (error) {
      dispatch(hideLoading());
      console.error(error);
      message.error("Something went wrong");
    }
  };

  // Delete all read notifications
  const handleDeleteAllRead = async () => {
    try {
      dispatch(showLoading());
      const res = await axios.post(
        "http://localhost:7000/api/v1/user/delete-all-notification",
        { userId: user._id },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      dispatch(hideLoading());
      if (res.data.success) {
        message.success(res.data.message);
        window.location.reload();
      } else {
        message.error(res.data.message);
      }
    } catch (error) {
      dispatch(hideLoading());
      console.error(error);
      message.error("Something went wrong in notifications");
    }
  };

  // Confirm deletion of a notification
  const confirmDeleteNotification = (notificationId) => {
    Modal.confirm({
      title: "Are you sure you want to delete this notification?",
      content: "This action cannot be undone.",
      onOk: () => handleDeleteNotification(notificationId),
    });
  };

  // Delete a single notification
  const handleDeleteNotification = async (notificationId) => {
    try {
      dispatch(showLoading());
      const res = await axios.delete(
        "http://localhost:7000/api/v1/user/delete-One-Notification",
        {
          data: { notificationId: notificationId, userId: user._id },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      dispatch(hideLoading());
      if (res.data.success) {
        message.success(res.data.message);
        dispatch({
          type: "DELETE_NOTIFICATION",
          payload: notificationId,
        });
      } else {
        message.error(res.data.message);
      }
    } catch (error) {
      dispatch(hideLoading());
      console.error(error);
      message.error("Failed to delete notification");
    }
  };

  // Sort notifications by time
  const sortNotificationsByTime = (notifications) => {
    return [...notifications].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  };

  // Format date using moment.js
  const formatDate = (date) => {
    if (!date) return "Invalid Date"; // Handle null or undefined dates

    const momentDate = moment(date); // Try parsing the date using moment.js

    if (!momentDate.isValid()) {
      return "Invalid Date"; // Return fallback if invalid date
    }

    // Return the formatted date
    return momentDate.format("MMMM Do YYYY, h:mm:ss a");
  };

  // Handle click on notification to show the modal
  const handleNotificationClick = (notification) => {
    setSelectedNotification(notification);
  };

  // Close the modal
  const handleCloseModal = () => {
    setSelectedNotification(null);
  };

  useEffect(() => {
    handleMarkAllRead();
    handleDeleteAllRead();
  }, []);

  return (
    <Layout>
      <h4 className="text-center">Notification Page</h4>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "80vw",
          height: "80vh",
          backgroundColor:'#fff',
          marginLeft:'120px'
        }}
      >
        <div style={{ width: "80%" }}>
          <Tabs>
            {/* Unread Notifications */}
            <Tabs.TabPane tab="Unread" key={0}>
              <div className="d-flex justify-content-end">
                <h4
                  className="p-2"
                  onClick={handleMarkAllRead}
                  style={{ cursor: "pointer" }}
                >
                  Mark All Read
                </h4>
              </div>
              <div className="notification-scrollable">
                {sortNotificationsByTime(user?.notifcation || []).map((notificationMgs) => {
                  return (
                    <div
                      key={notificationMgs._id}
                      className="notification-card"
                      onClick={() => handleNotificationClick(notificationMgs)}
                    >
                      <div className="card-header">
                        <p>Messages for You Doctor.</p>
                      </div>
                      <div className="card-body">
                        <small>{formatDate(notificationMgs.createdAt)}</small>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Tabs.TabPane>

            {/* Read Notifications */}
            <Tabs.TabPane tab="Read" key={1}>
              <div className="d-flex justify-content-end">
                <h4
                  className="p-2 text-primary"
                  style={{ cursor: "pointer" }}
                  onClick={handleDeleteAllRead}
                >
                  Delete All Read
                </h4>
              </div>
              <div className="notification-scrollable">
                {sortNotificationsByTime(user?.seennotification || []).map((notificationMgs) => {
                  return (
                    <div
                      key={notificationMgs._id}
                      className="notification-card"
                      onClick={() => handleNotificationClick(notificationMgs)}
                    >
                      <div className="card-header">
                        <p>Messages for You Doctor.</p>
                      </div>
                      <div className="card-body">
                        <small>{formatDate(notificationMgs.createdAt)}</small>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Tabs.TabPane>
          </Tabs>
        </div>
      </div>

      {/* Modal for displaying full notification message */}
      <Modal
        title="Notification Details"
        visible={!!selectedNotification}
        onCancel={handleCloseModal}
        footer={null}
      >
        {selectedNotification && (
          <>
            <h4>Message:</h4>
            <p>{selectedNotification.message}</p>
            <p>
              <small>{formatDate(selectedNotification.createdAt)}</small>
            </p>
          </>
        )}
      </Modal>
    </Layout>
  );
};

export default NotificationPage;
