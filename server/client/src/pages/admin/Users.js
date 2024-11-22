import React, { useEffect, useState } from "react";
import Layout from "./../../components/Layout";
import axios from "axios";
import { message, Table } from "antd";

const Users = () => {
  const [users, setUsers] = useState([]);

  // Fetch all users
  const getUsers = async () => {
    try {
      const res = await axios.get("http://localhost:7000/api/v1/admin/getAllUsers", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getUsers();
  }, []);

  // Block/Unblock user
  const handleBlockUnblock = async (record, isUserBlock) => {
    try {
      const res = await axios.post(
        "http://localhost:7000/api/v1/admin/toggleBlockUser",
        {
          userId: record._id, isUserBlock:isUserBlock
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (res.data.success) {
        message.success(res.data.message);
        // window.location.reload();
        console.log(res.data)
        getUsers(); // Refresh the user list
      } else {
        message.error(res.data.message);
      }
    } catch (error) {
      console.log(error);
      message.error("Something went wrong!");
    }
  };

  // Define table columns
  const columns = [
    {
      title: "Name",
      dataIndex: "name",
    },
    {
      title: "Email",
      dataIndex: "email",
    },
    {
      title: "Doctor",
      dataIndex: "isDoctor",
      render: (text, record) => <span>{record.isDoctor ? "Yes" : "No"}</span>,
    },
    {
      title: "Actions",
      dataIndex: "actions",
      render: (text, record) => (
        <div className="d-flex">
          {record.isUserBlock === "blocked" ? (
            <button
              className="btn btn-success"
              onClick={() => handleBlockUnblock(record, "unblocked")}
              // disabled={record.isAdmin} // Disable the button if the user is an admin
            >
              Unblock
            </button>
          ) : (
            <button
              className="btn btn-danger"
              onClick={() => handleBlockUnblock(record, "blocked")}
              // disabled={record.isAdmin} // Disable the button if the user is an admin
            >
              Block
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <Layout>
    <div style={{ height: 'calc(100vh - 100px)', justifyContent: 'center' }}>
      <h1 className="text-center m-2">Users List</h1>
      <Table 
        columns={columns} 
        dataSource={users} // Filter out users with isDoctor true
        rowKey="_id" 
      />
    </div>
  </Layout>
  );
};

export default Users;
