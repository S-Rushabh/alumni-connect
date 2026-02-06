
import { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserProfile } from './services/user';
import { logout } from './services/auth';
// import { getJobs } from './services/jobs';
// import { getEvents } from './services/events';
import { Page, type UserProfile } from './types';

// Components
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import Directory from './pages/Directory';
import Profile from './pages/Profile';
import Jobs from './pages/Jobs';
import Events from './pages/Events';
import Networking from './pages/Networking';
import Analytics from './pages/Analytics';




function App() {
  const [currentPage, setCurrentPage] = useState<Page>(Page.Landing);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [requestLoading, setRequestLoading] = useState(true);



  // Monitor Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userProfile = await getUserProfile(currentUser.uid);
          setProfile(userProfile);

          // Fetch data for dashboard
          // const [fetchedJobs, fetchedEvents] = await Promise.all([getJobs(), getEvents()]);
          // setJobs(fetchedJobs);
          // setEvents(fetchedEvents);

          // If we are on Landing/Login/Signup and just logged in, go to Dashboard
          if ([Page.Landing, Page.Login, Page.SignUp].includes(currentPage)) {
            setCurrentPage(Page.Dashboard);
          }

        } catch (err) {
          console.error("Error loading data", err);
        }
      } else {
        setProfile(null);
        // If we are on protected routes and logged out, go to Landing
        if (![Page.Landing, Page.Login, Page.SignUp].includes(currentPage)) {
          setCurrentPage(Page.Landing);
        }
      }
      setRequestLoading(false);
    });
    return () => unsubscribe();
  }, [currentPage]); // Dependency on currentPage to ensure redirect logic works if state changes mid-stream? No, usually just empty dependency for auth listener.

  const renderPage = () => {
    switch (currentPage) {
      case Page.Landing:
        return <Landing onStart={() => setCurrentPage(Page.Login)} />;
      case Page.Login:
        return (
          <Login
            onLoginSuccess={() => setCurrentPage(Page.Dashboard)}
            onGoToSignUp={() => setCurrentPage(Page.SignUp)}
          />
        );
      case Page.SignUp:
        return (
          <SignUp
            onSignUpSuccess={() => setCurrentPage(Page.Dashboard)}
            onGoToLogin={() => setCurrentPage(Page.Login)}
          />
        );
      case Page.Dashboard:
        return (
          <Dashboard
            onNavigate={setCurrentPage}
            currentUser={profile}
            onStartFlashMatch={(alum) => {
              console.log("Flash Match requested with:", alum);
              // Navigate to Networking with this alum potentially selected (would need more state in App but for now just go there)
              setCurrentPage(Page.Networking);
            }}
          />
        );
      case Page.Directory:
        return (
          <Directory
            onStartChat={(alum) => {
              console.log("Chat started with:", alum);
              setCurrentPage(Page.Networking);
            }}
          />
        );
      case Page.Profile:
        return (
          <Profile
            selfUser={profile}
          // If we had a "viewing profile" state in App, we would pass it here
          // For now, only self profile is fully supported via nav
          />
        );
      case Page.Jobs:
        return <Jobs currentUser={profile} />;
      case Page.Events:
        return <Events />;
      case Page.Networking:
        return <Networking currentUser={profile} />;
      case Page.Analytics:
        return <Analytics />;

      default:
        return <Landing onStart={() => setCurrentPage(Page.Login)} />;
    }
  };

  if (requestLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">
      Loading AlumniPulse...
    </div>
  );

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Layout
      currentPage={currentPage}
      isAuthenticated={!!user}
      onPageChange={setCurrentPage}
      onLogout={handleLogout}
      currentUser={profile}
    >
      {renderPage()}
    </Layout>
  );
}

export default App;