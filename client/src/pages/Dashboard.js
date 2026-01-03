import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import { profileAPI, attendanceAPI } from '../services/api';
import Navbar from '../components/Navbar';

const Dashboard = () => {
  const { user, isAdmin } = useContext(AuthContext);
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isAdmin()) {
          const response = await profileAPI.getAll();
          setEmployees(response.data.data || []);
        } else {
          const response = await attendanceAPI.getToday();
          setTodayAttendance(response.data.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin]);

  const handleViewProfile = (employeeId) => {
    navigate(`/profile/${employeeId}`);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <Container className="mt-4">
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Container className="mt-4">
        <h2 className="mb-4">Dashboard</h2>
        {error && <Alert variant="danger">{error}</Alert>}

        {isAdmin() ? (
          <div>
            <Row className="mb-3">
              <Col>
                <h4>Employees</h4>
              </Col>
            </Row>
            <Row>
              {employees.length > 0 ? (
                employees.map((employee) => (
                  <Col key={employee._id} md={4} lg={3} className="mb-4">
                    <Card className="employee-card h-100" onClick={() => handleViewProfile(employee.userId._id)}>
                      <Card.Body className="text-center">
                        <img
                          src={employee.profileImage || 'https://via.placeholder.com/100'}
                          alt={employee.firstName}
                          className="rounded-circle mb-3"
                          style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                        />
                        <Card.Title>
                          {employee.firstName} {employee.lastName}
                        </Card.Title>
                        <Card.Text className="text-muted">{employee.designation}</Card.Text>
                        <Button variant="outline-primary" size="sm">
                          View Profile
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                ))
              ) : (
                <Col>
                  <p>No employees found.</p>
                </Col>
              )}
            </Row>
          </div>
        ) : (
          <div>
            <Row>
              <Col md={6}>
                <Card>
                  <Card.Body>
                    <Card.Title>Today's Attendance</Card.Title>
                    {todayAttendance ? (
                      <div>
                        <p>
                          Status: <span className={`status-dot ${todayAttendance.status?.toLowerCase()}`}></span>
                          {todayAttendance.status || 'Absent'}
                        </p>
                        {todayAttendance.checkedIn && (
                          <p>Check In: {new Date(todayAttendance.checkInTime).toLocaleTimeString()}</p>
                        )}
                        {todayAttendance.checkedOut && (
                          <p>Check Out: {new Date(todayAttendance.checkOutTime).toLocaleTimeString()}</p>
                        )}
                      </div>
                    ) : (
                      <p>No attendance record for today</p>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Container>
    </>
  );
};

export default Dashboard;

