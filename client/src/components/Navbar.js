import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar as BootstrapNavbar, Nav, NavDropdown, Image } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout, isAdmin } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <BootstrapNavbar bg="light" expand="lg" className="shadow-sm">
      <div className="container-fluid">
        <BootstrapNavbar.Brand as={Link} to="/dashboard">
          <strong>Dayflow HRMS</strong>
        </BootstrapNavbar.Brand>
        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/dashboard">
              Dashboard
            </Nav.Link>
            <Nav.Link as={Link} to="/attendance">
              Attendance
            </Nav.Link>
            <Nav.Link as={Link} to="/leave">
              Time Off
            </Nav.Link>
            {isAdmin() && (
              <Nav.Link as={Link} to="/settings">
                Settings
              </Nav.Link>
            )}
          </Nav>
          <Nav>
            <NavDropdown
              title={
                <span>
                  <Image
                    src="https://via.placeholder.com/32"
                    roundedCircle
                    style={{ width: '32px', height: '32px', marginRight: '8px' }}
                  />
                  {user.employeeId}
                </span>
              }
              id="user-dropdown"
              show={showDropdown}
              onToggle={setShowDropdown}
            >
              <NavDropdown.Item as={Link} to="/profile/me">
                My Profile
              </NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item onClick={handleLogout}>
                Log Out
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </BootstrapNavbar.Collapse>
      </div>
    </BootstrapNavbar>
  );
};

export default Navbar;

