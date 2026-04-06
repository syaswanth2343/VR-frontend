import React, { useState, useRef } from 'react';
import RegisteredStudents from './RegisteredStudents';
import { topics as topicsApi, pdfs as pdfsApi, users, loginHistory, reports } from '../api/databaseAPI';
import './AdminDashboard.css';

function AdminDashboard({ onLogout, adminName, adminId }) {
  const API_BASE = import.meta.env.VITE_API_BASE || '/api';
  const backendOrigin = API_BASE.startsWith('http') ? API_BASE.replace(/\/api\/?$/, '') : '';
  const toBackendAbsoluteUrl = (url) => {
    if (!url) return url;
    if (url.startsWith('http')) return url;
    return backendOrigin ? `${backendOrigin}${url}` : url;
  };

  const [activeSection, setActiveSection] = useState('dashboard');
  
  const [topics, setTopics] = useState([]);
  const [backendAlive, setBackendAlive] = useState(true);

  const [users, setUsers] = useState([]);
  const [reportData, setReportData] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [newTopic, setNewTopic] = useState({
    title: '',
    description: '',
    instructor: '',
    level: ''
  });
  const [selectedUser, setSelectedUser] = useState(null); // hold user details for modal
  const [userHistory, setUserHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editForm, setEditForm] = useState({ full_name: '', phone: '', role: '', is_active: true, password: '' });
  const [newTopicFile, setNewTopicFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleAddTopic = async (e) => {
    e.preventDefault();
    if (newTopic.title.trim() && newTopic.description.trim() && newTopic.instructor.trim()) {
      try {
        const result = await topicsApi.create(newTopic.title, newTopic.description, newTopic.instructor, newTopic.level);
        console.log('create topic response', result);
        if (result && result.ok) {
          const topicId = result.topicId;
          // if file chosen, upload it now
          if (newTopicFile) {
            try {
              const token = localStorage.getItem('authToken');
              const form = new FormData();
              form.append('file', newTopicFile);
              const uploadRes = await fetch(`${API_BASE}/pdfs/upload?topicId=${topicId}`, {
                method: 'POST',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                body: form
              });
              if (!uploadRes.ok) {
                console.error('PDF upload failed during topic add', uploadRes.status, await uploadRes.text());
              }
            } catch (uploadErr) {
              console.error('Error uploading pdf during topic creation', uploadErr);
            }
          }
          await fetchTopics();
          await fetchPdfs();
          setNewTopic({ title: '', description: '', instructor: '', level: '' });
          setNewTopicFile(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
          setShowAddModal(false);
          alert('Topic added successfully!');
        } else {
          alert(result?.message || 'Failed to add topic');
        }
      } catch (err) {
        console.error('add topic error', err);
        if (err && err.message && err.message.toLowerCase().includes('failed to fetch')) {
          alert('Unable to contact backend server. Is it running on port 5000?');
        } else {
          alert('Failed to add topic: ' + (err.message || err));
        }
      }
    }
  };
  const handleOpenEditModal = (topic) => {
    setEditingTopic(topic);
    setShowEditModal(true);
    setNewTopic({
      title: topic.title || '',
      description: topic.description || '',
      instructor: topic.instructor || '',
      level: topic.level || ''
    });
  };

  const handleUpdateTopic = async (e) => {
    e.preventDefault();
    if (!editingTopic) return;
    try {
      const result = await topicsApi.update(
        editingTopic.id,
        newTopic.title,
        newTopic.description,
        newTopic.instructor,
        newTopic.level
      );
      if (result && result.ok) {
        fetchTopics();
        setEditingTopic(null);
        setShowEditModal(false);
        setNewTopic({ title: '', description: '', instructor: '', level: '' });
        alert('Topic updated successfully!');
      } else {
        alert(result.message || 'Failed to update topic');
      }
    } catch (err) {
      console.error('update topic error', err);
      alert('Failed to update topic');
    }
  };
  const handleDeleteTopic = async (id) => {
    if (confirm('Are you sure you want to delete this topic?')) {
      try {
        const result = await topicsApi.remove(id);
        if (result && result.ok) {
          fetchTopics();
        } else {
          alert(result.message || 'Failed to delete topic');
        }
      } catch (err) {
        console.error('delete topic error', err);
        alert('Failed to delete topic');
      }
    }
  };

  // removed redundant placeholder delete function. Actual API-backed delete defined below.

  const handleViewUser = async (id) => {
    try {
      const details = await users.getDetails(id);
      setSelectedUser(details);
      // populate edit form
      setEditForm({
        full_name: details.full_name || '',
        phone: details.phone || '',
        role: details.role,
        is_active: details.is_active,
        password: ''
      });
    } catch (err) {
      console.error('Error loading user details', err);
    }
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;
    try {
      // if password is empty string, remove it so backend doesn't overwrite
      const payload = { ...editForm };
      if (payload.password === '') delete payload.password;
      await users.update(selectedUser.id, payload);
      // refresh list and details
      fetchUsers();
      const updated = await users.getDetails(selectedUser.id);
      setSelectedUser(updated);
      alert('User updated');
    } catch (err) {
      console.error('update user error', err);
      alert('Failed to update user');
    }
  };

  const handleDeleteUser = async (id) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await users.remove(id);
        setUsers(users.filter(user => user.id !== id));
      } catch (err) {
        console.error('delete user api error', err);
        alert('Failed to delete user');
      }
    }
  };

  const handleEditChange = e => {
    const { name, type, value, checked } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // fetch users from backend
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const list = await users.list(token);
      if (Array.isArray(list)) {
        setUsers(list);
      } else {
        console.warn('fetchUsers returned non-array', list);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  // Dashboard Overview
  const renderDashboard = () => (
    <main className="dashboard-main">
      <div className="dashboard-top-bar">
        <h2>Dashboard Overview</h2>
        {adminId && <div className="admin-id-display">ID: {adminId}</div>}
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{topics.length}</div>
          <div className="stat-label">Total Topics</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{users.length}</div>
          <div className="stat-label">Total Users</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{users.filter(u => u.role === 'student').length}</div>
          <div className="stat-label">Active Students</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{users.filter(u => u.role === 'admin').length}</div>
          <div className="stat-label">Total Admins</div>
        </div>
        {reportData && (
          <>
            <div className="stat-card">
              <div className="stat-number">{reportData.totalEnrollments ?? 0}</div>
              <div className="stat-label">Total Enrollments</div>
            </div>
          </>
        )}
      </div>

      <div className="recent-section">
        <h3>Recent Activity</h3>
        <div className="activity-list">
          <div className="activity-item">
            <span className="activity-time">2 hours ago</span>
            <span className="activity-text">New student registered</span>
          </div>
          <div className="activity-item">
            <span className="activity-time">5 hours ago</span>
            <span className="activity-text">Topic "React Basics" was created</span>
          </div>
          <div className="activity-item">
            <span className="activity-time">1 day ago</span>
            <span className="activity-text">System backup completed</span>
          </div>
        </div>
      </div>
      {reportData && reportData.enrollmentsByTopic && reportData.enrollmentsByTopic.length > 0 && (
        <div className="report-section">
          <h3>Top Enrolled Topics</h3>
          <ul>
            {reportData.enrollmentsByTopic.map(t => (
              <li key={t.topicId}>{t.title} ({t.enrolled} enrollments)</li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );

  // Manage Topics Section
  const renderManageTopics = () => (
    <main className="dashboard-main">
      <div className="dashboard-top-bar">
        <h2>Topics Management</h2>
        <button
          className="btn-add"
          onClick={() => { setShowAddModal(true); setNewTopic({ title: '', description: '', instructor: '', level: '' }); setNewTopicFile(null); }}
          disabled={!backendAlive}
          title={!backendAlive ? 'Cannot add while backend is unreachable' : ''}
        >
          + Add New Topic
        </button>
        {!backendAlive && (
          <div className="backend-warning">Backend server not reachable – check it is running on port 5000</div>
        )}
      </div>

      <div className="topics-grid">
        {topics.map(topic => (
          <div key={topic.id} className="topic-card">
            <div className="topic-header">
              <h3>{topic.title}</h3>
              {topic.level && <span className="topic-level-badge">{topic.level}</span>}
              <button 
                className="btn-delete"
                onClick={() => handleDeleteTopic(topic.id)}
                title="Delete"
              >
                ✕
              </button>
            </div>
            <p className="topic-description">{topic.description}</p>
            <div className="topic-footer">
              <span className="instructor">👨‍🏫 {topic.instructor}</span>
              <button className="btn-edit" onClick={() => handleOpenEditModal(topic)}>Edit</button>
            </div>
            <div className="topic-pdf">
              <label className="btn-add">
                Upload PDF
                <input type="file" accept="application/pdf" onChange={e => handlePdfUpload(e, topic.id)} style={{display:'none'}} />
              </label>
              {topic.pdfUrl && (
                <a href={topic.pdfUrl} target="_blank" rel="noreferrer" download className="btn-secondary">Download PDF</a>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );

  // Users Section
  const renderUsers = () => (
    <main className="dashboard-main">
      <div className="dashboard-top-bar">
        <h2>User Management</h2>
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="user-search"
        />
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Code</th>
              <th>Username</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users
              .filter(u => {
                const term = searchTerm.toLowerCase();
                return (
                  u.username?.toLowerCase().includes(term) ||
                  (u.full_name || '').toLowerCase().includes(term) ||
                  u.email?.toLowerCase().includes(term) ||
                  u.user_code?.toLowerCase().includes(term)
                );
              })
              .map(user => (
              <tr key={user.id}>
                <td>#{user.id}</td>
                <td>{user.user_code || '—'}</td>
                <td>{user.username || '—'}</td>
                <td>{user.full_name || '—'}</td>
                <td>{user.email}</td>
                <td><span className={`role-badge role-${user.role.toLowerCase()}`}>{user.role}</span></td>
                <td>
                  <span className={`status-badge ${user.is_active ? 'status-active' : 'status-inactive'}`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <button className="btn-small btn-edit" onClick={() => handleViewUser(user.id)}>View</button>
                  <button 
                    className="btn-small btn-delete-inline"
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* user edit modal */}
      {selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Edit User</h2>
            <p><strong>ID:</strong> {selectedUser.id}</p>
            <p><strong>Code:</strong> {selectedUser.user_code || '—'}</p>
            <p><strong>Username:</strong> {selectedUser.username}</p>
            <div className="form-group">
              <label>Full name:</label>
              <input
                type="text"
                name="full_name"
                value={editForm.full_name}
                onChange={handleEditChange}
              />
            </div>
            <div className="form-group">
              <label>Phone:</label>
              <input
                type="tel"
                name="phone"
                value={editForm.phone}
                onChange={handleEditChange}
              />
            </div>
            <div className="form-group">
              <label>Role:</label>
              <select
                name="role"
                value={editForm.role}
                onChange={handleEditChange}
              >
                <option value="student">Student</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="form-group checkbox">
              <input
                type="checkbox"
                id="edit-active"
                name="is_active"
                checked={editForm.is_active}
                onChange={handleEditChange}
              />
              <label htmlFor="edit-active">Active</label>
            </div>
            <div className="form-group">
              <label>New Password:</label>
              <input
                type="password"
                name="password"
                value={editForm.password}
                onChange={handleEditChange}
                placeholder="Leave blank to keep existing"
              />
            </div>
            <div className="modal-actions">
              <button className="btn-primary" onClick={handleSaveUser}>Save</button>
              <button className="btn-secondary" onClick={() => { setSelectedUser(null); setUserHistory([]); }}>Cancel</button>
            </div>
            {userHistory.length > 0 && (
              <div className="history-section" style={{ marginTop: '24px' }}>
                <h3>Login History</h3>
                <ul className="history-list">
                  {userHistory.map(h => (
                    <li key={h.id}>
                      {new Date(h.login_time).toLocaleString()} – {h.ip_address || 'unknown'} – {h.device_type || 'unknown'}
                      {h.logout_time && ` (logout ${new Date(h.logout_time).toLocaleString()})`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {selectedUser && selectedUser.settings && (
              <div className="history-section" style={{ marginTop: '24px' }}>
                <h3>Preferences</h3>
                <pre style={{ whiteSpace: 'pre-wrap', fontSize: '13px' }}>
                  {JSON.stringify(selectedUser.settings, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );

  // Reports Section
  const renderReports = () => (
    <main className="dashboard-main">
      <div className="dashboard-top-bar">
        <h2>Reports & Analytics</h2>
      </div>

      <div className="reports-container">
        {!reportData ? (
          <p>Loading report data...</p>
        ) : (
          <>
            <div className="report-section">
              <h3>📊 Summary</h3>
              <div className="report-content">
                <div className="report-item">
                  <span>Total Users:</span>
                  <strong>{reportData.totalUsers}</strong>
                </div>
                <div className="report-item">
                  <span>Total Students:</span>
                  <strong>{reportData.totalStudents}</strong>
                </div>
                <div className="report-item">
                  <span>Total Admins:</span>
                  <strong>{reportData.totalAdmins}</strong>
                </div>
                <div className="report-item">
                  <span>Total Topics:</span>
                  <strong>{reportData.totalTopics}</strong>
                </div>
                <div className="report-item">
                  <span>Total Enrollments:</span>
                  <strong>{reportData.totalEnrollments}</strong>
                </div>
                <div className="report-item">
                  <span>New Users (30d):</span>
                  <strong>{reportData.newUsersMonth}</strong>
                </div>
                <div className="report-item">
                  <span>New Users (1yr):</span>
                  <strong>{reportData.newUsersYear}</strong>
                </div>
                {reportData.growthRatePercent != null && (
                  <div className="report-item">
                    <span>Growth Rate:</span>
                    <strong>{reportData.growthRatePercent}%</strong>
                  </div>
                )}
              </div>
            </div>

            <div className="report-section">
              <h3>📈 Top Enrolled Topics</h3>
              {reportData.enrollmentsByTopic && reportData.enrollmentsByTopic.length > 0 ? (
                (() => {
                  const max = Math.max(...reportData.enrollmentsByTopic.map(x => x.enrolled));
                  return (
                    <div className="bar-chart">
                      {reportData.enrollmentsByTopic.map(t => (
                        <div key={t.topicId} className="bar-item">
                          <span className="label">{t.title}</span>
                          <div
                            className="bar"
                            style={{ width: `${(t.enrolled / max) * 100}%` }}
                          ></div>
                          <span className="value">{t.enrolled}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()
              ) : (
                <p>No enrollment data available</p>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );


  // PDF management
  const [pdfs, setPdfs] = useState([]);
  
  // render a standalone list of all pdfs (admin view)
  const renderPdfs = () => (
    <main className="dashboard-main">
      <div className="dashboard-top-bar">
        <h2>Uploaded PDF Files</h2>
      </div>
      <div className="pdfs-list">
        {pdfs.length > 0 ? (
          <table className="pdfs-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Original Name</th>
                <th>Topic</th>
                <th>Uploader</th>
                <th>Size</th>
                <th>Uploaded</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pdfs.map(p => (
                <tr key={p.id}>
                  <td>#{p.id}</td>
                  <td>{p.original_name || p.filename}</td>
                  <td>{p.topic_title || '—'}</td>
                  <td>{p.uploader_id || '—'}</td>
                  <td>{(p.size/1024).toFixed(1)} KB</td>
                  <td>{new Date(p.uploaded_at).toLocaleString()}</td>
                  <td>
                    <a href={p.url} target="_blank" rel="noreferrer" download className="btn-small btn-secondary">Download</a>
                    <button className="btn-small btn-delete-inline" onClick={() => {
                      if (confirm('Delete this file?')) {
                        pdfsApi.remove(p.id).then(() => fetchPdfs());
                      }
                    }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No PDFs uploaded yet.</p>
        )}
      </div>
    </main>
  );
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fetchPdfs = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const list = await pdfsApi.list(token);
      setPdfs(list);
      // map any existing pdf files to topics so download links persist across reloads
      setTopics(current => {
        if (!Array.isArray(current)) {
          // unexpected value, just return it so we don't crash
          console.warn('fetchPdfs: topics state is not array', current);
          return current;
        }
        return current.map(t => {
          const pdf = list.find(p => (p.topicId === t.id) || (p.topic_id === t.id));
          if (!pdf) return t;
          const fullUrl = toBackendAbsoluteUrl(pdf.url);
          return { ...t, pdfUrl: fullUrl };
        });
      });
    } catch (err) {
      console.error('fetchPdfs error', err);
    }
  };

  const fetchReports = async () => {
    try {
      const data = await reports.summary();
      setReportData(data);
    } catch (e) {
      console.error('fetchReports error', e);
    }
  };

  // debugging: log mount
  React.useEffect(() => {
    console.log('AdminDashboard mounted');
  }, []);

  // fetch topics from backend
  const fetchTopics = async () => {
    try {
      const list = await topicsApi.list();
      if (!Array.isArray(list)) {
        console.warn('fetchTopics received non-array', list);
        setTopics([]);
      } else {
        setTopics(list);
      }
      return list;
    } catch (err) {
      console.error('fetchTopics error', err);
      return [];
    }
  };

  const checkBackend = async () => {
    try {
      await topicsApi.health();
      setBackendAlive(true);
    } catch (err) {
      console.warn('Backend health check failed', err);
      setBackendAlive(false);
    }
  };

  // load topics then pdf list when admin dashboard mounts
  React.useEffect(() => {
    const init = async () => {
      await fetchTopics();
      await fetchPdfs();
      await checkBackend();
      await fetchUsers();
      await fetchReports();
    };
    init();
  }, []);

  // if user navigates to reports tab later, refresh data
  React.useEffect(() => {
    if (activeSection === 'reports') {
      fetchReports();
    }
  }, [activeSection]);

  const handlePdfUpload = async (e, topicId) => {
    const file = e.target.files[0];
    if (!file) return;
    const maxBytes = 50 * 1024 * 1024;
    // some browsers report PDFs as `application/x-pdf` or similar;
    // just make sure the type string contains "pdf" so legitimate files aren't
    // rejected.
    if (!file.type.toLowerCase().includes('pdf')) { alert('Please select a PDF file'); e.target.value = ''; return; }
    if (file.size > maxBytes) { alert('File is too large (max 50MB)'); e.target.value = ''; return; }
    setUploading(true);
    try {
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const token = localStorage.getItem('authToken');
        xhr.open('POST', `${API_BASE}/pdfs/upload?topicId=${topicId}`);
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            const pct = Math.round((evt.loaded / evt.total) * 100);
            setUploadProgress(pct);
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try { const data = JSON.parse(xhr.responseText); if (data.ok && data.url) {
              setTopics(topics => topics.map(t => t.id === topicId ? {...t, pdfUrl: data.url} : t));
              resolve(data); return;
            } else { reject(new Error(data.message || 'Upload failed')); return; } } catch (e) { resolve(); return; }
          } else {
            reject(new Error('Upload failed with status ' + xhr.status));
          }
        };
        xhr.onerror = () => reject(new Error('Network error during upload'));
        const form = new FormData();
        form.append('file', file);
        xhr.send(form);
      });
      alert('Upload successful');
    } catch (err) {
      console.error('upload error', err);
      alert('Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      e.target.value = '';
    }
  };


  // Settings Section
  const renderSettings = () => (
    <main className="dashboard-main">
      <div className="dashboard-top-bar">
        <h2>Settings & Configuration</h2>
      </div>

      <div className="settings-container">
        <div className="settings-section">
          <h3>⚙️ General Settings</h3>
          <div className="settings-form">
            <div className="form-group">
              <label>Platform Name</label>
              <input type="text" defaultValue="V R Troops Learning Platform" />
            </div>
            <div className="form-group">
              <label>Support Email</label>
              <input type="email" defaultValue="support@vrtroops.edu.in" />
            </div>
            <div className="form-group">
              <label>Maximum Upload Size (MB)</label>
              <input type="number" defaultValue="50" />
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3>🔐 Security Settings</h3>
          <div className="settings-form">
            <div className="form-group checkbox">
              <input type="checkbox" id="2fa" defaultChecked />
              <label htmlFor="2fa">Enable Two-Factor Authentication</label>
            </div>
            <div className="form-group checkbox">
              <input type="checkbox" id="email-notifications" defaultChecked />
              <label htmlFor="email-notifications">Email Notifications for New Users</label>
            </div>
            <div className="form-group checkbox">
              <input type="checkbox" id="auto-backup" defaultChecked />
              <label htmlFor="auto-backup">Automatic Daily Backup</label>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3>📧 Email Configuration</h3>
          <div className="settings-form">
            <div className="form-group">
              <label>SMTP Server</label>
              <input type="text" defaultValue="smtp.gmail.com" />
            </div>
            <div className="form-group">
              <label>SMTP Port</label>
              <input type="number" defaultValue="587" />
            </div>
            <div className="form-group">
              <button className="btn-primary">Test Email Connection</button>
            </div>
          </div>
        </div>

        <div className="settings-actions">
          <button className="btn-primary">Save Changes</button>
          <button className="btn-secondary">Reset to Default</button>
        </div>
      </div>
    </main>
  );

  // Registered Students Section
  const renderRegisteredStudents = () => (
    <RegisteredStudents />
  );

  // Render appropriate section
  const renderSection = () => {
    switch(activeSection) {
      case 'topics':
        return renderManageTopics();
      case 'users':
        return renderUsers();
      case 'reports':
        return renderReports();
      case 'settings':
        return renderSettings();
      case 'pdfs':
        return renderPdfs();
      case 'registered-students':
        return renderRegisteredStudents();
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-info">
            <h1>🎛️ Admin Control Center</h1>
            <p className="header-subtitle">Manage your platform efficiently</p>
          </div>
          <div className="header-actions">
            <div className="welcome-section">
              <span className="admin-name">Welcome back, {adminName || 'Admin'}!</span>
              <span className="admin-status">Online & Ready</span>
            </div>
            <button className="btn-logout" onClick={onLogout}>
              ✕ Logout
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-container">
        <div className="dashboard-sidebar">
          <nav className="sidebar-nav">
            <ul>
              <li>
                <button 
                  className={`nav-link ${activeSection === 'dashboard' ? 'active' : ''}`}
                  onClick={() => setActiveSection('dashboard')}
                >
                  📊 Dashboard
                </button>
              </li>
              <li>
                <button 
                  className={`nav-link ${activeSection === 'topics' ? 'active' : ''}`}
                  onClick={() => setActiveSection('topics')}
                >
                  📚 Manage Topics
                </button>
              </li>
              <li>
                <button 
                  className={`nav-link ${activeSection === 'users' ? 'active' : ''}`}
                  onClick={() => setActiveSection('users')}
                >
                  👥 Users
                </button>
              </li>
              <li>
                <button 
                  className={`nav-link ${activeSection === 'reports' ? 'active' : ''}`}
                  onClick={() => setActiveSection('reports')}
                >
                  📈 Reports
                </button>
              </li>
              <li>
                <button 
                  className={`nav-link ${activeSection === 'settings' ? 'active' : ''}`}
                  onClick={() => setActiveSection('settings')}
                >
                  ⚙️ Settings
                </button>
              </li>
              <li>
                <button 
                  className={`nav-link ${activeSection === 'pdfs' ? 'active' : ''}`}
                  onClick={() => setActiveSection('pdfs')}
                >
                  📄 PDFs
                </button>
              </li>
              <li>
                <button 
                  className={`nav-link ${activeSection === 'registered-students' ? 'active' : ''}`}
                  onClick={() => setActiveSection('registered-students')}
                >
                  📋 Registered Students
                </button>
              </li>
            </ul>
          </nav>
        </div>

        {renderSection()}
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => { setShowAddModal(false); setNewTopicFile(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add New Topic</h2>
            <form onSubmit={handleAddTopic}>
              <div className="form-group">
                <label>Topic Title *</label>
                <input
                  type="text"
                  value={newTopic.title}
                  onChange={(e) => setNewTopic({...newTopic, title: e.target.value})}
                  placeholder="Enter topic title"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={newTopic.description}
                  onChange={(e) => setNewTopic({...newTopic, description: e.target.value})}
                  placeholder="Enter topic description"
                  rows="4"
                  required
                ></textarea>
              </div>

              <div className="form-group">
                <label>Instructor Name *</label>
                <input
                  type="text"
                  value={newTopic.instructor}
                  onChange={(e) => setNewTopic({...newTopic, instructor: e.target.value})}
                  placeholder="Enter instructor name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Level</label>
                <input
                  type="text"
                  value={newTopic.level}
                  onChange={(e) => setNewTopic({...newTopic, level: e.target.value})}
                  placeholder="e.g. Beginner, Intermediate, Advanced"
                />
              </div>

              <div className="form-group">
                <label>Upload PDF</label>
                <input
                  type="file"
                  accept="application/pdf"
                  ref={fileInputRef}
                  onChange={(e) => setNewTopicFile(e.target.files[0] || null)}
                />
                {newTopicFile && <div className="file-name">Selected: {newTopicFile.name}</div>}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => { setShowAddModal(false); setNewTopicFile(null); }}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit-modal">
                  Add Topic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editingTopic && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Topic</h2>
            <form onSubmit={handleUpdateTopic}>
              <div className="form-group">
                <label>Topic Title *</label>
                <input
                  type="text"
                  value={newTopic.title}
                  onChange={(e) => setNewTopic({...newTopic, title: e.target.value})}
                  placeholder="Enter topic title"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={newTopic.description}
                  onChange={(e) => setNewTopic({...newTopic, description: e.target.value})}
                  placeholder="Enter topic description"
                  rows="4"
                  required
                ></textarea>
              </div>

              <div className="form-group">
                <label>Instructor Name *</label>
                <input
                  type="text"
                  value={newTopic.instructor}
                  onChange={(e) => setNewTopic({...newTopic, instructor: e.target.value})}
                  placeholder="Enter instructor name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Level</label>
                <input
                  type="text"
                  value={newTopic.level}
                  onChange={(e) => setNewTopic({...newTopic, level: e.target.value})}
                  placeholder="e.g. Beginner, Intermediate, Advanced"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit-modal">
                  Update Topic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
