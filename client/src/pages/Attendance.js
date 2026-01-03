import React, { useState, useEffect, useContext } from 'react';
import { Container, Card, Button, Table, Alert, Badge } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import { attendanceAPI } from '../services/api';
import Navbar from '../components/Navbar';

const Attendance = () => {
  const { user, isAdmin } = useContext(AuthContext);
  const [attendance, setAttendance] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    fetchAttendance();
    fetchTodayAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const params = isAdmin() ? {} : { userId: user.id };
      const response = await attendanceAPI.getAll(params);
      setAttendance(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayAttendance = async () => {
    if (!isAdmin()) {
      try {
        const response = await attendanceAPI.getToday();
        setTodayAttendance(response.data.data);
      } catch (err) {
        console.error('Failed to load today attendance:', err);
      }
    }
  };

  const handleCheckIn = async () => {
    setChecking(true);
    setError('');
    try {
      await attendanceAPI.checkIn({});
      await fetchTodayAttendance();
      await fetchAttendance();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to check in');
    } finally {
      setChecking(false);
    }
  };

  const handleCheckOut = async () => {
    setChecking(true);
    setError('');
    try {
      await attendanceAPI.checkOut({});
      await fetchTodayAttendance();
      await fetchAttendance();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to check out');
    } finally {
      setChecking(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      Present: 'success',
      Absent: 'danger',
      'Half-day': 'info',
      Leave: 'warning'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
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
        <h2 className="mb-4">Attendance</h2>
        {error && <Alert variant="danger">{error}</Alert>}

        {!isAdmin() && (
          <Card className="mb-4">
            <Card.Body>
              <h5>Today's Attendance</h5>
              {todayAttendance ? (
                <div>
                  <p>
                    Status: {getStatusBadge(todayAttendance.status || 'Absent')}
                  </p>
                  {todayAttendance.checkedIn && (
                    <p>Check In: {new Date(todayAttendance.checkInTime).toLocaleString()}</p>
                  )}
                  {todayAttendance.checkedOut && (
                    <p>Check Out: {new Date(todayAttendance.checkOutTime).toLocaleString()}</p>
                  )}
                  {!todayAttendance.checkedIn && (
                    <Button variant="success" onClick={handleCheckIn} disabled={checking}>
                      {checking ? 'Checking In...' : 'Check In'}
                    </Button>
                  )}
                  {todayAttendance.checkedIn && !todayAttendance.checkedOut && (
                    <Button variant="danger" onClick={handleCheckOut} disabled={checking}>
                      {checking ? 'Checking Out...' : 'Check Out'}
                    </Button>
                  )}
                </div>
              ) : (
                <div>
                  <p>No attendance record for today</p>
                  <Button variant="success" onClick={handleCheckIn} disabled={checking}>
                    {checking ? 'Checking In...' : 'Check In'}
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        )}

        <Card>
          <Card.Body>
            <h5 className="mb-3">Attendance Records</h5>
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead>
                  <tr>
                    {isAdmin() && <th>Employee Name</th>}
                    <th>Date</th>
                    <th>Day</th>
                    <th>Check In Time</th>
                    <th>Check Out Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.length > 0 ? (
                    attendance.map((record) => (
                      <tr key={record._id}>
                        {isAdmin() && (
                          <td>
                            {record.userId?.employeeId || 'N/A'}
                          </td>
                        )}
                        <td>{new Date(record.date).toLocaleDateString()}</td>
                        <td>{new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' })}</td>
                        <td>
                          {record.checkIn?.time
                            ? new Date(record.checkIn.time).toLocaleTimeString()
                            : '-'}
                        </td>
                        <td>
                          {record.checkOut?.time
                            ? new Date(record.checkOut.time).toLocaleTimeString()
                            : '-'}
                        </td>
                        <td>{getStatusBadge(record.status)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={isAdmin() ? 6 : 5} className="text-center">
                        No attendance records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </>
  );
};

export default Attendance;

