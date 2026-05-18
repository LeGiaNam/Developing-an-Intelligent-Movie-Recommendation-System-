import Link from "next/link";
import { Icon } from "./Icon";

const adminLinks = [
  { href: "/admin", label: "Movie Manager", icon: "movie" },
  { href: "/admin/users", label: "User Management", icon: "group" },
  { href: "/admin/users/new", label: "Add New User", icon: "person_add" },
  { href: "/", label: "Viewer App", icon: "live_tv" },
];

export function AdminShell({ active = "/admin", children }) {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Link className="brand" href="/admin">
          IPANMOVIE
        </Link>
        <nav className="admin-menu">
          {adminLinks.map((link) => (
            <Link className={active === link.href ? "active" : ""} href={link.href} key={link.href}>
              <Icon name={link.icon} />
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
