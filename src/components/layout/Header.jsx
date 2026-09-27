import React from 'react';
import { Navbar } from './Navbar';

/**
 * Top Application Header bar component
 * Delegates to responsive hospital system Navbar with notifications and user profile
 */
export const Header = (props) => {
  return <Navbar {...props} />;
};

export default Header;
