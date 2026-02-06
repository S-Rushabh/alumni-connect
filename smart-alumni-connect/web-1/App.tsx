
import React, { useState } from 'react';
import { Page, Alum } from './types';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Directory from './pages/Directory';
import Profile from './pages/Profile';
import Jobs from './pages/Jobs';
import Events from './pages/Events';
import Networking from './pages/Networking';
import Analytics from './pages/Analytics';
import MentorshipMatch from './pages/MentorshipMatch';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import { MOCK_ALUMNI } from './constants';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.Landing);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<Alum | null>(null);
  const [activeChatAlum, setActiveChatAlum] = useState<Alum>(MOCK_ALUMNI[0]);
  const [viewingProfileAlum, setViewingProfileAlum] = useState<Alum | null>(null);

  const handleNavigateToChat = (alum: Alum) => {
    setActiveChatAlum(alum);
    setCurrentPage(Page.Networking);
  };

  const handleViewProfile = (alum: Alum | null) => {
    setViewingProfileAlum(alum);
    setCurrentPage(Page.Profile);
  };

  const handleLoginSuccess = (user: Alum) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setCurrentPage(Page.Dashboard);
  };

  const handleSignUpSuccess = (user: Alum) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setCurrentPage(Page.Dashboard);
  };

  const renderPage = () => {
    switch (currentPage) {
      case Page.Landing: 
        return <Landing onStart={() => setCurrentPage(Page.Login)} />;
      case Page.Login:
        return <Login onLoginSuccess={handleLoginSuccess} onGoToSignUp={() => setCurrentPage(Page.SignUp)} />;
      case Page.SignUp:
        return <SignUp onSignUpSuccess={handleSignUpSuccess} onGoToLogin={() => setCurrentPage(Page.Login)} />;
      case Page.Dashboard: 
        return (
          <Dashboard 
            onNavigate={setCurrentPage} 
            onStartFlashMatch={(alum) => handleNavigateToChat(alum)} 
          />
        );
      case Page.Directory: 
        return (
          <Directory 
            onStartChat={handleNavigateToChat} 
            onViewProfile={handleViewProfile}
          />
        );
      case Page.Profile: 
        return (
          <Profile 
            alum={viewingProfileAlum} 
            selfUser={currentUser}
            onStartChat={handleNavigateToChat} 
          />
        );
      case Page.Jobs: 
        return <Jobs onAskReferral={handleNavigateToChat} />;
      case Page.Events: 
        return <Events />;
      case Page.MentorshipMatch:
        return <MentorshipMatch onChatStart={handleNavigateToChat} />;
      case Page.Networking: 
        return <Networking initialAlum={activeChatAlum} />;
      case Page.Analytics: 
        return <Analytics />;
      default: 
        return <Landing onStart={() => setCurrentPage(Page.Login)} />;
    }
  };

  return (
    <Layout 
      currentPage={currentPage} 
      isAuthenticated={isAuthenticated}
      onPageChange={(page) => {
        if (page === Page.Profile) setViewingProfileAlum(null);
        setCurrentPage(page);
      }}
      currentUser={currentUser}
    >
      {renderPage()}
    </Layout>
  );
};

export default App;
