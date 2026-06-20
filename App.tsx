import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, onSnapshot, doc, updateDoc, serverTimestamp, query, orderBy } from "firebase/firestore";

const C = {
  navy: "#0D2B55", navyLight: "#1A3F73", teal: "#1A7DAF",
  green: "#2ECC71", greenDark: "#27AE60", bg: "#F4F8FB", white: "#FFFFFF",
  gray: "#6B7E99", grayLight: "#E8EFF5", border: "#D0DDE9", red: "#E74C3C", orange: "#F39C12",
};

const ADMIN_PASSWORD = "jv2024";

const statusColors = {
  "Nuevo": { bg: "#E8F4FD", text: "#1A7DAF", border: "#A8D5F0" },
  "En revisión": { bg: "#FFF3E0", text: "#E67E22", border: "#FBBF80" },
  "En fabricación": { bg: "#FFF0F0", text: "#E74C3C", border: "#FFAAAA" },
  "Listo": { bg: "#E8F8EE", text: "#27AE60", border: "#A0DFB8" },
  "Entregado": { bg: "#F0F0F0", text: "#555", border: "#CCC" },
};

function JVLogo({ size = 40, dark = false }) {
  const fc = dark ? C.navy : "#fff";
  const tc = dark ? C.navy : "#fff";
  const sc = dark ? C.teal : "rgba(255,255,255,.85)";
  const d1 = dark ? C.teal : "rgba(255,255,255,.95)";
  const d2 = dark ? "#2A9FD6" : "rgba(255,255,255,.7)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
        {[18,24,30,36,41].map((cx,i)=>(
          <ellipse key={i} cx={cx} cy={36-(i===2?2:i===1||i===3?1:0)} rx={i===2?4:i===1||i===3?3.5:3} ry={i===2?5:4} fill={fc}/>
        ))}
        <ellipse cx="30" cy="57" rx="14" ry="18" fill={fc}/>
        <circle cx="10" cy="12" r="5" fill={d1}/>
        <circle cx="20" cy="6" r="4" fill={d2}/>
        <circle cx="8" cy="24" r="3" fill={d2} opacity=".6"/>
      </svg>
      <div>
        <div style={{ fontWeight: 900, fontSize: size * 0.55, color: tc, lineHeight: 1, letterSpacing: -1 }}>J&V</div>
        <div style={{ fontWeight: 700, fontSize: size * 0.26, color: sc, letterSpacing: 2.5, marginTop: 1 }}>ORTOPEDIA</div>
      </div>
    </div>
  );
}

const Btn = ({ children, onClick, variant = "primary", disabled, full = true }) => {
  const base = { border: "none", borderRadius: 12, cursor: disabled ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 15, transition: "all .18s", padding: "14px 20px", width: full ? "100%" : "auto", opacity: disabled ? 0.5 : 1, fontFamily: "inherit" };
  const styles = {
    primary: { background: `linear-gradient(135deg, ${C.teal}, ${C.navyLight})`, color: "#fff", boxShadow: `0 4px 16px ${C.teal}50` },
    green: { background: `linear-gradient(135deg, ${C.green}, ${C.greenDark})`, color: "#fff", boxShadow: `0 4px 16px ${C.green}50` },
    outline: { background: "transparent", color: C.teal, border: `2px solid ${C.teal}` },
    ghost: { background: C.grayLight, color: C.navy },
  };
  return <button style={{ ...base, ...styles[variant] }} onClick={onClick} disabled={disabled}>{children}</button>;
};

const Badge = ({ status }) => {
  const s = statusColors[status] || statusColors["Nuevo"];
  return <span style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}`, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700 }}>{status}</span>;
};

const Field = ({ label, value, onChange, type = "text", placeholder, unit }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 5, textTransform: "uppercase", letterSpacing: .5 }}>
      {label}{unit && <span style={{ color: C.gray, fontWeight: 500, textTransform: "none", letterSpacing: 0 }}> ({unit})</span>}
    </label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 14, color: C.navy, background: C.white, boxSizing: "border-box", outline: "none", fontFamily: "inherit" }} />
  </div>
);

const STEPS = ["Tus datos", "Medidas", "Fotos", "Resumen"];
function StepBar({ current }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 26 }}>
      {STEPS.map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, background: i < current ? C.green : i === current ? C.navy : C.grayLight, color: i <= current ? "#fff" : C.gray, border: i === current ? `3px solid ${C.teal}` : "none", transition: "all .3s" }}>{i < current ? "✓" : i + 1}</div>
            <span style={{ fontSize: 9, fontWeight: 700, color: i === current ? C.navy : C.gray, whiteSpace: "nowrap" }}>{s}</span>
          </div>
          {i < STEPS.length - 1 && <div style={{ width: 28, height: 3, background: i < current ? C.green : C.grayLight, marginBottom: 16, transition: "all .3s" }} />}
        </div>
      ))}
    </div>
  );
}

function Step1({ data, setData, onNext }) {
  const ok = data.nombre && data.telefono && data.localidad;
  return (
    <div>
      <h2 style={{ color: C.navy, fontWeight: 900, fontSize: 21, marginBottom: 4 }}>Datos personales</h2>
      <p style={{ color: C.gray, fontSize: 13, marginBottom: 22 }}>Completá tu información de contacto</p>
      <Field label="Nombre y apellido" value={data.nombre} onChange={v => setData({ ...data, nombre: v })} placeholder="Juan Pérez" />
      <Field label="Teléfono" value={data.telefono} onChange={v => setData({ ...data, telefono: v })} placeholder="381 123 4567" type="tel" />
      <Field label="Localidad" value={data.localidad} onChange={v => setData({ ...data, localidad: v })} placeholder="Chilecito, La Rioja" />
      <Field label="Edad" value={data.edad} onChange={v => setData({ ...data, edad: v })} placeholder="32" type="number" />
      <Btn onClick={onNext} disabled={!ok}>Siguiente →</Btn>
    </div>
  );
}

function Step2({ data, setData, onNext, onBack }) {
  const ok = data.calzado && data.largoDer && data.anchoDer && data.largoIzq && data.anchoIzq;
  const PieCard = ({ lado, lKey, aKey }) => (
    <div style={{ background: C.bg, borderRadius: 14, padding: 16, marginBottom: 14, border: `1px solid ${C.border}` }}>
      <div style={{ fontWeight: 800, color: C.navy, fontSize: 14, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 18 }}>🦶</span> Pie {lado}
      </div>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
        <svg width={110} height={145} viewBox="0 0 110 145">
          <defs>
            <marker id={"at"+lado} markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto-start-reverse"><path d="M0,0 L7,3.5 L0,7 Z" fill={C.teal}/></marker>
            <marker id={"ab"+lado} markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z" fill={C.teal}/></marker>
            <marker id={"rl"+lado} markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto-start-reverse"><path d="M0,0 L7,3.5 L0,7 Z" fill={C.red}/></marker>
            <marker id={"rr"+lado} markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z" fill={C.red}/></marker>
          </defs>
          <path d="M30,130 Q16,118 18,90 Q20,72 25,58 Q29,44 36,34 Q41,25 51,23 Q59,21 66,26 Q74,32 76,46 Q80,65 78,88 Q76,110 72,124 Q62,138 47,136 Q33,134 30,130Z" fill="#E8EFF5" stroke={C.border} strokeWidth="1.5"/>
          <ellipse cx="34" cy="27" rx="5.5" ry="8" fill="#D0DDE9"/>
          <ellipse cx="46" cy="19" rx="5.5" ry="9" fill="#D0DDE9"/>
          <ellipse cx="58" cy="18" rx="5.5" ry="9" fill="#D0DDE9"/>
          <ellipse cx="69" cy="23" rx="5" ry="8" fill="#D0DDE9"/>
          <ellipse cx="77" cy="32" rx="4" ry="6.5" fill="#D0DDE9"/>
          <line x1="9" y1="18" x2="9" y2="134" stroke={C.teal} strokeWidth="2" markerStart={"url(#at"+lado+")"} markerEnd={"url(#ab"+lado+")"}/>
          <text x="2" y="82" fill={C.teal} fontSize="8" fontWeight="bold" transform={"rotate(-90,2,82)"}>LARGO</text>
          <line x1="18" y1="83" x2="77" y2="83" stroke={C.red} strokeWidth="2" markerStart={"url(#rl"+lado+")"} markerEnd={"url(#rr"+lado+")"}/>
          <text x="20" y="97" fill={C.red} fontSize="7.5" fontWeight="bold">METATARSO</text>
        </svg>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}><Field label="Largo" unit="cm" value={data[lKey]} onChange={v => setData({ ...data, [lKey]: v })} placeholder="26.5" type="number" /></div>
        <div style={{ flex: 1 }}><Field label="Ancho" unit="cm" value={data[aKey]} onChange={v => setData({ ...data, [aKey]: v })} placeholder="9.5" type="number" /></div>
      </div>
    </div>
  );
  return (
    <div>
      <h2 style={{ color: C.navy, fontWeight: 900, fontSize: 21, marginBottom: 4 }}>Medidas del pie</h2>
      <p style={{ color: C.gray, fontSize: 13, marginBottom: 10 }}>Medí ambos pies con una regla sobre papel</p>
      <div style={{ background: `${C.teal}10`, border: `1px solid ${C.teal}30`, borderRadius: 12, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: C.teal, lineHeight: 1.7 }}>
        <strong>📏 Cómo medir:</strong><br/>
        <strong>Largo:</strong> desde el talón hasta la punta del dedo más largo<br/>
        <strong>Ancho:</strong> la parte más ancha del pie (zona del metatarso)
      </div>
      <div style={{ background: C.white, border: `2px solid ${C.navy}20`, borderRadius: 14, padding: 16, marginBottom: 14 }}>
        <div style={{ fontWeight: 800, color: C.navy, fontSize: 14, marginBottom: 10 }}>👟 Número de calzado</div>
        <Field label="Talle actual" value={data.calzado} onChange={v => setData({ ...data, calzado: v })} placeholder="Ej: 42" type="number" />
      </div>
      <PieCard lado="derecho" lKey="largoDer" aKey="anchoDer" />
      <PieCard lado="izquierdo" lKey="largoIzq" aKey="anchoIzq" />
      <div style={{ background: "#FFF8E0", border: "1px solid #FFD97D", borderRadius: 12, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#7D5A00" }}>
        ⚠️ <strong>Importante:</strong> medí ambos pies. Se usa el más largo y más ancho como referencia.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Btn onClick={onBack} variant="ghost">← Atrás</Btn>
        <Btn onClick={onNext} disabled={!ok}>Siguiente →</Btn>
      </div>
    </div>
  );
}

function Step3({ data, setData, onNext, onBack }) {
  const photos = [
    { key: "fotoArriba", label: "Ambos pies juntos", sublabel: "Vista de arriba", icon: "👆", desc: "Poné ambos pies sobre fondo blanco y fotografiá desde arriba" },
    { key: "fotoAtras", label: "Ambos pies juntos", sublabel: "Vista de atrás", icon: "🔙", desc: "Parate y fotografiá desde atrás mostrando ambos talones" },
  ];
  const loaded = photos.filter(p => data[p.key]).length;
  const allOk = loaded === 2;
  return (
    <div>
      <h2 style={{ color: C.navy, fontWeight: 900, fontSize: 21, marginBottom: 4 }}>Fotos de los pies</h2>
      <p style={{ color: C.gray, fontSize: 13, marginBottom: 14 }}>Necesitamos 2 fotos de ambos pies juntos</p>
      <div style={{ background: `${C.teal}10`, border: `1px solid ${C.teal}30`, borderRadius: 12, padding: "10px 14px", marginBottom: 18, fontSize: 12, color: C.teal, lineHeight: 1.7 }}>
        📸 <strong>Instrucciones:</strong><br/>• Fondo blanco o claro<br/>• Buena iluminación, sin sombras<br/>• Foto nítida y bien enfocada
      </div>
      {photos.map(p => (
        <label key={p.key} htmlFor={p.key} style={{ cursor: "pointer", display: "block", marginBottom: 14 }}>
          <div style={{ borderRadius: 16, border: `2px dashed ${data[p.key] ? C.green : C.border}`, background: data[p.key] ? `${C.green}08` : C.white, padding: "18px 16px", display: "flex", alignItems: "center", gap: 16, transition: "all .2s" }}>
            <div style={{ width: 62, height: 62, borderRadius: 14, flexShrink: 0, background: data[p.key] ? `${C.green}15` : C.grayLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, border: `2px solid ${data[p.key] ? C.green : C.border}` }}>
              {data[p.key] ? "✅" : p.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, color: C.navy, fontSize: 15 }}>{p.label}</div>
              <div style={{ fontWeight: 700, color: data[p.key] ? C.green : C.teal, fontSize: 13 }}>{p.sublabel}</div>
              <div style={{ fontSize: 11, color: C.gray, marginTop: 4, lineHeight: 1.5 }}>{data[p.key] ? "✓ Foto cargada" : p.desc}</div>
            </div>
          </div>
          <input type="file" id={p.key} accept="image/*" style={{ display: "none" }} onChange={e => setData({ ...data, [p.key]: e.target.files[0]?.name })} />
        </label>
      ))}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.gray, marginBottom: 6 }}>
          <span>Progreso</span><span style={{ fontWeight: 700, color: allOk ? C.green : C.navy }}>{loaded} / 2 fotos</span>
        </div>
        <div style={{ height: 7, background: C.grayLight, borderRadius: 99 }}>
          <div style={{ height: 7, background: allOk ? C.green : C.teal, borderRadius: 99, width: `${loaded * 50}%`, transition: "width .4s" }} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Btn onClick={onBack} variant="ghost">← Atrás</Btn>
        <Btn onClick={onNext} disabled={!allOk}>Siguiente →</Btn>
      </div>
    </div>
  );
}

function Step4({ formData, onSubmit, onBack, saving }) {
  const { s1, s2, s3 } = formData;
  const secs = [
    { title: "👤 Datos personales", rows: [["Nombre", s1.nombre], ["Teléfono", s1.telefono], ["Localidad", s1.localidad], ["Edad", s1.edad ? `${s1.edad} años` : "-"]] },
    { title: "📏 Medidas", rows: [["Calzado", `N° ${s2.calzado}`], ["Pie der. — Largo", `${s2.largoDer} cm`], ["Pie der. — Ancho metatarso", `${s2.anchoDer} cm`], ["Pie izq. — Largo", `${s2.largoIzq} cm`], ["Pie izq. — Ancho metatarso", `${s2.anchoIzq} cm`]] },
    { title: "📸 Fotos", rows: [["Vista superior", s3.fotoArriba ? "✓ Cargada" : "—"], ["Vista posterior", s3.fotoAtras ? "✓ Cargada" : "—"]] },
  ];
  return (
    <div>
      <h2 style={{ color: C.navy, fontWeight: 900, fontSize: 21, marginBottom: 4 }}>Resumen</h2>
      <p style={{ color: C.gray, fontSize: 13, marginBottom: 20 }}>Revisá que todo esté correcto</p>
      {secs.map(sec => (
        <div key={sec.title} style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden", marginBottom: 14 }}>
          <div style={{ background: C.navy, padding: "10px 16px" }}><span style={{ color: "#fff", fontWeight: 800, fontSize: 13 }}>{sec.title}</span></div>
          {sec.rows.map(([k, v], i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 16px", background: i % 2 === 0 ? C.white : "#FAFCFE", borderBottom: i < sec.rows.length - 1 ? `1px solid ${C.grayLight}` : "none" }}>
              <span style={{ fontSize: 13, color: C.gray, fontWeight: 600 }}>{k}</span>
              <span style={{ fontSize: 13, color: v?.startsWith?.("✓") ? C.green : C.navy, fontWeight: 700 }}>{v}</span>
            </div>
          ))}
        </div>
      ))}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
        <Btn onClick={onBack} variant="ghost">← Atrás</Btn>
        <Btn onClick={onSubmit} variant="green" disabled={saving}>{saving ? "Enviando..." : "Enviar pedido ✓"}</Btn>
      </div>
    </div>
  );
}

function Step5({ nombre, onReset }) {
  return (
    <div style={{ textAlign: "center", padding: "10px 0 20px" }}>
      <div style={{ width: 90, height: 90, borderRadius: "50%", margin: "0 auto 20px", background: `linear-gradient(135deg, ${C.green}, ${C.greenDark})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 42, boxShadow: `0 8px 24px ${C.green}50` }}>✓</div>
      <h2 style={{ color: C.navy, fontWeight: 900, fontSize: 22, marginBottom: 8 }}>¡Pedido enviado!</h2>
      <p style={{ color: C.gray, fontSize: 14, marginBottom: 6 }}>Gracias, <strong style={{ color: C.navy }}>{nombre}</strong></p>
      <p style={{ color: C.gray, fontSize: 13, marginBottom: 24, lineHeight: 1.7 }}>Tu pedido llegó a <strong style={{ color: C.teal }}>J&V Ortopedia</strong>.<br/>Nos contactaremos a la brevedad.</p>
      <div style={{ background: `${C.teal}10`, border: `1px solid ${C.teal}30`, borderRadius: 14, padding: 16, marginBottom: 24, textAlign: "left" }}>
        <div style={{ fontSize: 13, color: C.teal, fontWeight: 800, marginBottom: 10 }}>📦 ¿Qué sigue?</div>
        {["J&V Ortopedia revisa tu pedido", "Se fabrica tu plantilla a medida", "Se entrega o envía al paciente"].map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: C.teal, color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</div>
            <span style={{ fontSize: 13, color: C.navy }}>{s}</span>
          </div>
        ))}
      </div>
      <Btn onClick={onReset} variant="outline">Hacer otro pedido</Btn>
    </div>
  );
}

function UserFlow({ onBack }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [s1, setS1] = useState({ nombre: "", telefono: "", localidad: "", edad: "" });
  const [s2, setS2] = useState({ calzado: "", largoDer: "", anchoDer: "", largoIzq: "", anchoIzq: "" });
  const [s3, setS3] = useState({ fotoArriba: "", fotoAtras: "" });
  const reset = () => { setStep(0); setSaving(false); setS1({ nombre: "", telefono: "", localidad: "", edad: "" }); setS2({ calzado: "", largoDer: "", anchoDer: "", largoIzq: "", anchoIzq: "" }); setS3({ fotoArriba: "", fotoAtras: "" }); };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const now = new Date();
      const fecha = String(now.getDate()).padStart(2,"0")+"/"+String(now.getMonth()+1).padStart(2,"0")+"/"+now.getFullYear();
      await addDoc(collection(db, "pedidos"), {
        patient: s1.nombre, telefono: s1.telefono, localidad: s1.localidad,
        age: parseInt(s1.edad)||0, calzado: s2.calzado,
        largoDer: s2.largoDer, anchoDer: s2.anchoDer,
        largoIzq: s2.largoIzq, anchoIzq: s2.anchoIzq,
        photos: [s3.fotoArriba,s3.fotoAtras].filter(Boolean).length,
        status: "Nuevo", date: fecha, notes: "",
        weight: 0, height: 0, pain: false, painZone: "",
        createdAt: serverTimestamp(),
      });
      setStep(4);
    } catch(e) {
      alert("Error al enviar. Revisá tu conexión e intentá de nuevo.");
    }
    setSaving(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg, #0D2B55 0%, #1A3F73 60%, #1A7DAF 100%)", padding: "22px 20px 72px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={onBack} style={{ background: "rgba(255,255,255,.15)", border: "none", color: "#fff", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 16 }}>←</button>
          <JVLogo size={34} dark={false} />
        </div>
        <h1 style={{ color: "#fff", fontWeight: 900, fontSize: 20, margin: "0 0 4px" }}>Pedido de plantillas ortopédicas</h1>
        <p style={{ color: "rgba(255,255,255,.7)", fontSize: 13, margin: 0 }}>Completá el formulario para fabricar tu plantilla a medida</p>
      </div>
      <div style={{ margin: "-48px 14px 24px", background: C.white, borderRadius: 22, padding: "24px 18px", boxShadow: "0 8px 40px rgba(0,0,0,.10)" }}>
        {step < 4 && <StepBar current={step} />}
        {step === 0 && <Step1 data={s1} setData={setS1} onNext={() => setStep(1)} />}
        {step === 1 && <Step2 data={s2} setData={setS2} onNext={() => setStep(2)} onBack={() => setStep(0)} />}
        {step === 2 && <Step3 data={s3} setData={setS3} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
        {step === 3 && <Step4 formData={{ s1, s2, s3 }} onSubmit={handleSubmit} saving={saving} onBack={() => setStep(2)} />}
        {step === 4 && <Step5 nombre={s1.nombre} onReset={reset} />}
      </div>
    </div>
  );
}

function generatePDF(order) {
  const refL = Math.max(parseFloat(order.largoDer)||0, parseFloat(order.largoIzq)||0).toFixed(1);
  const refA = Math.max(parseFloat(order.anchoDer)||0, parseFloat(order.anchoIzq)||0).toFixed(1);
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Pedido #${order.id}</title>
  <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;color:#0D2B55;padding:30px}
  .hdr{display:flex;justify-content:space-between;border-bottom:3px solid #1A7DAF;padding-bottom:18px;margin-bottom:22px}
  .logo{font-size:24px;font-weight:900;color:#0D2B55}.sub{font-size:11px;color:#1A7DAF;font-weight:700;letter-spacing:2px}
  .badge{display:inline-block;background:#E8F4FD;color:#1A7DAF;border:1px solid #A8D5F0;border-radius:20px;padding:4px 14px;font-size:12px;font-weight:700}
  .sec{margin-bottom:20px}.st{background:#0D2B55;color:#fff;padding:9px 16px;border-radius:8px 8px 0 0;font-size:12px;font-weight:800;text-transform:uppercase}
  .sb{border:1px solid #D0DDE9;border-top:none;border-radius:0 0 8px 8px;overflow:hidden}
  .row{display:flex;padding:9px 16px;border-bottom:1px solid #E8EFF5}.row:last-child{border-bottom:none}.row:nth-child(even){background:#FAFCFE}
  .lbl{font-size:13px;color:#6B7E99;font-weight:600;width:200px;flex-shrink:0}.val{font-size:13px;color:#0D2B55;font-weight:700}
  .grid2{display:grid;grid-template-columns:1fr 1fr}.pc{padding:12px 16px}.pc:first-child{border-right:1px solid #E8EFF5}
  .pt{font-size:11px;font-weight:800;color:#1A7DAF;text-transform:uppercase;margin-bottom:8px}
  .mr{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #F4F8FB;font-size:13px}.mr:last-child{border-bottom:none}
  .ref{background:#E8F8EE;border-top:1px solid #A0DFB8;padding:10px 16px;font-size:13px;color:#27AE60;font-weight:700}
  .cz{background:#F4F8FB;display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid #E8EFF5}
  .ft{margin-top:28px;border-top:1px solid #D0DDE9;padding-top:12px;display:flex;justify-content:space-between;font-size:11px;color:#6B7E99}
  @media print{body{padding:18px}}</style></head><body>
  <div class="hdr">
    <div><div class="logo">J&V ORTOPEDIA</div><div class="sub">PLANTILLAS A MEDIDA</div></div>
    <div style="text-align:right"><div style="font-size:20px;font-weight:900">Pedido #${order.id?.substring(0,8)}</div><div class="badge">${order.status}</div><div style="font-size:11px;color:#6B7E99;margin-top:5px">${order.date}</div></div>
  </div>
  <div class="sec"><div class="st">Datos del paciente</div><div class="sb">
    <div class="row"><span class="lbl">Nombre</span><span class="val">${order.patient}</span></div>
    <div class="row"><span class="lbl">Teléfono</span><span class="val">${order.telefono||"-"}</span></div>
    <div class="row"><span class="lbl">Localidad</span><span class="val">${order.localidad||"-"}</span></div>
    <div class="row"><span class="lbl">Edad</span><span class="val">${order.age ? order.age+" años" : "-"}</span></div>
  </div></div>
  <div class="sec"><div class="st">Calzado y medidas</div><div class="sb">
    <div class="cz"><div><div style="font-size:11px;color:#6B7E99;font-weight:600">NÚMERO DE CALZADO</div><div style="font-size:22px;font-weight:900">N° ${order.calzado}</div></div></div>
    <div class="grid2">
      <div class="pc"><div class="pt">Pie derecho</div>
        <div class="mr"><span style="color:#6B7E99;font-weight:600">Largo</span><span style="font-weight:800">${order.largoDer} cm</span></div>
        <div class="mr"><span style="color:#6B7E99;font-weight:600">Ancho metatarso</span><span style="font-weight:800">${order.anchoDer} cm</span></div>
      </div>
      <div class="pc"><div class="pt">Pie izquierdo</div>
        <div class="mr"><span style="color:#6B7E99;font-weight:600">Largo</span><span style="font-weight:800">${order.largoIzq} cm</span></div>
        <div class="mr"><span style="color:#6B7E99;font-weight:600">Ancho metatarso</span><span style="font-weight:800">${order.anchoIzq} cm</span></div>
      </div>
    </div>
    <div class="ref">Medida de referencia: Largo ${refL} cm x Ancho ${refA} cm</div>
  </div></div>
  <div class="ft"><span>J&V Ortopedia — Plantillas a medida</span><span>${order.date}</span></div>
  <script>window.onload=()=>{window.print()}</script></body></html>`;
  const w = window.open("", "_blank");
  w.document.write(html);
  w.document.close();
}

const ALL_STATUSES = ["Todos", "Nuevo", "En revisión", "En fabricación", "Listo", "Entregado"];

function AdminPanel({ onBack }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [search, setSearch] = useState("");
  const [sideOpen, setSideOpen] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "pedidos"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, snap => {
      setOrders(snap.docs.map(d => ({ ...d.data(), id: d.id })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const filtered = orders.filter(o => (filterStatus === "Todos" || o.status === filterStatus) && (o.patient?.toLowerCase().includes(search.toLowerCase()) || o.id?.includes(search)));
  const updateStatus = async (id, s) => {
    await updateDoc(doc(db, "pedidos", id), { status: s });
    setSelected(p => p?.id === id ? { ...p, status: s } : p);
  };
  const stats = { total: orders.length, nuevo: orders.filter(o => o.status === "Nuevo").length, fab: orders.filter(o => o.status === "En fabricación").length, listo: orders.filter(o => o.status === "Listo").length };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg, #0D2B55, #1A3F73)", padding: "18px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={onBack} style={{ background: "rgba(255,255,255,.15)", border: "none", color: "#fff", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 16 }}>←</button>
            <JVLogo size={28} dark={false} />
          </div>
          <span style={{ background: "rgba(255,255,255,.15)", color: "#fff", borderRadius: 8, padding: "4px 12px", fontSize: 11, fontWeight: 800, letterSpacing: 1 }}>ADMIN</span>
        </div>
        <h1 style={{ color: "#fff", fontWeight: 900, fontSize: 20, margin: 0 }}>Panel de pedidos</h1>
      </div>

      {loading && <div style={{ textAlign: "center", padding: "40px 0", color: C.gray, fontSize: 14 }}>Cargando pedidos...</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, padding: "14px 14px 0" }}>
        {[["Total", stats.total, C.teal], ["Nuevos", stats.nuevo, C.navyLight], ["Fabricando", stats.fab, C.orange], ["Listos", stats.listo, C.green]].map(([l,v,c]) => (
          <div key={l} style={{ background: C.white, borderRadius: 14, padding: "12px 8px", textAlign: "center", boxShadow: "0 2px 10px rgba(0,0,0,.06)", borderTop: `3px solid ${c}` }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: c }}>{v}</div>
            <div style={{ fontSize: 10, color: C.gray, fontWeight: 700, marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: "12px 14px 0" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Buscar paciente..." style={{ width: "100%", padding: "11px 16px", borderRadius: 12, border: `1.5px solid ${C.border}`, fontSize: 14, color: C.navy, boxSizing: "border-box", outline: "none", fontFamily: "inherit" }} />
      </div>
      <div style={{ display: "flex", gap: 8, padding: "10px 14px", overflowX: "auto" }}>
        {ALL_STATUSES.map(s => <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 800, whiteSpace: "nowrap", background: filterStatus === s ? C.navy : C.white, color: filterStatus === s ? "#fff" : C.gray, boxShadow: "0 2px 6px rgba(0,0,0,.06)" }}>{s}</button>)}
      </div>

      <div style={{ padding: "0 14px 100px" }}>
        {!loading && filtered.length === 0 && <div style={{ textAlign: "center", padding: "40px 0", color: C.gray }}><div style={{ fontSize: 40 }}>📭</div><div style={{ fontWeight: 700, marginTop: 10 }}>Sin pedidos aún</div></div>}
        {filtered.map(order => (
          <div key={order.id} onClick={() => { setSelected(order); setSideOpen(true); }} style={{ background: C.white, borderRadius: 16, padding: "14px", marginBottom: 10, boxShadow: "0 2px 10px rgba(0,0,0,.06)", cursor: "pointer", border: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div><div style={{ fontWeight: 800, color: C.navy, fontSize: 15 }}>{order.patient}</div><div style={{ fontSize: 12, color: C.gray }}>{order.date} · Calzado N° {order.calzado}</div></div>
              <Badge status={order.status} />
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, background: C.grayLight, color: C.gray, borderRadius: 6, padding: "3px 8px", fontWeight: 600 }}>📏 {order.largoDer}×{order.anchoDer} cm</span>
              <span style={{ fontSize: 11, background: C.grayLight, color: C.gray, borderRadius: 6, padding: "3px 8px", fontWeight: 600 }}>📍 {order.localidad}</span>
            </div>
          </div>
        ))}
      </div>

      {sideOpen && selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 100 }} onClick={() => setSideOpen(false)}>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: C.white, borderRadius: "22px 22px 0 0", maxHeight: "90vh", overflowY: "auto", padding: "20px 18px 32px" }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 40, height: 4, background: C.border, borderRadius: 2, margin: "0 auto 18px" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div><div style={{ fontWeight: 900, fontSize: 18, color: C.navy }}>{selected.patient}</div><div style={{ fontSize: 12, color: C.gray }}>{selected.date}</div></div>
              <Badge status={selected.status} />
            </div>
            <button onClick={() => generatePDF(selected)} style={{ width: "100%", padding: "13px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#E74C3C,#C0392B)", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", marginBottom: 18 }}>
              📄 Generar PDF del pedido
            </button>
            <div style={{ background: C.bg, borderRadius: 14, padding: 14, marginBottom: 14 }}>
              <div style={{ fontWeight: 800, color: C.navy, fontSize: 13, marginBottom: 10 }}>👤 Paciente</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
                {[["Teléfono", selected.telefono], ["Localidad", selected.localidad], ["Edad", `${selected.age} años`], ["Calzado", `N° ${selected.calzado}`]].map(([k,v]) => (
                  <div key={k}><div style={{ fontSize: 11, color: C.gray, fontWeight: 600 }}>{k}</div><div style={{ fontSize: 13, color: C.navy, fontWeight: 800 }}>{v}</div></div>
                ))}
              </div>
            </div>
            <div style={{ background: C.bg, borderRadius: 14, overflow: "hidden", marginBottom: 14 }}>
              <div style={{ background: C.navy, padding: "10px 14px", fontWeight: 800, color: "#fff", fontSize: 13 }}>📏 Medidas</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                {[["derecho", ["largoDer","anchoDer"]], ["izquierdo", ["largoIzq","anchoIzq"]]].map(([lado, keys]) => (
                  <div key={lado} style={{ padding: "12px 14px", borderRight: lado === "derecho" ? `1px solid ${C.border}` : "none" }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: C.teal, marginBottom: 8, textTransform: "uppercase" }}>🦶 Pie {lado}</div>
                    {[["Largo", 0], ["Ancho", 1]].map(([label, idx]) => (
                      <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                        <span style={{ color: C.gray }}>{label}</span><span style={{ fontWeight: 800, color: C.navy }}>{selected[keys[idx]]} cm</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div style={{ padding: "10px 14px", background: `${C.green}10`, borderTop: `1px solid ${C.green}30` }}>
                <span style={{ fontSize: 12, color: C.greenDark, fontWeight: 700 }}>✅ Ref: {Math.max(parseFloat(selected.largoDer)||0, parseFloat(selected.largoIzq)||0).toFixed(1)} cm × {Math.max(parseFloat(selected.anchoDer)||0, parseFloat(selected.anchoIzq)||0).toFixed(1)} cm</span>
              </div>
            </div>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.navy, marginBottom: 10 }}>Cambiar estado</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {ALL_STATUSES.filter(s => s !== "Todos").map(s => <button key={s} onClick={() => updateStatus(selected.id, s)} style={{ padding: "9px", borderRadius: 10, border: `2px solid ${selected.status === s ? C.teal : C.border}`, background: selected.status === s ? `${C.teal}15` : C.white, color: selected.status === s ? C.teal : C.gray, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>{s}</button>)}
              </div>
            </div>
            <Btn onClick={() => setSideOpen(false)} variant="ghost">Cerrar</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminLogin({ onSuccess, onBack }) {
  const [pass, setPass] = useState("");
  const [error, setError] = useState(false);
  const check = () => { if (pass === ADMIN_PASSWORD) { setError(false); onSuccess(); } else { setError(true); setPass(""); } };
  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg, #0D2B55, #1A3F73)", padding: "28px 20px 80px" }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,.15)", border: "none", color: "#fff", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 16, marginBottom: 20 }}>←</button>
        <JVLogo size={36} dark={false} />
        <h1 style={{ color: "#fff", fontWeight: 900, fontSize: 22, margin: "18px 0 4px" }}>Acceso administrador</h1>
        <p style={{ color: "rgba(255,255,255,.7)", fontSize: 13, margin: 0 }}>Ingresá tu contraseña</p>
      </div>
      <div style={{ margin: "-52px 20px 0", background: C.white, borderRadius: 22, padding: "32px 22px", boxShadow: "0 8px 40px rgba(0,0,0,.10)" }}>
        <div style={{ fontSize: 48, textAlign: "center", marginBottom: 22 }}>🔒</div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 6, textTransform: "uppercase" }}>Contraseña</label>
          <input type="password" value={pass} onChange={e => { setPass(e.target.value); setError(false); }} onKeyDown={e => e.key === "Enter" && check()} placeholder="Ingresá la contraseña"
            style={{ width: "100%", padding: "13px 16px", borderRadius: 12, border: `2px solid ${error ? C.red : C.border}`, fontSize: 15, color: C.navy, boxSizing: "border-box", outline: "none", fontFamily: "inherit" }} />
          {error && <div style={{ color: C.red, fontSize: 13, fontWeight: 600, marginTop: 8 }}>❌ Contraseña incorrecta</div>}
        </div>
        <Btn onClick={check} disabled={!pass}>Entrar al panel →</Btn>
      </div>
    </div>
  );
}

function Home({ onUser, onAdmin }) {
  const [taps, setTaps] = useState(0);
  const [showAdmin, setShowAdmin] = useState(false);
  const handleTap = () => { const n = taps + 1; setTaps(n); if (n >= 7) { setShowAdmin(true); setTaps(0); } };
  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Segoe UI', system-ui, sans-serif", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "linear-gradient(150deg, #0D2B55 0%, #1A3F73 55%, #1A7DAF 100%)", padding: "52px 28px 68px", textAlign: "center" }}>
        <div onClick={handleTap} style={{ display: "inline-block", userSelect: "none" }}>
          <JVLogo size={56} dark={false} />
        </div>
        <h1 style={{ color: "#fff", fontWeight: 900, fontSize: 26, margin: "22px 0 10px", lineHeight: 1.2 }}>Plantillas ortopédicas<br/>a medida</h1>
        <p style={{ color: "rgba(255,255,255,.75)", fontSize: 14, margin: 0, lineHeight: 1.6 }}>Pedí desde casa en minutos.<br/>Rápido, fácil y sin complicaciones.</p>
      </div>
      <div style={{ flex: 1, margin: "-36px 16px 0", background: C.white, borderRadius: "22px 22px 0 0", padding: "28px 20px 36px", boxShadow: "0 -4px 30px rgba(0,0,0,.08)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
          {[{ icon: "✅", label: "Fácil", desc: "Formulario simple" }, { icon: "⚡", label: "Rápido", desc: "Solo 4 pasos" }, { icon: "🔒", label: "Seguro", desc: "Datos protegidos" }, { icon: "🏠", label: "Sin salir de casa", desc: "100% online" }].map(b => (
            <div key={b.label} style={{ background: C.bg, borderRadius: 14, padding: "16px 12px", textAlign: "center", border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 26, marginBottom: 6 }}>{b.icon}</div>
              <div style={{ fontWeight: 800, color: C.navy, fontSize: 14 }}>{b.label}</div>
              <div style={{ fontSize: 11, color: C.gray, marginTop: 3 }}>{b.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.navy, marginBottom: 14 }}>¿Cómo funciona?</div>
          {["Completá tus datos personales", "Ingresá las medidas de tus pies", "Sacá 2 fotos guiadas", "Revisá y enviá tu pedido"].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg, #1A7DAF, #1A3F73)", color: "#fff", fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</div>
              <div style={{ fontSize: 14, color: C.navy }}>{s}</div>
            </div>
          ))}
        </div>
        <Btn onClick={onUser}>Hacer mi pedido →</Btn>
        {showAdmin && (
          <button onClick={onAdmin} style={{ width: "100%", marginTop: 14, padding: "12px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: "transparent", color: C.gray, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            Acceso administrador →
          </button>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("home");
  if (view === "user") return <UserFlow onBack={() => setView("home")} />;
  if (view === "adminLogin") return <AdminLogin onSuccess={() => setView("admin")} onBack={() => setView("home")} />;
  if (view === "admin") return <AdminPanel onBack={() => setView("home")} />;
  return <Home onUser={() => setView("user")} onAdmin={() => setView("adminLogin")} />;
}
