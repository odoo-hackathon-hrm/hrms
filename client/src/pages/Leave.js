import React, { useState, useEffect, useContext } from 'react';
import { Container, Card, Button, Table, Alert, Badge, Modal, Form, Tabs, Tab } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import { leaveAPI } from '../services/api';
import Navbar from '../components/Navbar';

const Leave = () => {
  const { user, isAdmin } = useContext(AuthContext);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [actionType, setActionType] = useState('');
  const [formData, setFormData] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [adminComment, setAdminComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      const response = await leaveAPI.getAll();
      setLeaveRequests(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await leaveAPI.create(formData);
      setShowModal(false);
      setFormData({ leaveType: '', startDate: '', endDate: '', reason: '' });
      await fetchLeaveRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create leave request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    setError('');
    setSubmitting(true);

    try {
      await leaveAPI.approve(selectedLeave._id, { adminComment });
      setShowActionModal(false);
      setAdminComment('');
      setSelectedLeave(null);
      await fetchLeaveRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve leave request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!adminComment.trim()) {
      setError('Please provide a comment for rejection');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      await leaveAPI.reject(selectedLeave._id, { adminComment });
      setShowActionModal(false);
      setAdminComment('');
      setSelectedLeave(null);
      await fetchLeaveRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject leave request');
    } finally {
      setSubmitting(false);
    }
  };

  const openActionModal = (leave, type) => {
    setSelectedLeave(leave);
    setActionType(type);
    setAdminComment('');
    setShowActionModal(true);
  };

  const getStatusBadge = (status) => {
    const variants = {
      Pending: 'warning',
      Approved: 'success',
      Rejected: 'danger'
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
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Time Off</h2>
          {!isAdmin() && (
            <Button variant="primary" onClick={() => setShowModal(true)}>
              New Time Off Request
            </Button>
          )}
        </div>
        {error && <Alert variant="danger">{error}</Alert>}

        <Card>
          <Card.Body>
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead>
                  <tr>
                    {isAdmin() && <th>Employee Name</th>}
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Time Off Type</th>
                    <th>Status</th>
                    {isAdmin() && <th>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {leaveRequests.length > 0 ? (
                    leaveRequests.map((leave) => (
                      <tr key={leave._id}>
                        {isAdmin() && (
                          <td>{leave.userId?.employeeId || 'N/A'}</td>
                        )}
                        <td>{new Date(leave.startDate).toLocaleDateString()}</td>
                        <td>{new Date(leave.endDate).toLocaleDateString()}</td>
                        <td>{leave.leaveType}</td>
                        <td>{getStatusBadge(leave.status)}</td>
                        {isAdmin() && leave.status === 'Pending' && (
                          <td>
                            <Button
                              variant="success"
                              size="sm"
                              className="me-2"
                              onClick={() => openActionModal(leave, 'approve')}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => openActionModal(leave, 'reject')}
                            >
                              Reject
                            </Button>
                          </td>
                        )}
                        {isAdmin() && leave.status !== 'Pending' && (
                          <td>-</td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={isAdmin() ? 6 : 5} className="text-center">
                        No leave requests found
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>

        {/* New Leave Request Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>New Time Off Request</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={handleCreateRequest}>
              <Form.Group className="mb-3">
                <Form.Label>Request Type *</Form.Label>
                <Form.Select
                  name="leaveType"
                  value={formData.leaveType}
                  onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                  required
                >
                  <option value="">Select Type</option>
                  <option value="Paid Time off">Paid Time off</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Unpaid Leaves">Unpaid Leaves</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Start Date *</Form.Label>
                <Form.Control
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>End Date *</Form.Label>
                <Form.Control
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Reason *</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  required
                />
              </Form.Group>
              <Button variant="primary" type="submit" disabled={submitting} className="w-100">
                {submitting ? 'Submitting...' : 'Submit'}
              </Button>
            </Form>
          </Modal.Body>
        </Modal>

        {/* Approve/Reject Modal */}
        <Modal show={showActionModal} onHide={() => setShowActionModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>
              {actionType === 'approve' ? 'Approve' : 'Reject'} Leave Request
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedLeave && (
              <div className="mb-3">
                <p><strong>Employee:</strong> {selectedLeave.userId?.employeeId}</p>
                <p><strong>Type:</strong> {selectedLeave.leaveType}</p>
                <p><strong>Period:</strong> {new Date(selectedLeave.startDate).toLocaleDateString()} - {new Date(selectedLeave.endDate).toLocaleDateString()}</p>
                <p><strong>Reason:</strong> {selectedLeave.reason}</p>
              </div>
            )}
            <Form.Group className="mb-3">
              <Form.Label>Comment {actionType === 'reject' && '*'}</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={adminComment}
                onChange={(e) => setAdminComment(e.target.value)}
                required={actionType === 'reject'}
                placeholder={actionType === 'reject' ? 'Please provide a reason for rejection' : 'Optional comment'}
              />
            </Form.Group>
            <div className="d-flex gap-2">
              <Button
                variant={actionType === 'approve' ? 'success' : 'danger'}
                onClick={actionType === 'approve' ? handleApprove : handleReject}
                disabled={submitting || (actionType === 'reject' && !adminComment.trim())}
                className="flex-fill"
              >
                {submitting ? 'Processing...' : actionType === 'approve' ? 'Approve' : 'Reject'}
              </Button>
              <Button variant="secondary" onClick={() => setShowActionModal(false)} className="flex-fill">
                Cancel
              </Button>
            </div>
          </Modal.Body>
        </Modal>
      </Container>
    </>
  );
};

export default Leave;

