import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, User, LogOut, Settings, FileText, Home } from 'lucide-react';
import logo from "../assets/logo.png";

// Mock user data - Replace with your actual authentication context
const mockUser = {
  name: "John Smith",
  email: "john.smith@example.com",
  avatarInitials: "JS",
  subscription: "Pro Member",
};

const HeaderFooter = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuOpen && !event.target.closest('.profile-menu')) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileMenuOpen]);

  const isActive = (path) => location.pathname === path;

  const navigationItems = [
    { name: 'Home', path: '/' },
    { name: 'How It Works', path: '/how-it-works' },
    { name: 'Pricing', path: '/pricing' },
    { name: 'Guides', path: '/guides' },
    { name: 'Contact', path: '/contact' },
  ];

  const handleProfileAction = (action) => {
    setProfileMenuOpen(false);
    switch (action) {
      case 'profile':
        navigate('/profile');
        break;
      case 'reports':
        navigate('/my-reports');
        break;
      case 'settings':
        navigate('/settings');
        break;
      case 'logout':
        // Implement your logout logic here
        console.log('Logging out...');
        navigate('/login');
        break;
      default:
        break;
    }
  };

  const footerLinks = {
    'Quick Links': [
      { name: 'Home', path: '/' },
      { name: 'How It Works', path: '/how-it-works' },
      { name: 'Pricing', path: '/pricing' },
      { name: 'Guides', path: '/guides' },
      { name: 'Contact', path: '/contact' },
    ],
    'Support': [
      { name: 'FAQ', path: '/faq' },
      { name: 'Check Your Quote', path: '/check-quote' },
      { name: 'Help Center', path: '/help' },
    ],
    'Legal': [
      { name: 'Privacy Policy', path: '/privacy' },
      { name: 'Terms of Use', path: '/terms' },
      { name: 'Cookie Policy', path: '/cookies' },
    ],
    'Company': [
      { name: 'About Us', path: '/about' },
      { name: 'Blog', path: '/blog' },
      { name: 'Careers', path: '/careers' },
    ],
  };

  const handleDropdownToggle = (dropdown) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      {/* Header */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200'
          : 'bg-white border-b border-gray-100'
        }`}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-20">
            {/* Logo - Made bigger */}
            
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-r from-orange-400 to-amber-600 rounded-full opacity-0 blur transition-opacity duration-300"></div>
                <img
                  src={logo}
                  alt="MyQuoteMate Logo"
                  className="h-80 lg:h-84 w-auto object-contain"
                />
              </div>
            

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg flex items-center gap-2 ${isActive(item.path)
                      ? 'text-orange-600 bg-orange-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                >
                  {item.icon && item.icon}
                  {item.name}
                  {isActive(item.path) && (
                    <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-orange-500 to-amber-700 rounded-full"></span>
                  )}
                </Link>
              ))}

              {/* CTA Button */}
              <div className="relative group ml-2">
                <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-amber-700 rounded-lg blur opacity-0 group-hover:opacity-75 transition-opacity duration-300"></div>
                <Link
                  to="/check-quote"
                  className="relative px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-700 text-white rounded-lg font-semibold text-sm hover:shadow-lg hover:shadow-orange-500/30 transition-all duration-300 hover:scale-105"
                >
                  Check Your Quote
                </Link>
              </div>

              {/* Profile Section - Moved to right of CTA button */}
              <div className="relative profile-menu ml-4">
                <div className="relative">
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    aria-label="User menu"
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {mockUser.avatarInitials}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">
                        {mockUser.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {mockUser.subscription}
                      </p>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${profileMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Profile Dropdown Menu */}
                  {profileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50">
                      {/* User Info Section */}
                      <div className="p-4 border-b border-gray-100">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                            {mockUser.avatarInitials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">
                              {mockUser.name}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {mockUser.email}
                            </p>
                            <div className="flex items-center mt-1">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                {mockUser.subscription}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <button
                          onClick={() => handleProfileAction('profile')}
                          className="w-full px-4 py-3 flex items-center text-left hover:bg-gray-50 transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center mr-3 group-hover:bg-orange-50 transition-colors">
                            <User className="h-4 w-4 text-gray-600 group-hover:text-orange-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">My Profile</p>
                            <p className="text-xs text-gray-500">View and edit your profile</p>
                          </div>
                        </button>

                        <button
                          onClick={() => handleProfileAction('reports')}
                          className="w-full px-4 py-3 flex items-center text-left hover:bg-gray-50 transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center mr-3 group-hover:bg-orange-50 transition-colors">
                            <FileText className="h-4 w-4 text-gray-600 group-hover:text-orange-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">My Reports</p>
                            <p className="text-xs text-gray-500">View your quote analyses</p>
                          </div>
                        </button>

                        <button
                          onClick={() => handleProfileAction('settings')}
                          className="w-full px-4 py-3 flex items-center text-left hover:bg-gray-50 transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center mr-3 group-hover:bg-orange-50 transition-colors">
                            <Settings className="h-4 w-4 text-gray-600 group-hover:text-orange-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Settings</p>
                            <p className="text-xs text-gray-500">Account and preferences</p>
                          </div>
                        </button>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-gray-100"></div>

                      {/* Logout */}
                      <div className="p-4">
                        <button
                          onClick={() => handleProfileAction('logout')}
                          className="w-full px-4 py-2.5 flex items-center justify-center text-red-600 hover:bg-red-50 rounded-lg transition-colors group"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          <span className="font-medium">Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          <div className={`lg:hidden transition-all duration-300 ease-in-out overflow-hidden ${mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}>
            <div className="py-4 space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`block px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 flex items-center gap-3 ${isActive(item.path)
                      ? 'text-orange-600 bg-orange-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.icon && item.icon}
                  {item.name}
                </Link>
              ))}

              {/* Mobile CTA Button */}
              <Link
                to="/check-quote"
                className="block px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-700 text-white rounded-lg font-semibold text-center hover:shadow-lg hover:shadow-orange-500/30 transition-all duration-300 mt-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Check Your Quote
              </Link>

              {/* Mobile Profile Section */}
              <div className="pt-6 border-t border-gray-200 mt-4">
                <div className="flex items-center px-4 py-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-600 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                    {mockUser.avatarInitials}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{mockUser.name}</p>
                    <p className="text-sm text-gray-500">{mockUser.subscription}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 px-4">
                  <button
                    onClick={() => handleProfileAction('profile')}
                    className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </button>
                  <button
                    onClick={() => handleProfileAction('reports')}
                    className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Reports
                  </button>
                </div>

                <div className="mt-4 px-4 space-y-2">
                  <button
                    onClick={() => handleProfileAction('settings')}
                    className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Settings className="h-4 w-4 mr-3" />
                    Settings
                  </button>
                  <button
                    onClick={() => handleProfileAction('logout')}
                    className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-grow">{children}</main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Brand Section */}
            <div className="lg:col-span-2">
                <img
                  src={logo}
                  alt="MyQuoteMate Logo"
                  className="h-70 lg:h-74 w-auto object-contain"
                />
              <p className="text-gray-600 text-sm lg:text-base max-w-md">
                Helping Australian homeowners understand their tradie quotes with confidence.
                Get instant AI-powered analysis and make informed decisions.
              </p>

              {/* Social Links */}
              <div className="mt-6 flex space-x-4">
                {['Facebook', 'Twitter', 'Instagram', 'LinkedIn'].map((social) => (
                  <a
                    key={social}
                    href="#"
                    className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-orange-50 hover:text-orange-500 transition-colors"
                    aria-label={`Follow us on ${social}`}
                  >
                    <span className="text-sm font-medium">{social.charAt(0)}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Footer Links - Desktop */}
            <div className="hidden lg:grid lg:grid-cols-3 lg:col-span-3 gap-8">
              {Object.entries(footerLinks).map(([category, links]) => (
                <div key={category}>
                  <h4 className="text-gray-900 font-semibold mb-4 text-sm uppercase tracking-wider">
                    {category}
                  </h4>
                  <ul className="space-y-3">
                    {links.map((link) => (
                      <li key={link.path}>
                        <Link
                          to={link.path}
                          className="text-gray-600 hover:text-orange-500 text-sm transition-colors duration-200 inline-flex items-center group"
                        >
                          <span className="w-1.5 h-1.5 bg-orange-400 rounded-full opacity-0 group-hover:opacity-100 mr-2 transition-opacity"></span>
                          {link.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Footer Links - Mobile (Accordion) */}
            <div className="lg:hidden space-y-4">
              {Object.entries(footerLinks).map(([category, links]) => (
                <div key={category} className="border-b border-gray-100">
                  <button
                    onClick={() => handleDropdownToggle(category)}
                    className="w-full flex justify-between items-center py-3 text-gray-900 font-semibold text-sm uppercase tracking-wider"
                  >
                    {category}
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${activeDropdown === category ? 'rotate-180' : ''
                      }`} />
                  </button>
                  <div className={`overflow-hidden transition-all duration-200 ${activeDropdown === category ? 'max-h-48' : 'max-h-0'
                    }`}>
                    <ul className="pb-3 space-y-2">
                      {links.map((link) => (
                        <li key={link.path}>
                          <Link
                            to={link.path}
                            className="text-gray-600 hover:text-orange-500 text-sm transition-colors duration-200 block py-1"
                            onClick={() => setActiveDropdown(null)}
                          >
                            {link.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Copyright & Bottom Bar */}
          <div className="mt-12 lg:mt-16 pt-8 border-t border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-500 text-sm text-center md:text-left">
                © {new Date().getFullYear()} MyQuoteMate. All rights reserved.
              </p>

              {/* Additional Legal Links */}
              <div className="flex flex-wrap justify-center gap-6 text-sm">
                <Link to="/privacy" className="text-gray-500 hover:text-orange-500 transition-colors">
                  Privacy Policy
                </Link>
                <Link to="/terms" className="text-gray-500 hover:text-orange-500 transition-colors">
                  Terms of Service
                </Link>
                <Link to="/cookies" className="text-gray-500 hover:text-orange-500 transition-colors">
                  Cookie Policy
                </Link>
                <Link to="/sitemap" className="text-gray-500 hover:text-orange-500 transition-colors">
                  Sitemap
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HeaderFooter;
