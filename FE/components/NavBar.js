import Link from "next/link";
import Image from "next/image";
import { images } from "@/lib/data";
import { Icon } from "./Icon";

const links = [
  { href: "/", label: "Home" },
  { href: "/movies", label: "Movies" },
  { href: "/browse", label: "Browse" },
  { href: "/notifications", label: "Notifications" },
];

export function NavBar({ active = "/" }) {
  return (
    <nav className="top-nav">
      <div className="nav-left">
        <Link className="brand" href="/">
          IPANMOVIE
        </Link>
        <div className="nav-links">
          {links.map((link) => (
            <Link className={`nav-link ${active === link.href ? "active" : ""}`} href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="nav-right">
        <label className="search-field">
          <Icon name="search" />
          <input placeholder="Search..." />
        </label>
        <Link className="icon-button" href="/notifications" aria-label="Notifications">
          <Icon name="notifications" />
        </Link>
        <Link className="icon-button" href="/admin" aria-label="Admin">
          <Icon name="settings" />
        </Link>
        <Link href="/profile">
          <Image className="avatar" src={images.avatar} alt="User profile" width={42} height={42} />
        </Link>
      </div>
    </nav>
  );
}
