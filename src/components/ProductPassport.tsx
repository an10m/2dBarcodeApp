import type { ReactNode } from "react";

export type StageState = "ok" | "warning";
export type StageKind =
  | "raw"
  | "transport"
  | "storage"
  | "production"
  | "quality"
  | "packaging"
  | "release"
  | "distribution"
  | "pharmacy";

export type PassportStage = {
  date: string;
  title: string;
  detail: string;
  location: string;
  country: string;
  state: StageState;
  tag: string;
  kind: StageKind;
};

export type PassportMeta = { label: string; value: string };

type PassportProps = {
  eyebrow?: string;
  name: string;
  description: string;
  meta: PassportMeta[];
  status: { title: string; caption: string; tone?: StageState };
  stages: PassportStage[];
  code?: string;
  onBack?: () => void;
  backLabel?: string;
  top?: ReactNode;
  footerNote?: string;
  actions?: ReactNode;
};

const monthNames = ["YANV", "FEVR", "MART", "APR", "MAY", "IYUN", "IYUL", "AVG", "SEN", "OKT", "NOY", "DEK"];

const kindPalette: Record<StageKind, string> = {
  raw: "linear-gradient(160deg,#cfdbe6,#6f8aa3 60%,#3d5368)",
  transport: "linear-gradient(160deg,#6f9bc4,#23476e 60%,#0f2238)",
  storage: "linear-gradient(160deg,#9db8d6,#456a94 60%,#233a57)",
  production: "linear-gradient(160deg,#c3c9cf,#7b858f 60%,#3a4048)",
  quality: "linear-gradient(160deg,#bfe0ec,#5fa3bd 60%,#245870)",
  packaging: "linear-gradient(160deg,#dfe5ea,#97a5b2 60%,#4d5a66)",
  release: "linear-gradient(160deg,#d9dfe8,#8b9bb3 60%,#3b4a63)",
  distribution: "linear-gradient(160deg,#c9d4de,#7a8da1 60%,#37465a)",
  pharmacy: "linear-gradient(160deg,#a9cdf0,#3f7fc4 60%,#16457a)"
};

const kindPaths: Record<StageKind, string[]> = {
  raw: ["M12 3c3 3.4 5 6.1 5 8.6A5 5 0 0 1 7 11.6C7 9.1 9 6.4 12 3z"],
  transport: ["M3 7h10v9H3z", "M13 10h4l4 3v3h-8z", "M6.5 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z", "M17.5 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"],
  storage: ["M3 8l9-4 9 4-9 4-9-4z", "M3 8v8l9 4 9-4V8", "M12 12v8"],
  production: ["M3 20V9l5 4V9l5 4V6l4-2 4 3v13z"],
  quality: ["M9 3h6v5l4 9a2 2 0 0 1-1.8 3H6.8A2 2 0 0 1 5 17l4-9z", "M7.4 14h9.2"],
  packaging: ["M4 8h16v12H4z", "M4 8l8-4 8 4", "M12 4v16"],
  release: ["M12 3l7 3v6c0 4.4-3 7.7-7 9-4-1.3-7-4.6-7-9V6z", "M9 12l2 2 4-4"],
  distribution: ["M4 19l5-6 4 3 7-9", "M15 7h5v5"],
  pharmacy: ["M4 10h16v10H4z", "M9 10V6h6v4", "M4 14h16"]
};

function StageIcon({ kind }: { kind: StageKind }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {kindPaths[kind].map((path, index) => <path key={index} d={path} />)}
    </svg>
  );
}

function splitDate(value: string) {
  const match = value.match(/^\s*(\d{1,2})\s+([A-Za-zÀ-ÿ'’.]+)/);
  if (!match) return { month: "BUGUN", day: value.slice(0, 2).toUpperCase() };
  const monthIndex = monthNames.findIndex((month) => month.toLowerCase().startsWith(match[2].slice(0, 3).toLowerCase()));
  return {
    month: monthIndex >= 0 ? monthNames[monthIndex] : match[2].slice(0, 4).toUpperCase(),
    day: match[1].padStart(2, "0")
  };
}

export function ProductPassport({
  eyebrow = "Mahsulot raqamli pasporti",
  name,
  description,
  meta,
  status,
  stages,
  code,
  onBack,
  backLabel = "Orqaga",
  top,
  footerNote = "Namoyish ma'lumotlari (o'ylab topilgan)",
  actions
}: PassportProps) {
  const warningCount = stages.filter((stage) => stage.state === "warning").length;
  const tone = status.tone ?? "ok";

  return (
    <div className="passport">
      <aside className="passportIntro">
        <div className="passportIntroInner">
          {top && <div className="passportTopBar">{top}</div>}
          {onBack && (
            <button type="button" className="passportBack" onClick={onBack} aria-label={backLabel}>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 12H5M11 6l-6 6 6 6" />
              </svg>
            </button>
          )}
          <p className="passportEyebrow">{eyebrow}</p>
          <h1>{name}</h1>
          <p className="passportDescription">{description}</p>

          <div className="passportMeta">
            {meta.map((row) => (
              <div className="passportMetaRow" key={row.label}>
                <span>{row.label}</span>
                <b>{row.value}</b>
              </div>
            ))}
          </div>

          <div className={`passportStatus ${tone}`}>
            <svg viewBox="0 0 34 38" width="34" height="38" aria-hidden="true">
              <path d="M17 1l14 5v11c0 9-6 16-14 20C9 33 3 26 3 17V6z" fill={tone === "ok" ? "#22a05a" : "#f59e0b"} />
              {tone === "ok"
                ? <path d="M10 19l5 5 9-10" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                : <path d="M17 11v9M17 25.5v.5" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />}
            </svg>
            <div>
              <strong>{status.title}</strong>
              <span>{status.caption}</span>
            </div>
          </div>

          <div className="passportLegend">
            <span><i className="ok" />Bosqich izohsiz o'tdi</span>
            <span><i className="warning" />Og'ish bo'ldi — hal qilindi va tarixda saqlandi</span>
          </div>

          {code && <div className="passportCode"><span>2D kod</span><code>{code}</code></div>}
          {actions && <div className="passportActions">{actions}</div>}
          <p className="passportNote">{footerNote} · {stages.length} bosqich{warningCount ? `, ${warningCount} ta og'ish` : ""}</p>
        </div>
      </aside>

      <section className="passportTimeline" aria-label="Partiya bosqichlari">
        <ol className="stageList">
          {stages.map((stage, index) => {
            const { month, day } = splitDate(stage.date);
            return (
              <li className={`stage stage-${index % 2 === 0 ? "left" : "right"}`} key={`${stage.date}-${stage.title}`}>
                <div className={`stageNode ${stage.state}`}>{index + 1}</div>
                <article className={`stageCard ${stage.state}`}>
                  <header className="stageTop">
                    <span className={`stageTag ${stage.state}`}>
                      {stage.state === "ok"
                        ? <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>
                        : <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><rect x="10.5" y="3" width="3" height="11" rx="1.5" /><circle cx="12" cy="19" r="2" /></svg>}
                      {stage.tag}
                    </span>
                    <span className="stageDate"><b>{month}</b><em>{day}</em></span>
                  </header>
                  <h3>{stage.title}</h3>
                  <p>{stage.detail}</p>
                  <div className="stageVisual" style={{ backgroundImage: kindPalette[stage.kind] }}>
                    <div className="stagePlace">
                      <StageIcon kind={stage.kind} />
                      <div><span>{stage.location}</span><span>{stage.country}</span></div>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
        <div className="stageFade" aria-hidden="true">
          <span><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg></span>
        </div>
      </section>
    </div>
  );
}
