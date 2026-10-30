(() => {
    const seasonal = ['autumn', 'winter', 'spring'];
    const COLORS = {
        autumn: ['#c2410c', '#d97706', '#b45309', '#e07a1f', '#a33c1c'],
        spring: ['#e64980', '#f06595', '#f783ac', '#ffa8c5', '#e8590c', '#fcc419']
    };
    let mode = '',
        particles = [],
        raf = 0,
        last = 0,
        w = 0,
        h = 0,
        dpr = 1;

    const canvas = document.createElement('canvas');
    canvas.className = 'fx-canvas';
    const ctx = canvas.getContext('2d');

    const park = document.createElement('div');
    park.className = 'fx-park';
    park.innerHTML = `<svg viewBox="0 0 1200 600" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <defs>
            <linearGradient id="fxSky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#b8e3ff"/><stop offset=".65" stop-color="#e8f8ff"/><stop offset="1" stop-color="#f6fdff"/>
            </linearGradient>
            <linearGradient id="fxGrass" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#93d97b"/><stop offset="1" stop-color="#62b95a"/>
            </linearGradient>
        </defs>
        <rect width="1200" height="600" fill="url(#fxSky)"/>
        <circle cx="1010" cy="105" r="78" fill="#ffe9a6" opacity=".35"/>
        <circle cx="1010" cy="105" r="55" fill="#ffd166"/>
        <g fill="#fff" opacity=".92">
            <ellipse cx="250" cy="122" rx="70" ry="24"/><ellipse cx="300" cy="106" rx="48" ry="20"/><ellipse cx="192" cy="108" rx="40" ry="16"/>
            <ellipse cx="760" cy="158" rx="60" ry="20"/><ellipse cx="812" cy="146" rx="38" ry="15"/>
        </g>
        <path d="M0 400 Q180 330 360 390 T720 385 T1050 400 L1200 420 L1200 600 L0 600Z" fill="#bfe6a4"/>
        <path d="M0 455 Q220 395 470 452 T900 447 T1200 458 L1200 600 L0 600Z" fill="#9bd97f"/>
        <path d="M0 505 Q300 465 600 502 T1200 502 L1200 600 L0 600Z" fill="url(#fxGrass)"/>
        <g>
            <rect x="120" y="350" width="18" height="145" rx="8" fill="#8a5a3b"/>
            <circle cx="129" cy="322" r="60" fill="#5fae4e"/>
            <circle cx="84" cy="348" r="39" fill="#71bd5c"/>
            <circle cx="176" cy="346" r="43" fill="#68b654"/>
        </g>
        <g>
            <rect x="1042" y="365" width="16" height="130" rx="7" fill="#946240"/>
            <circle cx="1050" cy="338" r="52" fill="#6cbb58"/>
            <circle cx="1012" cy="360" r="34" fill="#7bc766"/>
            <circle cx="1088" cy="358" r="37" fill="#74c05f"/>
        </g>
        <g fill="#ffffff" opacity=".55">
            <circle cx="430" cy="530" r="4"/><circle cx="452" cy="548" r="3"/><circle cx="720" cy="540" r="4"/><circle cx="760" cy="525" r="3"/><circle cx="930" cy="548" r="4"/>
        </g>
        <ellipse cx="600" cy="560" rx="270" ry="34" fill="#d9b985" opacity=".5"/>

        <g class="park-cat">
            <animateTransform attributeName="transform" type="translate" from="-190 0" to="1400 0" dur="6s" begin="-2s" repeatCount="indefinite"/>
            <ellipse cx="80" cy="515" rx="66" ry="12" fill="#000" opacity=".13"/>
            <g class="cat-bob">
                <g class="cat-legs">
                    <g class="cat-leg a"><rect x="42" y="478" width="11" height="30" rx="5" fill="#1b1b1f"/><rect x="40" y="502" width="15" height="11" rx="5" fill="#fff"/></g>
                    <g class="cat-leg b"><rect x="62" y="478" width="11" height="30" rx="5" fill="#1b1b1f"/><rect x="60" y="502" width="15" height="11" rx="5" fill="#fff"/></g>
                    <g class="cat-leg b"><rect x="98" y="478" width="11" height="30" rx="5" fill="#1b1b1f"/><rect x="96" y="502" width="15" height="11" rx="5" fill="#fff"/></g>
                    <g class="cat-leg a"><rect x="116" y="478" width="11" height="30" rx="5" fill="#1b1b1f"/><rect x="114" y="502" width="15" height="11" rx="5" fill="#fff"/></g>
                </g>
                <path d="M24 458 Q4 432 24 414" stroke="#1b1b1f" stroke-width="12" fill="none" stroke-linecap="round"/>
                <circle cx="25" cy="414" r="7" fill="#fff"/>
                <ellipse cx="82" cy="462" rx="54" ry="28" fill="#1b1b1f"/>
                <ellipse cx="84" cy="472" rx="34" ry="15" fill="#fff"/>
                <path d="M112 418 l3 -24 l20 14 Z" fill="#1b1b1f"/>
                <path d="M146 416 l14 -20 l9 24 Z" fill="#1b1b1f"/>
                <circle cx="133" cy="432" r="28" fill="#1b1b1f"/>
                <ellipse cx="137" cy="441" rx="18" ry="12" fill="#fff"/>
                <circle cx="124" cy="428" r="4.6" fill="#8bd44f"/>
                <circle cx="144" cy="426" r="4.6" fill="#8bd44f"/>
                <circle cx="125" cy="427" r="1.7" fill="#111"/>
                <circle cx="145" cy="425" r="1.7" fill="#111"/>
                <path d="M137 438 l6 4 l-6 4 l-6 -4 Z" fill="#ff8fa3"/>
                <path d="M119 444 l-20 -5 M119 449 l-20 4 M153 442 l20 -6 M153 448 l20 5" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
            </g>
        </g>

        <g class="park-dog">
            <animateTransform attributeName="transform" type="translate" from="1400 0" to="-220 0" dur="5s" begin="-1.5s" repeatCount="indefinite"/>
            <ellipse cx="82" cy="517" rx="72" ry="13" fill="#000" opacity=".13"/>
            <g class="dog-bob">
                <path d="M142 456 Q174 428 158 398" stroke="#8a5a33" stroke-width="13" fill="none" stroke-linecap="round"/>
                <g class="dog-legs">
                    <g class="dog-leg a"><rect x="40" y="480" width="12" height="31" rx="6" fill="#a86d3f"/><rect x="37" y="504" width="18" height="12" rx="5" fill="#6f4526"/></g>
                    <g class="dog-leg b"><rect x="62" y="480" width="12" height="31" rx="6" fill="#a86d3f"/><rect x="59" y="504" width="18" height="12" rx="5" fill="#6f4526"/></g>
                    <g class="dog-leg b"><rect x="106" y="480" width="12" height="31" rx="6" fill="#a86d3f"/><rect x="103" y="504" width="18" height="12" rx="5" fill="#6f4526"/></g>
                    <g class="dog-leg a"><rect x="128" y="480" width="12" height="31" rx="6" fill="#a86d3f"/><rect x="125" y="504" width="18" height="12" rx="5" fill="#6f4526"/></g>
                </g>
                <ellipse cx="86" cy="463" rx="60" ry="31" fill="#b97c4b"/>
                <ellipse cx="82" cy="475" rx="39" ry="16" fill="#e3c09a"/>
                <circle cx="27" cy="428" r="31" fill="#b97c4b"/>
                <ellipse cx="2" cy="441" rx="24" ry="16" fill="#d7a273"/>
                <circle cx="-10" cy="435" r="8" fill="#151515"/>
                <ellipse cx="38" cy="405" rx="13" ry="20" fill="#8a5a33" transform="rotate(28 38 405)"/>
                <ellipse cx="8" cy="406" rx="11" ry="17" fill="#8a5a33" transform="rotate(-18 8 406)"/>
                <circle cx="23" cy="420" r="4.8" fill="#2a1a10"/>
                <circle cx="24" cy="419" r="1.6" fill="#fff"/>
                <path d="M-4 448 q12 11 24 2" stroke="#6f4526" stroke-width="2.5" fill="none" stroke-linecap="round"/>
                <path d="M2 454 q7 13 14 1" fill="#ff7a8a"/>
            </g>
        </g>
    </svg>`;

    document.addEventListener('DOMContentLoaded', () => {
        document.body.append(canvas, park);
        size();
        sync();
        new MutationObserver(sync).observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });
        addEventListener('resize', () => {
            size();
            if (seasonal.includes(mode)) spawn(mode)
        });
    });

    function theme() {
        return document.documentElement.dataset.theme || 'light'
    }

    function size() {
        dpr = Math.min(devicePixelRatio || 1, 2);
        w = innerWidth;
        h = innerHeight;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function sync() {
        const t = theme();
        const next = seasonal.includes(t) ? t : t === 'summer' ? 'summer' : '';
        if (next === mode) return;
        mode = next;
        cancelAnimationFrame(raf);
        raf = 0;
        ctx.clearRect(0, 0, w, h);
        canvas.classList.toggle('on', seasonal.includes(mode));
        park.classList.toggle('on', mode === 'summer');
        if (seasonal.includes(mode)) {
            spawn(mode);
            last = 0;
            raf = requestAnimationFrame(loop)
        } else {
            particles = []
        }
    }

    function count(kind) {
        const base = kind === 'winter' ? w / 46 : kind === 'autumn' ? w / 95 : w / 105;
        const min = kind === 'winter' ? 16 : 7;
        const max = kind === 'winter' ? 42 : kind === 'autumn' ? 18 : 14;
        return Math.max(min, Math.min(max, Math.round(base)))
    }

    function spawn(kind) {
        const n = count(kind);
        particles = [];
        for (let i = 0; i < n; i++) {
            particles.push({
                kind,
                x: Math.random() * w,
                y: Math.random() * h,
                size: kind === 'winter' ? 1.4 + Math.random() * 2.2 : kind === 'autumn' ? 7 + Math.random() * 7 : 10 + Math.random() * 7,
                vy: (kind === 'winter' ? .35 : .28) + Math.random() * (kind === 'winter' ? .6 : .42),
                vx: (Math.random() - .5) * .25,
                rot: Math.random() * Math.PI * 2,
                vr: (Math.random() - .5) * (kind === 'winter' ? .02 : .035),
                phase: Math.random() * Math.PI * 2,
                sway: .6 + Math.random() * .9,
                color: kind === 'winter' ? '#fff' : COLORS[kind][Math.floor(Math.random() * COLORS[kind].length)]
            })
        }
    }

    function loop(ts) {
        if (!seasonal.includes(mode)) return;
        const dt = last ? Math.min(2, (ts - last) / 16.67) : 1;
        last = ts;
        ctx.clearRect(0, 0, w, h);
        for (const p of particles) {
            p.y += p.vy * dt * (p.kind === 'winter' ? 1 : 1.2);
            p.x += Math.sin(p.y * .012 * p.sway + p.phase) * .35 * dt + p.vx * dt;
            p.rot += p.vr * dt;
            if (p.y > h + 30) {
                p.y = -30;
                p.x = Math.random() * w
            }
            if (p.x < -40) p.x = w + 30;
            if (p.x > w + 40) p.x = -30;
            p.kind === 'winter' ? snow(p) : p.kind === 'autumn' ? leaf(p) : tulip(p)
        }
        raf = requestAnimationFrame(loop)
    }

    function snow(p) {
        ctx.save();
        ctx.shadowColor = 'rgba(120,165,205,.75)';
        ctx.shadowBlur = 5;
        ctx.fillStyle = 'rgba(255,255,255,.95)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore()
    }

    function leaf(p) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.bezierCurveTo(p.size * .85, -p.size * .5, p.size * .85, p.size * .55, 0, p.size);
        ctx.bezierCurveTo(-p.size * .85, p.size * .55, -p.size * .85, -p.size * .5, 0, -p.size);
        ctx.fill();
        ctx.strokeStyle = 'rgba(80,40,10,.28)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -p.size * .8);
        ctx.lineTo(0, p.size * .8);
        ctx.stroke();
        ctx.restore()
    }

    function tulip(p) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot * .35);
        const s = p.size / 10;
        ctx.strokeStyle = '#4c9a45';
        ctx.lineWidth = 2 * s;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 8 * s);
        ctx.lineTo(0, 20 * s);
        ctx.stroke();
        ctx.fillStyle = '#5fb457';
        ctx.beginPath();
        ctx.ellipse(-4 * s, 16 * s, 5 * s, 2.4 * s, -.5, 0, Math.PI * 2);
        ctx.ellipse(4 * s, 19 * s, 5 * s, 2.2 * s, .5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(-7 * s, 8 * s);
        ctx.quadraticCurveTo(-9 * s, -5 * s, -2 * s, -7 * s);
        ctx.quadraticCurveTo(0, -2 * s, 2 * s, -7 * s);
        ctx.quadraticCurveTo(9 * s, -5 * s, 7 * s, 8 * s);
        ctx.quadraticCurveTo(0, 12 * s, -7 * s, 8 * s);
        ctx.fill();
        ctx.restore()
    }
})();
