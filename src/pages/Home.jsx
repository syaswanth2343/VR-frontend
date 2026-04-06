import React from 'react'
import './Home.css'
import Logo from '../components/Logo'

function Home({ onStart }) {
  console.log('Home render');

  return (
    <div className="home-container app">
      <header className="home-hero">
        <div className="home-hero-inner">
          <div className="brand-row">
            <Logo size="large" />
            <div className="brand-text">
              <h1 className="home-title">Welcome to V R Troops</h1>
              <p className="home-tag">A simple learning management hub for students and admins.</p>
            </div>
          </div>

          <p className="home-sub">Choose your role and get started in seconds ➜</p>

          <div className="home-actions">
            <button className="btn-primary" onClick={onStart}>Sign Up Now</button>
            <button
              className="btn-secondary"
              onClick={() => {
                const el = document.getElementById('features');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              Learn More
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="home-stats">
          <div className="stat">
            <div className="stat-number">12k+</div>
            <div className="stat-label">Active Learners</div>
          </div>
          <div className="stat">
            <div className="stat-number">450+</div>
            <div className="stat-label">Courses & Modules</div>
          </div>
          <div className="stat">
            <div className="stat-number">99.8%</div>
            <div className="stat-label">Uptime</div>
          </div>
        </section>

        <section className="home-features" id="features">
          <article>
            <h3>Easy Onboarding</h3>
            <p>Just click "Sign Up Now", pick Admin or Student, and you're in. No confusing forms.
            </p>
          </article>

          <article>
            <h3>Simple Admin Dashboard</h3>
            <p>Add or remove students, export records, and keep track of registrations all in one place.
            </p>
          </article>

          <article>
            <h3>Student Experience</h3>
            <p>Save courses, view progress, and access learning materials with minimal clicks.
            </p>
          </article>

          <article>
            <h3>Fast & Accessible</h3>
            <p>The site loads quickly on any device and meets basic accessibility best practices. Focus stays on learning, not loading.
            </p>
          </article>
        </section>

        <section className="home-testimonial">
          <blockquote>
            "V R Troops is the only tool our school needed – intuitive, fast, and gives students freedom to focus on what matters."
          </blockquote>
        </section>

        <footer className="home-footer">
          <div className="footer-inner">
            <div className="footer-brand">
              <Logo size="small" />
              <div>© {new Date().getFullYear()} V R Troops. All rights reserved.</div>
            </div>
            <div className="footer-links">
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">Contact</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}

export default Home
