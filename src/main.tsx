import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  Mic,
  Search,
  Plus,
  MessageCircle,
  Heart,
  ImagePlus,
  X,
  ArrowUpLeft,
  Bookmark,
  Sparkles,
  LogOut,
  Trash2,
  Flag,
  Menu,
  Check,
  Loader2,
  Crown,
  ArrowLeft,
  ArrowDownLeft,
  Lightbulb,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import {
  db,
  demo,
  kinds,
  relativeTime,
  checked,
  type Post,
  type Profile,
} from "./lib";
import "@fontsource-variable/heebo";
import "./style.css";
function App() {
  const [posts, setPosts] = useState<Post[]>(db ? [] : demo),
    [user, setUser] = useState<User | null>(null),
    [profile, setProfile] = useState<Profile | null>(null),
    [view, setView] = useState("feed"),
    [filter, setFilter] = useState("הכול"),
    [search, setSearch] = useState(""),
    [modal, setModal] = useState<"auth" | "post" | "profile" | null>(null),
    [toast, setToast] = useState(""),
    [loading, setLoading] = useState(!!db),
    [saving, setSaving] = useState(false),
    [expanded, setExpanded] = useState<string[]>([]),
    [saved, setSaved] = useState<string[]>(() => {
      try {
        return JSON.parse(localStorage.getItem("matzchik-saved") || "[]");
      } catch {
        return [];
      }
    }),
    [selected, setSelected] = useState<Profile | null>(null);
  const [body, setBody] = useState(""),
    [kind, setKind] = useState("פאנץ׳"),
    [image, setImage] = useState<File | null>(null),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [name, setName] = useState(""),
    [bio, setBio] = useState(""),
    [city, setCity] = useState(""),
    [signup, setSignup] = useState(true),
    [error, setError] = useState(""),
    [comment, setComment] = useState<Record<string, string>>({}),
    [menu, setMenu] = useState(false);
  useEffect(() => {
    if (!modal) return;
    const previous = document.activeElement as HTMLElement | null;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) setModal(null);
      if (event.key === "Tab") {
        const elements = Array.from(
          document.querySelectorAll<HTMLElement>(
            ".modal button:not(:disabled),.modal input,.modal textarea",
          ),
        ).filter((el) => el.getClientRects().length > 0);
        const first = elements[0],
          last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    const timer = setTimeout(
      () =>
        document
          .querySelector<HTMLElement>(
            ".modal input,.modal textarea,.modal button",
          )
          ?.focus(),
      0,
    );
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handler);
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handler);
      previous?.focus();
    };
  }, [modal, saving]);
  const notify = (s: string) => {
    setToast(s);
    setTimeout(() => setToast(""), 4500);
  };
  const load = async () => {
    if (!db) return;
    if (!user) {
      setPosts([]);
      setLoading(false);
      return;
    }
    try {
      const data = await checked(
        db
          .from("posts")
          .select("*,profiles(*),comments(*,profiles(*)),reactions(user_id)")
          .order("created_at", { ascending: false })
          .limit(100),
      );
      const hydrated = await Promise.all(
        (data || []).map(async (p: any) => {
          let image_url = null;
          if (p.image_path) {
            const { data: img } = await db!.storage
              .from("post-images")
              .createSignedUrl(p.image_path, 3600);
            image_url = img?.signedUrl || null;
          }
          return { ...p, image_url };
        }),
      );
      setPosts(hydrated as Post[]);
    } catch {
      setError("לא הצלחנו לטעון את הפיד. בדקו את החיבור ונסו שוב.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (!db) return;
    db.auth
      .getSession()
      .then(({ data }) => setUser(data.session?.user || null));
    const { data } = db.auth.onAuthStateChange((_event, session) =>
      setUser(session?.user || null),
    );
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    load();
    if (!db || !user) {
      setProfile(null);
      return;
    }
    db.from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()
      .then(({ data }) => setProfile(data));
  }, [user]);
  useEffect(() => {
    localStorage.setItem("matzchik-saved", JSON.stringify(saved));
  }, [saved]);
  const open = (m: "auth" | "post" | "profile") => {
    setError("");
    if (m !== "auth" && !user) {
      setModal("auth");
      return;
    }
    if (m === "profile" && profile) {
      setName(profile.name);
      setBio(profile.bio);
      setCity(profile.city);
    }
    setModal(m);
  };
  const auth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) {
      setError("זוהי הדגמה. הרשמה תיפתח לאחר חיבור מסד הנתונים.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (signup) {
        const { data, error } = await db.auth.signUp({
          email,
          password,
          options: { data: { name }, emailRedirectTo: location.origin },
        });
        if (error) throw error;
        notify(
          data.session
            ? "ברוכים הבאים לקהילה!"
            : "שלחנו קישור אישור למייל. בדקו גם את תיקיית הספאם.",
        );
      } else {
        const { error } = await db.auth.signInWithPassword({ email, password });
        if (error) throw error;
        notify("טוב שחזרתם!");
      }
      setModal(null);
      setPassword("");
    } catch {
      setError(
        "הפעולה לא הצליחה. בדקו את הפרטים. בהרשמה: ייתכן שנדרש אישור מייל.",
      );
    } finally {
      setSaving(false);
    }
  };
  const publish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user) return;
    setSaving(true);
    setError("");
    let path: string | null = null;
    try {
      let image_url = null;
      if (image) {
        if (
          !["image/jpeg", "image/png", "image/webp"].includes(image.type) ||
          image.size > 5 * 1024 * 1024
        )
          throw new Error("image");
        path = `${user.id}/${crypto.randomUUID()}.${image.type.split("/")[1]}`;
        await checked(
          db.storage
            .from("post-images")
            .upload(path, image, { contentType: image.type }),
        );
        image_url = path;
      }
      await checked(
        db.from("posts").insert({
          user_id: user.id,
          body: body.trim(),
          kind,
          image_path: image_url,
        }),
      );
      setModal(null);
      setBody("");
      setImage(null);
      await load();
      notify("החומר שלכם באוויר. עכשיו תור הקהילה.");
    } catch {
      if (path) await db.storage.from("post-images").remove([path]);
      setError(
        "הפרסום נכשל. התמונות צריכות להיות JPG, PNG או WebP, עד 5MB. נסו שוב.",
      );
    } finally {
      setSaving(false);
    }
  };
  const react = async (p: Post) => {
    if (!db || !user) {
      open("auth");
      return;
    }
    try {
      const liked = p.reactions.some((r) => r.user_id === user.id);
      await checked(
        liked
          ? db
              .from("reactions")
              .delete()
              .eq("post_id", p.id)
              .eq("user_id", user.id)
          : db.from("reactions").insert({ post_id: p.id, user_id: user.id }),
      );
      await load();
    } catch {
      notify("הפרגון לא נשמר. נסו שוב.");
    }
  };
  const addComment = async (p: Post) => {
    if (!db || !user) {
      open("auth");
      return;
    }
    if (!comment[p.id]?.trim()) return;
    setSaving(true);
    try {
      await checked(
        db.from("comments").insert({
          post_id: p.id,
          user_id: user.id,
          body: comment[p.id].trim(),
        }),
      );
      setComment({ ...comment, [p.id]: "" });
      await load();
    } catch {
      notify("התגובה לא נשמרה. נסו שוב.");
    } finally {
      setSaving(false);
    }
  };
  const remove = async (p: Post) => {
    if (!db || !confirm("למחוק את הפוסט? הפעולה אינה ניתנת לביטול.")) return;
    try {
      await checked(db.from("posts").delete().eq("id", p.id));
      if (p.image_path)
        await db.storage.from("post-images").remove([p.image_path]);
      await load();
      notify("הפוסט נמחק");
    } catch {
      notify("המחיקה נכשלה");
    }
  };
  const report = async (p: Post) => {
    if (!db || !user) {
      open("auth");
      return;
    }
    const reason = prompt("מה תרצו לדווח? (לפחות 5 תווים)");
    if (!reason || reason.trim().length < 5) return;
    try {
      await checked(
        db
          .from("reports")
          .insert({ post_id: p.id, user_id: user.id, reason: reason.trim() }),
      );
      notify("הדיווח התקבל ונשמר לבדיקה");
    } catch {
      notify("לא הצלחנו לשלוח את הדיווח");
    }
  };
  const shown = posts.filter(
    (p) =>
      (filter === "הכול" || p.kind === filter) &&
      (!search || `${p.body} ${p.profiles.name}`.includes(search)) &&
      (view !== "saved" || saved.includes(p.id)) &&
      (view !== "mine" || p.user_id === user?.id) &&
      (!selected || p.user_id === selected.id),
  );
  const people = Array.from(
    new Map(posts.map((p) => [p.profiles.id, p.profiles])).values(),
  );
  return (
    <>
      <a className="skip-link" href="#main-content">
        דילוג לתוכן
      </a>
      <header className="site-header">
        <button
          className="mobile-menu icon"
          onClick={() => setMenu(!menu)}
          aria-label="תפריט"
          aria-expanded={menu}
          aria-controls="site-nav"
        >
          <Menu />
        </button>
        <a
          className="compact-brand"
          href="#"
          aria-label="מצחיק — דף הבית"
          onClick={(e) => {
            e.preventDefault();
            setView("feed");
            setSelected(null);
            setMenu(false);
          }}
        >
          מצחיק<span>®</span>
        </a>
        <nav
          id="site-nav"
          className={`site-nav ${menu ? "show" : ""}`}
          aria-label="ניווט ראשי"
        >
          {[
            ["feed", "הפיד"],
            ["people", "הקומיקאים"],
            ["saved", "שמרתי להמשך"],
            ["mine", "החומרים שלי"],
          ].map(([id, label]) => (
            <button
              key={id}
              className={view === id ? "active" : ""}
              aria-current={view === id ? "page" : undefined}
              onClick={() => {
                setView(id);
                setSelected(null);
                setMenu(false);
              }}
            >
              {label}
            </button>
          ))}
          {user && (
            <button className="signout" onClick={() => db?.auth.signOut()}>
              <LogOut size={15} /> יציאה
            </button>
          )}
        </nav>
        <label className="search header-search">
          <Search size={19} />
          <input
            placeholder="חיפוש פאנצ׳ים, רעיונות, יוצרים…"
            aria-label="חיפוש בחומרים"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (view === "people") setView("feed");
            }}
          />
          <span className="search-hint">חיפוש</span>
        </label>
        <div className="header-actions">
          {user ? (
            <button
              className="avatar"
              onClick={() => open("profile")}
              aria-label="עריכת הפרופיל"
            >
              {profile?.name?.[0] || "א"}
            </button>
          ) : (
            <button className="outline" onClick={() => open("auth")}>
              כניסה לקהילה <ArrowUpLeft size={15} />
            </button>
          )}
        </div>
      </header>
      <section className="masthead" aria-label="מצחיק — קהילת הסטנדאפ">
        <div className="masthead-art" aria-hidden="true">
          <img src="/images/stage.png" alt="" />
          <span className="art-caption">
            יותר קולות.
            <br />
            פחות פילטרים.
          </span>
          <svg className="scribble" viewBox="0 0 120 65">
            <path d="M8 42 27 12 31 48 60 8 62 50 88 20 108 44" />
          </svg>
        </div>
        <a
          className="masthead-word"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setView("feed");
            setSelected(null);
          }}
        >
          מצחיק
        </a>
        <div className="masthead-manifesto">
          <span className="tape-label">
            קהילת הסטנדאפ
            <br />
            של ישראל
          </span>
          <p>
            פאנצ׳ים
            <br />
            רעיונות
            <br />
            חומרים
            <br />
            <b>אנשים אמיתיים.</b>
          </p>
          <span className="issue-number">בלי פילטר / גרסת בטא</span>
        </div>
      </section>
      <div className="editorial-kicker">
        <span>חומר טוב לא נכתב לבד.</span>
        <span>כותבים. משתפים. מחדדים. מפרגנים.</span>
        <span className="kicker-arrow" aria-hidden="true">
          <ArrowDownLeft size={23} />
        </span>
      </div>
      <div className="layout">
        <main id="main-content" tabIndex={-1}>
          {!db && (
            <div className="demo-note">
              <Sparkles size={16} /> מצב הדגמה · התוכן לדוגמה. הרשמה ושיתוף
              ייפתחו לאחר חיבור Supabase.
            </div>
          )}
          {db && !user && (
            <div className="demo-note">
              החומרים גלויים לחברי הקהילה בלבד.
              <button className="text-button" onClick={() => open("auth")}>
                כניסה או הרשמה ←
              </button>
            </div>
          )}
          {view === "people" ? (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">אותו עולם. קולות שונים.</div>
                  <h1>
                    האנשים מאחורי הבדיחות<span>.</span>
                  </h1>
                </div>
              </div>
              <div className="people-grid">
                {people.map((p) => (
                  <button
                    className="person"
                    key={p.id}
                    onClick={() => {
                      setSelected(p);
                      setView("feed");
                    }}
                  >
                    <span className="avatar large">{p.name[0]}</span>
                    <h3>{p.name}</h3>
                    <p>{p.bio || "חלק מקהילת מצחיק"}</p>
                    <small>{p.city}</small>
                    <span>
                      לצפייה בחומרים <ArrowLeft size={14} />
                    </span>
                  </button>
                ))}
              </div>
              {!people.length && (
                <div className="empty">
                  הקהילה עוד בתחילת הדרך. הפוסט הראשון יכול להיות שלכם.
                </div>
              )}
            </>
          ) : (
            <>
              <div
                className={`page-heading ${view === "feed" && !selected ? "feed-heading" : ""}`}
              >
                <div>
                  <div className="eyebrow">
                    {selected
                      ? "הכירו את היוצר"
                      : view === "saved"
                        ? "רעיונות ששווה לחזור אליהם"
                        : view === "mine"
                          ? "המחברת שלכם, עם קהל"
                          : "קצת השראה. קצת אומץ. הרבה חומר."}
                  </div>
                  <h1>
                    {selected
                      ? selected.name
                      : view === "saved"
                        ? "שמרתי להמשך"
                        : view === "mine"
                          ? "החומרים שלי"
                          : "מאחורי הפאנץ׳"}
                    <span>.</span>
                  </h1>
                  <p>
                    {selected
                      ? selected.bio
                      : "מקום לנסות רעיונות, לחדד פאנצ׳ים ולפרגן לאנשים שמבינים."}
                  </p>
                </div>
              </div>
              <div className="feed-controls">
                <div className="tabs">
                  {kinds.map((k) => (
                    <button
                      className={filter === k ? "chosen" : ""}
                      onClick={() => setFilter(k)}
                      key={k}
                      aria-label={k}
                      aria-pressed={filter === k}
                    >
                      {k === "פאנץ׳" ? (
                        <Mic size={20} />
                      ) : k === "רעיון" ? (
                        <Lightbulb size={20} />
                      ) : k === "חומר" ? (
                        <ImagePlus size={20} />
                      ) : null}
                      {k === "פאנץ׳"
                        ? "פאנצ׳ים"
                        : k === "רעיון"
                          ? "רעיונות"
                          : k === "חומר"
                            ? "חומרים"
                            : "הכול"}
                    </button>
                  ))}
                </div>
                <button
                  className="primary toolbar-create"
                  onClick={() => open("post")}
                >
                  <Plus size={19} />
                  חומר חדש
                </button>
              </div>
              <div className="editorial-body">
                <aside className="writing-rail" aria-label="השראה לכתיבה">
                  <button className="composer" onClick={() => open("post")}>
                    <span className="composer-eyebrow">המחברת פתוחה.</span>
                    <strong>
                      רעיונות?
                      <br />
                      פאנצ׳ים?
                      <br />
                      חומרים?
                      <br />
                      הכול כאן.
                    </strong>
                    <span className="composer-scribble" aria-hidden="true">
                      <ArrowDownLeft size={58} strokeWidth={3} />
                    </span>
                    <span className="composer-action">
                      <Plus size={19} />
                      חומר חדש
                    </span>
                  </button>
                  <div className="daily-card">
                    <span className="pill">תרגיל כתיבה / 01</span>
                    <Lightbulb size={32} strokeWidth={1.4} />
                    <h2>
                      היומיום שלכם.
                      <br />
                      הטוויסט שלכם.
                    </h2>
                    <p>
                      קחו משהו קטן שעצבן אתכם היום. תנו לו סוף שאף אחד לא ציפה
                      לו.
                    </p>
                    <button
                      onClick={() => {
                        setBody("");
                        setKind("רעיון");
                        open("post");
                      }}
                    >
                      יש לי כיוון
                      <ArrowUpLeft size={18} />
                    </button>
                  </div>
                  <div className="rules">
                    <span className="rules-number">[ ! ]</span>
                    <h3>מצחיק. אבל עם כבוד.</h3>
                    <p>
                      פידבק בונה, קרדיט ליוצרים ופרגון אמיתי. חומר של מישהו אחר?
                      בקשו רשות לפני שימוש.
                    </p>
                  </div>
                </aside>
                <div className="feed-content">
                  <div className="feed-label">
                    <span>
                      {selected
                        ? "החומרים"
                        : view === "saved"
                          ? "הפוסטים השמורים"
                          : "מה חדש במחברת"}
                    </span>
                    <span>הכי חדשים קודם</span>
                  </div>
                  {error && !modal && (
                    <div className="error">
                      {error}
                      <button
                        onClick={() => {
                          setError("");
                          setLoading(true);
                          load();
                        }}
                      >
                        נסו שוב
                      </button>
                    </div>
                  )}
                  <div className="feed-grid">
                    {loading ? (
                      <div className="empty">
                        <Loader2 className="spin" /> טוענים את החומרים…
                      </div>
                    ) : (
                      shown.map((p, index) => (
                        <article
                          className={`post ${p.image_url ? "image-post" : "text-post"} ${index === 0 ? "lead-post" : ""}`}
                          key={p.id}
                        >
                          <div className="post-top">
                            <button
                              className="author"
                              onClick={() => {
                                setSelected(p.profiles);
                                setView("feed");
                              }}
                            >
                              <span
                                className={`avatar tone-${p.profiles.name.length % 3}`}
                              >
                                {p.profiles.name[0]}
                              </span>
                              <span>
                                <strong>{p.profiles.name}</strong>
                                <small>
                                  {p.profiles.city && `${p.profiles.city} · `}
                                  {relativeTime(p.created_at)}
                                </small>
                              </span>
                            </button>
                            <span
                              className={`tag tag-${kinds.indexOf(p.kind)}`}
                            >
                              {p.kind}
                            </span>
                          </div>
                          {p.image_url && (
                            <figure className="post-figure">
                              <img
                                className="post-image"
                                src={p.image_url}
                                alt="תמונה שצורפה לחומר"
                                loading="lazy"
                              />
                              {!db && (
                                <figcaption>
                                  חומר לדוגמה · מאחורי הקלעים
                                </figcaption>
                              )}
                            </figure>
                          )}
                          <div className="post-copy">
                            <p className="post-body">
                              {p.body.split("\n\n")[0]}
                            </p>
                            {p.body.includes("\n\n") && (
                              <p className="post-note">
                                {p.body.split("\n\n").slice(1).join("\n\n")}
                              </p>
                            )}
                          </div>
                          <div className="post-actions">
                            <button
                              className={
                                p.reactions.some((r) => r.user_id === user?.id)
                                  ? "liked"
                                  : ""
                              }
                              aria-pressed={p.reactions.some(
                                (r) => r.user_id === user?.id,
                              )}
                              onClick={() => react(p)}
                            >
                              <Heart size={18} />
                              <span>פרגון</span>
                              {p.reactions.length > 0 && p.reactions.length}
                            </button>
                            <button
                              aria-expanded={expanded.includes(p.id)}
                              onClick={() =>
                                setExpanded(
                                  expanded.includes(p.id)
                                    ? expanded.filter((id) => id !== p.id)
                                    : [...expanded, p.id],
                                )
                              }
                            >
                              <MessageCircle size={18} />
                              {p.comments.length} תגובות
                            </button>
                            <div className="action-spacer" />
                            <button
                              className={
                                saved.includes(p.id)
                                  ? "bookmarked icon"
                                  : "icon"
                              }
                              aria-label="שמירה להמשך"
                              aria-pressed={saved.includes(p.id)}
                              onClick={() =>
                                setSaved(
                                  saved.includes(p.id)
                                    ? saved.filter((id) => id !== p.id)
                                    : [...saved, p.id],
                                )
                              }
                            >
                              <Bookmark size={18} />
                            </button>
                            {p.user_id === user?.id ? (
                              <button
                                className="icon"
                                aria-label="מחיקת פוסט"
                                onClick={() => remove(p)}
                              >
                                <Trash2 size={17} />
                              </button>
                            ) : (
                              <button
                                className="icon"
                                aria-label="דיווח על פוסט"
                                onClick={() => report(p)}
                              >
                                <Flag size={16} />
                              </button>
                            )}
                          </div>
                          {expanded.includes(p.id) && (
                            <div className="comments">
                              {p.comments.map((c) => (
                                <div className="comment" key={c.id}>
                                  <span className="avatar tiny">
                                    {c.profiles.name[0]}
                                  </span>
                                  <div>
                                    <strong>{c.profiles.name}</strong>
                                    <p>{c.body}</p>
                                  </div>
                                </div>
                              ))}
                              {!p.comments.length && (
                                <small>
                                  עוד אין תגובות. יש לכם כיוון לפאנץ׳?
                                </small>
                              )}
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  addComment(p);
                                }}
                              >
                                <input
                                  aria-label="כתיבת תגובה"
                                  placeholder="פרגון, זווית חדשה או פידבק בונה…"
                                  maxLength={2000}
                                  value={comment[p.id] || ""}
                                  onChange={(e) =>
                                    setComment({
                                      ...comment,
                                      [p.id]: e.target.value,
                                    })
                                  }
                                />
                                <button disabled={saving} className="primary">
                                  שליחה
                                </button>
                              </form>
                            </div>
                          )}
                        </article>
                      ))
                    )}
                  </div>
                  {!loading && !shown.length && (
                    <div className="empty">
                      <Mic size={30} />
                      <h3>עוד אין כאן חומר</h3>
                      <p>
                        {view === "mine" && !user
                          ? "היכנסו כדי לראות את החומרים שלכם."
                          : "נסו חיפוש אחר, או שתפו את הרעיון הראשון."}
                      </p>
                      <button className="primary" onClick={() => open("post")}>
                        בואו נכתוב משהו
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
          <footer>
            מצחיק © {new Date().getFullYear()} · שומרים על החומר. מפרגנים
            ליוצרים.
          </footer>
        </main>
        <aside className="creator-directory" aria-label="יוצרים בקהילה">
          <div className="directory-heading">
            <h2>יוצרים במצחיק</h2>
            <button
              aria-label="הצגת כל היוצרים"
              onClick={() => {
                setView("people");
                setSelected(null);
              }}
            >
              <ArrowLeft size={18} />
            </button>
          </div>
          <div className="directory-list">
            {people.map((p, index) => (
              <button
                className="rail-person"
                key={p.id}
                onClick={() => {
                  setSelected(p);
                  setView("feed");
                }}
              >
                <span className={`avatar tone-${index % 3}`}>{p.name[0]}</span>
                <span>
                  <strong>{p.name}</strong>
                  <small>{p.bio || p.city || "כותבים ביחד"}</small>
                  <span className="creator-link">
                    לחומרים <ArrowUpLeft size={11} />
                  </span>
                </span>
              </button>
            ))}
          </div>
          {!people.length && (
            <p className="directory-empty">
              הבמה פתוחה. הקהילה מחכה לקול שלכם.
            </p>
          )}
          <div className="blue-poster">
            <ArrowUpLeft size={54} strokeWidth={2.5} />
            <strong>
              יחד,
              <br />
              זה מצחיק
              <br />
              יותר.
            </strong>
            <span>פחות אגו. יותר חומר.</span>
          </div>
          <div className="directory-footnote">
            <Crown size={24} />
            <p>
              כל פאנץ׳ גדול התחיל
              <br />
              ב״רגע, יש לי רעיון״.
            </p>
          </div>
        </aside>
      </div>
      {modal && (
        <div className="overlay" onClick={() => !saving && setModal(null)}>
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close icon"
              aria-label="סגירה"
              disabled={saving}
              onClick={() => setModal(null)}
            >
              <X />
            </button>
            <div className="eyebrow">מצחיק · מקום לחומר שלכם</div>
            <h2 id="modal-title">
              {modal === "post"
                ? "מה מתבשל במחברת?"
                : modal === "profile"
                  ? "מאחורי המיקרופון"
                  : signup
                    ? "הבמה הזאת גם שלכם."
                    : "טוב לראות אתכם שוב."}
            </h2>
            {modal === "auth" ? (
              <form onSubmit={auth}>
                {!db && (
                  <div className="demo-note">
                    ההרשמה סגורה במצב הדגמה עד חיבור Supabase.
                  </div>
                )}
                {signup && (
                  <label>
                    שם במה
                    <input
                      required
                      maxLength={60}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="nickname"
                    />
                  </label>
                )}
                <label>
                  אימייל
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    dir="ltr"
                  />
                </label>
                <label>
                  סיסמה
                  <input
                    required
                    type="password"
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={signup ? "new-password" : "current-password"}
                    dir="ltr"
                  />
                </label>
                <small>לפחות 8 תווים. החומרים גלויים לחברי הקהילה.</small>
                <button className="primary" disabled={saving || !db}>
                  {saving ? "רגע…" : signup ? "מצטרפים לקהילה" : "כניסה"}
                </button>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    setSignup(!signup);
                    setError("");
                  }}
                >
                  {signup ? "כבר יש חשבון? כניסה" : "פעם ראשונה כאן? הרשמה"}
                </button>
              </form>
            ) : modal === "post" ? (
              <form onSubmit={publish}>
                <div className="tabs">
                  {kinds.slice(1).map((k) => (
                    <button
                      type="button"
                      className={kind === k ? "chosen" : ""}
                      key={k}
                      onClick={() => setKind(k)}
                    >
                      {k}
                    </button>
                  ))}
                </div>
                <textarea
                  required
                  minLength={1}
                  maxLength={5000}
                  rows={7}
                  placeholder="פאנץ׳ שעוד צריך חידוד, רעיון שלא יוצא מהראש…"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
                <div className="upload-row">
                  <label className="upload">
                    <ImagePlus size={19} /> הוספת תמונה
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (
                          f &&
                          (f.size > 5 * 1024 * 1024 ||
                            !["image/jpeg", "image/png", "image/webp"].includes(
                              f.type,
                            ))
                        ) {
                          setError("בחרו JPG, PNG או WebP עד 5MB");
                          e.target.value = "";
                          return;
                        }
                        setImage(f || null);
                        setError("");
                      }}
                    />
                  </label>
                  <small>{body.length}/5000</small>
                </div>
                {image && (
                  <div className="attached">
                    {image.name}
                    <button
                      type="button"
                      className="icon"
                      onClick={() => setImage(null)}
                    >
                      <X size={15} />
                    </button>
                  </div>
                )}
                <small>
                  גלוי לחברי הקהילה. אל תשתפו חומר שאין לכם רשות לפרסם.
                </small>
                <button className="primary" disabled={saving || !body.trim()}>
                  {saving ? "מעלים לבמה…" : "שיתוף החומר"}
                  <ArrowUpLeft size={17} />
                </button>
              </form>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!db || !user) return;
                  setSaving(true);
                  try {
                    await checked(
                      db
                        .from("profiles")
                        .update({
                          name: name.trim(),
                          bio: bio.trim(),
                          city: city.trim(),
                        })
                        .eq("id", user.id),
                    );
                    setProfile({ id: user.id, name, bio, city });
                    await load();
                    setModal(null);
                    notify("הפרופיל עודכן");
                  } catch {
                    setError("העדכון נכשל. נסו שוב.");
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                <label>
                  שם במה
                  <input
                    required
                    maxLength={60}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
                <label>
                  קצת עליכם
                  <textarea
                    maxLength={300}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </label>
                <label>
                  עיר
                  <input
                    maxLength={60}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </label>
                <button disabled={saving} className="primary">
                  שמירת פרופיל
                </button>
              </form>
            )}
            {error && (
              <div className="error" role="alert">
                {error}
              </div>
            )}
          </section>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={18} />
          {toast}
        </div>
      )}
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
