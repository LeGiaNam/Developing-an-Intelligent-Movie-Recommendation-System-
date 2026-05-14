import Link from "next/link";
import Image from "next/image";
import { Icon } from "@/components/Icon";
import { profiles } from "@/lib/data";

export default function ProfilesPage() {
  return (
    <main className="profiles-page">
      <section className="container" style={{ textAlign: "center" }}>
        <Link className="brand" href="/">
          IPANMOVIE
        </Link>
        <h1 className="title-xl" style={{ margin: "54px auto 18px", fontSize: "clamp(34px, 5vw, 64px)" }}>
          Who&apos;s watching?
        </h1>
        <div className="profile-grid">
          {profiles.map((profile) => (
            <Link className="profile-tile" href="/" key={profile.name}>
              <Image src={profile.image} alt={`${profile.name} profile`} width={140} height={140} />
              <strong>{profile.name}</strong>
            </Link>
          ))}
          <button className="profile-tile" type="button">
            <span className="icon-button" style={{ width: 140, height: 140 }}>
              <Icon name="add" />
            </span>
            <strong>Add Profile</strong>
          </button>
        </div>
        <button className="btn btn-ghost" style={{ marginTop: 34 }}>
          Manage Profiles
        </button>
      </section>
    </main>
  );
}
