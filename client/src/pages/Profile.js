import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Row, Col, Alert, Tabs, Tab } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import { profileAPI, payrollAPI } from '../services/api';
import Navbar from '../components/Navbar';

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [payroll, setPayroll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({});

  const isOwnProfile = id === 'me' || (user && id === user.id);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileId = id === 'me' ? user.id : id;
        const response = await profileAPI.getById(profileId);
        setProfile(response.data.data);
        setFormData(response.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [id, user]);

  useEffect(() => {
    const fetchPayroll = async () => {
      if (isAdmin() && profile) {
        try {
          const currentMonth = new Date().toLocaleString('default', { month: 'long' });
          const currentYear = new Date().getFullYear();
          const response = await payrollAPI.getAll({
            userId: profile.userId._id,
            month: currentMonth,
            year: currentYear
          });
          if (response.data.data && response.data.data.length > 0) {
            setPayroll(response.data.data[0]);
          }
        } catch (err) {
          console.error('Failed to load payroll:', err);
        }
      }
    };

    if (activeTab === 'payroll' && profile) {
      fetchPayroll();
    }
  }, [activeTab, profile, isAdmin]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const profileId = id === 'me' ? user.id : id;
      await profileAPI.update(profileId, formData);
      setSuccess('Profile updated successfully');
      const response = await profileAPI.getById(profileId);
      setProfile(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePayrollSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const payrollData = {
        userId: profile.userId._id,
        basicSalary: parseFloat(formData.basicSalary) || 0,
        houseRentAllowance: parseFloat(formData.houseRentAllowance) || 0,
        medicalAllowance: parseFloat(formData.medicalAllowance) || 0,
        conveyanceAllowance: parseFloat(formData.conveyanceAllowance) || 0,
        specialAllowance: parseFloat(formData.specialAllowance) || 0,
        providentFund: parseFloat(formData.providentFund) || 0,
        professionalTax: parseFloat(formData.professionalTax) || 0,
        incomeTax: parseFloat(formData.incomeTax) || 0,
        month: new Date().toLocaleString('default', { month: 'long' }),
        year: new Date().getFullYear(),
        remarks: formData.remarks || ''
      };

      if (payroll) {
        await payrollAPI.update(payroll._id, payrollData);
      } else {
        await payrollAPI.create(payrollData);
      }
      setSuccess('Payroll updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update payroll');
    } finally {
      setSaving(false);
    }
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

  if (!profile) {
    return (
      <>
        <Navbar />
        <Container className="mt-4">
          <Alert variant="danger">Profile not found</Alert>
        </Container>
      </>
    );
  }

  const canEdit = isAdmin() || isOwnProfile;
  const viewOnly = !canEdit || (isOwnProfile && !isAdmin());

  return (
    <>
      <Navbar />
      <Container className="mt-4">
        <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4">
          <Tab eventKey="profile" title="My Profile">
            <Card>
              <Card.Body>
                <div className="text-center mb-4">
                  <img
                    src={profile.profileImage || 'https://via.placeholder.com/150'}
                    alt="Profile"
                    className="profile-avatar"
                  />
                  <h3 className="mt-3">
                    {profile.firstName} {profile.lastName}
                  </h3>
                </div>

                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}

                <Form onSubmit={handleSubmit}>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>First Name *</Form.Label>
                        <Form.Control
                          type="text"
                          name="firstName"
                          value={formData.firstName || ''}
                          onChange={handleChange}
                          required
                          disabled={viewOnly}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Last Name *</Form.Label>
                        <Form.Control
                          type="text"
                          name="lastName"
                          value={formData.lastName || ''}
                          onChange={handleChange}
                          required
                          disabled={viewOnly}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Email *</Form.Label>
                    <Form.Control
                      type="email"
                      value={profile.userId?.email || ''}
                      disabled
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Phone Number *</Form.Label>
                    <Form.Control
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber || ''}
                      onChange={handleChange}
                      required
                      disabled={viewOnly}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Address *</Form.Label>
                    <Form.Control
                      type="text"
                      name="address"
                      value={formData.address || ''}
                      onChange={handleChange}
                      required
                      disabled={viewOnly}
                    />
                  </Form.Group>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Date of Birth *</Form.Label>
                        <Form.Control
                          type="date"
                          name="dateOfBirth"
                          value={formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString().split('T')[0] : ''}
                          onChange={handleChange}
                          required
                          disabled={viewOnly}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Gender *</Form.Label>
                        <Form.Select
                          name="gender"
                          value={formData.gender || ''}
                          onChange={handleChange}
                          required
                          disabled={viewOnly}
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Marital Status *</Form.Label>
                    <Form.Select
                      name="maritalStatus"
                      value={formData.maritalStatus || ''}
                      onChange={handleChange}
                      required
                      disabled={viewOnly}
                    >
                      <option value="">Select Status</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                    </Form.Select>
                  </Form.Group>

                  <h5 className="mt-4 mb-3">Emergency Contact *</h5>
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="emergencyContact.name"
                          value={formData.emergencyContact?.name || ''}
                          onChange={handleChange}
                          required
                          disabled={viewOnly}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Phone</Form.Label>
                        <Form.Control
                          type="tel"
                          name="emergencyContact.phone"
                          value={formData.emergencyContact?.phone || ''}
                          onChange={handleChange}
                          required
                          disabled={viewOnly}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Relation</Form.Label>
                        <Form.Control
                          type="text"
                          name="emergencyContact.relation"
                          value={formData.emergencyContact?.relation || ''}
                          onChange={handleChange}
                          required
                          disabled={viewOnly}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <h5 className="mt-4 mb-3">Employment Details</h5>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Designation *</Form.Label>
                        <Form.Control
                          type="text"
                          name="designation"
                          value={formData.designation || ''}
                          onChange={handleChange}
                          required
                          disabled={viewOnly || !isAdmin()}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Department *</Form.Label>
                        <Form.Control
                          type="text"
                          name="department"
                          value={formData.department || ''}
                          onChange={handleChange}
                          required
                          disabled={viewOnly || !isAdmin()}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Date of Joining *</Form.Label>
                        <Form.Control
                          type="date"
                          name="dateOfJoining"
                          value={formData.dateOfJoining ? new Date(formData.dateOfJoining).toISOString().split('T')[0] : ''}
                          onChange={handleChange}
                          required
                          disabled={viewOnly || !isAdmin()}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Employee ID *</Form.Label>
                        <Form.Control
                          type="text"
                          value={formData.employeeId || ''}
                          disabled
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Reporting Manager</Form.Label>
                        <Form.Control
                          type="text"
                          name="reportingManager"
                          value={formData.reportingManager || ''}
                          onChange={handleChange}
                          disabled={viewOnly || !isAdmin()}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Employment Type *</Form.Label>
                        <Form.Select
                          name="employmentType"
                          value={formData.employmentType || ''}
                          onChange={handleChange}
                          required
                          disabled={viewOnly || !isAdmin()}
                        >
                          <option value="">Select Type</option>
                          <option value="Full-time">Full-time</option>
                          <option value="Part-time">Part-time</option>
                          <option value="Contract">Contract</option>
                          <option value="Intern">Intern</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  {isAdmin() && (
                    <Form.Group className="mb-3">
                      <Form.Label>Status *</Form.Label>
                      <Form.Select
                        name="status"
                        value={formData.status || ''}
                        onChange={handleChange}
                        required
                        disabled={viewOnly}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Terminated">Terminated</option>
                      </Form.Select>
                    </Form.Group>
                  )}

                  {canEdit && (
                    <Button variant="primary" type="submit" disabled={saving}>
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                  )}
                </Form>
              </Card.Body>
            </Card>
          </Tab>

          {isAdmin() && (
            <Tab eventKey="payroll" title="Salary Info">
              <Card>
                <Card.Body>
                  {error && <Alert variant="danger">{error}</Alert>}
                  {success && <Alert variant="success">{success}</Alert>}

                  <Form onSubmit={handlePayrollSubmit}>
                    <h5 className="mb-3">Salary Details</h5>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Basic Salary</Form.Label>
                          <Form.Control
                            type="number"
                            name="basicSalary"
                            value={formData.basicSalary || payroll?.basicSalary || ''}
                            onChange={handleChange}
                            step="0.01"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>House Rent Allowance</Form.Label>
                          <Form.Control
                            type="number"
                            name="houseRentAllowance"
                            value={formData.houseRentAllowance || payroll?.houseRentAllowance || ''}
                            onChange={handleChange}
                            step="0.01"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Medical Allowance</Form.Label>
                          <Form.Control
                            type="number"
                            name="medicalAllowance"
                            value={formData.medicalAllowance || payroll?.medicalAllowance || ''}
                            onChange={handleChange}
                            step="0.01"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Conveyance Allowance</Form.Label>
                          <Form.Control
                            type="number"
                            name="conveyanceAllowance"
                            value={formData.conveyanceAllowance || payroll?.conveyanceAllowance || ''}
                            onChange={handleChange}
                            step="0.01"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Label>Special Allowance</Form.Label>
                      <Form.Control
                        type="number"
                        name="specialAllowance"
                        value={formData.specialAllowance || payroll?.specialAllowance || ''}
                        onChange={handleChange}
                        step="0.01"
                      />
                    </Form.Group>

                    <hr />

                    <h5 className="mb-3">Deductions</h5>
                    <Row>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Provident Fund</Form.Label>
                          <Form.Control
                            type="number"
                            name="providentFund"
                            value={formData.providentFund || payroll?.providentFund || ''}
                            onChange={handleChange}
                            step="0.01"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Professional Tax</Form.Label>
                          <Form.Control
                            type="number"
                            name="professionalTax"
                            value={formData.professionalTax || payroll?.professionalTax || ''}
                            onChange={handleChange}
                            step="0.01"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Income Tax</Form.Label>
                          <Form.Control
                            type="number"
                            name="incomeTax"
                            value={formData.incomeTax || payroll?.incomeTax || ''}
                            onChange={handleChange}
                            step="0.01"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Label>Remarks</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="remarks"
                        value={formData.remarks || payroll?.remarks || ''}
                        onChange={handleChange}
                      />
                    </Form.Group>

                    <Button variant="primary" type="submit" disabled={saving}>
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Tab>
          )}
        </Tabs>
      </Container>
    </>
  );
};

export default Profile;

