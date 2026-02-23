"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './Navbar.css';
import React from 'react';

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
  {
    icon: 'run',
    label: 'Run',
    link: '/runner',
  },
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

export default Navbar;
