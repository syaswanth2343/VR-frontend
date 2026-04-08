import React, { useState, useEffect } from 'react';
import { topics as topicsApi, pdfs as pdfsApi, users, enrollments as apiEnrollments } from '../api/databaseAPI';
import { useSavedItems, useWishlist, useLoginHistory } from '../hooks/useDatabase';
import { API_BASE_URL as API_BASE } from '../config/apiBase';
import './StudentDashboard.css';

function StudentDashboard({ onLogout, studentUsername, studentId }) {
  const backendOrigin = API_BASE.startsWith('http') ? API_BASE.replace(/\/api\/?$/, '') : '';
  const toBackendAbsoluteUrl = (url) => {
    if (!url) return url;
    if (url.startsWith('http')) return url;
    return backendOrigin ? `${backendOrigin}${url}` : url;
  };

  const getHistory = () => {
    try {
      const storageKey = `student_history_${studentUsername}`;
      const savedHistory = JSON.parse(localStorage.getItem(storageKey));
      return {
        saved: (savedHistory && savedHistory.savedTopics) || [],
        wishlist: (savedHistory && savedHistory.wishlistTopics) || []
      };
    } catch (e) {
      console.error('getHistory error:', e);
      return { saved: [], wishlist: [] };
    }
  };

  const [topics, setTopics] = useState([]);
  const [pdfList, setPdfList] = useState([]);
  const [profile, setProfile] = useState(null); // populated from backend
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [profileForm, setProfileForm] = useState({ full_name: '', phone: '', password: '' });

  const [settingsState, setSettingsState] = useState({
    emailNotifications: true,
    marketingEmails: false,
    profileVisibility: true,
    showProgressPublicly: false,
    learningPace: 'Less than 5 hours',
    preferredStyle: 'Video & Text'
  });

  const [enrolledTopics, setEnrolledTopics] = useState([]);
  const [activeTab, setActiveTab] = useState('all');

  // replace local storage history with backend-synced saved/wishlist
  const studentIdForApi = profile?.id || null; // will be set after profile fetch
  const {
    items: savedTopics,
    addItem: addSavedTopic,
    removeItem: removeSavedTopic,
    fetchItems: fetchSavedTopics
  } = useSavedItems(studentIdForApi);
  const {
    items: wishlistTopics,
    addItem: addWishlistTopic,
    removeItem: removeWishlistTopic,
    fetchItems: fetchWishlistTopics
  } = useWishlist(studentIdForApi);
  const { history: loginHistory, fetchHistory } = useLoginHistory(studentIdForApi);

  // fetch PDF metadata and attach url to topics
  const fetchPdfs = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const list = await pdfsApi.list(token);
      setPdfList(list.map(p => ({
        ...p,
        url: toBackendAbsoluteUrl(p.url)
      })));
      // Map PDFs to topics; backend may return topicId or topic_id
      setTopics(prevTopics => {
        if (!Array.isArray(prevTopics)) {
          console.warn('fetchPdfs: topics state not array', prevTopics);
          return prevTopics;
        }
        return prevTopics.map(topic => {
          const pdf = list.find(p => (p.topicId === topic.id) || (p.topic_id === topic.id));
          if (!pdf) return topic;
          const fullUrl = toBackendAbsoluteUrl(pdf.url);
          return { ...topic, pdfUrl: fullUrl };
        });
      });
    } catch (err) {
      console.error('fetchPdfs error', err);
    }
  };

  useEffect(() => {
    console.log('StudentDashboard mounted');
    // fetch topics and pdf metadata once on mount
    const load = async () => {
      try {
        const list = await topicsApi.list();
        if (!Array.isArray(list)) {
          console.warn('StudentDashboard.fetchTopics returned non-array', list);
          setTopics([]);
        } else {
          setTopics(list);
        }
      } catch (err) {
        console.error('fetchTopics error', err);
      }
      await fetchPdfs();
      try {
        const prof = await users.me();
        setProfile(prof);
        if (prof.settings) {
          setSettingsState(prev => ({ ...prev, ...prof.settings }));
        }
      } catch (e) {
        console.error('fetch profile error', e);
      }
    };
    load();
  }, []);

  // when profile becomes available, refresh saved/wishlist from backend
  useEffect(() => {
    if (studentIdForApi) {
      fetchSavedTopics();
      fetchWishlistTopics();
      fetchHistory();
      // also load enrollments from backend
      (async () => {
        try {
          const list = await apiEnrollments.listByUser(studentIdForApi);
          if (Array.isArray(list)) {
            // Backend returns Enrollment objects; frontend expects an array of topic IDs.
            const ids = list.map(e => e.topicId || e.topic_id).filter(Boolean);
            setEnrolledTopics(ids);
          }
        } catch (e) {
          console.error('fetch enrollments error', e);
        }
      })();
    }
  }, [studentIdForApi, fetchSavedTopics, fetchWishlistTopics, fetchHistory]);

  const handleProfileChange = e => {
    const { name, type, value, checked } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSaveProfile = async e => {
    e.preventDefault();
    if (!profile) return;
    try {
      const payload = { ...profileForm };
      if (payload.password === '') delete payload.password;
      await users.update(profile.id, payload);
      const updated = await users.me();
      setProfile(updated);
      setShowProfileEdit(false);
      alert('Profile updated');
    } catch (err) {
      console.error('save profile error', err);
      alert('Failed to save profile');
    }
  };

  const handleSaveSettings = async () => {
    if (!profile) return;
    try {
      await users.update(profile.id, { settings: settingsState });
      setProfile(prev => ({ ...prev, settings: settingsState }));
      alert('Settings saved');
    } catch (err) {
      console.error('save settings error', err);
      alert('Failed to save settings');
    }
  };

  const handleSaveTopic = async (topicId) => {
    const existing = savedTopics.find(item => Number(item.item_id) === Number(topicId));
    if (existing) {
      await removeSavedTopic(existing.id);
    } else {
      await addSavedTopic(topicId, '', 'topic', '');
    }
  };

  const handleAddToWishlist = async (topicId) => {
    const existing = wishlistTopics.find(item => Number(item.item_id) === Number(topicId));
    if (existing) {
      await removeWishlistTopic(existing.id);
    } else {
      await addWishlistTopic(topicId, '', 'topic', '');
    }
  };

  const handleEnrollCourse = async (topicId) => {
    try {
      await apiEnrollments.add(profile.id, topicId);
      setEnrolledTopics(prev => ([...prev, topicId]));
      alert('Successfully enrolled in course!');
    } catch (err) {
      console.error('enroll error', err);
      alert('Failed to enroll');
    }
  };

    const handleDisenrollCourse = async (topicId) => {
      try {
        await apiEnrollments.remove(profile.id, topicId);
        setEnrolledTopics(prev => prev.filter(id => id !== topicId));
        alert('You have been disenrolled from this course.');
      } catch (err) {
        console.error('disenroll error', err);
        alert('Failed to disenroll');
      }
    };

  // upload PDF as a student
  const handleUserPdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await pdfsApi.upload(file);
      alert('Upload successful!');
      fetchPdfs();
    } catch (err) {
      alert('Upload failed: ' + (err.message || err));
      console.error('user upload error', err);
    } finally {
      e.target.value = '';
    }
  };

  const openEditProfile = () => {
    if (!profile) return;
    setProfileForm({
      full_name: profile.full_name || '',
      phone: profile.phone || '',
      password: ''
    });
    setShowProfileEdit(true);
  };

  const getDisplayTopics = () => {
    if (activeTab === 'saved') {
      return topics.filter(t => savedTopics.some(item => Number(item.item_id) === Number(t.id)));
    } else if (activeTab === 'wishlist') {
      return topics.filter(t => wishlistTopics.some(item => Number(item.item_id) === Number(t.id)));
    } else if (activeTab === 'courses') {
      return topics.filter(t => enrolledTopics.includes(t.id));
    }
    return topics;
  };

  const displayTopics = getDisplayTopics();

  // profile edit modal
  const renderProfileModal = () => {
    if (!showProfileEdit) return null;
    return (
      <div className="modal-overlay" onClick={() => setShowProfileEdit(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <h2>Edit Profile</h2>
          <form onSubmit={handleSaveProfile}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="full_name"
                value={profileForm.full_name}
                onChange={handleProfileChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                name="phone"
                value={profileForm.phone}
                onChange={handleProfileChange}
              />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                name="password"
                value={profileForm.password}
                onChange={handleProfileChange}
                placeholder="Leave blank to keep current"
              />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={() => setShowProfileEdit(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-submit-modal">
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderProfile = () => {
    if (!profile) return <p>Loading profile...</p>;
    return (
      <div className="profile-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Your Profile</h2>
          <button className="btn-edit" onClick={openEditProfile}>Edit</button>
        </div>
        <div className="profile-stats">
          <div className="stat-box">
            <div className="stat-value">{enrolledTopics.length}</div>
            <div className="stat-label">Enrolled Courses</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{savedTopics.length}</div>
            <div className="stat-label">Saved Topics</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{wishlistTopics.length}</div>
            <div className="stat-label">Wishlist Items</div>
          </div>
        </div>
        <div className="profile-details">
          <div><strong>ID:</strong> {profile.user_code || '—'}</div>
          <div><strong>Username:</strong> {profile.username}</div>
          <div><strong>Name:</strong> {profile.full_name || '—'}</div>
          <div><strong>Email:</strong> {profile.email}</div>
          <div><strong>Phone:</strong> {profile.phone || '—'}</div>
          <div><strong>Role:</strong> {profile.role}</div>
          <div><strong>Status:</strong> {profile.is_active ? 'Active' : 'Inactive'}</div>
        </div>
      </div>
    );
  };

  const renderHistory = () => {
    if (loginHistory.length === 0) return <p>No login records available.</p>;
    return (
      <div className="history-section">
        <h3>Your Last Logins</h3>
        <ul className="history-list">
          {loginHistory.map(h => (
            <li key={h.id}>
              {new Date(h.login_time).toLocaleString()} – {h.ip_address || 'unknown'} – {h.device_type || 'unknown'}
              {h.logout_time && ` (logout ${new Date(h.logout_time).toLocaleString()})`}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="student-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-info">
            <h1>📚 Learning Center</h1>
            <p className="header-subtitle">Explore and learn new skills</p>
          </div>
          <div className="header-actions">
            <div className="welcome-section">
              <span className="student-name">
              Welcome, {profile?.full_name || studentUsername || 'Student'}!
            </span>
            {studentId && <span className="student-id">ID: {studentId}</span>}
              <span className="student-status">Learner Mode</span>
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
                <a 
                  href="#" 
                  className={`nav-link ${activeTab === 'all' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); setActiveTab('all'); }}
                >
                  📖 All Topics
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className={`nav-link ${activeTab === 'saved' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); setActiveTab('saved'); }}
                >
                  📌 Saved ({savedTopics.length})
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className={`nav-link ${activeTab === 'wishlist' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); setActiveTab('wishlist'); }}
                >
                  ❤️ Wishlist ({wishlistTopics.length})
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); setActiveTab('profile'); }}
                >
                  👤 Profile
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className={`nav-link ${activeTab === 'history' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); setActiveTab('history'); }}
                >
                  🕒 Login History
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className={`nav-link ${activeTab === 'courses' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); setActiveTab('courses'); }}
                >
                  ✓ My Courses ({enrolledTopics.length})
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className={`nav-link ${activeTab === 'pdfs' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); setActiveTab('pdfs'); }}
                >
                  📄 PDFs
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); setActiveTab('settings'); }}
                >
                  ⚙️ Settings
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <main className="dashboard-main">
          <div className="dashboard-top-bar">
            <h2>
              {activeTab === 'all' && 'All Available Topics'}
              {activeTab === 'saved' && 'Saved Topics'}
              {activeTab === 'wishlist' && 'Wishlist'}
              {activeTab === 'courses' && 'My Enrolled Courses'}
              {activeTab === 'pdfs' && 'Available PDFs'}
              {activeTab === 'profile' && 'My Profile'}
              {activeTab === 'history' && 'Login History'}
              {activeTab === 'settings' && 'Settings'}
            </h2>
            {(activeTab === 'all' || activeTab === 'saved' || activeTab === 'wishlist' || activeTab === 'courses') && (
              <span className="topics-count">{displayTopics.length} item(s)</span>
            )}
            {activeTab === 'profile' && null /* no count */}
          </div>

          {(activeTab === 'all' || activeTab === 'saved' || activeTab === 'wishlist' || activeTab === 'courses') && (
            <>
              {displayTopics.length > 0 ? (
                <div className="topics-grid">
                  {displayTopics.map(topic => (
                    <div key={topic.id} className="topic-card">
                      <div className="topic-badge">{topic.level}</div>
                      <h3>{topic.title}</h3>
                      <p className="topic-description">{topic.description}</p>
                      <div className="topic-meta">
                        <span className="instructor">👨‍🏫 {topic.instructor}</span>
                      </div>
                      <div className="topic-actions">
                        <button 
                          className={`btn-action save-btn ${savedTopics.some(i => Number(i.item_id) === Number(topic.id)) ? 'active' : ''}`}
                          onClick={() => handleSaveTopic(topic.id)}
                          title="Save for later"
                        >
                          📌 {savedTopics.some(i => Number(i.item_id) === Number(topic.id)) ? 'Saved' : 'Save'}
                        </button>
                        <button 
                          className={`btn-action wishlist-btn ${wishlistTopics.some(i => Number(i.item_id) === Number(topic.id)) ? 'active' : ''}`}
                          onClick={() => handleAddToWishlist(topic.id)}
                          title="Add to wishlist"
                        >
                          ❤️ {wishlistTopics.some(i => Number(i.item_id) === Number(topic.id)) ? 'Added' : 'Wish'}
                        </button>
                        {/* always show a download control; active when pdfUrl exists */}
                        <button
                          className="btn-secondary download-btn"
                          style={{ marginLeft: 8 }}
                          disabled={!topic.pdfUrl}
                          onClick={() => {
                            if (topic.pdfUrl) window.open(topic.pdfUrl, '_blank');
                          }}
                          title={topic.pdfUrl ? 'Download PDF' : 'No PDF available'}
                        >
                          📄 Download PDF
                        </button>
                      </div>
                      {enrolledTopics.includes(topic.id) ? (
                        <>
                          <button className="btn-disenroll" onClick={() => handleDisenrollCourse(topic.id)} style={{marginTop:8}}>
                            Disenroll
                          </button>
                          <button className="btn-enroll enrolled" disabled style={{marginTop:8}}>
                            ✓ Enrolled
                          </button>
                        </>
                      ) : (
                        <button className="btn-enroll" onClick={() => handleEnrollCourse(topic.id)}>
                          Enroll Now
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>No items found in this section.</p>
                  {activeTab !== 'all' && (
                    <button 
                      className="btn-back-to-all"
                      onClick={() => setActiveTab('all')}
                    >
                      Browse All Topics
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {activeTab === 'profile' && renderProfile()}
          {activeTab === 'history' && renderHistory()}

          {activeTab === 'settings' && (
            <div className="settings-section">
              <div className="settings-group">
                <h3>⚙️ General Settings</h3>
                <div className="setting-item">
                  <div className="setting-label">
                    <h4>Email Notifications</h4>
                    <p>Receive course updates and announcements</p>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle-switch"
                    checked={settingsState.emailNotifications}
                    onChange={e => setSettingsState(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                  />
                </div>
                <div className="setting-item">
                  <div className="setting-label">
                    <h4>Marketing Emails</h4>
                    <p>Receive promotional offers and new course alerts</p>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle-switch"
                    checked={settingsState.marketingEmails}
                    onChange={e => setSettingsState(prev => ({ ...prev, marketingEmails: e.target.checked }))}
                  />
                </div>
              </div>

              <div className="settings-group">
                <h3>🔐 Privacy & Security</h3>
                <div className="setting-item">
                  <div className="setting-label">
                    <h4>Profile Visibility</h4>
                    <p>Allow other students to see your profile</p>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle-switch"
                    checked={settingsState.profileVisibility}
                    onChange={e => setSettingsState(prev => ({ ...prev, profileVisibility: e.target.checked }))}
                  />
                </div>
                <div className="setting-item">
                  <div className="setting-label">
                    <h4>Show Progress Publicly</h4>
                    <p>Display your course progress on your profile</p>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle-switch"
                    checked={settingsState.showProgressPublicly}
                    onChange={e => setSettingsState(prev => ({ ...prev, showProgressPublicly: e.target.checked }))}
                  />
                </div>
              </div>

              <div className="settings-group">
                <h3>📱 Preferences</h3>
                <div className="setting-item">
                  <div className="setting-label">
                    <h4>Learning Pace</h4>
                    <p>How many hours per week do you intend to study?</p>
                  </div>
                  <select
                    className="settings-select"
                    value={settingsState.learningPace}
                    onChange={e => setSettingsState(prev => ({ ...prev, learningPace: e.target.value }))}
                  >
                    <option>Less than 5 hours</option>
                    <option>5-10 hours</option>
                    <option>10-15 hours</option>
                    <option>More than 15 hours</option>
                  </select>
                </div>
                <div className="setting-item">
                  <div className="setting-label">
                    <h4>Preferred Learning Style</h4>
                    <p>Choose your preferred learning method</p>
                  </div>
                  <select
                    className="settings-select"
                    value={settingsState.preferredStyle}
                    onChange={e => setSettingsState(prev => ({ ...prev, preferredStyle: e.target.value }))}
                  >
                    <option>Video & Text</option>
                    <option>Video Only</option>
                    <option>Text Only</option>
                    <option>Interactive Exercises</option>
                  </select>
                </div>
              </div>

              <div className="settings-actions">
                <button className="btn-save" onClick={handleSaveSettings}>💾 Save Changes</button>
                <button
                  className="btn-reset"
                  onClick={() => {
                    // revert to profile's stored settings or defaults
                    if (profile && profile.settings) {
                      setSettingsState(profile.settings);
                    } else {
                      setSettingsState({
                        emailNotifications: true,
                        marketingEmails: false,
                        profileVisibility: true,
                        showProgressPublicly: false,
                        learningPace: 'Less than 5 hours',
                        preferredStyle: 'Video & Text'
                      });
                    }
                  }}
                >
                  ↻ Reset to Default
                </button>
              </div>
            </div>
          )}

        </main>
      </div>

      {renderProfileModal()}

          {activeTab === 'pdfs' && (
            <div className="pdfs-section">
              <h3>Available documents</h3>
              {pdfList.length > 0 ? (
                <ul className="pdf-list">
                  {pdfList.map(p => (
                    <li key={p.id} className="pdf-item">
                      <a href={p.url} target="_blank" rel="noreferrer">
                        {p.original_name || p.filename}
                      </a>
                      {p.topic_title && <span className="pdf-topic">({p.topic_title})</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No files have been uploaded yet.</p>
              )}

              <div className="upload-section">
                <h4>Upload a file</h4>
                <input type="file" accept="application/pdf" onChange={handleUserPdfUpload} />
              </div>
            </div>
          )}

    </div>
  );
}

export default StudentDashboard;
