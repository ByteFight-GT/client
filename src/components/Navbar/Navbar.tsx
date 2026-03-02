"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './Navbar.css';
import React, { lazy } from 'react';
import { BugIcon } from 'lucide-react';
import { Tooltip, Tooltipped, TooltipProvider } from '../Tooltip';

const NAVBAR_LINKS = [
  {
    icon: 'board',
    label: 'Game',
    link: '/player',
  },
  {
    icon: 'book',
    label: 'Matches',
    link: '/matches',
  },
  // {
  //   icon: 'run',
  //   label: 'Run',
  //   link: '/runner',
  // },
  {
    icon: 'map',
    label: 'Maps',
    link: '/mapbuilder',
  },
  {
    icon: 'config',
    label: 'Config',
    link: '/settings',
  },
]

const NAVBAR_LINKS_BOTTOM = [
  {
    icon: <BugIcon />,
    label: 'Debug',
    link: '/debug',
  }
]

function Navbar() {

  const pathName = usePathname();


  return (
    <div className="navbar-container">

      <img src="/logo.png" className="navbar-logo" />

      {NAVBAR_LINKS.map((item) => 
        <NavbarLink 
        {...item} 
        key={item.label}
        selected={item.link === pathName} />
      )}

      <div className='navbar-bottom-buttons'>
        {NAVBAR_LINKS_BOTTOM.map((item) => 
          <NavbarLinkBottom 
          {...item} 
          key={item.label}
          selected={item.link === pathName} />
        )}
      </div>

      </div>
  );
}

interface NavbarLinkProps {
  icon: string;
  label: string;
  link: string;
  selected: boolean;
}
function NavbarLink(props: NavbarLinkProps) {
  return (
    <Link href={props.link} className={`navbar-link ${props.selected? 'selected' : ''}`}>
      <img src={`/navbar_icons/${props.icon}.png`} className="navbar-link-icon" />
      <p className="navbar-link-label">{props.label}</p>
    </Link>
  );
}

interface NavbarLinkBottomProps {
  icon: React.ReactNode;
  label: string;
  link: string;
  selected: boolean;
}
function NavbarLinkBottom(props: NavbarLinkBottomProps) {
  return (
    <Tooltipped tooltip={props.label}>
      <Link href={props.link} className={`navbar-button ${props.selected? 'selected' : ''}`}>
        {props.icon}
      </Link>
    </Tooltipped>
  );
}

export default Navbar;
