import React, { useState, useEffect, useContext } from 'react';
import { Container, Card, Table, Button, Alert, Badge } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import { profileAPI } from '../services/api';
import Navbar from '../components/Navbar';

const Settings = () => {
  const { isAdmin } = useContext(AuthContext);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAdmin()) {
      fetchEmployees();
    }
  }, [isAdmin]);

  const fetchEmployees = async () => {
    try {
      const response = await profileAPI.getAll();
      setEmployees(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (employee) => {
    try {
      const newStatus = employee.status === 'Active' ? 'Inactive' : 'Active';
      await profileAPI.update(employee.userId._id, { status: newStatus });
      await fetchEmployees();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update employee status');
    }
  };

  if (!isAdmin()) {
    return (
      <>
        <Navbar />
        <Container className="mt-4">
          <Alert variant="warning">You don't have permission to access this page.</Alert>
        </Container>
      </>
    );
  }

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
        <h2 className="mb-4">Settings</h2>
        {error && <Alert variant="danger">{error}</Alert>}

        <Card>
          <Card.Body>
            <h5 className="mb-3">Employee Management</h5>
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.length > 0 ? (
                    employees.map((employee) => (
                      <tr key={employee._id}>
                        <td>{employee.employeeId}</td>
                        <td>
                          {employee.firstName} {employee.lastName}
                        </td>
                        <td>{employee.userId?.email || 'N/A'}</td>
                        <td>{employee.department}</td>
                        <td>
                          <Badge bg={employee.status === 'Active' ? 'success' : 'danger'}>
                            {employee.status}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant={employee.status === 'Active' ? 'danger' : 'success'}
                            size="sm"
                            onClick={() => handleToggleStatus(employee)}
                          >
                            {employee.status === 'Active' ? 'Deactivate' : 'Activate'}
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center">
                        No employees found
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

export default Settings;

