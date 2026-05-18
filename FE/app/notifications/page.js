import { NavBar } from "@/components/NavBar";
import { Icon } from "@/components/Icon";
import { notifications } from "@/lib/data";
import Image from "next/image";

export default function NotificationsPage() {
  return (
    <div className="app-shell">
      <NavBar active="/notifications" />
      <main className="container section">
        <div className="section-header">
          <div>
            <h1 className="title-xl" style={{ fontSize: "clamp(38px, 5vw, 64px)" }}>
              Thong bao
            </h1>
            <p className="lead">Cap nhat noi dung, thanh toan va goi y ca nhan hoa cho profile hien tai.</p>
          </div>
          <button className="btn btn-ghost">
            <Icon name="filter_list" />
            Loc theo
          </button>
        </div>
        <section className="glass-panel">
          <h2 className="section-title">Moi</h2>
          <div className="notice-list" style={{ marginTop: 18 }}>
            {notifications.map((notice) => (
              <article className="notice" key={notice.title}>
                <Image src={notice.image} alt="" width={72} height={72} />
                <div>
                  <h3 className="card-title">{notice.title}</h3>
                  <p className="muted">{notice.body}</p>
                </div>
                <button className="btn btn-primary">{notice.action}</button>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
