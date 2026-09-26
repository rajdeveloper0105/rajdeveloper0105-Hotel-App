export default function DiningAnimation() {
  return <svg className="login-dining" viewBox="0 0 360 240" aria-hidden="true">
    <ellipse cx="180" cy="119" rx="155" ry="108" fill="#e4eee2" />
    <circle cx="293" cy="47" r="18" fill="#f6e6ba" />
    <path d="M42 55h40M62 35v40" stroke="#ceddc8" strokeWidth="3" />
    <ellipse cx="180" cy="219" rx="139" ry="9" fill="#cfddcd" />
    {/* Chairs and seated legs. */}
    <g stroke="#8d6c4c" strokeWidth="8" strokeLinecap="round" fill="none">
      <path d="M53 130v49h62M58 179v38M110 179v38M307 130v49h-62M302 179v38M250 179v38" />
    </g>
    <path d="M84 161v20h38l8 32M276 161v20h-38l-8 32" stroke="#344952" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M127 217h17M216 217h17" stroke="#253732" strokeWidth="10" strokeLinecap="round" />
    {/* Two diners, facing the table. */}
    <path d="M69 164v-44q0-20 19-20t23 24v40" fill="#377f69" />
    <path d="M291 164v-44q0-20-19-20t-23 24v40" fill="#d49a52" />
    <path d="M85 93v15M275 93v15" stroke="#dba779" strokeWidth="12" strokeLinecap="round" />
    <g className="diner-head diner-head-left">
      <circle cx="87" cy="76" r="23" fill="#e7b78c" />
      <path d="M64 77q-7-36 22-31q28-5 25 22q-15 1-26-10q-4 17-21 19" fill="#354333" />
      <circle cx="102" cy="76" r="2" fill="#374238" />
      <path d="M99 87q6 4 10-1" stroke="#a66a50" strokeWidth="2" fill="none" />
    </g>
    <g className="diner-head diner-head-right">
      <path d="M251 72q-2-32 27-27q28 7 18 50h-39" fill="#513e35" />
      <circle cx="273" cy="76" r="22" fill="#e5b189" />
      <path d="M253 62q25 4 29-14q19 8 12 35l-12-19" fill="#513e35" />
      <circle cx="258" cy="76" r="2" fill="#374238" />
      <path d="M250 87q6 4 10-1" stroke="#a66a50" strokeWidth="2" fill="none" />
    </g>
    {/* Table, plates, food and glasses. */}
    <path d="M174 153h12v60h-12z" fill="#846142" />
    <path d="M145 216h70" stroke="#846142" strokeWidth="7" strokeLinecap="round" />
    <rect x="104" y="141" width="152" height="13" rx="6" fill="#b68c5c" />
    <ellipse cx="137" cy="139" rx="24" ry="5" fill="#fffdf5" />
    <ellipse cx="223" cy="139" rx="24" ry="5" fill="#fffdf5" />
    <path d="M123 137q14-18 28 0M209 137q14-18 28 0" fill="#ecb852" />
    <g fill="#5a8a42"><circle cx="134" cy="133" r="3" /><circle cx="143" cy="134" r="3" /><circle cx="220" cy="133" r="3" /><circle cx="229" cy="134" r="3" /></g>
    <path d="M167 119h12l-2 20h-8zM187 119h12l-2 20h-8z" fill="#aad4cc" stroke="#7eafa4" />
    {/* Arms lift the spoons toward each person's mouth. */}
    <path d="M83 119l16 16M277 119l-16 16" stroke="#e7b78c" strokeWidth="11" strokeLinecap="round" />
    <g className="diner-arm diner-arm-left">
      <path d="M99 135l29-9" stroke="#e7b78c" strokeWidth="10" strokeLinecap="round" />
      <path d="M129 127l8-13" stroke="#77898a" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="139" cy="110" rx="4" ry="6" fill="#acbcbc" />
      <circle cx="139" cy="107" r="3" fill="#ecb852" />
    </g>
    <g className="diner-arm diner-arm-right">
      <path d="M261 135l-29-9" stroke="#e5b189" strokeWidth="10" strokeLinecap="round" />
      <path d="M231 127l-8-13" stroke="#77898a" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="221" cy="110" rx="4" ry="6" fill="#acbcbc" />
      <circle cx="221" cy="107" r="3" fill="#ecb852" />
    </g>
  </svg>;
}
