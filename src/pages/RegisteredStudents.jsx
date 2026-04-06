import React, { useState, useEffect } from 'react';
import './RegisteredStudents.css';
import { users } from '../api/databaseAPI';

function RegisteredStudents() {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState('all');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const list = await users.list();
        if (Array.isArray(list)) {
          setStudents(list);
        } else {
          console.warn('RegisteredStudents: users.list returned non-array', list);
        }
      } catch (err) {
        console.error('RegisteredStudents: failed to load students from database', err);
      }
    };
    fetchStudents();
  }, []);

  const filteredStudents = students.filter(student => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (student.full_name || '').toLowerCase().includes(term) ||
      (student.email || '').toLowerCase().includes(term) ||
      (student.username || '').toLowerCase().includes(term) ||
      (student.user_code || '').toLowerCase().includes(term);
    const matchesState =
      filterState === 'all' ||
      (student.settings &&
        typeof student.settings === 'object' &&
        (student.settings.state || '') === filterState);
    return matchesSearch && matchesState;
  });

  const uniqueStates = [...new Set(
    students
      .map(s => (s.settings && typeof s.settings === 'object' ? s.settings.state : null))
      .filter(Boolean)
  )].sort();

  const handleDeleteStudent = async (id) => {
    if (confirm('Are you sure you want to delete this student record?')) {
      try {
        await users.remove(id);
        setStudents(prev => prev.filter(s => s.id !== id));
      } catch (err) {
        console.error('RegisteredStudents: failed to delete student', err);
        alert('Failed to delete student');
      }
    }
  };

  const handleClearAll = () => {
    alert('Bulk delete of all students is disabled for safety. Please delete individual records if needed.');
  };

  const handleExport = () => {
    const safeData = students.map(s => ({
      id: s.id,
      user_code: s.user_code,
      username: s.username,
      email: s.email,
      role: s.role,
      full_name: s.full_name,
      phone: s.phone,
      is_active: s.is_active,
      created_at: s.created_at,
    }));
    const dataStr = JSON.stringify(safeData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `registered_students_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  return (
    <div className="registered-students-page">
      <div className="students-header">
        <h1>📋 Registered Students</h1>
        <p>View and manage all registered student accounts</p>
      </div>

      <div className="students-container">
        <div className="students-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-controls">
            <select
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
              className="filter-select"
            >
              <option value="all">All States</option>
              {uniqueStates.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>

            <div className="action-buttons">
              <button className="btn-export" onClick={handleExport}>
                📥 Export Data
              </button>
              {students.length > 0 && (
                <button className="btn-clear-all" onClick={handleClearAll}>
                  🗑️ Clear All
                </button>
              )}
            </div>
          </div>

          <div className="stats-row">
            <div className="stat-badge">
              Total: <strong>{students.length}</strong> users
            </div>
            <div className="stat-badge">
              Filtered: <strong>{filteredStudents.length}</strong> users
            </div>
          </div>
        </div>

        {students.length === 0 ? (
          <div className="empty-state">
                      <div className="empty-icon">👥</div>
                      <h2>No Users Found</h2>
                      <p>User records from the database will appear here once accounts are created.</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h2>No Results Found</h2>
            <p>Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          <div className="students-table-container">
            <table className="students-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Code</th>
                  <th>Username</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td>#{student.id}</td>
                    <td>{student.user_code || '—'}</td>
                    <td className="username-cell">
                      {student.username || '—'}
                    </td>
                    <td className="name-cell">
                      <strong>{student.full_name || '—'}</strong>
                    </td>
                    <td className="email-cell">
                      {student.email ? <a href={`mailto:${student.email}`}>{student.email}</a> : '—'}
                    </td>
                    <td>{student.phone || '—'}</td>
                    <td>{student.role}</td>
                    <td>
                      <span className={`state-badge ${student.is_active ? 'active' : 'inactive'}`}>
                        {student.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="date-cell">
                      <div className="date-info">
                        <div>{student.created_at ? new Date(student.created_at).toLocaleDateString() : '—'}</div>
                      </div>
                    </td>
                    <td>
                      <button
                        className="btn-delete-student"
                        onClick={() => handleDeleteStudent(student.id)}
                        title="Delete student record"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default RegisteredStudents;
